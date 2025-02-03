const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const emailService = require('./emailService');

class CronService {
  start() {
    console.log('[LOG cron_service] ========= Initializing scheduled background jobs...');

    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
      console.log('[LOG cron_service] ========= Running daily subscription expiry check...');
      await this.checkExpiredSubscriptions();
    });
  }

  async checkExpiredSubscriptions() {
    try {
      const now = new Date();
      
      // Find all users who are currently 'premium' but whose end date has passed
      const expiredUsers = await db.User.findAll({
        where: {
          subscription_status: 'premium',
          subscription_end_date: {
            [Op.lt]: now
          }
        }
      });

      if (expiredUsers.length === 0) {
        console.log('[LOG cron_service] ========= No expired subscriptions found today.');
        return;
      }

      console.log(`[LOG cron_service] ========= Found ${expiredUsers.length} expired subscriptions. Processing...`);

      let successCount = 0;
      let failCount = 0;

      for (const user of expiredUsers) {
        try {
          // Revert to free tier
          await user.update({
            subscription_status: 'free'
          });

          // Send notification email asynchronously
          if (user.email) {
            emailService.sendSubscriptionExpiryEmail(user.email, user.username)
              .catch(err => console.error(`[LOG cron_service] Failed to send expiry email to ${user.email}:`, err.message));
          }

          successCount++;
        } catch (err) {
          console.error(`[LOG cron_service] Failed to process expiry for user ${user.id}:`, err);
          failCount++;
        }
      }

      console.log(`[LOG cron_service] ========= Expiry check complete. Updated: ${successCount}, Failed: ${failCount}`);
    } catch (error) {
      console.error('[LOG cron_service] ========= FATAL ERROR during expiry check:', error);
    }
  }
}

module.exports = new CronService();
