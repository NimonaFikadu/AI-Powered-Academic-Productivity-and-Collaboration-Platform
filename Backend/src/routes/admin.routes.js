const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const adminOnly = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

router.use(auth);
router.use(adminOnly);

router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

router.get('/materials', adminController.getAllMaterials);
router.delete('/materials/:id', adminController.deleteMaterial);

router.get('/notes', adminController.getAllNotes);
router.get('/notes/:id', adminController.getNoteDetails);
router.delete('/notes/:id', adminController.deleteNote);

router.get('/transactions', adminController.getAllTransactions);

router.get('/stats', adminController.getSystemStats);
router.get('/analytics', adminController.getAdminAnalytics);

module.exports = router;
