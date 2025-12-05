import express from 'express';
import Cart from '../models/Cart';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Use optionalAuth for all cart routes (supports both authenticated and guest users)
router.use(optionalAuth);

// Helper function to validate userId (must be truthy and not null)
function isValidUserId(userId: any): boolean {
  return userId !== null && userId !== undefined && userId !== '';
}

// Helper function to get or create guest session ID
function getGuestSessionId(req: express.Request): string {
  // Check if guest session ID exists in cookies
  let guestSessionId = req.cookies?.guestSessionId;
  
  if (!guestSessionId) {
    // Generate new guest session ID
    guestSessionId = uuidv4();
    // Set cookie (will be set in response)
    (req as any).newGuestSessionId = guestSessionId;
  }
  
  return guestSessionId;
}

// Get user's or guest's cart
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;
    
    console.log('🛒 GET /cart - userId:', userId ? userId.toString() : 'guest');
    
    // If userId is missing (null/undefined), return null cart instead of creating one
    if (!isValidUserId(userId)) {
      console.log('🛒 No user session - returning null cart');
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No user session',
      });
    }
    
    let cart;
    
    // Authenticated user - userId is guaranteed to be valid here
    cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name price images',
        strictPopulate: false, // Don't throw error if product doesn't exist
      })
      .populate({
        path: 'items.design',
        select: 'name thumbnail',
        strictPopulate: false, // Don't throw error if design doesn't exist
      });

    // If cart doesn't exist, create an empty one (only for authenticated users)
    if (!cart) {
      console.log('🛒 Creating new cart for user:', userId);
      // Validate userId one more time before creating
      if (!isValidUserId(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }
      cart = await Cart.create({
        user: userId,
        items: [],
        subtotal: 0,
      });
    }

    // Ensure cart has required fields
    if (!cart) {
      throw new Error('Failed to create or retrieve cart');
    }

    // Convert to plain object and ensure all fields are present
    const cartData = {
      _id: (cart._id as any)?.toString() || cart._id,
      user: cart.user ? cart.user.toString() : undefined,
      guestSessionId: cart.guestSessionId,
      items: (cart.items || []).map((item: any) => {
        // Safely handle product reference
        let productId = undefined;
        if (item.product) {
          if (typeof item.product === 'object' && item.product._id) {
            productId = item.product._id.toString();
          } else if (typeof item.product === 'string') {
            productId = item.product;
          } else if (item.product?.toString) {
            productId = item.product.toString();
          }
        }
        
        // Safely handle design reference
        let designId = undefined;
        if (item.design) {
          if (typeof item.design === 'object' && item.design._id) {
            designId = item.design._id.toString();
          } else if (typeof item.design === 'string') {
            designId = item.design;
          } else if (item.design?.toString) {
            designId = item.design.toString();
          }
        }
        
        return {
          _id: item._id ? item._id.toString() : undefined,
          product: productId,
          design: designId,
          name: item.name || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          size: item.size || '',
          color: item.color || '',
          image: item.image || '',
          isCustom: item.isCustom || false,
        };
      }),
      subtotal: cart.subtotal || 0,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    console.log('🛒 Cart retrieved successfully:', {
      cartId: cartData._id,
      itemsCount: cartData.items.length,
      subtotal: cartData.subtotal,
    });

    res.status(200).json({
      success: true,
      data: cartData,
    });
  } catch (error: any) {
    console.error('❌ Error fetching cart:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message || 'Unknown error',
    });
  }
});

// Add item to cart
router.post('/items', async (req: express.Request, res: express.Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;

    const { product, design, name, price, quantity, size, color, image, isCustom } = req.body;

    // Validate required fields
    if (!name || !price || !quantity || !size || !color || !image) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Validate userId - if missing, reject the request
    if (!isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Find or create cart for authenticated user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      // Validate userId again before creating
      if (!isValidUserId(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }
      cart = await Cart.create({
        user: userId,
        items: [],
        subtotal: 0,
      });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product?.toString() === product &&
        item.size === size &&
        item.color === color &&
        item.isCustom === isCustom
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product,
        design,
        name,
        price,
        quantity,
        size,
        color,
        image,
        isCustom: isCustom || false,
      });
    }

    await cart.save();

    // Populate and return updated cart
    cart = await Cart.findById(cart._id)
      .populate('items.product')
      .populate('items.design');

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message,
    });
  }
});

// Update cart item quantity
router.put('/items/:itemId', async (req: express.Request, res: express.Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;

    // VALIDATION: Only authenticated users can update cart items
    if (!isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    // VALIDATION: Validate itemId format
    if (!itemId || !itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity',
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    // FIXED: Use find instead of .id() for TypeScript compatibility
    const item = cart.items.find((item: any) => 
      item._id && item._id.toString() === itemId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    item.quantity = quantity;
    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product')
      .populate('items.design');

    res.status(200).json({
      success: true,
      data: updatedCart,
    });
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message,
    });
  }
});

// Remove item from cart
router.delete('/items/:itemId', async (req: express.Request, res: express.Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;

    // VALIDATION: Only authenticated users can remove cart items
    if (!isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const { itemId } = req.params;

    // VALIDATION: Validate itemId format
    if (!itemId || !itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // FIXED: Remove item using filter instead of pull for TypeScript compatibility
    cart.items = cart.items.filter((item: any) => 
      !item._id || item._id.toString() !== itemId
    ) as any;
    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product')
      .populate('items.design');

    res.status(200).json({
      success: true,
      data: updatedCart,
    });
  } catch (error: any) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message,
    });
  }
});

// Clear cart
router.delete('/', async (req: express.Request, res: express.Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;

    // VALIDATION: Only authenticated users can clear cart
    if (!isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message,
    });
  }
});

export default router;
