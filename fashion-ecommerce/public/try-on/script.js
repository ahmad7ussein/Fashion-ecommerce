let video = null;
let startBtn = null;
let statusText = null;
let canvas = null;
let ctx = null;

function initElements() {
  video = document.getElementById("video");
  startBtn = document.getElementById("startCameraBtn");
  statusText = document.getElementById("statusText");
  canvas = document.getElementById("overlay");

  if (canvas) {
    ctx = canvas.getContext("2d");
  } else {
    ctx = null;
    console.warn("Canvas element not found with id = overlay");
  }

  return Boolean(video && startBtn && statusText && canvas);
}

initElements();

const MIRROR_OVERLAY = true;

const SHORT_SLEEVE_CONFIG = {
  collarTightenFactor: 1.08,
  neckOffsetRatio: 0.05,

  widthFromShouldersFactor: 1.9,
  widthFromHipsFactor: 1.6,
  widthFromElbowsFactor: 0.9,
  globalFitFactor: 1.08,

  heightFromTorsoFactor: 1.25,
};

const SHORT_SLEEVE_COLLAR_CONFIG = {
  collarTightenFactor: 1.129,
  neckOffsetRatio: 0.009,

  widthFromShouldersFactor: 1.9,
  widthFromHipsFactor: 1.6,
  widthFromElbowsFactor: 0.9,
  globalFitFactor: 1.09,

  heightFromTorsoFactor: 1.25,

  neckPinch: 0.1,
};

const PLAIN_SHORT_CONFIG = {
  collarTightenFactor: 1.08,
  neckOffsetRatio: -0.01,

  widthFromShouldersFactor: 1.75,
  widthFromHipsFactor: 1.45,
  widthFromElbowsFactor: 0.85,
  globalFitFactor: 1.03,

  heightFromTorsoFactor: 1.2,

  neckPinch: 0.0,
};

const HOODIE_CONFIG = {
  collarTightenFactor: 1.08,
  neckOffsetRatio: -0.02,

  widthFromShouldersFactor: 1.83,
  widthFromHipsFactor: 1.45,
  widthFromElbowsFactor: 0.85,
  globalFitFactor: 1.1,

  heightFromTorsoFactor: 1.2,
};

const SHIRT_CONFIG = {
  collarTightenFactor: 1.1,
  neckOffsetRatio: 0.01,

  widthFromShouldersFactor: 1.9,
  widthFromHipsFactor: 1.6,
  widthFromElbowsFactor: 0.9,
  globalFitFactor: 1.08,

  heightFromTorsoFactor: 1.25,

  neckPinch: 0.45,
};

const KOM_SHIRT_CONFIG = {
  collarTightenFactor: 1.12,
  neckOffsetRatio: 0.001,

  widthFromShouldersFactor: 1.92,
  widthFromHipsFactor: 1.62,
  widthFromElbowsFactor: 0.9,
  globalFitFactor: 1.08,

  heightFromTorsoFactor: 1.25,

  neckPinch: 0.3,
};

