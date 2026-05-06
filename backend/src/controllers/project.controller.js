const Project = require('../models/project.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response.utils');

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { 'members.user': req.user._id };

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    // Attach task stats to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.find({ project: p._id });
        const stats = {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === 'todo').length,
          inProgress: tasks.filter((t) => t.status === 'in-progress').length,
          inReview: tasks.filter((t) => t.status === 'in-review').length,
          done: tasks.filter((t) => t.status === 'done').length,
          overdue: tasks.filter(
            (t) => t.dueDate && new Date() > new Date(t.dueDate) && t.status !== 'done'
          ).length,
        };
        return { ...p.toObject(), taskStats: stats };
      })
    );

    return successResponse(res, { projects: projectsWithStats }, 'Projects fetched');
  } catch (err) {
    next(err);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (Admin)
const createProject = async (req, res, next) => {
  try {
    const { name, description, color, priority, dueDate, tags } = req.body;

    const project = await Project.create({
      name,
      description,
      color,
      priority,
      dueDate,
      tags,
      owner: req.user._id,
    });

    await project.populate('owner', 'name email avatar');
    return successResponse(res, { project }, 'Project created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    if (!project) return errorResponse(res, 'Project not found', 404);

    // Check access
    if (req.user.role !== 'admin') {
      const isMember = project.members.some(
        (m) => m.user._id.toString() === req.user._id.toString()
      );
      if (!isMember) return errorResponse(res, 'Access denied', 403);
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      inReview: tasks.filter((t) => t.status === 'in-review').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter(
        (t) => t.dueDate && new Date() > new Date(t.dueDate) && t.status !== 'done'
      ).length,
    };

    return successResponse(res, { project, tasks, stats }, 'Project fetched');
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Project Admin)
const updateProject = async (req, res, next) => {
  try {
    const { name, description, color, status, priority, dueDate, tags } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, color, status, priority, dueDate, tags },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return errorResponse(res, 'Project not found', 404);
    return successResponse(res, { project }, 'Project updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 'Project not found', 404);

    // Delete all associated tasks
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    return successResponse(res, null, 'Project deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Project Admin)
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 'Project not found', 404);

    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 'User with this email not found', 404);

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === user._id.toString()
    );
    if (alreadyMember) return errorResponse(res, 'User is already a member', 409);

    project.members.push({ user: user._id, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    return successResponse(res, { project }, 'Member added successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Project Admin)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 'Project not found', 404);

    if (project.owner.toString() === req.params.userId) {
      return errorResponse(res, 'Cannot remove project owner', 400);
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await project.save();

    // Unassign tasks from removed user
    await Task.updateMany(
      { project: project._id, assignee: req.params.userId },
      { assignee: null }
    );

    return successResponse(res, { project }, 'Member removed successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Update member role
// @route   PUT /api/projects/:id/members/:userId
// @access  Private (Project Admin)
const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 'Project not found', 404);

    const member = project.members.find(
      (m) => m.user.toString() === req.params.userId
    );
    if (!member) return errorResponse(res, 'Member not found', 404);

    member.role = role;
    await project.save();
    await project.populate('members.user', 'name email avatar');

    return successResponse(res, { project }, 'Member role updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
};
