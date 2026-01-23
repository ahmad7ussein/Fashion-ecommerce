"use strict";
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/stylecraft";
const APPLY_CHANGES = process.argv.includes("--apply");

const mojibakePattern = /[ØÙÃÂÐâ]/;
const arabicPattern = /[\u0600-\u06FF]/;

const toUtf8FromLatin1 = (value) => Buffer.from(value, "latin1").toString("utf8");

const shouldRepair = (value) =>
  typeof value === "string" &&
  mojibakePattern.test(value) &&
  !arabicPattern.test(value);

const loadModels = () => {
  const modelsDir = path.join(__dirname, "../models");
  const files = fs.readdirSync(modelsDir).filter((file) => file.endsWith(".js"));
  files.forEach((file) => {
    require(path.join(modelsDir, file));
  });
};

const walkAndCollectFixes = (obj, basePath = "") => {
  const fixes = [];
  if (!obj || typeof obj !== "object") {
    return fixes;
  }
  const entries = Array.isArray(obj) ? obj.entries() : Object.entries(obj);
  for (const [key, value] of entries) {
    const pathKey = Array.isArray(obj) ? `${basePath}[${key}]` : basePath ? `${basePath}.${key}` : key;
    if (typeof value === "string") {
      if (shouldRepair(value)) {
        const repaired = toUtf8FromLatin1(value);
        if (repaired !== value && arabicPattern.test(repaired)) {
          fixes.push({ path: pathKey, value, repaired });
        }
      }
      continue;
    }
    if (value && typeof value === "object") {
      fixes.push(...walkAndCollectFixes(value, pathKey));
    }
  }
  return fixes;
};

const applyFixesToDoc = (doc, fixes) => {
  fixes.forEach((fix) => {
    doc.set(fix.path, fix.repaired);
  });
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    loadModels();
    const modelNames = mongoose.modelNames();
    if (modelNames.length === 0) {
      console.warn("No models registered. Exiting.");
      process.exit(0);
    }

    let totalFixes = 0;
    for (const name of modelNames) {
      const Model = mongoose.model(name);
      const cursor = Model.find({}).cursor();
      let modelFixes = 0;

      for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        const data = doc.toObject({ depopulate: true, virtuals: false });
        const fixes = walkAndCollectFixes(data);
        if (fixes.length === 0) {
          continue;
        }
        modelFixes += fixes.length;
        totalFixes += fixes.length;
        console.log(`[${name}] ${doc._id} -> ${fixes.length} field(s)`);
        fixes.forEach((fix) => {
          console.log(`  - ${fix.path}: "${fix.value}" -> "${fix.repaired}"`);
        });
        if (APPLY_CHANGES) {
          applyFixesToDoc(doc, fixes);
          await doc.save();
        }
      }

      if (modelFixes > 0) {
        console.log(`[${name}] fixes detected: ${modelFixes}`);
      }
    }

    if (!APPLY_CHANGES) {
      console.log("Dry run complete. Re-run with --apply to persist fixes.");
    }
    console.log(`Total fixes detected: ${totalFixes}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to repair mojibake Arabic:", error);
    process.exit(1);
  }
};

run();
