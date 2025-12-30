const video = document.getElementById("video");
const startBtn = document.getElementById("startCameraBtn");
const statusText = document.getElementById("statusText");
const canvas = document.getElementById("overlay");

let ctx = null;
if (canvas) {
  ctx = canvas.getContext("2d");
} else {
  console.warn("⚠️ لم يتم العثور على عنصر الكانفاس بالـ id = overlay");
}

// ✅ نعكس الرسم على الـ overlay فقط (لحل مشكلة يمين/يسار بالعكس)
const MIRROR_OVERLAY = true;

/* تحميل صورة التيشيرت */
const shirtImg = new Image();
shirtImg.src = "shirt.png"; // تأكد أن الصورة في نفس فولدر index.html

let shirtLoaded = false;

// نسبة موضع الياقة داخل صورة التيشيرت (y / height) – سنحسبها تلقائياً
let collarRatio = 0.17;

/**
 * حساب موضع الياقة تلقائياً من صورة البلوزة (PNG بخلفية شفافة)
 */
function autoDetectCollarRatioFromImage(img) {
  try {
    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d");
    offCanvas.width = img.width;
    offCanvas.height = img.height;

    offCtx.drawImage(img, 0, 0);

    const centerX = Math.floor(img.width / 2);
    const height = img.height;

    const imageData = offCtx.getImageData(centerX, 0, 1, height);
    const data = imageData.data;

    const alphaThreshold = 20; // 0–255

    let detectedY = null;

    for (let y = 0; y < height; y++) {
      const index = y * 4 + 3; // alpha channel
      const alpha = data[index];

      if (alpha > alphaThreshold) {
        detectedY = y;
        break;
      }
    }

    if (detectedY !== null) {
      const newCollarRatio = detectedY / height;
      console.log("🔍 collarRatio من الصورة:", newCollarRatio.toFixed(3));
      collarRatio = newCollarRatio;
    } else {
      console.warn(
        "⚠️ لم يتم العثور على بكسلات غير شفافة في العمود الوسطي. سيتم استخدام القيمة الافتراضية للـ collarRatio:",
        collarRatio
      );
    }
  } catch (err) {
    console.error("خطأ أثناء تحليل صورة البلوزة لاكتشاف الياقة:", err);
  }
}

shirtImg.onload = () => {
  shirtLoaded = true;
  console.log("👕 تم تحميل صورة التيشيرت بنجاح");
  autoDetectCollarRatioFromImage(shirtImg);
};

/* MediaPipe Holistic */
let holistic = null;
let loopRunning = false;

/* ثوابت عامة */

// 🔥 تنعيم أخف = استجابة أسرع
const ALPHA_POS = 0.8; // حركة الرقبة
const ALPHA_SIZE = 0.7; // حجم البلوزة
const ALPHA_DISTS = 0.7; // مسافات الكتاف/الورك/المرفق

// ثوابت مقاس الشيرت (تقدر تعدلهم لو حاب توسّع/تضيّق بشكل عام)
const WIDTH_FROM_SHOULDERS_FACTOR = 1.9;
const WIDTH_FROM_HIPS_FACTOR = 1.6;
const WIDTH_FROM_ELBOWS_FACTOR = 0.9;
const GLOBAL_FIT_FACTOR = 1.08;

const HEIGHT_FROM_TORSO_FACTOR = 1.25;

// كم ننزل البلوزة عن الرقبة (نسبة من طول البلوزة)
const NECK_OFFSET_RATIO = 0.06;

// نشد الياقة شوي لفوق عشان تقرب من الرقبة وتبين أضيق
const COLLAR_TIGHTEN_FACTOR = 1.08;

// كم نسمح للحجم يتغيّر بين فريم وفريم (نسبة مئوية)
// 🔥 رفعناها تقريباً حرة (90%)
const MAX_SIZE_STEP = 0.9;

// متغيرات تنعيم
let prevNeckX = null;
let prevNeckY = null;
let prevWidth = null;
let prevHeight = null;

let prevShoulderDist = null;
let prevTorsoHeight = null;
let prevHipDist = null;
let prevElbowDist = null;

/* تنعيم بسيط */
function smooth(prev, current, alpha) {
  if (prev == null) return current;
  return prev * (1 - alpha) + current * alpha;
}

