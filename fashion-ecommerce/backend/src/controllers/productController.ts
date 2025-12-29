import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { logEmployeeActivity } from './employeeActivityController';
import mongoose from 'mongoose';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

const normalizeImageString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    const candidate = (value as { url?: unknown; secure_url?: unknown; path?: unknown }).url
      || (value as { url?: unknown; secure_url?: unknown; path?: unknown }).secure_url
      || (value as { url?: unknown; secure_url?: unknown; path?: unknown }).path;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }
  return null;
};

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    // Quick connection check - don't wait too long
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection not ready. Please try again.',
      });
    }
    
    // Removed per-request ping; rely on connection state and query handling

    const {
      search,
      category,
      gender,
      season,
      style,
      occasion,
      sortBy,
      onSale,
      inCollection,
      featured,
      page = 1,
      limit = 50,
    } = req.query;

    // All queries sort by createdAt: -1 (newest first) to match indexes
    const sort = { createdAt: -1 };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Select only necessary fields to reduce data transfer
    const selectFields = 'name nameAr category price stock active featured onSale salePercentage image inCollection createdAt';
    
    // Build query - always filter by active: true
    const query: any = { active: true };
    
    // Add filters that match our indexes
    if (gender && gender !== 'all') {
      query.gender = gender;
    }
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Additional filters (will be filtered client-side or use default index)
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
    
    // Handle search - use regex (simple, allows index usage on active/gender)
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { nameAr: { $regex: search as string, $options: 'i' } },
      ];
    }
    
    // Cap limit to prevent large queries
    const safeLimit = Math.min(parseInt(limit as string) || 50, 50);
    
    // Measure query execution time
    const queryStartTime = Date.now();
    
    // Execute query - MongoDB will automatically choose best index
    // No .hint() - let MongoDB query optimizer choose
    const productsQuery = Product.find(query)
      .select(selectFields)
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .lean() // Return plain objects (faster, no Mongoose overhead)
      .maxTimeMS(10000); // 10s MongoDB (increased due to network latency)
    
    let products: any[];
    try {
      // Add Node.js-level timeout wrapper (in case MongoDB maxTimeMS doesn't work)
      // Increased to 15s due to network latency (MongoDB is fast but network is slow)
      const queryTimeout = 15000; // 15s total (to account for network latency)
      let timeoutId: NodeJS.Timeout;
      
      products = await Promise.race([
        productsQuery,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Query timeout - exceeded 15 seconds')), queryTimeout);
        })
      ]) as any[];
      
      // Clear timeout if query succeeded
      if (timeoutId!) clearTimeout(timeoutId);
      
      const apiResponseTime = Date.now() - queryStartTime;
      
      // In development ONLY: explain query to confirm index usage
      // This runs AFTER the actual query to avoid affecting API performance
      if (process.env.NODE_ENV === 'development') {
        try {
          // Run explain on a separate query (not the actual one) to avoid performance impact
          const explainQuery = Product.find(query).sort(sort).limit(1).lean();
          const explainResult = await explainQuery.explain('executionStats');
          const executionStats = explainResult?.executionStats;
          
          if (executionStats) {
            // Extract the actual index scan stage (may be nested under LIMIT/FETCH/SORT)
            let ixscanStage: any = null;
            let currentStage: any = executionStats.executionStages;
            
            // Traverse the execution plan tree to find IXSCAN stage
            const traverseStage = (stage: any): any => {
              if (!stage) return null;
              if (stage.stage === 'IXSCAN') return stage;
              if (stage.inputStage) {
                const found = traverseStage(stage.inputStage);
                if (found) return found;
              }
              if (stage.shards && Array.isArray(stage.shards)) {
                for (const shard of stage.shards) {
                  if (shard.executionStages) {
                    const found = traverseStage(shard.executionStages);
                    if (found) return found;
                  }
                }
              }
              return null;
            };
            
            ixscanStage = traverseStage(currentStage);
            
            // Extract information directly from executionStats (top-level stats)
            const stage = executionStats.executionStages?.stage || 'unknown';
            const indexUsed = ixscanStage?.indexName || null;
            const totalDocsExamined = executionStats.totalDocsExamined || 0;
            const mongoExecutionTime = executionStats.executionTimeMillis || 0;
            
            // Log index usage information
            if (ixscanStage) {
              // Index is being used (IXSCAN found)
              console.log(`🔍 Index usage:`, {
                stage: 'IXSCAN',
                indexUsed: indexUsed || 'auto-selected',
                totalDocsExamined: totalDocsExamined,
                mongoExecutionTime: `${mongoExecutionTime}ms`,
                apiResponseTime: `${apiResponseTime}ms`,
                resultsCount: products.length
              });
              console.log(`✅ Using index: ${indexUsed || 'auto-selected'}`);
            } else if (stage === 'LIMIT' || stage === 'FETCH' || stage === 'SORT') {
              // Top stage is LIMIT/FETCH/SORT - this is normal, index may be used underneath
              console.log(`🔍 Query execution:`, {
                topStage: stage,
                totalDocsExamined: totalDocsExamined,
                mongoExecutionTime: `${mongoExecutionTime}ms`,
                apiResponseTime: `${apiResponseTime}ms`
              });
            } else {
              // Only warn if we truly don't see IXSCAN and top stage is not normal
              if (stage !== 'IXSCAN' && stage !== 'FETCH' && stage !== 'LIMIT' && stage !== 'SORT') {
                console.warn(`⚠️ Unexpected execution stage: ${stage}`);
              }
            }
            
            // Warn only if MongoDB execution time is slow (NOT API response time)
            if (mongoExecutionTime > 100) {
              console.warn('⚠️ Slow MongoDB query', {
                query: JSON.stringify(query),
                mongoExecutionTime: mongoExecutionTime,
                apiResponseTime: apiResponseTime,
                difference: `${apiResponseTime - mongoExecutionTime}ms (network/processing overhead)`
              });
            } else if (apiResponseTime > 1000 && mongoExecutionTime < 100) {
              // MongoDB is fast but API is slow - likely network or processing issue
              console.warn('⚠️ API response slow despite fast MongoDB query', {
                mongoExecutionTime: mongoExecutionTime,
                apiResponseTime: apiResponseTime,
                overhead: `${apiResponseTime - mongoExecutionTime}ms (likely network latency)`
              });
            }
          }
        } catch (explainError) {
          // Explain failed - silently continue (don't affect production or log errors)
        }
      }
    } catch (queryError: any) {
      const queryTime = Date.now() - queryStartTime;
      console.error('❌ Query failed:', {
        error: queryError.message,
        queryTime: `${queryTime}ms`,
        query: JSON.stringify(query),
        sort: JSON.stringify(sort)
      });
      
      // If query times out (MongoDB or Node.js timeout), return a clear 503
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
    
    // Get count - use same query, no hint (let MongoDB choose)
    // Skip count if query was slow to avoid additional timeout
    let total = 0;
    try {
      const countQuery = Product.countDocuments(query).maxTimeMS(10000); // 10s MongoDB
      // Add Node.js-level timeout wrapper
      let countTimeoutId: NodeJS.Timeout;
      total = await Promise.race([
        countQuery,
        new Promise((_, reject) => {
          countTimeoutId = setTimeout(() => reject(new Error('Count timeout')), 12000); // 12s Node.js
        })
      ]) as number;
      if (countTimeoutId!) clearTimeout(countTimeoutId);
    } catch (countError) {
      // If count fails, estimate from results (acceptable for pagination)
      total = products.length > 0 ? products.length + skip + 10 : 0;
    }

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });

  } catch (error: any) {
    const isTimeoutError = error.name === 'MongoNetworkTimeoutError' || 
                          error.name === 'MongoServerError' ||
                          error.message?.includes('timeout') || 
                          error.message?.includes('timed out') ||
                          error.message?.includes('connection');
    
    if (isTimeoutError) {
      console.warn('⚠️ Database timeout in getProducts:', {
        error: error.message,
        name: error.name,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host
      });
      
      // Try to reconnect if connection is lost
      if (mongoose.connection.readyState !== 1) {
        console.log('🔄 Attempting to reconnect to database...');
        try {
          await mongoose.connection.close();
          await mongoose.connect(process.env.MONGODB_URI || '', {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000,
          });
          console.log('✅ Reconnected to database');
        } catch (reconnectError) {
          console.error('❌ Failed to reconnect:', reconnectError);
        }
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;

    // Check if it's a MongoDB ObjectId (24 hex characters)
    const isObjectId = productId && productId.match(/^[0-9a-fA-F]{24}$/);
    
    // Check if it's a numeric ID (for fallback catalog)
    const isNumericId = productId && /^\d+$/.test(productId);

    // If neither ObjectId nor numeric, return error
    if (!isObjectId && !isNumericId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    let product = null;

    // Try to find by MongoDB ObjectId first - optimize with lean() and select()
    if (isObjectId) {
      product = await Product.findById(productId)
        .lean()
        .maxTimeMS(5000);
    }

    // If not found and it's a numeric ID, it might be from fallback catalog
    // In this case, we return 404 so frontend can use fallback
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const productData: any = { ...req.body };

    // Handle main image upload (from multer)
    // Check if files were uploaded using fields() middleware
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const mainImageFile = files?.image?.[0];
    const additionalImageFiles = files?.images || [];

    if (mainImageFile) {
      try {
        const imageUrl = await uploadToCloudinary(mainImageFile.buffer, 'stylecraft/products');
        productData.image = imageUrl;
      } catch (uploadError: any) {
        return res.status(400).json({
          success: false,
          message: `Failed to upload main image: ${uploadError.message}`,
        });
      }
    } else if (req.body.image) {
      const bodyImage = normalizeImageString(req.body.image);
      if (!bodyImage) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image format',
        });
      }
      // If image is provided as URL (already uploaded or external), use it directly
      // If it's a base64 string (legacy support), upload it
      if (bodyImage.startsWith('data:image/')) {
        try {
          const imageUrl = await uploadToCloudinary(bodyImage, 'stylecraft/products');
          productData.image = imageUrl;
        } catch (uploadError: any) {
          return res.status(400).json({
            success: false,
            message: `Failed to upload main image: ${uploadError.message}`,
          });
        }
      } else {
        // Already a URL, use it directly
        productData.image = bodyImage;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Product image is required',
      });
    }

    // Handle additional images upload (from multer)
    if (additionalImageFiles && additionalImageFiles.length > 0) {
      try {
        const additionalImageUrls: string[] = [];
        for (const file of additionalImageFiles) {
          const imageUrl = await uploadToCloudinary(file.buffer, 'stylecraft/products');
          additionalImageUrls.push(imageUrl);
        }
        productData.images = additionalImageUrls;
      } catch (uploadError: any) {
        return res.status(400).json({
          success: false,
          message: `Failed to upload additional images: ${uploadError.message}`,
        });
      }
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // Handle images array from request body (for base64 or URLs)
      const processedImages: string[] = [];
      for (const rawImg of req.body.images) {
        const img = normalizeImageString(rawImg);
        if (!img) {
          continue;
        }
        if (img.startsWith('data:image/')) {
          // Base64 image, upload it
          try {
            const imageUrl = await uploadToCloudinary(img, 'stylecraft/products');
            processedImages.push(imageUrl);
          } catch (uploadError: any) {
            console.error('Failed to upload image:', uploadError);
            // Skip failed uploads
            continue;
          }
        } else if (img.startsWith('http://') || img.startsWith('https://')) {
          // Already a URL, use it directly
          processedImages.push(img);
        }
      }
      if (processedImages.length > 0) {
        productData.images = processedImages;
      }
    }

    // Parse numeric fields
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.stock) productData.stock = parseInt(productData.stock);
    if (productData.salePercentage) productData.salePercentage = parseFloat(productData.salePercentage);
    if (productData.featured !== undefined) productData.featured = productData.featured === 'true' || productData.featured === true;
    if (productData.active !== undefined) productData.active = productData.active === 'true' || productData.active === true;
    if (productData.onSale !== undefined) productData.onSale = productData.onSale === 'true' || productData.onSale === true;
    if (productData.inCollection !== undefined) productData.inCollection = productData.inCollection === 'true' || productData.inCollection === true;

    const product = await Product.create(productData);

    // FIXED: Log employee activity for product creation
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      await logEmployeeActivity(
        req.user._id as any,
        'product_added',
        `Added new product: ${product.name}`,
        'Product',
        product._id as any,
        { productName: product.name, productCategory: product.category }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // FIXED: Get old product to track stock changes and delete old images if needed
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const oldStock = oldProduct.stock;
    const newStock = req.body.stock !== undefined ? req.body.stock : oldStock;
    const productData: any = { ...req.body };

    // Handle main image update (from multer)
    // Check if files were uploaded using fields() middleware
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const mainImageFile = files?.image?.[0];
    const additionalImageFiles = files?.images || [];

    if (mainImageFile) {
      try {
        // Delete old image from Cloudinary if it's a Cloudinary URL
        if (oldProduct.image && oldProduct.image.includes('cloudinary.com')) {
          await deleteFromCloudinary(oldProduct.image);
        }
        // Upload new image
        const imageUrl = await uploadToCloudinary(mainImageFile.buffer, 'stylecraft/products');
        productData.image = imageUrl;
      } catch (uploadError: any) {
        return res.status(400).json({
          success: false,
          message: `Failed to upload main image: ${uploadError.message}`,
        });
      }
    } else if (req.body.image) {
      const bodyImage = normalizeImageString(req.body.image);
      if (!bodyImage) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image format',
        });
      }
      // If image is provided as URL (already uploaded or external), use it directly
      // If it's a base64 string (legacy support), upload it
      if (bodyImage.startsWith('data:image/')) {
        try {
          // Delete old image from Cloudinary if it's a Cloudinary URL
          if (oldProduct.image && oldProduct.image.includes('cloudinary.com')) {
            await deleteFromCloudinary(oldProduct.image);
          }
          const imageUrl = await uploadToCloudinary(bodyImage, 'stylecraft/products');
          productData.image = imageUrl;
        } catch (uploadError: any) {
          return res.status(400).json({
            success: false,
            message: `Failed to upload main image: ${uploadError.message}`,
          });
        }
      } else if (bodyImage !== oldProduct.image) {
        // New URL provided, delete old Cloudinary image if applicable
        if (oldProduct.image && oldProduct.image.includes('cloudinary.com')) {
          await deleteFromCloudinary(oldProduct.image);
        }
        productData.image = bodyImage;
      }
      // If image hasn't changed, don't update it
    }

    // Handle additional images update (from multer)
    if (additionalImageFiles && additionalImageFiles.length > 0) {
      try {
        // Delete old additional images from Cloudinary
        if (oldProduct.images && oldProduct.images.length > 0) {
          for (const oldImg of oldProduct.images) {
            if (oldImg.includes('cloudinary.com')) {
              await deleteFromCloudinary(oldImg);
            }
          }
        }
        // Upload new images
        const additionalImageUrls: string[] = [];
        for (const file of additionalImageFiles) {
          const imageUrl = await uploadToCloudinary(file.buffer, 'stylecraft/products');
          additionalImageUrls.push(imageUrl);
        }
        productData.images = additionalImageUrls;
      } catch (uploadError: any) {
        return res.status(400).json({
          success: false,
          message: `Failed to upload additional images: ${uploadError.message}`,
        });
      }
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // Handle images array from request body
      const processedImages: string[] = [];
      const oldCloudinaryImages = (oldProduct.images || []).filter(img => img.includes('cloudinary.com'));
      
      for (const rawImg of req.body.images) {
        const img = normalizeImageString(rawImg);
        if (!img) {
          continue;
        }
        if (img.startsWith('data:image/')) {
          // Base64 image, upload it
          try {
            const imageUrl = await uploadToCloudinary(img, 'stylecraft/products');
            processedImages.push(imageUrl);
          } catch (uploadError: any) {
            console.error('Failed to upload image:', uploadError);
            continue;
          }
        } else if (img.startsWith('http://') || img.startsWith('https://')) {
          // Already a URL
          processedImages.push(img);
        }
      }
      
      // Delete old Cloudinary images that are no longer in the new list
      if (oldCloudinaryImages.length > 0) {
        for (const oldImg of oldCloudinaryImages) {
          if (!processedImages.includes(oldImg)) {
            await deleteFromCloudinary(oldImg);
          }
        }
      }
      
      if (processedImages.length > 0) {
        productData.images = processedImages;
      }
    }

    // Parse numeric fields
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.stock) productData.stock = parseInt(productData.stock);
    if (productData.salePercentage) productData.salePercentage = parseFloat(productData.salePercentage);
    if (productData.featured !== undefined) productData.featured = productData.featured === 'true' || productData.featured === true;
    if (productData.active !== undefined) productData.active = productData.active === 'true' || productData.active === true;
    if (productData.onSale !== undefined) productData.onSale = productData.onSale === 'true' || productData.onSale === true;
    if (productData.inCollection !== undefined) productData.inCollection = productData.inCollection === 'true' || productData.inCollection === true;

    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // FIXED: Log employee activity for product update with stock tracking
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      const activityDescription = oldStock !== newStock
        ? `Updated product: ${product.name} (Stock: ${oldStock} → ${newStock})`
        : `Updated product: ${product.name}`;
      
      await logEmployeeActivity(
        req.user._id as any,
        oldStock !== newStock ? 'stock_updated' : 'product_updated',
        activityDescription,
        'Product',
        product._id as any,
        { 
          productName: product.name,
          oldStock,
          newStock,
          stockChange: newStock - oldStock
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    // VALIDATION: Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // FIXED: Log employee activity before deletion
    if (req.user?._id && (req.user.role === 'admin' || req.user.role === 'employee')) {
      await logEmployeeActivity(
        req.user._id as any,
        'product_deleted',
        `Deleted product: ${product.name}`,
        'Product',
        product._id as any,
        { productName: product.name }
      );
    }

    // Delete images from Cloudinary before deleting product
    if (product.image && product.image.includes('cloudinary.com')) {
      await deleteFromCloudinary(product.image);
    }
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.includes('cloudinary.com')) {
          await deleteFromCloudinary(img);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/meta/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get product genders
// @route   GET /api/products/meta/genders
// @access  Public
export const getGenders = async (req: Request, res: Response) => {
  try {
    const genders = await Product.distinct('gender');

    res.status(200).json({
      success: true,
      data: genders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
