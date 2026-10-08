const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_12345', {
    expiresIn: '30d',
  });
};

// Helper to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper to send OTP email using Resend
const sendOtpEmail = async (email, name, otp) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SmartDeal AI <onboarding@resend.dev>',
      to: [email],
      subject: '🔐 Your OTP for SmartDeal AI Registration',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f43f5e, #f59e0b); padding: 32px 40px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 26px;">SmartDeal AI 🛒</h1>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">AI-Powered Price Tracker</p>
          </div>

          <div style="padding: 36px 40px;">
            <p style="color: #cbd5e1; font-size: 16px;">
              Hi <strong style="color: #f8fafc;">${name}</strong>,
            </p>

            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
              Use the OTP below to verify your email and complete your registration.
              This code is valid for <strong style="color: #f8fafc;">10 minutes</strong>.
            </p>

            <div style="background: #1e293b; border: 2px solid #f43f5e; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
              <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                Your Verification Code
              </p>

              <span style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #f43f5e; font-family: 'Courier New', monospace;">
                ${otp}
              </span>
            </div>

            <p style="color: #64748b; font-size: 12px; text-align: center;">
              ⚠️ Never share this OTP with anyone.
            </p>
          </div>

          <div style="background: #0f172a; border-top: 1px solid #1e293b; padding: 20px 40px; text-align: center;">
            <p style="color: #475569; font-size: 11px;">
              © ${new Date().getFullYear()} SmartDeal AI
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error: ${errorData}`);
  }

  return await response.json();
};
// @desc    Register a new user (Step 1 — sends OTP, does NOT log in)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if a VERIFIED user already exists
    const existingVerified = await User.findOne({ email, isVerified: true });
    if (existingVerified) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert: update existing unverified user or create new
    // NOTE: findOneAndUpdate bypasses mongoose pre-save hook, so we hash manually
    const totalVerified = await User.countDocuments({ isVerified: true });
    const role = totalVerified === 0 ? 'admin' : 'user';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.findOneAndUpdate(
      { email },
      { name, email, password: hashedPassword, role, otp, otpExpiry, isVerified: false },
      { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
    );

    // Send OTP email (non-blocking — email failure must NOT crash registration)
    if (process.env.RESEND_API_KEY) {
      try {
        await sendOtpEmail(email, name, otp);
        console.log(`[OTP SENT] OTP email sent to ${email}`);
      } catch (emailErr) {
        console.error(`[OTP EMAIL FAILED] Could not send to ${email}: ${emailErr.message}`);
        // Still succeed — user can use Resend OTP button
      }
    } else {
      console.log(`[OTP SIMULATION] OTP for ${email}: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Please check your inbox.`,
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Verify OTP and complete registration (Step 2 — issues JWT)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registration found for this email. Please register again.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified. Please login.' });
    }

    if (!user.otp || user.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please register again to get a new OTP.' });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log(`[OTP VERIFIED] User ${email} successfully verified.`);

    return res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email, isVerified: false });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No pending registration found for this email.' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    if (process.env.RESEND_API_KEY) {
      try {
        await sendOtpEmail(email, user.name, otp);
        console.log(`[OTP RESENT] New OTP sent to ${email}`);
      } catch (emailErr) {
        console.error(`[OTP RESEND EMAIL FAILED] ${email}: ${emailErr.message}`);
      }
    } else {
      console.log(`[OTP SIMULATION RESEND] OTP for ${email}: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: `A new OTP has been sent to ${email}.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error while resending OTP' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Block unverified users
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please complete OTP verification.',
        needsVerification: true,
        email: user.email,
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    return res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Helper to send Reset Password OTP email
const sendResetPasswordEmail = async (email, name, otp) => {
  const configs = [
    { host: 'smtp.gmail.com', port: 465, secure: true },
    { host: 'smtp.gmail.com', port: 587, secure: false },
  ];

  let lastError;
  for (const cfg of configs) {
    try {
      const transporter = nodemailer.createTransport({
        ...cfg,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      await transporter.sendMail({
        from: `"SmartDeal AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔑 Password Reset Code for SmartDeal AI',
        html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f43f5e, #f59e0b); padding: 32px 40px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">SmartDeal AI 🛒</h1>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Password Reset Request</p>
        </div>

        <!-- Body -->
        <div style="padding: 36px 40px;">
          <p style="color: #cbd5e1; font-size: 16px; margin: 0 0 8px;">Hi <strong style="color: #f8fafc;">${name || 'User'}</strong>,</p>
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 28px; line-height: 1.6;">
            We received a request to reset your password. Use the verification code below to set a new password. This code is valid for <strong style="color: #f8fafc;">10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background: #1e293b; border: 2px solid #f43f5e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Your Reset Code</p>
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #f43f5e; font-family: 'Courier New', monospace;">${otp}</span>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
            ⚠️ If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #0f172a; border-top: 1px solid #1e293b; padding: 20px 40px; text-align: center;">
          <p style="color: #475569; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} SmartDeal AI · AI-powered price intelligence for smart Indian shoppers</p>
        </div>
      </div>
      `,
      });
      return;
    } catch (err) {
      lastError = err;
      console.warn(`[RESET EMAIL] Failed on port ${cfg.port}: ${err.message}. Trying next...`);
    }
  }
  throw lastError;
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Request Password Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendResetPasswordEmail(user.email, user.name, otp);
        console.log(`[RESET OTP SENT] Reset OTP email sent to ${user.email}`);
      } catch (emailErr) {
        console.error(`[RESET OTP EMAIL FAILED] ${user.email}: ${emailErr.message}`);
      }
    } else {
      console.log(`[RESET OTP SIMULATION] Reset OTP for ${user.email}: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: `Password reset code sent to ${user.email}. Please check your inbox.`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error while sending reset code' });
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, verification code, and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +resetOtp +resetOtpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.resetOtp || user.resetOtp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
    }

    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    console.log(`[PASSWORD RESET SUCCESS] Password reset for user ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error while resetting password' });
  }
};

