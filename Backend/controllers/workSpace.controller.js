const workSpace = require("../models/Workspace");
const User = require("../models/User");

const { sendInvitationEmail } = require("../services/email"); 

const Project = require("../models/Project");
const Task = require("../models/Task");


exports.createWorkSpace = async (req, res) => {
  try {
    const { name, description, owner, members } = req.body;

    if (!name || !owner) {
      return res.status(400).json({ message: "Name and owner are required !" });
    }

    const newWorkSpace = new workSpace({
      name,
      description,
      owner,
      members: members || [],
    });

    const ownerExists = await User.findById(owner);
    if (!ownerExists) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const duplicate = await workSpace.findOne({ name: name.trim(), owner });
    if (duplicate) {
      return res.status(409).json({ message: "Workspace name already exists !" });
    }

    const savedWorkSpace = await newWorkSpace.save();
    res.status(201).json(savedWorkSpace);

  } catch (err) {
    res.status(500).json({ message: "Error creating workspace", error: err.message });
  }
};


exports.inviteMember = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const wSpace = await workSpace.findById(workspaceId)
      .populate("members", "_id email firstName lastName")
      .populate("owner", "_id email firstName lastName");
    
    if (!wSpace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    const isAlreadyMember = wSpace.members.some(m => 
      m.email.toLowerCase() === normalizedEmail
    );

    const isOwner = wSpace.owner.email.toLowerCase() === normalizedEmail;

    if (isOwner) {
      return res.status(400).json({ 
        message: "Cannot invite workspace owner - they already have full access" 
      });
    }

    if (isAlreadyMember) {
      return res.status(400).json({ 
        message: "User is already a member of this workspace" 
      });
    }

    const emailData = {
      email: normalizedEmail,
      workspaceName: wSpace.name,
      workspaceId: wSpace._id,
      inviterName: `${wSpace.owner.firstName} ${wSpace.owner.lastName}`
    };

    if (user) {
      wSpace.members.push(user._id);
      await wSpace.save();

      await sendInvitationEmail('WORKSPACE_ADD_EXISTING', emailData);

      return res.status(200).json({ 
        message: "User successfully added to workspace and notified",
        userExists: true,
        memberAdded: true
      });
    } else {
      await sendInvitationEmail('WORKSPACE_INVITE_NEW', emailData);

      return res.status(200).json({ 
        message: "Invitation sent successfully. User must create an account to join",
        userExists: false,
        invitationSent: true
      });
    }

  } catch (err) {
    console.error("Error inviting user to workspace:", err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: err.message 
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid workspace ID format" 
      });
    }

    res.status(500).json({ 
      message: "Failed to process invitation. Please try again later",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


exports.bulkInviteMembers = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "Emails array is required and must not be empty" });
    }

    if (emails.length > 50) {
      return res.status(400).json({ message: "Maximum 50 emails allowed per bulk invitation" });
    }

    const wSpace = await workSpace.findById(workspaceId)
      .populate("members", "_id email firstName lastName")
      .populate("owner", "_id email firstName lastName");
    
    if (!wSpace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let email of emails) {
      try {
        const normalizedEmail = email.trim().toLowerCase();

        if (!emailRegex.test(normalizedEmail)) {
          results.failed.push({
            email: normalizedEmail,
            reason: "Invalid email format"
          });
          continue;
        }

        const isOwner = wSpace.owner.email.toLowerCase() === normalizedEmail;
        if (isOwner) {
          results.skipped.push({
            email: normalizedEmail,
            reason: "Cannot invite workspace owner"
          });
          continue;
        }

        const isAlreadyMember = wSpace.members.some(m => 
          m.email.toLowerCase() === normalizedEmail
        );
        if (isAlreadyMember) {
          results.skipped.push({
            email: normalizedEmail,
            reason: "Already a member"
          });
          continue;
        }

        const user = await User.findOne({ email: normalizedEmail });
        const emailData = {
          email: normalizedEmail,
          workspaceName: wSpace.name,
          workspaceId: wSpace._id,
          inviterName: `${wSpace.owner.firstName} ${wSpace.owner.lastName}`
        };

        if (user) {
          wSpace.members.push(user._id);
          await sendInvitationEmail('WORKSPACE_ADD_EXISTING', emailData);
          
          results.successful.push({
            email: normalizedEmail,
            status: "added",
            userExists: true
          });
        } else {
          await sendInvitationEmail('WORKSPACE_INVITE_NEW', emailData);
          
          results.successful.push({
            email: normalizedEmail,
            status: "invited", 
            userExists: false
          });
        }

      } catch (emailError) {
        console.error(`Error processing email ${email}:`, emailError);
        results.failed.push({
          email: email,
          reason: "Processing error"
        });
      }
    }

    if (results.successful.some(r => r.userExists)) {
      await wSpace.save();
    }

    const summary = {
      total: emails.length,
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length
    };

    return res.status(200).json({
      message: `Bulk invitation completed. ${summary.successful} successful, ${summary.failed} failed, ${summary.skipped} skipped.`,
      summary,
      results
    });

  } catch (err) {
    console.error("Error in bulk invite:", err);
    res.status(500).json({ 
      message: "Failed to process bulk invitations. Please try again later",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


exports.getAll = async (req, res) => {
  try {
    const workSpaces = await workSpace.find().populate("owner").populate("members");
    res.status(200).json(workSpaces);

  } catch (err) {
    res.status(500).json({ message: "Error fetching workSpaces", error: err.message });
  }
};  


exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const workSpaceData = await workSpace.findById(id).populate("owner").populate("members");
    res.status(200).json(workSpaceData);

  } catch (err) {
    res.status(500).json({ message: "Error fetching workSpace", error: err.message });
  }
};


exports.getWorkspaceStats = async (req, res) => {
  try {
    const { wsId } = req.params;

    // Get workspace with populated members
    const workspace = await workSpace.findById(wsId)
      .populate('members', 'firstName lastName email')
      .populate('owner', 'firstName lastName email');

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Get all projects in the workspace
    const projects = await Project.find({ workspace: wsId })
      .populate('owner', 'firstName lastName')
      .populate('members', 'firstName lastName');
    
    const projectIds = projects.map(p => p._id);

    // Get all boards for these projects
    const Board = require("../models/Board");
    const boards = await Board.find({ project: { $in: projectIds } });
    const boardIds = boards.map(b => b._id);

    // Get all tasks for these boards
    const tasks = await Task.find({ board: { $in: boardIds } })
      .populate('assignee', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    // Task status breakdown
    const taskStatusCount = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    // Task priority breakdown
    const taskPriorityCount = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    // Tasks by assignee
    const tasksByAssignee = tasks.reduce((acc, task) => {
      if (task.assignee) {
        const name = `${task.assignee.firstName} ${task.assignee.lastName}`;
        acc[name] = (acc[name] || 0) + 1;
      } else {
        acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
      }
      return acc;
    }, {});

    // Project progress with detailed stats
    const projectProgress = projects.map(project => {
      const projectBoards = boards.filter(b => b.project.equals(project._id));
      const projectBoardIds = projectBoards.map(b => b._id);
      const projectTasks = tasks.filter(t => projectBoardIds.some(bid => bid.equals(t.board)));
      
      // Status breakdown
      const statusBreakdown = projectTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      // Priority breakdown
      const priorityBreakdown = projectTasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {});

      // Tasks by assignee for this project
      const projectTasksByAssignee = projectTasks.reduce((acc, task) => {
        if (task.assignee) {
          const name = `${task.assignee.firstName} ${task.assignee.lastName}`;
          acc[name] = (acc[name] || 0) + 1;
        } else if (projectTasks.length > 0) {
          // Only add "Unassigned" if there are actually tasks
          acc['Unassigned'] = (acc['Unassigned'] || 0) + 1;
        }
        return acc;
      }, {});

      // Overdue tasks for this project
      const now = new Date();
      const projectOverdueTasks = projectTasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < now && 
        t.status !== 'done'
      ).length;

      // Tasks created in last 30 days for this project
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const projectRecentTasks = projectTasks.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);
      const projectTasksByDate = projectRecentTasks.reduce((acc, task) => {
        const date = new Date(task.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Board breakdown for this project
      const boardsBreakdown = projectBoards.map(board => {
        const boardTasks = projectTasks.filter(t => t.board.equals(board._id));
        const boardCompletedTasks = boardTasks.filter(t => t.status === 'done').length;
        
        return {
          boardId: board._id,
          boardName: board.name,
          totalTasks: boardTasks.length,
          completedTasks: boardCompletedTasks,
          completionPercentage: boardTasks.length > 0 
            ? Math.round((boardCompletedTasks / boardTasks.length) * 100) 
            : 0
        };
      });

      // Team members working on this project
      const projectMembers = project.members.map(member => {
        const memberTasks = projectTasks.filter(t => 
          t.assignee && t.assignee._id.equals(member._id)
        );
        const memberCompletedTasks = memberTasks.filter(t => t.status === 'done').length;
        
        return {
          memberId: member._id,
          memberName: `${member.firstName} ${member.lastName}`,
          assignedTasks: memberTasks.length,
          completedTasks: memberCompletedTasks,
          completionRate: memberTasks.length > 0 
            ? Math.round((memberCompletedTasks / memberTasks.length) * 100) 
            : 0
        };
      }).filter(m => m.assignedTasks > 0); // Only include members with tasks

      const completedTasks = statusBreakdown['done'] || 0;
      const completionPercentage = projectTasks.length > 0 
        ? Math.round((completedTasks / projectTasks.length) * 100) 
        : 0;

      return {
        projectId: project._id,
        projectName: project.name,
        projectDescription: project.description,
        projectStatus: project.status,
        totalTasks: projectTasks.length,
        completedTasks,
        completionPercentage,
        overdueTasks: projectOverdueTasks,
        totalBoards: projectBoards.length,
        statusBreakdown,
        priorityBreakdown,
        tasksByAssignee: projectTasksByAssignee,
        tasksByDate: projectTasksByDate,
        boardsBreakdown,
        teamMembers: projectMembers,
        owner: project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Unknown',
        createdAt: project.createdAt
      };
    });

    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== 'done'
    ).length;

    // Tasks created over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTasks = tasks.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);
    const tasksByDate = recentTasks.reduce((acc, task) => {
      const date = new Date(task.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Project status breakdown
    const projectStatusCount = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    // Member activity stats
    const memberStats = workspace.members.map(member => {
      const assignedTasks = tasks.filter(t => 
        t.assignee && t.assignee._id.equals(member._id)
      );
      const completedTasks = assignedTasks.filter(t => t.status === 'done').length;
      
      return {
        memberId: member._id,
        memberName: `${member.firstName} ${member.lastName}`,
        email: member.email,
        assignedTasks: assignedTasks.length,
        completedTasks,
        completionRate: assignedTasks.length > 0 
          ? Math.round((completedTasks / assignedTasks.length) * 100) 
          : 0
      };
    });

    // Overall workspace health metrics
    const totalCompletedTasks = tasks.filter(t => t.status === 'done').length;
    const overallCompletionRate = tasks.length > 0 
      ? Math.round((totalCompletedTasks / tasks.length) * 100) 
      : 0;

    res.status(200).json({
      workspace: {
        id: workspace._id,
        name: workspace.name,
        totalMembers: workspace.members.length,
        owner: workspace.owner ? `${workspace.owner.firstName} ${workspace.owner.lastName}` : 'Unknown'
      },
      overview: {
        totalProjects: projects.length,
        totalBoards: boards.length,
        totalTasks: tasks.length,
        completedTasks: totalCompletedTasks,
        overallCompletionRate,
        overdueTasks
      },
      taskStatusCount,
      taskPriorityCount,
      tasksByAssignee,
      projectStatusCount,
      projectProgress,
      memberStats,
      tasksByDate
    });

  } catch (err) {
    console.error("Error fetching workspace stats:", err);
    res.status(500).json({ 
      message: "Error fetching workspace stats", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};


exports.Update = async (req, res) => {
  try {
    const id = req.params.id;
    const newData = req.body;

    const updatedWorkSpace = await workSpace.findByIdAndUpdate(id, newData, { new: true }).populate("owner").populate("members");
    if (!updatedWorkSpace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    
    res.status(200).json(updatedWorkSpace);

  } catch (err) {
    res.status(500).json({ message: "Error updating workSpace", error: err.message });
  }
};


exports.Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedWorkSpace = await workSpace.findByIdAndDelete(id);

    if (!deletedWorkSpace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.status(200).json(deletedWorkSpace);

  } catch (err) {
    res.status(500).json({ message: "Error Deleting Workspace", error: err.message });
  }
};