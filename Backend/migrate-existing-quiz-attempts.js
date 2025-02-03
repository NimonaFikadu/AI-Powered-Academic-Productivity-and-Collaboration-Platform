const sequelize = require('./src/config/database');
const { QuizProgress } = require('./src/models');

async function migrateExistingQuizAttempts() {
  try {
    console.log('[LOG migration] ========= Starting migration of existing quiz attempts');
    
    // Get all quiz attempts that don't have corresponding quiz progress records
    const existingAttempts = await sequelize.query(`
      SELECT 
        qa.user_id,
        qa.quiz_id,
        MAX(qa.score) as best_score,
        COUNT(*) as attempts_count,
        MAX(qa.completed_at) as last_attempt_date
      FROM quiz_attempts qa
      LEFT JOIN quiz_progress qp ON qa.user_id = qp.user_id AND qa.quiz_id = qp.quiz_id
      WHERE qp.id IS NULL
      GROUP BY qa.user_id, qa.quiz_id
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`[LOG migration] ========= Found ${existingAttempts.length} quiz attempts without progress records`);
    
    // Create quiz progress records for each
    for (const attempt of existingAttempts) {
      try {
        const progress = attempt.best_score >= 70 ? 100 : attempt.best_score;
        
        await QuizProgress.create({
          user_id: attempt.user_id,
          quiz_id: attempt.quiz_id,
          progress,
          best_score: attempt.best_score,
          attempts_count: attempt.attempts_count,
          last_attempt_date: attempt.last_attempt_date
        });
        
        console.log(`[LOG migration] ========= Created progress record for user ${attempt.user_id}, quiz ${attempt.quiz_id}`);
      } catch (error) {
        console.error(`[LOG migration] ========= Error creating progress for user ${attempt.user_id}, quiz ${attempt.quiz_id}:`, error.message);
      }
    }
    
    console.log('[LOG migration] ========= Migration completed successfully');
    
    // Verify the results
    const totalProgressRecords = await QuizProgress.count();
    console.log(`[LOG migration] ========= Total quiz progress records now: ${totalProgressRecords}`);
    
  } catch (error) {
    console.error('[LOG migration] ========= Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  migrateExistingQuizAttempts();
}

module.exports = { migrateExistingQuizAttempts }; 