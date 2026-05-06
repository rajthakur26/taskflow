const Task = require('../models/task.model');
const Project = require('../models/project.model');
const { successResponse, errorResponse } = require('../utils/response.utils');

// @desc    Get tasks for a project
// @route   GET /api/tasks?projectId=xxx
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignee, search } = req.query;
    const filter = {};

    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (search) filter.title = { $regex: search, $options: 'i' };

    // If not admin, only show tasks from accessible projects
    if (req.user.role !== 'admin') {
      const accessibleProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      const projectIds = accessibleProjects.map((p) => p._id);
      filter.project = projectId ? projectId : { $in: projectIds };
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });

    return successResponse(res, { tasks }, 'Tasks fetched');
  } catch (err) {
    next(err);
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignee, priority, dueDate, tags, status } = req.body;

    // Verify project access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) return errorResponse(res, 'Project not found', 404);

    if (req.user.role !== 'admin') {
      const isMember = projectDoc.members.some(
        (m) => m.user.toString() === req.user._id.toString()
      );
      if (!isMember) return errorResponse(res, 'Access denied to this project', 403);
    }

    const task = await Task.create({
      title, description, project, assignee, priority, dueDate, tags, status,
      createdBy: req.user._id,
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color');

    return successResponse(res, { task }, 'Task created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color members')
      .populate('comments.user', 'name email avatar');

    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, { task }, 'Task fetched');
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { title, description, assignee, priority, status, dueDate, tags } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignee, priority, status, dueDate, tags },
      { new: true, runValidators: true }
    )
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, { task }, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Update task status only (quick update)
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['todo', 'in-progress', 'in-review', 'done'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('assignee', 'name email avatar')
      .populate('project', 'name color');

    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, { task }, 'Task status updated');
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return errorResponse(res, 'Task not found', 404);

    // Only creator, project admin, or global admin can delete
    const project = await Project.findById(task.project);
    const isProjectAdmin = project?.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (
      req.user.role !== 'admin' &&
      task.createdBy.toString() !== req.user._id.toString() &&
      !isProjectAdmin
    ) {
      return errorResponse(res, 'Not authorized to delete this task', 403);
    }

    await task.deleteOne();
    return successResponse(res, null, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return errorResponse(res, 'Comment text is required', 400);

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.user._id, text } } },
      { new: true }
    ).populate('comments.user', 'name email avatar');

    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, { comments: task.comments }, 'Comment added');
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/tasks/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const projectFilter = req.user.role === 'admin'
      ? {}
      : { 'members.user': req.user._id };

    const projects = await Project.find(projectFilter).select('_id name color status');
    const projectIds = projects.map((p) => p._id);

    const taskFilter = req.user.role === 'admin'
      ? {}
      : { project: { $in: projectIds } };

    const allTasks = await Task.find(taskFilter)
      .populate('assignee', 'name email avatar')
      .populate('project', 'name color')
      .sort({ dueDate: 1 });

    const now = new Date();
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    );
    const myTasks = allTasks.filter(
      (t) => t.assignee && t.assignee._id.toString() === req.user._id.toString()
    );
    const recentTasks = allTasks.slice(0, 10);

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      totalTasks: allTasks.length,
      todo: allTasks.filter((t) => t.status === 'todo').length,
      inProgress: allTasks.filter((t) => t.status === 'in-progress').length,
      inReview: allTasks.filter((t) => t.status === 'in-review').length,
      done: allTasks.filter((t) => t.status === 'done').length,
      overdue: overdueTasks.length,
      myTasks: myTasks.length,
    };

    return successResponse(res, {
      stats,
      overdueTasks: overdueTasks.slice(0, 5),
      myTasks: myTasks.slice(0, 5),
      recentTasks,
      projects,
    }, 'Dashboard data fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks, createTask, getTask, updateTask, updateTaskStatus,
  deleteTask, addComment, getDashboardStats,
};
