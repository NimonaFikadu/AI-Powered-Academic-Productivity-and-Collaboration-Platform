const db = require('../models');

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await db.User.findByPk(req.user.id, {
      attributes: ['id', 'subscription_status', 'subscription_end_date']
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    if (user.subscription_status !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required'
      });
    }

    const currentDate = new Date();
    if (user.subscription_end_date && currentDate > user.subscription_end_date) {
      // Auto-downgrade user in database if expired
      await user.update({ subscription_status: 'free' });
      
      return res.status(403).json({
        success: false,
        message: 'Your premium subscription has expired'
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Premium check failed', error: error.message });
  }
};
