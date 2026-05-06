const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getTasks, createTask, getTask, updateTask, updateTaskStatus,
  deleteTask, addComment, getDashboardStats,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/', getTasks);

router.post('/', [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 chars'),
  body('project').notEmpty().withMessage('Project is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done']),
], validate, createTask);

router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
