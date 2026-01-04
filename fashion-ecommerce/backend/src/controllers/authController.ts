import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import env from '../config/env';
import { logEmployeeActivity } from './employeeActivityController';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/emailService';


const generateToken = (id: string): string => {
  return jwt.sign({ id }, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  } as jwt.SignOptions);
};


const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;




export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    
    
    const allowedRole = role === 'customer' ? 'customer' : 'customer';
    
    
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: allowedRole, 
    });

    const token = generateToken((user._id as any).toString());

    try {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const emailSent = await sendWelcomeEmail(user.email, fullName);
      if (!emailSent) {
        console.warn('Welcome email not sent for:', user.email);
      }
    } catch (emailError) {
      console.warn('Welcome email failed:', (emailError as Error)?.message || emailError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};




export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    console.log('🔐 Login attempt:', { identifier: identifier?.substring(0, 10) + '...', hasPassword: !!password });

    
    if (!identifier || !password) {
      console.log('❌ Missing identifier or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    
    const normalizedEmail = identifier.toLowerCase().trim();

    
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      console.log('❌ User not found for email:', normalizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('✅ User found:', { id: user._id, email: user.email, role: user.role });

    
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      console.log('❌ Password mismatch for user:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('✅ Password verified for user:', user.email);

    const token = generateToken((user._id as any).toString());

    console.log('✅ Login successful, token generated for user:', user.email);

    
    if (user.role === 'employee' || user.role === 'admin') {
      await logEmployeeActivity(
        user._id as any,
        'login',
        `User logged in: ${user.firstName} ${user.lastName} (${user.email})`,
        'User',
        user._id as any,
        { loginTime: new Date().toISOString() }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('❌ Login error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};




export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const user = await User.findById(req.user._id as any).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in getMe:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};




export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?._id as any,
      { firstName, lastName, phone, address },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};




export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
    }

    if (!googleClient || !env.googleClientId) {
      return res.status(503).json({
        success: false,
        message: 'Google authentication is not configured',
      });
    }

    
    let payload: any;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to get user information from Google',
      });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const firstName = payload.given_name;
    const lastName = payload.family_name;
    const picture = payload.picture;
    const normalizedEmail = email.toLowerCase().trim();

    
    let user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { googleId: googleId },
      ],
    });

    if (user) {
      
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        await user.save();
      }
    } else {
      
      user = await User.create({
        firstName: firstName || 'User',
        lastName: lastName || '',
        email: normalizedEmail,
        googleId: googleId,
        provider: 'google',
        role: 'customer',
      });
    }

    const token = generateToken((user._id as any).toString());

    
    if (user.role === 'employee' || user.role === 'admin') {
      await logEmployeeActivity(
        user._id as any,
        'login',
        `User logged in via Google: ${user.firstName} ${user.lastName} (${user.email})`,
        'User',
        user._id as any,
        { loginTime: new Date().toISOString(), provider: 'google' }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          picture: picture,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google authentication',
    });
  }
};




export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    
    
    if (user) {
      
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      
      user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
      
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      console.log('🔐 Password reset token generated for:', email);
      console.log('🔗 Reset URL:', resetUrl);
      
      
      const emailSent = await sendPasswordResetEmail(
        email,
        resetToken,
        `${user.firstName} ${user.lastName}`
      );

      if (!emailSent) {
        
        console.warn('⚠️ Failed to send email. Token (dev only):', resetToken);
        console.warn('⚠️ Reset URL (dev only):', resetUrl);
      } else {
        console.log('✅ Password reset email sent successfully to:', email);
      }
    }

    
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};




export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    
    
    const password = newPassword || req.body.password;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters',
      });
    }

    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
