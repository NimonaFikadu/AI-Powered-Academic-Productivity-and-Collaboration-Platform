const db = require('../models');
const sequelize = require('../config/database');
const { QueryTypes, Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { getAiStats } = require('../services/rag/utils/aiHealthCheck');

const clampInt = (value, { min, max, fallback }) => {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  if (Number.isFinite(min) && n < min) return min;
  if (Number.isFinite(max) && n > max) return max;
  return n;
};

const getPagination = (req) => {
  const page = clampInt(req.query.page, { min: 1, max: 1000000, fallback: 1 });
  const pageSize = clampInt(req.query.pageSize, { min: 5, max: 100, fallback: 10 });
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
};

const normalizeSortDir = (dir) => {
  const d = String(dir || '').toLowerCase();
  return d === 'asc' ? 'ASC' : 'DESC';
};

const buildPaginationResponse = ({ page, pageSize, total }) => {
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  return {
    page,
    pageSize,
    total,
    totalPages
  };
};

const isUuidV4Like = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

const logAdminAction = (req, action, entityType, entityId) => {
  const adminId = req.user?.id;
  console.log(`[LOG admin_action] ========= adminId=${adminId} action=${action} entityType=${entityType} entityId=${entityId}`);
};

const getAllUsers = async (req, res) => {
  try {
    const { page, pageSize, offset } = getPagination(req);
    const search = String(req.query.search || '').trim();
    const role = String(req.query.role || '').trim();
    const sortBy = String(req.query.sortBy || 'created_at');
    const sortDir = normalizeSortDir(req.query.sortDir);

    const sortWhitelist = {
      created_at: 'u.created_at',
      email: 'u.email',
      role: 'u.role'
    };
    const sortColumn = sortWhitelist[sortBy] || sortWhitelist.created_at;

    const whereParts = [];
    const replacements = [];

    if (search) {
      whereParts.push('LOWER(u.email) LIKE ?');
      replacements.push(`%${search.toLowerCase()}%`);
    }

    if (role && role !== 'all') {
      whereParts.push('u.role = ?');
      replacements.push(role);
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const [countRow] = await sequelize.query(
      `SELECT COUNT(*) as total FROM users u ${whereSql}`,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    const total = Number(countRow?.total) || 0;

    const users = await sequelize.query(
      `SELECT u.id, u.email, u.role, u.full_name, u.created_at,
              u.subscription_status, u.subscription_start_date, u.subscription_end_date
       FROM users u
       ${whereSql}
       ORDER BY ${sortColumn} ${sortDir}
       LIMIT ? OFFSET ?`,
      {
        replacements: [...replacements, pageSize, offset],
        type: QueryTypes.SELECT
      }
    );

    return res.json({
      users,
      pagination: buildPaginationResponse({ page, pageSize, total })
    });
  } catch (error) {
    console.error('[LOG admin_getAllUsers] ========= Error:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const { page, pageSize, offset } = getPagination(req);
    const status = String(req.query.status || '').trim().toLowerCase();
    const search = String(req.query.search || '').trim().toLowerCase();
    const user = String(req.query.user || '').trim().toLowerCase();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    if (from || to) {
      const createdAt = {};
      if (from) createdAt[Op.gte] = new Date(from);
      if (to) createdAt[Op.lte] = new Date(to);
      where.created_at = createdAt;
    }

    const userWhere = {};
    if (user) {
      userWhere.email = { [Op.iLike]: `%${user}%` };
    }

    const searchOr = [];
    if (search) {
      searchOr.push({ tx_ref: { [Op.iLike]: `%${search}%` } });
      searchOr.push({ '$user.email$': { [Op.iLike]: `%${search}%` } });
    }

    const finalWhere = { ...where };
    if (searchOr.length) {
      finalWhere[Op.or] = searchOr;
    }

    const { rows, count } = await db.Transaction.findAndCountAll({
      where: finalWhere,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'email'],
          required: false,
          where: Object.keys(userWhere).length ? userWhere : undefined
        }
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset
    });

    const transactions = rows.map((t) => {
      const json = t.toJSON ? t.toJSON() : t;
      return {
        id: json.id,
        tx_ref: json.tx_ref,
        amount: json.amount,
        status: json.status,
        created_at: json.created_at,
        user_id: json.user_id,
        user_email: json.user?.email || null
      };
    });

    return res.json({
      transactions,
      pagination: buildPaginationResponse({ page, pageSize, total: Number(count) || 0 })
    });
  } catch (error) {
    console.error('[LOG admin_getAllTransactions] ========= Error:', error);
    return res.status(500).json({ message: 'Error fetching transactions' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuidV4Like(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (req.user?.id === id) {
      return res.status(400).json({ message: 'Admins cannot delete themselves' });
    }

    const [, meta] = await sequelize.query('DELETE FROM users WHERE id = ?', {
      replacements: [id]
    });

    const affected = meta?.affectedRows ?? meta?.rowCount;
    if (!affected) {
      return res.status(404).json({ message: 'User not found' });
    }

    logAdminAction(req, 'delete', 'user', id);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('[LOG admin_deleteUser] ========= Error:', error);
    return res.status(500).json({ message: 'Error deleting user' });
  }
};

const getAllMaterials = async (req, res) => {
  try {
    const { page, pageSize, offset } = getPagination(req);
    const search = String(req.query.search || '').trim();
    const sortBy = String(req.query.sortBy || 'created_at');
    const sortDir = normalizeSortDir(req.query.sortDir);

    const sortWhitelist = {
      created_at: 'm.created_at',
      file_name: 'm.file_name',
      file_type: 'm.file_type',
      owner: 'u.email'
    };
    const sortColumn = sortWhitelist[sortBy] || sortWhitelist.created_at;

    const whereParts = [];
    const replacements = [];

    if (search) {
      whereParts.push('(LOWER(m.file_name) LIKE ? OR LOWER(u.email) LIKE ?)');
      replacements.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const [countRow] = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM materials m
       LEFT JOIN users u ON m.user_id = u.id
       ${whereSql}`,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );
    const total = Number(countRow?.total) || 0;

    const materials = await sequelize.query(
      `SELECT m.id, m.user_id, m.topic_id, m.file_name, m.uploaded_file, m.file_type, m.file_size, m.created_at, m.updated_at,
              u.email as owner_email, u.full_name as owner_name,
              t.title as topic_title
       FROM materials m
       LEFT JOIN users u ON m.user_id = u.id
       LEFT JOIN topics t ON m.topic_id = t.id
       ${whereSql}
       ORDER BY ${sortColumn} ${sortDir}
       LIMIT ? OFFSET ?`,
      {
        replacements: [...replacements, pageSize, offset],
        type: QueryTypes.SELECT
      }
    );

    return res.json({
      materials,
      pagination: buildPaginationResponse({ page, pageSize, total })
    });
  } catch (error) {
    console.error('[LOG admin_getAllMaterials] ========= Error:', error);
    return res.status(500).json({ message: 'Error fetching materials' });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuidV4Like(id)) {
      return res.status(400).json({ message: 'Invalid material id' });
    }

    const material = await db.Material.findOne({ where: { id } });
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const filePath = path.join(__dirname, `../../uploads/materials/${material.user_id}`, material.uploaded_file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fsError) {
        console.error('[LOG admin_deleteMaterial] ========= Error deleting file:', fsError);
      }
    }

    await material.destroy();

    logAdminAction(req, 'delete', 'material', id);
    return res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('[LOG admin_deleteMaterial] ========= Error:', error);
    return res.status(500).json({ message: 'Error deleting material' });
  }
};

const getAllNotes = async (req, res) => {
  try {
    const { page, pageSize, offset } = getPagination(req);
    const search = String(req.query.search || '').trim();
    const privacy = String(req.query.privacy || '').trim();
    const sortBy = String(req.query.sortBy || 'created_at');
    const sortDir = normalizeSortDir(req.query.sortDir);

    const sortWhitelist = {
      created_at: 'n.created_at',
      title: 'n.title',
      owner: 'u.email',
      privacy: 'n.is_private'
    };
    const sortColumn = sortWhitelist[sortBy] || sortWhitelist.created_at;

    const whereParts = [];
    const replacements = [];

    if (search) {
      whereParts.push('(LOWER(n.title) LIKE ? OR LOWER(u.email) LIKE ?)');
      replacements.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    const dialect = String(sequelize.getDialect ? sequelize.getDialect() : '').toLowerCase();
    const isPostgres = dialect === 'postgres';
    const isPrivateTrue = isPostgres ? 'true' : '1';
    const isPrivateFalse = isPostgres ? 'false' : '0';

    if (privacy && privacy !== 'all') {
      if (privacy === 'public') whereParts.push(`n.is_private = ${isPrivateFalse}`);
      if (privacy === 'private') whereParts.push(`n.is_private = ${isPrivateTrue}`);
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const [countRow] = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM notes n
       LEFT JOIN users u ON n.user_id = u.id
       ${whereSql}`,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );
    const total = Number(countRow?.total) || 0;

    const notes = await sequelize.query(
      `SELECT n.id, n.title, n.user_id, n.topic_id, n.created_at, n.updated_at, n.is_private,
              u.email as owner_email, u.full_name as owner_name,
              t.title as topic_title
       FROM notes n
       LEFT JOIN users u ON n.user_id = u.id
       LEFT JOIN topics t ON n.topic_id = t.id
       ${whereSql}
       ORDER BY ${sortColumn} ${sortDir}
       LIMIT ? OFFSET ?`,
      {
        replacements: [...replacements, pageSize, offset],
        type: QueryTypes.SELECT
      }
    );

    return res.json({
      notes,
      pagination: buildPaginationResponse({ page, pageSize, total })
    });
  } catch (error) {
    console.error('[LOG admin_getAllNotes] ========= Error:', error);
    return res.status(500).json({ message: 'Error fetching notes' });
  }
};

const getNoteDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuidV4Like(id)) {
      return res.status(400).json({ message: 'Invalid note id' });
    }

    const [note] = await sequelize.query(
      `SELECT n.*, u.email as owner_email, u.full_name as owner_name, t.title as topic_title
       FROM notes n
       LEFT JOIN users u ON n.user_id = u.id
       LEFT JOIN topics t ON n.topic_id = t.id
       WHERE n.id = ?
       LIMIT 1`,
      {
        replacements: [id],
        type: QueryTypes.SELECT
      }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    return res.json({ note });
  } catch (error) {
    console.error('[LOG admin_getNoteDetails] ========= Error:', error);
    return res.status(500).json({ message: 'Error fetching note details' });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const days = clampInt(req.query.days, { min: 7, max: 90, fallback: 30 });

    const dialect = String(sequelize.getDialect ? sequelize.getDialect() : '').toLowerCase();
    const isPostgres = dialect === 'postgres';

    const usersSinceSql = isPostgres
      ? 'created_at >= (CURRENT_DATE - (? * INTERVAL \'1 day\'))'
      : 'created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';

    const materialsSinceSql = isPostgres
      ? 'created_at >= (CURRENT_DATE - (? * INTERVAL \'1 day\'))'
      : 'created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';

    const dateExpr = isPostgres ? "DATE_TRUNC('day', created_at)" : 'DATE(created_at)';

    // Daily counts for the last N days
    const dailyUsers = await sequelize.query(
      `SELECT ${dateExpr} as date, COUNT(*) as count
       FROM users
       WHERE ${usersSinceSql}
       GROUP BY ${dateExpr}
       ORDER BY ${dateExpr} ASC`,
      {
        replacements: [days],
        type: QueryTypes.SELECT
      }
    );

    const dailyMaterials = await sequelize.query(
      `SELECT ${dateExpr} as date, COUNT(*) as count
       FROM materials
       WHERE ${materialsSinceSql}
       GROUP BY ${dateExpr}
       ORDER BY ${dateExpr} ASC`,
      {
        replacements: [days],
        type: QueryTypes.SELECT
      }
    );

    const isPrivateVal = isPostgres ? 'true' : '1';
    const privacyCounts = await sequelize.query(
      `SELECT
         CASE
           WHEN is_private = ${isPrivateVal} THEN 'Private'
           ELSE 'Public'
         END as name,
         COUNT(*) as value
       FROM notes
       GROUP BY
         CASE
           WHEN is_private = ${isPrivateVal} THEN 'Private'
           ELSE 'Public'
         END`,
      { type: QueryTypes.SELECT }
    );

    const [recentUsers, recentMaterials, recentNotes] = await Promise.all([
      sequelize.query(
        `SELECT u.id as entity_id, u.email as label, u.created_at as created_at
         FROM users u
         ORDER BY u.created_at DESC
         LIMIT 5`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT m.id as entity_id, m.file_name as label, m.created_at as created_at
         FROM materials m
         ORDER BY m.created_at DESC
         LIMIT 5`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT n.id as entity_id, n.title as label, n.created_at as created_at
         FROM notes n
         ORDER BY n.created_at DESC
         LIMIT 5`,
        { type: QueryTypes.SELECT }
      )
    ]);

    const recentActivity = []
      .concat(
        (recentUsers || []).map((r) => ({ entity_type: 'User', entity_id: r.entity_id, label: r.label, action: 'created', created_at: r.created_at })),
        (recentMaterials || []).map((r) => ({ entity_type: 'Material', entity_id: r.entity_id, label: r.label, action: 'uploaded', created_at: r.created_at })),
        (recentNotes || []).map((r) => ({ entity_type: 'Note', entity_id: r.entity_id, label: r.label, action: 'created', created_at: r.created_at }))
      )
      .filter((r) => r && r.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    const result = {
      charts: {
        userGrowth: Array.isArray(dailyUsers) ? dailyUsers : [],
        materialsPerDay: Array.isArray(dailyMaterials) ? dailyMaterials : [],
        notesDistribution: Array.isArray(privacyCounts) ? privacyCounts : []
      },
      activity: Array.isArray(recentActivity) ? recentActivity : []
    };

    console.log('[ADMIN_ANALYTICS_RESPONSE]', result);
    return res.json(result);
  } catch (error) {
    console.error('[LOG admin_getAdminAnalytics] ========= Error:', error);
    console.error('[ADMIN_ANALYTICS_ERROR_DETAIL]', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      sql: error?.sql,
      original: error?.original
        ? {
            name: error.original?.name,
            message: error.original?.message,
            code: error.original?.code,
            detail: error.original?.detail
          }
        : undefined
    });
    return res.status(500).json({ message: 'Error fetching analytics' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuidV4Like(id)) {
      return res.status(400).json({ message: 'Invalid note id' });
    }

    const [, meta] = await sequelize.query('DELETE FROM notes WHERE id = ?', {
      replacements: [id]
    });

    const affected = meta?.affectedRows ?? meta?.rowCount;
    if (!affected) {
      return res.status(404).json({ message: 'Note not found' });
    }

    logAdminAction(req, 'delete', 'note', id);
    return res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('[LOG admin_deleteNote] ========= Error:', error);
    return res.status(500).json({ message: 'Error deleting note' });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const usersCount = await sequelize.query('SELECT COUNT(*) as total FROM users', { type: QueryTypes.SELECT });
    const materialsCount = await sequelize.query('SELECT COUNT(*) as total FROM materials', { type: QueryTypes.SELECT });
    const notesCount = await sequelize.query('SELECT COUNT(*) as total FROM notes', { type: QueryTypes.SELECT });
    const topicsCount = await sequelize.query('SELECT COUNT(*) as total FROM topics', { type: QueryTypes.SELECT });

    const [revenueRaw, txTotalRaw, txSuccessRaw, txFailedRaw, txPendingRaw] = await Promise.all([
      db.Transaction.sum('amount', { where: { status: 'success' } }),
      db.Transaction.count(),
      db.Transaction.count({ where: { status: 'success' } }),
      db.Transaction.count({ where: { status: 'failed' } }),
      db.Transaction.count({ where: { status: 'pending' } })
    ]);

    const totalRevenue = revenueRaw === null || revenueRaw === undefined ? 0 : Number(revenueRaw);

    const usersTotal = Array.isArray(usersCount) && usersCount[0] ? usersCount[0].total : 0;
    const materialsTotal = Array.isArray(materialsCount) && materialsCount[0] ? materialsCount[0].total : 0;
    const notesTotal = Array.isArray(notesCount) && notesCount[0] ? notesCount[0].total : 0;
    const topicsTotal = Array.isArray(topicsCount) && topicsCount[0] ? topicsCount[0].total : 0;

    const aiStats = getAiStats() || {};
    const result = {
      ai: {
        aiSuccessCount: Number(aiStats.aiSuccessCount) || 0,
        aiFailureCount: Number(aiStats.aiFailureCount) || 0,
        status: aiStats.status || 'HEALTHY',
        lastErrorType: aiStats.lastErrorType || 'none'
      },
      usage: {
        totalTransactions: Number(txTotalRaw) || 0,
        successTransactions: Number(txSuccessRaw) || 0,
        failedTransactions: Number(txFailedRaw) || 0,
        pendingTransactions: Number(txPendingRaw) || 0
      },
      performance: {
        aiFailureRate: aiStats.aiFailureRate || '0.0%',
        serverTime: new Date().toISOString()
      },
      users: {
        totalUsers: Number(usersTotal) || 0
      },
      topics: {
        totalTopics: Number(topicsTotal) || 0
      },
      stats: {
        users: Number(usersTotal) || 0,
        materials: Number(materialsTotal) || 0,
        notes: Number(notesTotal) || 0,
        totalRevenue: Number.isFinite(totalRevenue) ? totalRevenue : 0,
        totalTransactions: Number(txTotalRaw) || 0,
        successTransactions: Number(txSuccessRaw) || 0,
        failedTransactions: Number(txFailedRaw) || 0,
        pendingTransactions: Number(txPendingRaw) || 0,
        ai: {
          aiSuccessCount: Number(aiStats.aiSuccessCount) || 0,
          aiFailureCount: Number(aiStats.aiFailureCount) || 0,
          aiFailureRate: aiStats.aiFailureRate || '0.0%',
          lastErrorType: aiStats.lastErrorType || 'none',
          status: aiStats.status || 'HEALTHY'
        }
      }
    };

    console.log('[ADMIN_STATS_RESPONSE]', result);
    return res.json(result);
  } catch (error) {
    console.error('[LOG admin_getSystemStats] ========= Error:', error);
    return res.status(500).json({ message: 'Error fetching system stats' });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAllMaterials,
  deleteMaterial,
  getAllNotes,
  deleteNote,
  getAllTransactions,
  getSystemStats,
  getNoteDetails,
  getAdminAnalytics
};
