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




export const getProducts = async (req: Request, res: Response) => {
  try {
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection not ready. Please try again.',
      });
    }
    
    

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

    
    const sort = { createdAt: -1 };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    
    const selectFields = 'name nameAr category price stock active featured onSale salePercentage image inCollection createdAt';
    
    
    const query: any = { active: true };
    
    
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
        { name: { $regex: search as string, $options: 'i' } },
        { nameAr: { $regex: search as string, $options: 'i' } },
      ];
    }
    
    
    const safeLimit = Math.min(parseInt(limit as string) || 50, 50);
    
    
    const queryStartTime = Date.now();
    
    
    
    const productsQuery = Product.find(query)
      .select(selectFields)
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .lean() 
      .maxTimeMS(10000); 
    
    let products: any[];
    try {
      
      
      const queryTimeout = 15000; 
      let timeoutId: NodeJS.Timeout;
      
      products = await Promise.race([
        productsQuery,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Query timeout - exceeded 15 seconds')), queryTimeout);
        })
      ]) as any[];
      
      
      if (timeoutId!) clearTimeout(timeoutId);
      
      const apiResponseTime = Date.now() - queryStartTime;
      
      
      
      if (process.env.NODE_ENV === 'development') {
        try {
          
          const explainQuery = Product.find(query).sort(sort).limit(1).lean();
          const explainResult = await explainQuery.explain('executionStats');
          const executionStats = explainResult?.executionStats;
          
          if (executionStats) {
            
            let ixscanStage: any = null;
            let currentStage: any = executionStats.executionStages;
            
            
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
            } else if (stage === 'LIMIT' || stage === 'FETCH' || stage === 'SORT') {
              
              console.log(`🔍 Query execution:`, {
                topStage: stage,
                totalDocsExamined: totalDocsExamined,
                mongoExecutionTime: `${mongoExecutionTime}ms`,
                apiResponseTime: `${apiResponseTime}ms`
              });
            } else {
              
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
            } else if (apiResponseTime > 1000 && mongoExecutionTime < 100) {
              
              console.warn('⚠️ API response slow despite fast MongoDB query', {
                mongoExecutionTime: mongoExecutionTime,
                apiResponseTime: apiResponseTime,
                overhead: `${apiResponseTime - mongoExecutionTime}ms (likely network latency)`
              });
            }
          }
        } catch (explainError) {
          
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
      const countQuery = Product.countDocuments(query).maxTimeMS(10000); 
      
      let countTimeoutId: NodeJS.Timeout;
      total = await Promise.race([
        countQuery,
        new Promise((_, reject) => {
          countTimeoutId = setTimeout(() => reject(new Error('Count timeout')), 12000); 
        })
      ]) as number;
      if (countTimeoutId!) clearTimeout(countTimeoutId);
    } catch (countError) {
      
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




export const getProduct = async (req: Request, res: Response) => {
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
      product = await Product.findById(productId)
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};




export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const productData: any = { ...req.body };

    
    
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
        
        productData.image = bodyImage;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Product image is required',
      });
    }

    
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
      
      const processedImages: string[] = [];
      for (const rawImg of req.body.images) {
        const img = normalizeImageString(rawImg);
        if (!img) {
          continue;
        }
        if (img.startsWith('data:image/')) {
          
          try {
            const imageUrl = await uploadToCloudinary(img, 'stylecraft/products');
            processedImages.push(imageUrl);
          } catch (uploadError: any) {
            console.error('Failed to upload image:', uploadError);
            
            continue;
          }
        } else if (img.startsWith('http://') || img.startsWith('https://')) {
          
          processedImages.push(img);
        }
      }
      if (processedImages.length > 0) {
        productData.images = processedImages;
      }
    }

    
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.stock) productData.stock = parseInt(productData.stock);
    if (productData.salePercentage) productData.salePercentage = parseFloat(productData.salePercentage);
    if (productData.featured !== undefined) productData.featured = productData.featured === 'true' || productData.featured === true;
    if (productData.active !== undefined) productData.active = productData.active === 'true' || productData.active === true;
    if (productData.onSale !== undefined) productData.onSale = productData.onSale === 'true' || productData.onSale === true;
    if (productData.inCollection !== undefined) productData.inCollection = productData.inCollection === 'true' || productData.inCollection === true;

    const product = await Product.create(productData);

    
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




export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    
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

    
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const mainImageFile = files?.image?.[0];
    const additionalImageFiles = files?.images || [];

    if (mainImageFile) {
      try {
        
        if (oldProduct.image && oldProduct.image.includes('cloudinary.com')) {
          await deleteFromCloudinary(oldProduct.image);
        }
        
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
      
      
      if (bodyImage.startsWith('data:image/')) {
        try {
          
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
        
        if (oldProduct.image && oldProduct.image.includes('cloudinary.com')) {
          await deleteFromCloudinary(oldProduct.image);
        }
        productData.image = bodyImage;
      }
      
    }

    
    if (additionalImageFiles && additionalImageFiles.length > 0) {
      try {
        
        if (oldProduct.images && oldProduct.images.length > 0) {
          for (const oldImg of oldProduct.images) {
            if (oldImg.includes('cloudinary.com')) {
              await deleteFromCloudinary(oldImg);
            }
          }
        }
        
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
      
      const processedImages: string[] = [];
      const oldCloudinaryImages = (oldProduct.images || []).filter(img => img.includes('cloudinary.com'));
      
      for (const rawImg of req.body.images) {
        const img = normalizeImageString(rawImg);
        if (!img) {
          continue;
        }
        if (img.startsWith('data:image/')) {
          
          try {
            const imageUrl = await uploadToCloudinary(img, 'stylecraft/products');
            processedImages.push(imageUrl);
          } catch (uploadError: any) {
            console.error('Failed to upload image:', uploadError);
            continue;
          }
        } else if (img.startsWith('http://') || img.startsWith('https://')) {
          
          processedImages.push(img);
        }
      }
      
      
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




export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    
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