/* ديباغ نقطة */
function drawPointPx(x, y, color) {
  if (!canvas || !ctx) return;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPoint(lm, color) {
  if (!lm || !canvas || !ctx) return;
  const nx = MIRROR_OVERLAY ? (1 - lm.x) : lm.x; // ✅ قلب X فقط
  const x = nx * canvas.width;
  const y = lm.y * canvas.height;
  drawPointPx(x, y, color);
}

/* تهيئة Holistic */
function initHolistic() {
  if (typeof Holistic === "undefined") {
    console.error("❌ مكتبة MediaPipe Holistic غير محمّلة.");
    return;
  }

  holistic = new Holistic({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`,
  });

  holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    refineFaceLandmarks: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    selfieMode: true, // ✅ رجعناه كما كان
  });

  holistic.onResults(onHolisticResults);
}

/* النتائج من Holistic */
function onHolisticResults(results) {
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.poseLandmarks || !shirtLoaded) return;

  const pose = results.poseLandmarks;
  const face = results.faceLandmarks;

  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  const leftHip = pose[23];
  const rightHip = pose[24];
  const leftElbow = pose[13];
  const rightElbow = pose[14];

  if (!(leftShoulder && rightShoulder && leftHip && rightHip)) return;

  const visLS = leftShoulder.visibility ?? 0;
  const visRS = rightShoulder.visibility ?? 0;
  const visLH = leftHip.visibility ?? 0;
  const visRH = rightHip.visibility ?? 0;

  const minVis = Math.min(visLS, visRS, visLH, visRH);

  // لو الثقة قليلة: نثبت آخر رسم
  if (minVis < 0.4) {
    if (prevWidth && prevHeight && prevNeckX && prevNeckY) {
      let drawX = prevNeckX - prevWidth / 2;

      // ✅ قلب مكان البلوزة على الكانفاس فقط
      if (MIRROR_OVERLAY) {
        drawX = canvas.width - drawX - prevWidth;
      }

      const effectiveCollarRatio = collarRatio * COLLAR_TIGHTEN_FACTOR;
      const drawY =
        prevNeckY - prevHeight * effectiveCollarRatio +
        prevHeight * NECK_OFFSET_RATIO;

      ctx.drawImage(shirtImg, drawX, drawY, prevWidth, prevHeight);
    }
    return;
  }

  // تحويل إلى بكسل لبعض النقاط الأساسية
  const lx = leftShoulder.x * canvas.width;
  const ly = leftShoulder.y * canvas.height;
  const rx = rightShoulder.x * canvas.width;
  const ry = rightShoulder.y * canvas.height;

  const lhx = leftHip.x * canvas.width;
  const lhy = leftHip.y * canvas.height;
  const rhx = rightHip.x * canvas.width;
  const rhy = rightHip.y * canvas.height;

  const midShoulderX = (lx + rx) / 2;
  const midShoulderY = (ly + ry) / 2;
  const midHipX = (lhx + rhx) / 2;
  const midHipY = (lhy + rhy) / 2;

  const shoulderDistRaw = Math.hypot(rx - lx, ry - ly);
  const hipDistRaw = Math.hypot(rhx - lhx, rhy - lhy);
  const torsoHeightRaw = Math.hypot(
    midHipX - midShoulderX,
    midHipY - midShoulderY
  );

  // المسافة بين المرفقين (لو موجودين)
  let elbowDistRaw = null;
  if (leftElbow && rightElbow) {
    const lex = leftElbow.x * canvas.width;
    const ley = leftElbow.y * canvas.height;
    const rex = rightElbow.x * canvas.width;
    const rey = rightElbow.y * canvas.height;
    elbowDistRaw = Math.hypot(rex - lex, rey - ley);
  }

  // تنعيم المسافات (استجابة أسرع)
  const shoulderDist = smooth(prevShoulderDist, shoulderDistRaw, ALPHA_DISTS);
  const hipDist = smooth(prevHipDist, hipDistRaw, ALPHA_DISTS);
  const torsoHeight = smooth(prevTorsoHeight, torsoHeightRaw, ALPHA_DISTS);
  const elbowDist =
    elbowDistRaw != null
      ? smooth(prevElbowDist, elbowDistRaw, ALPHA_DISTS)
      : prevElbowDist;

  prevShoulderDist = shoulderDist;
  prevHipDist = hipDist;
  prevTorsoHeight = torsoHeight;
  prevElbowDist = elbowDist;

  /* ----------------- 🧠 حساب الرقبة من الأنف + الذقن ----------------- */

  let neckCandidateX = midShoulderX;
  let neckCandidateY = midShoulderY;

  // لو الوجه متوفر ونقاطه كاملة
  if (face && face.length > 152 && pose[0]) {
    const noseLm = pose[0]; // الأنف من pose
    const chinLm = face[152]; // الذقن من face mesh

    const noseX = noseLm.x * canvas.width;
    const noseY = noseLm.y * canvas.height;

    const chinX = chinLm.x * canvas.width;
    const chinY = chinLm.y * canvas.height;

    // X: متوسط بين الأنف والذقن (استقرار أفقي أفضل)
    const combinedX = (noseX + chinX) / 2;

    // Y: نقطة تحت الذقن شوي بناءً على عرض الكتاف
    const neckYOffset = shoulderDist * 0.18; // ممكن تزود/تنقص 0.15–0.22
    const combinedY = chinY + neckYOffset;

    neckCandidateX = combinedX;
    neckCandidateY = combinedY;
  }

  // تنعيم نقطة الرقبة (سريع)
  let neckX = smooth(prevNeckX, neckCandidateX, ALPHA_POS);
  let neckY = smooth(prevNeckY, neckCandidateY, ALPHA_POS);
  prevNeckX = neckX;
  prevNeckY = neckY;

  // 🧮 حساب عرض الشيرت من أكثر من مصدر
  const widthFromShoulders = shoulderDist * WIDTH_FROM_SHOULDERS_FACTOR;
  const widthFromHips = hipDist * WIDTH_FROM_HIPS_FACTOR;
  let widthFromElbows = 0;

  if (elbowDist != null) {
    widthFromElbows = elbowDist * WIDTH_FROM_ELBOWS_FACTOR;
  }

  let targetWidth = Math.max(widthFromShoulders, widthFromHips, widthFromElbows);
  targetWidth *= GLOBAL_FIT_FACTOR;

  // طول الشيرت من طول الجذع
  let targetHeight = torsoHeight * HEIGHT_FROM_TORSO_FACTOR;

  // الحفاظ على نسبة أبعاد الصورة
  const aspect = shirtImg.height / shirtImg.width;
  const widthFromHeight = targetHeight / aspect;
  if (widthFromHeight > targetWidth) {
    targetWidth = widthFromHeight;
  } else {
    targetHeight = targetWidth * aspect;
  }

  // 🔒 نسمح بتغير أسرع في الحجم
  if (prevWidth && prevHeight) {
    const maxGrowW = prevWidth * (1 + MAX_SIZE_STEP);
    const minGrowW = prevWidth * (1 - MAX_SIZE_STEP);
    targetWidth = Math.min(Math.max(targetWidth, minGrowW), maxGrowW);

    const maxGrowH = prevHeight * (1 + MAX_SIZE_STEP);
    const minGrowH = prevHeight * (1 - MAX_SIZE_STEP);
    targetHeight = Math.min(Math.max(targetHeight, minGrowH), maxGrowH);
  }

  // تنعيم الحجم (سريع)
  const shirtWidth = smooth(prevWidth, targetWidth, ALPHA_SIZE);
  const shirtHeight = smooth(prevHeight, targetHeight, ALPHA_SIZE);
  prevWidth = shirtWidth;
  prevHeight = shirtHeight;

  // مكان الرسم – مع شدّ الياقة
  let drawX = neckX - shirtWidth / 2;

  // ✅ قلب مكان البلوزة على الكانفاس فقط (حل يمين/يسار)
  if (MIRROR_OVERLAY) {
    drawX = canvas.width - drawX - shirtWidth;
  }

  const effectiveCollarRatio = collarRatio * COLLAR_TIGHTEN_FACTOR;
  const drawY =
    neckY - shirtHeight * effectiveCollarRatio +
    shirtHeight * NECK_OFFSET_RATIO;

  // ديباغ (اختياري)
  drawPoint(leftShoulder, "lime");
  drawPoint(rightShoulder, "red");
  drawPoint(leftHip, "yellow");
  drawPoint(rightHip, "yellow");

  ctx.drawImage(shirtImg, drawX, drawY, shirtWidth, shirtHeight);
}

/* تشغيل الكاميرا */
async function startCamera() {
  try {
    if (!navigator.mediaDevices || navigator.mediaDevices.getUserMedia === undefined) {
      alert("المتصفح لا يدعم تشغيل الكاميرا.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false,
    });

    if (!video) {
      console.error("عنصر الفيديو غير موجود");
      return;
    }

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (statusText) {
        statusText.textContent =
          "🎥 الكاميرا تعمل الآن بدقة أعلى. تحرك بشكل طبيعي، التيشيرت يتبع الرأس والجسم.";
      }

      if (!holistic) {
        initHolistic();
      }
      startHolisticLoop();
    };
  } catch (err) {
    console.error("خطأ في الوصول للكاميرا:", err);
    alert("تعذر الوصول للكاميرا. تأكد من إعطاء الصلاحيات للمتصفح.");

    if (statusText) {
      statusText.textContent = "حدث خطأ في تشغيل الكاميرا.";
    }
  }
}

/* اللوب */
function startHolisticLoop() {
  if (!holistic) {
    console.warn("⚠️ Holistic غير مهيأ بعد.");
    return;
  }

  if (loopRunning) return;
  loopRunning = true;

  const loop = async () => {
    if (!loopRunning) return;

    if (video.readyState >= 2) {
      try {
        await holistic.send({ image: video });
      } catch (e) {
        console.error("خطأ أثناء إرسال الفريم إلى Holistic:", e);
      }
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

/* زر تشغيل الكاميرا */
if (startBtn) {
  startBtn.addEventListener("click", () => {
    startCamera();
  });
} else {
  console.error("زر startCameraBtn غير موجود في الصفحة");
}
