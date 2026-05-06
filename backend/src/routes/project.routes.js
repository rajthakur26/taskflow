const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getProjects, createProject, getProject, updateProject,
  deleteProject, addMember, removeMember, updateMemberRole,
} = require('../controllers/project.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(protect);

router.get('/', getProjects);

router.post('/', adminOnly, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 chars'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
], validate, createProject);

router.get('/:id', getProject);

router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
], validate, updateProject);

router.delete('/:id', adminOnly, deleteProject);

// Member management
router.post('/:id/members', [
  body('email').isEmail().withMessage('Valid email required'),
], validate, addMember);

router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId', updateMemberRole);

module.exports = router;
