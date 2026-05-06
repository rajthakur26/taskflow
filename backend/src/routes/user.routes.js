const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUserRole, toggleUserStatus, searchUsers } = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/search', searchUsers);
router.get('/', adminOnly, getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/role', adminOnly, updateUserRole);
router.put('/:id/status', adminOnly, toggleUserStatus);

module.exports = router;