const garments = {
  ss1: {
    name: "بلوزة نص كم (1)",
    src: "/try-on/shirt1.png",
    warpType: "ss4",
    neckPinch: 0.3,
    ...SHORT_SLEEVE_CONFIG,
  },
  ss2: {
    name: "بلوزة نص كم (2)",
    src: "/try-on/shirt2.png",
    warpType: "ss4",
    neckPinch: 0.3,
    ...SHORT_SLEEVE_CONFIG,
  },
  ss3: {
    name: "بلوزة نص كم (3)",
    src: "/try-on/shirt3.png",
    warpType: "ss4",
    neckPinch: 0.3,
    ...SHORT_SLEEVE_CONFIG,
  },

  ss4: {
    name: "بلوزة نص كم (4)",
    src: "/try-on/shirt4.png",
    warpType: "ss4",
    neckPinch: 0.3,
    ...SHORT_SLEEVE_CONFIG,
  },

  shirt_collar: {
    name: "بلوزة نص كم قبة",
    src: "/try-on/shirt_collar.png",
    xOffsetRatio: 0.007,
    warpType: "collar",
    ...SHORT_SLEEVE_COLLAR_CONFIG,
  },

  shirt_collar2: {
    name: "بلوزة نص كم قبة (2)",
    src: "/try-on/shirt_collar2.png",
    xOffsetRatio: 0.007,
    warpType: "collar",
    ...SHORT_SLEEVE_COLLAR_CONFIG,
  },

  plain_short: {
    name: "بلوزة كم سادة",
    src: "/try-on/plain_short.png",
    xOffsetRatio: 0.012,
    warpType: "plain_short",
    ...PLAIN_SHORT_CONFIG,
  },

  hoodie: {
    name: "هودي",
    src: "/try-on/hoodie.png",
    xOffsetRatio: 0.007,
    warpType: "hoodie",
    neckPinch: 0.1,
    ...HOODIE_CONFIG,
  },

  qamies_kom: {
    name: "قميص كوم",
    src: "/try-on/qamies_kom.png",
    xOffsetRatio: 0.02,
    warpType: "qamies_kom",
    ...KOM_SHIRT_CONFIG,
  },

  shirt: {
    name: "قميص",
    src: "/try-on/qamies.png",
    xOffsetRatio: 0.007,
    group: "shirt",
    ...SHIRT_CONFIG,
  },
  shirt2: {
    name: "قميص 2",
    src: "/try-on/qamies2.png",
    xOffsetRatio: 0.007,
    group: "shirt",
    ...SHIRT_CONFIG,
  },
  shirt3: {
    name: "قميص 3",
    src: "/try-on/qamies3.png",
    xOffsetRatio: 0.007,
    group: "shirt",
    ...SHIRT_CONFIG,
  },
};

let currentGarmentKey = null;
let currentGarment = null;

let garmentImg = new Image();
let garmentLoaded = false;

let collarRatio = 0.17;

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

    const alphaThreshold = 20;
    let detectedY = null;

    for (let y = 0; y < height; y++) {
      const index = y * 4 + 3;
      const alpha = data[index];
      if (alpha > alphaThreshold) {
        detectedY = y;
        break;
      }
    }

    if (detectedY !== null) {
      const newCollarRatio = detectedY / height;
      console.log("collarRatio detected from image:", newCollarRatio.toFixed(3));
      collarRatio = newCollarRatio;
    } else {
      console.warn(
        "No opaque pixels found in the center column. Using default collarRatio:",
        collarRatio
      );
    }
  } catch (err) {
    console.error("Error analyzing garment image to detect collar:", err);
  }
}

function resetSmoothingState() {
  prevNeckX = null;
  prevNeckY = null;
  prevWidth = null;
  prevHeight = null;

  prevShoulderDist = null;
  prevTorsoHeight = null;
  prevHipDist = null;
  prevElbowDist = null;
}

function loadGarment(key) {
  if (!garments[key]) return;

  currentGarmentKey = key;
  currentGarment = garments[key];

  garmentLoaded = false;
  collarRatio = 0.17;

  garmentImg = new Image();
  garmentImg.src = currentGarment.src;

  garmentImg.onload = () => {
    garmentLoaded = true;
    console.log("Loaded garment:", currentGarment.name);
    autoDetectCollarRatioFromImage(garmentImg);
    resetSmoothingState();

    if (statusText) {
      statusText.textContent = `تم اختيار: ${currentGarment.name}. شغّل الكاميرا أو تابع التجربة.`;
    }
  };

  garmentImg.onerror = () => {
    garmentLoaded = false;
    console.error("Failed to load garment image:", currentGarment.src);
    if (statusText) statusText.textContent = `لم أجد الصورة: ${currentGarment.src}`;
  };
}

if (statusText) {
  statusText.textContent = "اختر قطعة من المتجر ثم شغّل الكاميرا لبدء التجربة.";
}

let holistic = null;
let loopRunning = false;

const ALPHA_POS = 0.8;
const ALPHA_SIZE = 0.7;
const ALPHA_DISTS = 0.7;

const MAX_SIZE_STEP = 0.9;

let prevNeckX = null;
let prevNeckY = null;
let prevWidth = null;
let prevHeight = null;

let prevShoulderDist = null;
let prevTorsoHeight = null;
let prevHipDist = null;
let prevElbowDist = null;

