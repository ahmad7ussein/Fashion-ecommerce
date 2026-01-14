"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.googleAuth = exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const google_auth_library_1 = require("google-auth-library");
const User_1 = __importDefault(require("../models/User"));
const env_1 = __importDefault(require("../config/env"));
const employeeActivityController_1 = require("./employeeActivityController");
const emailService_1 = require("../utils/emailService");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, env_1.default.jwtSecret, {
        expiresIn: env_1.default.jwtExpire,
    });
};
const googleClient = env_1.default.googleClientId ? new google_auth_library_1.OAuth2Client(env_1.default.googleClientId) : null;
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }
        const allowedRole = role === 'customer' ? 'customer' : 'customer';
        const user = await User_1.default.create({
            firstName,
            lastName,
            email,
            password,
            role: allowedRole,
        });
        const token = generateToken(user._id.toString());
        try {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            const emailSent = await (0, emailService_1.sendWelcomeEmail)(user.email, fullName);
            if (!emailSent) {
                console.warn('Welcome email not sent for:', user.email);
            }
        }
        catch (emailError) {
            console.warn('Welcome email failed:', emailError?.message || emailError);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.register = register;
const login = async (req, res) => {
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
        const normalizedIdentifier = String(identifier).trim();
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(normalizedIdentifier);
        const normalizedEmail = normalizedIdentifier.toLowerCase();
        const user = await User_1.default.findOne(isObjectId ? { _id: normalizedIdentifier } : { email: normalizedEmail }).select('+password');
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
        const token = generateToken(user._id.toString());
        console.log('✅ Login successful, token generated for user:', user.email);
        if (user.role === 'employee' || user.role === 'admin') {
            await (0, employeeActivityController_1.logEmployeeActivity)(user._id, 'login', `User logged in: ${user.firstName} ${user.lastName} (${user.email})`, 'User', user._id, { loginTime: new Date().toISOString() });
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
    }
    catch (error) {
        console.error('❌ Login error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const user = await User_1.default.findById(req.user._id).select('-password');
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
    }
    catch (error) {
        console.error('❌ Error in getMe:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, address } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.user?._id, { firstName, lastName, phone, address }, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.updateProfile = updateProfile;
const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Google ID token is required',
            });
        }
        if (!googleClient || !env_1.default.googleClientId) {
            return res.status(503).json({
                success: false,
                message: 'Google authentication is not configured',
            });
        }
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: env_1.default.googleClientId,
            });
            payload = ticket.getPayload();
        }
        catch (error) {
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
        let user = await User_1.default.findOne({
            $or: [
                { email: normalizedEmail },
                { googleId: googleId },
            ],
        });
        let isNewUser = false;
        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                user.provider = 'google';
                await user.save();
            }
        }
        else {
            user = await User_1.default.create({
                firstName: firstName || 'User',
                lastName: lastName || '',
                email: normalizedEmail,
                googleId: googleId,
                provider: 'google',
                role: 'customer',
            });
            isNewUser = true;
        }
        if (isNewUser) {
            try {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                const emailSent = await (0, emailService_1.sendWelcomeEmail)(user.email, fullName);
                if (!emailSent) {
                    console.warn('Welcome email not sent for:', user.email);
                }
            }
            catch (emailError) {
                console.warn('Welcome email failed:', emailError?.message || emailError);
            }
        }
        const token = generateToken(user._id.toString());
        if (user.role === 'employee' || user.role === 'admin') {
            await (0, employeeActivityController_1.logEmployeeActivity)(user._id, 'login', `User logged in via Google: ${user.firstName} ${user.lastName} (${user.email})`, 'User', user._id, { loginTime: new Date().toISOString(), provider: 'google' });
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
    }
    catch (error) {
        console.error('❌ Google auth error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during Google authentication',
        });
    }
};
exports.googleAuth = googleAuth;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            user.resetPasswordToken = crypto_1.default
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
            user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
            await user.save({ validateBeforeSave: false });
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            console.log('🔐 Password reset token generated for:', email);
            console.log('🔗 Reset URL:', resetUrl);
            const emailSent = await (0, emailService_1.sendPasswordResetEmail)(email, resetToken, `${user.firstName} ${user.lastName}`);
            if (!emailSent) {
                console.warn('⚠️ Failed to send email. Token (dev only):', resetToken);
                console.warn('⚠️ Reset URL (dev only):', resetUrl);
            }
            else {
                console.log('✅ Password reset email sent successfully to:', email);
            }
        }
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const password = newPassword || req.body.password;
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password is required and must be at least 6 characters',
            });
        }
        const hashedToken = crypto_1.default
            .createHash('sha256')
            .update(token)
            .digest('hex');
        const user = await User_1.default.findOne({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};
exports.resetPassword = resetPassword;
