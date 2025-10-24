const Project = require("../models/Project");
const User = require("../models/User");
const Workspace = require("../models/Workspace");

const { sendInvitationEmail } = require("../services/email");


exports.createProject = async (req, res) => {
  try {
    const { name, description, workspace, owner, members, status } = req.body;

    if (!name || !workspace || !owner) {
      return res.status(400).json({ message: "Name, workspace, and owner are required!" });
    }

    const newProject = new Project({
      name,
      description,
      workspace,
      owner,
      members,
      status,
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);

  } catch (err) {
    res.status(500).json({ message: "Error creating project", error: err.message });
  }
};


exports.inviteMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const project = await Project.findById(projectId)
      .populate("members", "_id email firstName lastName")
      .populate("workspace", "_id name members")
      .populate("owner", "_id email firstName lastName");
      
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    const isAlreadyProjectMember = project.members.some(m => 
      m.email.toLowerCase() === normalizedEmail
    );

    const isOwner = project.owner.email.toLowerCase() === normalizedEmail;

    if (isOwner) {
      return res.status(400).json({ 
        message: "Cannot invite project owner - they already have full access" 
      });
    }

    if (isAlreadyProjectMember) {
      return res.status(400).json({ 
        message: "User is already a member of this project" 
      });
    }

    const emailData = {
      email: normalizedEmail,
      projectName: project.name,
      projectId: project._id,
      workspaceName: project.workspace.name,
      projectStatus: project.status,
      inviterName: `${project.owner.firstName} ${project.owner.lastName}`
    };

    if (user) {

      if (!project.members.some(m => m._id.equals(user._id))) {
        project.members.push(user._id);
        await project.save();
      }

      const workspace = await Workspace.findById(project.workspace._id);
      if (!workspace.members.some(m => m.equals(user._id))) {
        workspace.members.push(user._id);
        await workspace.save();
      }

      await sendInvitationEmail('PROJECT_ADD_EXISTING', emailData);

      return res.status(200).json({ 
        message: "User successfully added to project and workspace, notification sent",
        userExists: true,
        memberAdded: true,
        addedToWorkspace: true
      });
    } else {
      await sendInvitationEmail('PROJECT_INVITE_NEW', emailData);

      return res.status(200).json({ 
        message: "Invitation sent successfully. User must create an account to join",
        userExists: false,
        invitationSent: true
      });
    }

  } catch (err) {
    console.error("Error inviting user to project:", err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: err.message 
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid project ID format" 
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
    const projectId = req.params.id;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "Emails array is required and must not be empty" });
    }

    if (emails.length > 50) {
      return res.status(400).json({ message: "Maximum 50 emails allowed per bulk invitation" });
    }

    const project = await Project.findById(projectId)
      .populate("members", "_id email firstName lastName")
      .populate("workspace", "_id name members")
      .populate("owner", "_id email firstName lastName");
      
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
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

        const isOwner = project.owner.email.toLowerCase() === normalizedEmail;
        if (isOwner) {
          results.skipped.push({
            email: normalizedEmail,
            reason: "Cannot invite project owner"
          });
          continue;
        }

        const isAlreadyProjectMember = project.members.some(m => 
          m.email.toLowerCase() === normalizedEmail
        );
        if (isAlreadyProjectMember) {
          results.skipped.push({
            email: normalizedEmail,
            reason: "Already a project member"
          });
          continue;
        }

        const user = await User.findOne({ email: normalizedEmail });
        const emailData = {
          email: normalizedEmail,
          projectName: project.name,
          projectId: project._id,
          workspaceName: project.workspace.name,
          projectStatus: project.status,
          inviterName: `${project.owner.firstName} ${project.owner.lastName}`
        };

        if (user) {
          if (!project.members.some(m => m._id.equals(user._id))) {
            project.members.push(user._id);
          }

          const workspace = await Workspace.findById(project.workspace._id);
          if (!workspace.members.some(m => m.equals(user._id))) {
            workspace.members.push(user._id);
            await workspace.save();
          }

          await sendInvitationEmail('PROJECT_ADD_EXISTING', emailData);
          
          results.successful.push({
            email: normalizedEmail,
            status: "added",
            userExists: true
          });
        } else {
          await sendInvitationEmail('PROJECT_INVITE_NEW', emailData);
          
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
      await project.save();
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


exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const project = await Project.findById(id)
      .populate("workspace", "name description")
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);

  } catch (err) {
    res.status(500).json({ message: "Error fetching project", error: err.message });
  }
};


exports.getByWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;
    const projects = await Project.find({
      workspace: workspaceId    
    })
    .populate("owner", "name email")
    .populate("members", "name email");

    res.status(200).json(projects);

  } catch (err) {
    res.status(500).json({message: "Error fetching projects by workspace", error: err.message});
  }
};


exports.Update = async (req, res) => {
  try {
    const id = req.params.id;
    const newData = req.body;

    const updatedProject = await Project.findByIdAndUpdate(id, newData, {new: true});

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(updatedProject);

  } catch (err) {
    res.status(500).json({ message: "Error updating project", error: err.message });
  }
};


exports.Archive = async (req, res) => {
  try {
    const id = req.params.id;

    const archivedProject = await Project.findByIdAndUpdate(id,{ isArchived: true },{ new: true });

    if (!archivedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project archived successfully", archivedProject });

  } catch (err) {
    res.status(500).json({ message: "Error archiving project", error: err.message });
  }
};


exports.Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted successfully", deletedProject });

  } catch (err) {
    res.status(500).json({ message: "Error deleting project", error: err.message });
  }
};