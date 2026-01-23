"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGenders = exports.getCategories = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getProducts = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const employeeActivityController_1 = require("./employeeActivityController");
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("../config/cloudinary");
const normalizeImageString = (value) => {
    if (typeof value === 'string') {
        return value;
    }
    if (value && typeof value === 'object') {
        const candidate = value.url
            || value.secure_url
            || value.path;
        if (typeof candidate === 'string') {
            return candidate;
        }
    }
    return null;
};
const productsCache = new Map();
const PRODUCTS_CACHE_TTL_MS = 60 * 1000;
const getProducts = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                code: 'DATABASE_UNAVAILABLE',
                message: 'Database connection not ready. Please try again.',
            });
        }
        const { search, category, gender, season, style, occasion, sortBy, onSale, inCollection, featured, includeInactive, page = 1, limit = 6, } = req.query;
        const sort = { createdAt: -1 };
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const requestedLimit = Math.max(parseInt(limit) || 6, 1);
        const safeLimit = Math.min(requestedLimit, 6);
        const skip = (pageNum - 1) * safeLimit;
        const selectFields = 'name nameAr category gender season style occasion price active featured onSale salePercentage image colors createdAt';
        const isPrivileged = Boolean(req.user && (req.user.role === 'admin' || req.user.role === 'employee'));
        const allowInactive = includeInactive === 'true' && isPrivileged;
        const query = allowInactive ? {} : { active: true };
        if (gender && gender !== 'all') {
            query.gender = gender;
        }
        if (featured === 'true') {
            query.featured = true;
        }
        if (category && category !== 'all') {
            query.category = category;
        }
        if (onSale === 'true') {
            query.onSale = true;
        }
        if (inCollection === 'true') {
            query.inCollection = true;
        }
        if (season && season !== 'all') {
            query.season = season;
        }
        if (style && style !== 'all') {
            query.style = style;
        }
        if (occasion && occasion !== 'all') {
            query.occasion = occasion;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameAr: { $regex: search, $options: 'i' } },
            ];
        }
        const cacheKey = JSON.stringify({ query, pageNum, safeLimit });
        const cachedEntry = productsCache.get(cacheKey);
        if (cachedEntry && Date.now() - cachedEntry.timestamp < PRODUCTS_CACHE_TTL_MS) {
            return res.status(200).json(cachedEntry.payload);
        }
        const queryStartTime = Date.now();
        const hint = gender && gender !== 'all'
            ? { active: 1, gender: 1, createdAt: -1 }
            : featured === 'true'
                ? { active: 1, featured: 1, createdAt: -1 }
                : { active: 1, createdAt: -1 };
        const productsQuery = Product_1.default.find(query)
            .select(selectFields)
            .sort(sort)
            .skip(skip)
            .limit(safeLimit)
            .lean()
            .hint(hint)
            .maxTimeMS(30000);
        let products;
        try {
            const queryTimeout = 30000;
            let timeoutId;
            products = await Promise.race([
                productsQuery,
                new Promise((_, reject) => {
                    timeoutId = setTimeout(() => reject(new Error('Query timeout - exceeded 30 seconds')), queryTimeout);
                })
            ]);
            if (timeoutId)
                clearTimeout(timeoutId);
            const apiResponseTime = Date.now() - queryStartTime;
            const enableExplain = process.env.PRODUCTS_EXPLAIN === 'true';
            if (process.env.NODE_ENV === 'development' && enableExplain) {
                try {
                    const explainQuery = Product_1.default.find(query).sort(sort).limit(1).lean();
                    const explainResult = await explainQuery.explain('executionStats');
                    const executionStats = explainResult?.executionStats;
                    if (executionStats) {
                        let ixscanStage = null;
                        let currentStage = executionStats.executionStages;
                        const traverseStage = (stage) => {
                            if (!stage)
                                return null;
                            if (stage.stage === 'IXSCAN')
                                return stage;
                            if (stage.inputStage) {
                                const found = traverseStage(stage.inputStage);
                                if (found)
                                    return found;
                            }
                            if (stage.shards && Array.isArray(stage.shards)) {
                                for (const shard of stage.shards) {
                                    if (shard.executionStages) {
                                        const found = traverseStage(shard.executionStages);
                                        if (found)
                                            return found;
                                    }
                                }
                            }
                            return null;
                        };
                        ixscanStage = traverseStage(currentStage);
                        const stage = executionStats.executionStages?.stage || 'unknown';
                        const indexUsed = ixscanStage?.indexName || null;
                        const totalDocsExamined = executionStats.totalDocsExamined || 0;
                        const mongoExecutionTime = executionStats.executionTimeMillis || 0;
                        if (ixscanStage) {
                            console.log(`🔍 Index usage:`, {
                                stage: 'IXSCAN',
                                indexUsed: indexUsed || 'auto-selected',
                                totalDocsExamined: totalDocsExamined,
                                mongoExecutionTime: `${mongoExecutionTime}ms`,
                                apiResponseTime: `${apiResponseTime}ms`,
                                resultsCount: products.length
                            });
                            console.log(`✅ Using index: ${indexUsed || 'auto-selected'}`);
                        }
                        else if (stage === 'LIMIT' || stage === 'FETCH' || stage === 'SORT') {
                            console.log(`🔍 Query execution:`, {
                                topStage: stage,
                                totalDocsExamined: totalDocsExamined,
                                mongoExecutionTime: `${mongoExecutionTime}ms`,
                                apiResponseTime: `${apiResponseTime}ms`
                            });
                        }
                        else {
                            if (stage !== 'IXSCAN' && stage !== 'FETCH' && stage !== 'LIMIT' && stage !== 'SORT') {
                                console.warn(`⚠️ Unexpected execution stage: ${stage}`);
                            }
                        }
                        if (mongoExecutionTime > 100) {
                            console.warn('⚠️ Slow MongoDB query', {
                                query: JSON.stringify(query),
                                mongoExecutionTime: mongoExecutionTime,
                                apiResponseTime: apiResponseTime,
                                difference: `${apiResponseTime - mongoExecutionTime}ms (network/processing overhead)`
                            });
                        }
                        else if (apiResponseTime > 1000 && mongoExecutionTime < 100) {
                            console.warn('⚠️ API response slow despite fast MongoDB query', {
                                mongoExecutionTime: mongoExecutionTime,
                                apiResponseTime: apiResponseTime,
                                overhead: `${apiResponseTime - mongoExecutionTime}ms (likely network latency)`
                            });
                        }
                    }
                }
                catch (explainError) {
                }
            }
        }
        catch (queryError) {
            const queryTime = Date.now() - queryStartTime;
            console.error('❌ Query failed:', {
                error: queryError.message,
                queryTime: `${queryTime}ms`,
                query: JSON.stringify(query),
                sort: JSON.stringify(sort)
            });
            const isTimeout = queryError.name === 'MongoNetworkTimeoutError' ||
                queryError.name === 'MongoServerError' ||
                queryError.message?.includes('timeout') ||
                queryError.message?.includes('timed out');
            if (isTimeout) {
                console.warn('?s??,? Query timeout - returning empty result', {
                    queryTime: `${queryTime}ms`,
                    error: queryError.message
                });
                return res.status(503).json({
                    success: false,
                    code: 'DATABASE_UNAVAILABLE',
                    message: 'Query timeout. Please try again.',
                });
            }
            throw queryError;
        }
        let total = 0;
        try {
            const countQuery = Product_1.default.countDocuments(query).maxTimeMS(5000);
            let countTimeoutId;
            total = await Promise.race([
                countQuery,
                new Promise((_, reject) => {
                    countTimeoutId = setTimeout(() => reject(new Error('Count timeout')), 5000);
                })
            ]);
            if (countTimeoutId)
                clearTimeout(countTimeoutId);
        }
        catch (countError) {
            total = products.length > 0 ? products.length + skip + 10 : 0;
        }
        const responsePayload = {
            success: true,
            count: products.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / safeLimit),
            data: products,
        };
        productsCache.set(cacheKey, { timestamp: Date.now(), payload: responsePayload });
        res.status(200).json(responsePayload);
    }
    catch (error) {
        const isTimeoutError = error.name === 'MongoNetworkTimeoutError' ||
            error.name === 'MongoServerError' ||
            error.message?.includes('timeout') ||
            error.message?.includes('timed out') ||
            error.message?.includes('connection');
        if (isTimeoutError) {
            console.warn('⚠️ Database timeout in getProducts:', {
                error: error.message,
                name: error.name,
                readyState: mongoose_1.default.connection.readyState,
                host: mongoose_1.default.connection.host
            });
            if (mongoose_1.default.connection.readyState !== 1) {
                console.warn('⚠️ Database disconnected; awaiting mongoose reconnect.');
            }
            return res.status(503).json({
                success: false,
                code: 'DATABASE_UNAVAILABLE',
                message: 'Database connection timeout. Please try again later.',
            });
        }
        console.error('Error in getProducts:', error);
        res.status(503).json({
            success: false,
            code: 'DATABASE_UNAVAILABLE',
            message: error.message || 'Server error',
        });
    }
};
exports.getProducts = getProducts;
const getProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const isObjectId = productId && productId.match(/^[0-9a-fA-F]{24}$/);
        const isNumericId = productId && /^\d+$/.test(productId);
        if (!isObjectId && !isNumericId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }
        let product = null;
        if (isObjectId) {
            product = await Product_1.default.findById(productId)
                .lean()
                .maxTimeMS(5000);
        }
        if (!product && isNumericId) {
            return res.status(404).json({
                success: false,
                message: 'Product not found. This ID may be from the fallback catalog.',
            });
        }
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        res.status(200).json({
            success: true,
            data: product,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getProduct = getProduct;
const createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };
        const files = req.files;
        const mainImageFile = files?.image?.[0];
        const additionalImageFiles = files?.images || [];
        if (mainImageFile) {
            try {
                const imageUrl = await (0, cloudinary_1.uploadToCloudinary)(mainImageFile.buffer, 'stylecraft/products');
                productData.image = imageUrl;
            }
            catch (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: `Failed to upload main image: ${uploadError.message}`,
                });
            }
        }
        else if (req.body.image) {
            const bodyImage = normalizeImageString(req.body.image);
            if (!bodyImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image format',
                });
            }
            if (bodyImage.startsWith('data:image/')) {
                try {
                    const imageUrl = await (0, cloudinary_1.uploadToCloudinary)(bodyImage, 'stylecraft/products');
                    productData.image = imageUrl;
                }
                catch (uploadError) {
                    return res.status(400).json({
                        success: false,
                        message: `Failed to upload main image: ${uploadError.message}`,
                    });
                }
            }
            else {
                productData.image = bodyImage;
            }
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Product image is required',
            });
        }
        if (additionalImageFiles && additionalImageFiles.length > 0) {
            try {
                const additionalImageUrls = [];
                for (const file of additionalImageFiles) {
                    const imageUrl = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, 'stylecraft/products');
                    additionalImageUrls.push(imageUrl);
                }
                productData.images = additionalImageUrls;
            }
            catch (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: `Failed to upload additional images: ${uploadError.message}`,
                });
            }
        }
        else if (req.body.images && Array.isArray(req.body.images)) {
            const processedImages = [];
            for (const rawImg of req.body.images) {
                const img = normalizeImageString(rawImg);
                if (!img) {
                    continue;
                }
                if (img.startsWith('data:image/')) {
                    try {
                        const imageUrl = await (0, cloudinary_1.uploadToCloudinary)(img, 'stylecraft/products');
                        processedImages.push(imageUrl);
                    }
                    catch (uploadError) {
                        console.error('Failed to upload image:', uploadError);
                        continue;
                    }
                }
                else if (img.startsWith('http://') || img.startsWith('https://')) {
                    processedImages.push(img);
                }
            }
            if (processedImages.length > 0) {
                productData.images = processedImages;
            }
        }
        if (productData.price)
            productData.price = parseFloat(productData.price);
        if (productData.stock)
            productData.stock = parseInt(productData.stock);
        if (productData.salePercentage)
            productData.salePercentage = parseFloat(productData.salePercentage);
        if (productData.featured !== undefined)
            productData.featured = productData.featured === 'true' || productData.featured === true;
        if (productData.active !== undefined)
            productData.active = productData.active === 'true' || productData.active === true;
        if (productData.onSale !== undefined)
            productData.onSale = productData.onSale === 'true' || productData.onSale === true;
        if (productData.inCollection !== undefined)
            productData.inCollection = productData.inCollection === 'true' || productData.inCollection === true;
        const product = await Product_1.default.create(productData);
        if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
            await (0, employeeActivityController_1.logEmployeeActivity)(req.user._id, 'product_added', `Added new product: ${product.name}`, 'Product', product._id, { productName: product.name, productCategory: product.category });
        }
        productsCache.clear();
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product,
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }
        const oldProduct = await Product_1.default.findById(req.params.id);
        if (!oldProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        const oldStock = oldProduct.stock;
        const newStock = req.body.stock !== undefined ? req.body.stock : oldStock;
        const productData = { ...req.body };
        const files = req.files;
        const mainImageFile = files?.image?.[0];
        const additionalImageFiles = files?.images || [];
        if (mainImageFile) {
            try {
                if (oldProduct.image && oldProduct.image.includes('cloudinary.com')) {
                    await (0, cloudinary_1.deleteFromCloudinary)(oldProduct.image);
                }
                const imageUrl = await (0, cloudinary_1.uploadToCloudinary)(mainImageFile.buffer, 'stylecraft/products');
                productData.image = imageUrl;
            }
            catch (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: `Failed to upload main image: ${uploadError.message}`,
                });
            }
        }
        else if (req.body.image) {
            const bodyImage = normalizeImageString(req.body.image);
            if (!bodyImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image format',
                });
            }
            if (bodyImage.startsWith('data:image/')) {
                try {
                    if (oldProduct.image && oldProduct.image.includes('cloudinary.com')) {
                        await (0, cloudinary_1.deleteFromCloudinary)(oldProduct.image);
                    }
                    const imageUrl = await (0, cloudinary_1.uploadToCloudinary)(bodyImage, 'stylecraft/products');
                    productData.image = imageUrl;
                }
                catch (uploadError) {
                    return res.status(400).json({
                        success: false,
                        message: `Failed to upload main image: ${uploadError.message}`,
                    });
                }
            }
            else if (bodyImage !== oldProduct.image) {
                if (oldProduct.image && oldProduct.image.includes('cloudinary.com')) {
                    await (0, cloudinary_1.deleteFromCloudinary)(oldProduct.image);
                }
                productData.image = bodyImage;
            }
        }
        if (additionalImageFiles && additionalImageFiles.length > 0) {
            try {
                if (oldProduct.images && oldProduct.images.length > 0) {
                    for (const oldImg of oldProduct.images) {
                        if (oldImg.includes('cloudinary.com')) {
                            await (0, cloudinary_1.deleteFromCloudinary)(oldImg);
                        }
                    }
                }
                const additionalImageUrls = [];
                for (const file of additionalImageFiles) {
                    const imageUrl = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, 'stylecraft/products');
                    additionalImageUrls.push(imageUrl);
                }
                productData.images = additionalImageUrls;
            }
            catch (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: `Failed to upload additional images: ${uploadError.message}`,
                });
            }
        }
        else if (req.body.images && Array.isArray(req.body.images)) {
            const processedImages = [];
            const oldCloudinaryImages = (oldProduct.images || []).filter(img => img.includes('cloudinary.com'));
            for (const rawImg of req.body.images) {
                const img = normalizeImageString(rawImg);
                if (!img) {
                    continue;
                }
                if (img.startsWith('data:image/')) {
                    try {
                        const imageUrl = await (0, cloudinary_1.uploadToCloudinary)(img, 'stylecraft/products');
                        processedImages.push(imageUrl);
                    }
                    catch (uploadError) {
                        console.error('Failed to upload image:', uploadError);
                        continue;
                    }
                }
                else if (img.startsWith('http://') || img.startsWith('https://')) {
                    processedImages.push(img);
                }
            }
            if (oldCloudinaryImages.length > 0) {
                for (const oldImg of oldCloudinaryImages) {
                    if (!processedImages.includes(oldImg)) {
                        await (0, cloudinary_1.deleteFromCloudinary)(oldImg);
                    }
                }
            }
            if (processedImages.length > 0) {
                productData.images = processedImages;
            }
        }
        if (productData.price)
            productData.price = parseFloat(productData.price);
        if (productData.stock)
            productData.stock = parseInt(productData.stock);
        if (productData.salePercentage)
            productData.salePercentage = parseFloat(productData.salePercentage);
        if (productData.featured !== undefined)
            productData.featured = productData.featured === 'true' || productData.featured === true;
        if (productData.active !== undefined)
            productData.active = productData.active === 'true' || productData.active === true;
        if (productData.onSale !== undefined)
            productData.onSale = productData.onSale === 'true' || productData.onSale === true;
        if (productData.inCollection !== undefined)
            productData.inCollection = productData.inCollection === 'true' || productData.inCollection === true;
        const product = await Product_1.default.findByIdAndUpdate(req.params.id, productData, {
            new: true,
            runValidators: true,
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
            const activityDescription = oldStock !== newStock
                ? `Updated product: ${product.name} (Stock: ${oldStock} → ${newStock})`
                : `Updated product: ${product.name}`;
            await (0, employeeActivityController_1.logEmployeeActivity)(req.user._id, oldStock !== newStock ? 'stock_updated' : 'product_updated', activityDescription, 'Product', product._id, {
                productName: product.name,
                oldStock,
                newStock,
                stockChange: newStock - oldStock
            });
        }
        productsCache.clear();
        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product,
        });
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }
        const product = await Product_1.default.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }
        if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
            await (0, employeeActivityController_1.logEmployeeActivity)(req.user._id, 'product_deleted', `Deleted product: ${product.name}`, 'Product', product._id, { productName: product.name });
        }
        if (product.image && product.image.includes('cloudinary.com')) {
            await (0, cloudinary_1.deleteFromCloudinary)(product.image);
        }
        if (product.images && product.images.length > 0) {
            for (const img of product.images) {
                if (img.includes('cloudinary.com')) {
                    await (0, cloudinary_1.deleteFromCloudinary)(img);
                }
            }
        }
        await Product_1.default.findByIdAndDelete(req.params.id);
        productsCache.clear();
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.deleteProduct = deleteProduct;
const getCategories = async (req, res) => {
    try {
        const categories = await Product_1.default.distinct('category');
        res.status(200).json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getCategories = getCategories;
const getGenders = async (req, res) => {
    try {
        const genders = await Product_1.default.distinct('gender');
        res.status(200).json({
            success: true,
            data: genders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getGenders = getGenders;
