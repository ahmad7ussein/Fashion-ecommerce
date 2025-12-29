import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

// Get and trim Cloudinary credentials
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Log configuration status (without exposing secrets)
if (process.env.NODE_ENV === 'development') {
  console.log('');
  console.log('☁️  Cloudinary Configuration:');
  console.log('☁️  ========================================');
  console.log(`  ${cloudName ? '✅' : '❌'} CLOUDINARY_CLOUD_NAME: ${cloudName || 'Not set'}`);
  console.log(`  ${apiKey ? '✅' : '❌'} CLOUDINARY_API_KEY: ${apiKey ? 'Set' : 'Not set'}`);
  console.log(`  ${apiSecret ? '✅' : '❌'} CLOUDINARY_API_SECRET: ${apiSecret ? 'Set' : 'Not set'}`);
  console.log('☁️  ========================================');
  console.log('');
}

/**
 * Upload image to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise with secure_url
 */
export const uploadToCloudinary = async (
  file: Buffer | string,
  folder: string = 'stylecraft/products'
): Promise<string> => {
  try {
    // Get and trim credentials
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

    // Check if Cloudinary is configured
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.');
    }

    // Reconfigure with trimmed values (in case they changed)
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const uploadOptions: any = {
      folder,
      resource_type: 'image',
      overwrite: false,
      invalidate: true,
      timeout: 120000, // 120 seconds (2 minutes) timeout for Cloudinary upload
    };

    let result;
    
    // If file is a Buffer (from multer), upload as buffer
    if (Buffer.isBuffer(file)) {
      result = await Promise.race([
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file);
        }),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Cloudinary upload timeout: Request took longer than 120 seconds'));
          }, 120000); // 2 minutes timeout
        })
      ]);
    } else {
      // If file is a base64 string, upload as base64
      result = await Promise.race([
        cloudinary.uploader.upload(file, uploadOptions),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Cloudinary upload timeout: Request took longer than 120 seconds'));
          }, 120000); // 2 minutes timeout
        })
      ]);
    }

    if (!result || !(result as any).secure_url) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    return (result as any).secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    
    // Provide more detailed error information
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    let errorMessage = error.message || 'Unknown error';
    
    // Check for specific Cloudinary errors
    if (errorMessage.includes('Invalid cloud_name')) {
      errorMessage = `Invalid cloud_name "${cloudName}". Please verify your CLOUDINARY_CLOUD_NAME in your .env.local file. Make sure it matches your Cloudinary dashboard exactly (case-sensitive, no spaces).`;
    } else if (errorMessage.includes('Invalid API Key')) {
      errorMessage = 'Invalid API Key. Please verify your CLOUDINARY_API_KEY in your .env.local file.';
    } else if (errorMessage.includes('Invalid API Secret')) {
      errorMessage = 'Invalid API Secret. Please verify your CLOUDINARY_API_SECRET in your .env.local file.';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      errorMessage = 'Upload timeout: The image upload is taking too long. This might be due to a slow internet connection or large file size. Please try again with a smaller image or check your internet connection.';
    } else if (errorMessage.includes('ECONNRESET') || errorMessage.includes('network')) {
      errorMessage = 'Network error: Connection to Cloudinary was interrupted. Please check your internet connection and try again.';
    }
    
    throw new Error(`Failed to upload image: ${errorMessage}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param imageUrl - Full Cloudinary URL or public_id
 */
export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = urlParts.slice(-2, -1)[0]; // Get folder name
    
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;
    
    await cloudinary.uploader.destroy(fullPublicId);
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    // Don't throw - deletion failure shouldn't break the flow
  }
};

export default cloudinary;