function smooth(prev, current, alpha) {
  if (prev == null) return current;
  return prev * (1 - alpha) + current * alpha;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function drawGarmentWithNeckPinch(ctx, img, x, y, w, h, pinch, options = {}) {
  if (!ctx || !img || !img.width || !img.height) return;

  const slices = options.slices ?? 40;
  const neckZone = options.neckZone ?? 0.18;
  const strengthPow = options.strengthPow ?? 4;
  const shoulderSafeZone = options.shoulderSafeZone ?? 0.24;

  const sw = img.width;
  const sh = img.height;

  const sliceSrcH = sh / slices;
  const sliceDstH = h / slices;

  const centerX = x + w / 2;

  const safe = clamp(shoulderSafeZone, 0, 0.45);

  const innerBaseW = w * (1 - safe * 2);
  const outerW = w - innerBaseW;

  for (let i = 0; i < slices; i++) {
    const srcY = i * sliceSrcH;
    const dstY = y + i * sliceDstH;

    const t = i / (slices - 1);

    const neckT = clamp(t / neckZone, 0, 1);
    const weightY = Math.pow(1 - neckT, strengthPow);

    const pinchAmount = pinch * weightY;

    const innerAfterW = innerBaseW * (1 - pinchAmount);

    const dstW = outerW + innerAfterW;
    const dstX = centerX - dstW / 2;

    ctx.drawImage(img, 0, srcY, sw, sliceSrcH, dstX, dstY, dstW, sliceDstH);
  }
}

function drawPointPx(x, y, color) {
  if (!canvas || !ctx) return;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPoint(lm, color) {
  if (!lm || !canvas || !ctx) return;
  const nx = MIRROR_OVERLAY ? (1 - lm.x) : lm.x;
  const x = nx * canvas.width;
  const y = lm.y * canvas.height;
  drawPointPx(x, y, color);
}

function initHolistic() {
  if (typeof Holistic === "undefined") {
    console.error("MediaPipe Holistic library is not loaded.");
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
    selfieMode: true,
  });

  holistic.onResults(onHolisticResults);
}

function onHolisticResults(results) {
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.poseLandmarks || !garmentLoaded || !currentGarment) return;

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

  const xOffsetRatio = currentGarment.xOffsetRatio ?? 0;

  if (minVis < 0.4) {
    if (prevWidth && prevHeight && prevNeckX && prevNeckY) {
      let drawX = prevNeckX - prevWidth / 2;

      if (MIRROR_OVERLAY) {
        drawX = canvas.width - drawX - prevWidth;
      }

      drawX += prevWidth * xOffsetRatio;

      const effectiveCollarRatio =
        collarRatio * currentGarment.collarTightenFactor;
      const drawY =
        prevNeckY -
        prevHeight * effectiveCollarRatio +
        prevHeight * currentGarment.neckOffsetRatio;

      const pinch = currentGarment.neckPinch ?? 0;

      if (currentGarment.group === "shirt" && pinch > 0) {
        drawGarmentWithNeckPinch(
          ctx,
          garmentImg,
          drawX,
          drawY,
          prevWidth,
          prevHeight,
          pinch,
          {
            slices: 40,
            neckZone: 0.18,
            strengthPow: 4,
            shoulderSafeZone: 0.26,
          }
        );
      } else if (currentGarment.warpType === "collar" && pinch > 0) {
        drawGarmentWithNeckPinch(
          ctx,
          garmentImg,
          drawX,
          drawY,
          prevWidth,
          prevHeight,
          pinch,
          {
            slices: 35,
            neckZone: 0.26,
            strengthPow: 3,
            shoulderSafeZone: 0.26,
          }
        );
      } else if (currentGarment.warpType === "ss4" && pinch > 0) {
        drawGarmentWithNeckPinch(
          ctx,
          garmentImg,
          drawX,
          drawY,
          prevWidth,
          prevHeight,
          pinch,
          {
            slices: 40,
            neckZone: 0.18,
            strengthPow: 3,
            shoulderSafeZone: 0.3,
          }
        );
      } else if (currentGarment.warpType === "plain_short" && pinch > 0) {
        drawGarmentWithNeckPinch(
          ctx,
          garmentImg,
          drawX,
          drawY,
          prevWidth,
          prevHeight,
          pinch,
          {
            slices: 44,
            neckZone: 0.22,
            strengthPow: 3,
            shoulderSafeZone: 0.3,
          }
        );
      } else if (currentGarment.warpType === "hoodie" && pinch > 0) {
        drawGarmentWithNeckPinch(
          ctx,
          garmentImg,
          drawX,
          drawY,
          prevWidth,
          prevHeight,
          pinch,
          {
            slices: 46,
            neckZone: 0.2,
            strengthPow: 3,
            shoulderSafeZone: 0.32,
          }
        );
      } else if (currentGarment.warpType === "qamies_kom" && pinch > 0) {
        drawGarmentWithNeckPinch(
          ctx,
          garmentImg,
          drawX,
          drawY,
          prevWidth,
          prevHeight,
          pinch,
          {
            slices: 48,
            neckZone: 0.19,
            strengthPow: 4,
            shoulderSafeZone: 0.27,
          }
        );
      } else {
        ctx.drawImage(garmentImg, drawX, drawY, prevWidth, prevHeight);
      }
    }
    return;
  }

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

  let elbowDistRaw = null;
  if (leftElbow && rightElbow) {
    const lex = leftElbow.x * canvas.width;
    const ley = leftElbow.y * canvas.height;
    const rex = rightElbow.x * canvas.width;
    const rey = rightElbow.y * canvas.height;
    elbowDistRaw = Math.hypot(rex - lex, rey - ley);
  }

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

  let neckCandidateX = midShoulderX;
  let neckCandidateY = midShoulderY;

  if (face && face.length > 152 && pose[0]) {
    const noseLm = pose[0];
    const chinLm = face[152];

    const noseX = noseLm.x * canvas.width;
    const chinX = chinLm.x * canvas.width;
    const chinY = chinLm.y * canvas.height;

    const combinedX = (noseX + chinX) / 2;
    const neckYOffset = shoulderDist * 0.18;
    const combinedY = chinY + neckYOffset;

    neckCandidateX = combinedX;
    neckCandidateY = combinedY;
  }

  let neckX = smooth(prevNeckX, neckCandidateX, ALPHA_POS);
  let neckY = smooth(prevNeckY, neckCandidateY, ALPHA_POS);
  prevNeckX = neckX;
  prevNeckY = neckY;

  const widthFromShoulders =
    shoulderDist * currentGarment.widthFromShouldersFactor;
  const widthFromHips = hipDist * currentGarment.widthFromHipsFactor;
  let widthFromElbows = 0;

  if (elbowDist != null) {
    widthFromElbows = elbowDist * currentGarment.widthFromElbowsFactor;
  }

  let targetWidth = Math.max(widthFromShoulders, widthFromHips, widthFromElbows);
  targetWidth *= currentGarment.globalFitFactor;

  let targetHeight = torsoHeight * currentGarment.heightFromTorsoFactor;

  const aspect = garmentImg.height / garmentImg.width;
  const widthFromHeight = targetHeight / aspect;
  if (widthFromHeight > targetWidth) {
    targetWidth = widthFromHeight;
  } else {
    targetHeight = targetWidth * aspect;
  }

  if (prevWidth && prevHeight) {
    const maxGrowW = prevWidth * (1 + MAX_SIZE_STEP);
    const minGrowW = prevWidth * (1 - MAX_SIZE_STEP);
    targetWidth = Math.min(Math.max(targetWidth, minGrowW), maxGrowW);

    const maxGrowH = prevHeight * (1 + MAX_SIZE_STEP);
    const minGrowH = prevHeight * (1 - MAX_SIZE_STEP);
    targetHeight = Math.min(Math.max(targetHeight, minGrowH), maxGrowH);
  }

  const garmentWidth = smooth(prevWidth, targetWidth, ALPHA_SIZE);
  const garmentHeight = smooth(prevHeight, targetHeight, ALPHA_SIZE);
  prevWidth = garmentWidth;
  prevHeight = garmentHeight;

  let drawX = neckX - garmentWidth / 2;

  if (MIRROR_OVERLAY) {
    drawX = canvas.width - drawX - garmentWidth;
  }

  drawX += garmentWidth * xOffsetRatio;

  const effectiveCollarRatio = collarRatio * currentGarment.collarTightenFactor;
  const drawY =
    neckY -
    garmentHeight * effectiveCollarRatio +
    garmentHeight * currentGarment.neckOffsetRatio;

  drawPoint(leftShoulder, "lime");
  drawPoint(rightShoulder, "red");
  drawPoint(leftHip, "yellow");
  drawPoint(rightHip, "yellow");

  const pinch = currentGarment.neckPinch ?? 0;

  if (currentGarment.group === "shirt" && pinch > 0) {
    drawGarmentWithNeckPinch(ctx, garmentImg, drawX, drawY, garmentWidth, garmentHeight, pinch, {
      slices: 40,
      neckZone: 0.18,
      strengthPow: 4,
      shoulderSafeZone: 0.26,
    });
  } else if (currentGarment.warpType === "collar" && pinch > 0) {
    drawGarmentWithNeckPinch(ctx, garmentImg, drawX, drawY, garmentWidth, garmentHeight, pinch, {
      slices: 40,
      neckZone: 0.18,
      strengthPow: 3,
      shoulderSafeZone: 0.26,
    });
  } else if (currentGarment.warpType === "ss4" && pinch > 0) {
    drawGarmentWithNeckPinch(ctx, garmentImg, drawX, drawY, garmentWidth, garmentHeight, pinch, {
      slices: 40,
      neckZone: 0.18,
      strengthPow: 3,
      shoulderSafeZone: 0.3,
    });
  } else if (currentGarment.warpType === "plain_short" && pinch > 0) {
    drawGarmentWithNeckPinch(ctx, garmentImg, drawX, drawY, garmentWidth, garmentHeight, pinch, {
      slices: 44,
      neckZone: 0.22,
      strengthPow: 3,
      shoulderSafeZone: 0.3,
    });
  } else if (currentGarment.warpType === "hoodie" && pinch > 0) {
    drawGarmentWithNeckPinch(ctx, garmentImg, drawX, drawY, garmentWidth, garmentHeight, pinch, {
      slices: 46,
      neckZone: 0.2,
      strengthPow: 3,
      shoulderSafeZone: 0.32,
    });
  } else if (currentGarment.warpType === "qamies_kom" && pinch > 0) {
    drawGarmentWithNeckPinch(ctx, garmentImg, drawX, drawY, garmentWidth, garmentHeight, pinch, {
      slices: 48,
      neckZone: 0.19,
      strengthPow: 4,
      shoulderSafeZone: 0.27,
    });
  } else {
    ctx.drawImage(garmentImg, drawX, drawY, garmentWidth, garmentHeight);
  }
}

