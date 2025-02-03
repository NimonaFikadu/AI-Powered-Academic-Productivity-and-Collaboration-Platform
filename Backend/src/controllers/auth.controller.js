const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const emailService = require('../services/emailService');

const signup = async (req, res) => {
  const { username, email, password, fullName } = req.body;

  try {
    console.log(`[LOG signup] ========= Signup attempt with username: ${username}, email: ${email}`);

    // Request Payload Validation
    if (!username) {
      return res.status(400).json({ message: 'Validation error: username is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Validation error: email is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Validation error: password is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    // Check if user exists
    const existingUserByUsername = await sequelize.query(
      'SELECT * FROM users WHERE username = ?',
      {
        replacements: [normalizedUsername],
        type: QueryTypes.SELECT,
      }
    );

    const existingUserByEmail = await sequelize.query(
      'SELECT * FROM users WHERE email = ?',
      {
        replacements: [normalizedEmail],
        type: QueryTypes.SELECT,
      }
    );

    if (existingUserByUsername.length > 0) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    if (existingUserByEmail.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get current timestamp
    const now = new Date();

    // Generate UUID for the new user
    const userId = uuidv4();

    // Create user
    await sequelize.query(
      `INSERT INTO users (id, username, email, password_hash, full_name, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          userId,
          normalizedUsername,
          normalizedEmail,
          hashedPassword,
          fullName || null,
          now,
          now
        ],
        type: QueryTypes.INSERT
      }
    );

    // Fetch the newly created user
    const [newUser] = await sequelize.query(
      'SELECT * FROM users WHERE id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT,
      }
    );

    // Generate token
    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove sensitive data
    delete newUser.password_hash;

    console.log(`[LOG signup] ========= User ${normalizedUsername} successfully registered with ID ${userId}`);

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('[LOG signup ERROR] ========= Full database error:', error);
    
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      return res.status(500).json({ message: 'Database connection failed. Please try again.' });
    }

    // Attempt to parse structured duplicate constraints if raw query bypassing failed
    if (error.name === 'SequelizeUniqueConstraintError' || (error.original && error.original.code === '23505')) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const explicitMsg = error.message && error.message.trim() !== '' 
      ? error.message 
      : (error.name ? error.name : 'Error creating user');

    return res.status(500).json({ 
      message: explicitMsg !== 'Error creating user' ? `Server Error: ${explicitMsg}` : explicitMsg,
      error: String(error)
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

  try {
    // Find user by email
    const { User } = require('../models');
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (typeof password !== 'string' || !password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Get plain user object
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('[LOG login ERROR] =========', {
      name: error && error.name,
      message: error && error.message,
      stack: error && error.stack
    });

    if (error && (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError')) {
      return res.status(500).json({ message: 'Database connection failed. Please try again.' });
    }

    return res.status(500).json({
      message: 'Error during login',
      error: error && error.message ? error.message : String(error),
      errorType: error && error.name ? error.name : undefined
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    console.log(`[LOG forgot_password] ========= Password reset request for email: ${email}`);

    // Find user by email
    const [user] = await sequelize.query(
      'SELECT * FROM users WHERE email = ?',
      {
        replacements: [email],
        type: QueryTypes.SELECT,
      }
    );

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await sequelize.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      {
        replacements: [resetToken, resetTokenExpiry, user.id],
        type: QueryTypes.UPDATE
      }
    );

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.username || user.full_name || 'User');
      console.log(`[LOG forgot_password] ========= Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error(`[LOG forgot_password] ========= Failed to send email to ${email}:`, emailError);
      // Clear the reset token if email fails
      await sequelize.query(
        'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
        {
          replacements: [user.id],
          type: QueryTypes.UPDATE
        }
      );
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });

  } catch (error) {
    console.error('[LOG forgot_password] ========= Error in forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    console.log(`[LOG reset_password] ========= Password reset attempt with token: ${token?.substring(0, 8)}...`);

    // Find user by reset token and check if token is not expired
    const [user] = await sequelize.query(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      {
        replacements: [token],
        type: QueryTypes.SELECT,
      }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await sequelize.query(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      {
        replacements: [hashedPassword, user.id],
        type: QueryTypes.UPDATE
      }
    );

    // Send confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.username || user.full_name || 'User');
      console.log(`[LOG reset_password] ========= Password change confirmation sent to ${user.email}`);
    } catch (emailError) {
      console.error(`[LOG reset_password] ========= Failed to send confirmation email:`, emailError);
      // Don't fail the request if confirmation email fails
    }

    console.log(`[LOG reset_password] ========= Password successfully reset for user ${user.username}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('[LOG reset_password] ========= Error in reset password:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password. Please try again later.'
    });
  }
};

const validateResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    console.log(`[LOG validate_token] ========= Validating reset token: ${token?.substring(0, 8)}...`);

    // Check if token exists and is not expired
    const [user] = await sequelize.query(
      'SELECT id, email, username FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      {
        replacements: [token],
        type: QueryTypes.SELECT,
      }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid.',
      data: {
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('[LOG validate_token] ========= Error validating token:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while validating the token.'
    });
  }
};

const getMe = async (req, res) => {
  try {
    const [user] = await sequelize.query(
      'SELECT id, username, email, full_name, role, created_at, subscription_status, subscription_start_date, subscription_end_date FROM users WHERE id = ?',
      {
        replacements: [req.user.id],
        type: QueryTypes.SELECT
      }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Auto-downgrade if expired
    if (user.subscription_status === 'premium' && user.subscription_end_date && new Date() > new Date(user.subscription_end_date)) {
      await sequelize.query(
        "UPDATE users SET subscription_status = 'free', updated_at = NOW() WHERE id = ?",
        {
          replacements: [req.user.id],
          type: QueryTypes.UPDATE
        }
      );
      user.subscription_status = 'free';
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('[LOG getMe] ========= Error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

const updateProfile = async (req, res) => {
  const { fullName, email, username } = req.body;
  try {
    const [existing] = await sequelize.query(
      'SELECT id, email, username FROM users WHERE id = ?',
      {
        replacements: [req.user.id],
        type: QueryTypes.SELECT
      }
    );

    if (!existing) return res.status(404).json({ message: 'User not found' });

    if (email && email !== existing.email) {
      const [emailCheck] = await sequelize.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        {
          replacements: [email, req.user.id],
          type: QueryTypes.SELECT
        }
      );
      if (emailCheck) {
        return res.status(409).json({ message: 'Email already registered' });
      }
    }

    if (username && username !== existing.username) {
      const [usernameCheck] = await sequelize.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        {
          replacements: [username, req.user.id],
          type: QueryTypes.SELECT
        }
      );
      if (usernameCheck) {
        return res.status(409).json({ message: 'Username already taken' });
      }
    }

    await sequelize.query(
      'UPDATE users SET full_name = ?, email = ?, username = ?, updated_at = NOW() WHERE id = ?',
      {
        replacements: [
          fullName || existing.full_name, 
          email || existing.email, 
          username || existing.username, 
          req.user.id
        ],
        type: QueryTypes.UPDATE
      }
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('[LOG updateProfile] ========= Error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [user] = await sequelize.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      {
        replacements: [req.user.id],
        type: QueryTypes.SELECT
      }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await sequelize.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      {
        replacements: [hashedPassword, req.user.id],
        type: QueryTypes.UPDATE
      }
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[LOG changePassword] ========= Error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { id } = req.user;
    const avatarUrl = `${req.protocol}://${req.get('host')}/avatars/${id}/${req.file.filename}`;

    await sequelize.query(
      'UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?',
      {
        replacements: [avatarUrl, id],
        type: QueryTypes.UPDATE
      }
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (error) {
    console.error('[LOG uploadAvatar] ========= Error:', error);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  validateResetToken,
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar
}; 