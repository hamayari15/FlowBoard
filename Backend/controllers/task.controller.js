const Task = require('../models/task');
const Board = require('../models/board');
const User = require('../models/User');

exports.createTask = async (req, res) => {
  try {
    const { title, description, board, status, assignee, priority, labels, dueDate } = req.body;
    const userId = req.user?.id || req.body.createdBy;

    if (!title || !board) {
      return res.status(400).json({ message: "Task title and board are required" });
    }

    const boardExists = await Board.findById(board);
    if (!boardExists) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Get the highest position in the specific column to add the new task at the end
    const taskStatus = status || 'to-do';
    const highestPositionTask = await Task.findOne({ board, status: taskStatus }).sort({ position: -1 });
    const position = highestPositionTask ? highestPositionTask.position + 1 : 0;

    const task = new Task({
      title: title.trim(),
      description,
      board,
      status: taskStatus,
      position,
      assignee: assignee || null,
      createdBy: userId,
      priority: priority || 'medium',
      labels: labels || [],
      dueDate: dueDate || null,
    });

    const savedTask = await task.save();
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('board', 'name');

    res.status(201).json(populatedTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('board', 'name description')
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .sort({ position: 1 });

    res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: "Error fetching tasks", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId)
      .populate('board', 'name description')
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ message: "Error fetching task", error: err.message });
  }
};

exports.getByBoard = async (req, res) => {
  try {
    const boardId = req.params.boardId;
    
    const boardExists = await Board.findById(boardId);
    if (!boardExists) {
      return res.status(404).json({ message: "Board not found" });
    }

    const tasks = await Task.find({ board: boardId })
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .sort({ position: 1 });

    res.status(200).json(tasks);
  } catch (err) {
    console.error('Error fetching tasks by board:', err);
    res.status(500).json({ message: "Error fetching tasks by board", error: err.message });
  }
};

exports.Update = async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true })
      .populate('board', 'name description')
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: "Error updating task", error: err.message });
  }
};

exports.Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully", task: deletedTask });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: "Error deleting task", error: err.message });
  }
};

exports.updatePosition = async (req, res) => {
  try {
    const id = req.params.id;
    const { position } = req.body;

    if (position === undefined || position === null) {
      return res.status(400).json({ message: "Position is required" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { position },
      { new: true }
    )
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    console.error('Error updating task position:', err);
    res.status(500).json({ message: "Error updating task position", error: err.message });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const id = req.params.id;
    const { assignee } = req.body;

    if (assignee) {
      const userExists = await User.findById(assignee);
      if (!userExists) {
        return res.status(404).json({ message: "Assignee user not found" });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { assignee: assignee || null },
      { new: true }
    )
      .populate('board', 'name description')
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    console.error('Error assigning task:', err);
    res.status(500).json({ message: "Error assigning task", error: err.message });
  }
};

// Bulk update task positions (useful for drag and drop)
exports.bulkUpdatePositions = async (req, res) => {
  try {
    const { tasks } = req.body; // Array of { id, position, status? }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: "Tasks array is required" });
    }

    const bulkOps = tasks.map(task => {
      const update = { position: task.position };
      if (task.status) {
        update.status = task.status;
      }
      return {
        updateOne: {
          filter: { _id: task.id },
          update: update
        }
      };
    });

    await Task.bulkWrite(bulkOps);

    res.status(200).json({ message: "Task positions updated successfully" });
  } catch (err) {
    console.error('Error bulk updating task positions:', err);
    res.status(500).json({ message: "Error updating task positions", error: err.message });
  }
};