async function startCamera() {
  try {
    if (!navigator.mediaDevices || navigator.mediaDevices.getUserMedia === undefined) {
      alert("Your browser does not support camera access.");
      return;
    }

    if (!video) {
      initElements();
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
      console.error("Video element not found");
      return;
    }

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      syncCanvasToVideo();

      if (statusText) {
        statusText.textContent =
          "الكاميرا تعمل الآن. اختر قطعة من المتجر وشاهدها على جسمك مباشرة.";
      }

      if (!holistic) {
        initHolistic();
      }
      startHolisticLoop();
    };
  } catch (err) {
    console.error("Camera access error:", err);
    alert("Unable to access the camera. Make sure you allowed camera permission.");

    if (statusText) {
      statusText.textContent = "حدث خطأ في تشغيل الكاميرا.";
    }
  }
}

function startHolisticLoop() {
  if (!holistic) {
    console.warn("Holistic is not initialized yet.");
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
        console.error("Error sending frame to Holistic:", e);
      }
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

function bindStartButton() {
  if (!startBtn) {
    initElements();
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      startCamera();
    });
  } else {
    console.error("startCameraBtn button not found on the page");
  }
}

function initStoreCards() {
  const cards = document.querySelectorAll(".garment-card");
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.dataset.garment;
      loadGarment(key);

      cards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
    });
  });
}

bindStartButton();
initStoreCards();

function syncCanvasToVideo() {
  if (!video || !canvas) return;

  if (video.videoWidth && video.videoHeight) {
    const newW = video.videoWidth;
    const newH = video.videoHeight;

    if (canvas.width !== newW || canvas.height !== newH) {
      canvas.width = newW;
      canvas.height = newH;

      resetSmoothingState();
    }
  }
}

window.addEventListener("resize", syncCanvasToVideo);
window.addEventListener("orientationchange", () => {
  setTimeout(syncCanvasToVideo, 150);
});
