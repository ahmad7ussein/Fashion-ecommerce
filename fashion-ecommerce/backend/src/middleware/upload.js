"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImages = exports.uploadMultiple = exports.uploadSingle = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        fieldSize: 10 * 1024 * 1024,
    },
});
exports.uploadSingle = exports.upload.single('image');
exports.uploadMultiple = exports.upload.array('images', 5);
exports.uploadProductImages = exports.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 },
]);
