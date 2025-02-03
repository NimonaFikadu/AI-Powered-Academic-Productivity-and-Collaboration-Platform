/**
 * RAG Progress Tracker
 * Tracks indexing progress for materials to provide real-time feedback to users
 */

const { createComponentLogger } = require('../../../utils/logger');
const logger = createComponentLogger('ragProgressTracker');

/**
 * Progress status types
 */
const ProgressStatus = {
    PENDING: 'pending',
    EXTRACTING: 'extracting_text',
    CHUNKING: 'chunking',
    EMBEDDING: 'generating_embeddings',
    INDEXING: 'indexing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

/**
 * In-memory store for progress tracking
 * In production, this should be moved to Redis or similar
 */
class ProgressTracker {
    constructor() {
        this.progress = new Map();
    }

    /**
     * Create a unique key for user-topic combination
     */
    _getKey(userId, topicId) {
        return `${userId}_${topicId}`;
    }

    /**
     * Start tracking indexing progress
     * @param {string} userId - User ID
     * @param {string} topicId - Topic ID
     * @param {number} totalMaterials - Total number of materials to process
     * @returns {Object} - Initial progress state
     */
    startIndexing(userId, topicId, totalMaterials) {
        const key = this._getKey(userId, topicId);

        const initialState = {
            userId,
            topicId,
            totalMaterials,
            materialsProcessed: 0,
            currentMaterial: null,
            status: ProgressStatus.PENDING,
            progress: 0,
            errors: [],
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null
        };

        this.progress.set(key, initialState);

        logger.info('Indexing progress started', {
            userId,
            topicId,
            totalMaterials
        });

        return initialState;
    }

    /**
     * Update progress for a specific material
     * @param {string} userId - User ID
     * @param {string} topicId - Topic ID
     * @param {Object} update - Update data
     * @returns {Object} - Updated progress state
     */
    updateProgress(userId, topicId, update) {
        const key = this._getKey(userId, topicId);
        const current = this.progress.get(key);

        if (!current) {
            logger.warn('Attempting to update non-existent progress', {
                userId,
                topicId
            });
            return null;
        }

        const updated = {
            ...current,
            ...update,
            updatedAt: new Date().toISOString()
        };

        // Calculate overall progress percentage
        if (updated.totalMaterials > 0) {
            updated.progress = Math.round(
                (updated.materialsProcessed / updated.totalMaterials) * 100
            );
        }

        this.progress.set(key, updated);

        logger.debug('Progress updated', {
            userId,
            topicId,
            progress: updated.progress,
            status: updated.status,
            currentMaterial: updated.currentMaterial
        });

        return updated;
    }

    /**
     * Update material-specific progress
     * @param {string} userId - User ID
     * @param {string} topicId - Topic ID
     * @param {string} materialId - Material ID
     * @param {string} status - Current status
     * @param {Object} meta - Additional metadata
     */
    updateMaterialProgress(userId, topicId, materialId, status, meta = {}) {
        return this.updateProgress(userId, topicId, {
            currentMaterial: {
                id: materialId,
                status,
                ...meta
            },
            status
        });
    }

    /**
     * Mark a material as completed (success or failure)
     * @param {string} userId - User ID
     * @param {string} topicId - Topic ID
     * @param {string} materialId - Material ID
     * @param {boolean} success - Whether processing succeeded
     * @param {string} error - Error message if failed
     */
    completeMaterial(userId, topicId, materialId, success = true, error = null) {
        const key = this._getKey(userId, topicId);
        const current = this.progress.get(key);

        if (!current) return null;

        const update = {
            materialsProcessed: current.materialsProcessed + 1
        };

        if (!success && error) {
            update.errors = [
                ...current.errors,
                {
                    materialId,
                    error,
                    timestamp: new Date().toISOString()
                }
            ];
        }

        return this.updateProgress(userId, topicId, update);
    }

    /**
     * Complete the entire indexing process
     * @param {string} userId - User ID
     * @param {string} topicId - Topic ID
     * @param {Object} results - Final results
     */
    completeIndexing(userId, topicId, results = {}) {
        const update = {
            status: results.success ? ProgressStatus.COMPLETED : ProgressStatus.FAILED,
            completedAt: new Date().toISOString(),
            results
        };

        const final = this.updateProgress(userId, topicId, update);

        logger.info('Indexing completed', {
            userId,
            topicId,
            success: results.success,
            totalMaterials: final?.totalMaterials,
            materialsProcessed: final?.materialsProcessed,
            errors: final?.errors?.length || 0
        });

        // Clean up after 5 minutes to prevent memory leak
        setTimeout(() => {
            this.clearProgress(userId, topicId);
        }, 5 * 60 * 1000);

        return final;
    }

    /**
     * Get current progress
     * @param {string} userId - User ID
     * @param {string} topicId - Topic ID
     * @returns {Object|null} - Current progress state
     */
    getProgress(userId, topicId) {
        const key = this._getKey(userId, topicId);
        return this.progress.get(key) || null;
    }

    /**
     * Clear progress data
     * @param {string} userId - User ID
     * @param {string} topicId - Topic ID
     */
    clearProgress(userId, topicId) {
        const key = this._getKey(userId, topicId);
        const deleted = this.progress.delete(key);

        if (deleted) {
            logger.debug('Progress data cleared', { userId, topicId });
        }

        return deleted;
    }

    /**
     * Get all progress for a user
     * @param {string} userId - User ID
     * @returns {Array} - All progress states for user
     */
    getUserProgress(userId) {
        const userProgress = [];

        for (const [key, value] of this.progress.entries()) {
            if (value.userId === userId) {
                userProgress.push(value);
            }
        }

        return userProgress;
    }
}

// Export singleton instance
const progressTracker = new ProgressTracker();

module.exports = {
    progressTracker,
    ProgressStatus
};
