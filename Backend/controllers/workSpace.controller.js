const workSpace = require("../models/Workspace");
const User = require("../models/User");

const { sendEmail, sendInvitationEmail } = require("../services/email");


exports.Add = async (req, res) => {
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
    res.status(500).json({ message: "Error creating workspace", err });
  }
};


exports.inviteMember = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { email } = req.body;

    // Input validation
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Find workspace with populated owner for better email context
    const wSpace = await workSpace.findById(workspaceId)
      .populate("members", "_id email firstName lastName")
      .populate("owner", "_id email firstName lastName");
    
    if (!wSpace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Check if user is already a member
    const isAlreadyMember = wSpace.members.some(m => 
      m.email.toLowerCase() === normalizedEmail
    );

    // Check if user is the owner
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
      // User exists - add to workspace and send welcome email
      wSpace.members.push(user._id);
      await wSpace.save();

      await sendInvitationEmail('WORKSPACE_ADD_EXISTING', emailData);

      return res.status(200).json({ 
        message: "User successfully added to workspace and notified",
        userExists: true,
        memberAdded: true
      });
    } else {
      // User doesn't exist - send invitation email
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

// NEW: Bulk invite members to workspace
exports.bulkInviteMembers = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { emails } = req.body;

    // Input validation
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "Emails array is required and must not be empty" });
    }

    if (emails.length > 50) {
      return res.status(400).json({ message: "Maximum 50 emails allowed per bulk invitation" });
    }

    // Find workspace with populated data
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

        // Validate email format
        if (!emailRegex.test(normalizedEmail)) {
          results.failed.push({
            email: normalizedEmail,
            reason: "Invalid email format"
          });
          continue;
        }

        // Check if user is the owner
        const isOwner = wSpace.owner.email.toLowerCase() === normalizedEmail;
        if (isOwner) {
          results.skipped.push({
            email: normalizedEmail,
            reason: "Cannot invite workspace owner"
          });
          continue;
        }

        // Check if user is already a member
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
          // User exists - add to workspace
          wSpace.members.push(user._id);
          await sendInvitationEmail('WORKSPACE_ADD_EXISTING', emailData);
          
          results.successful.push({
            email: normalizedEmail,
            status: "added",
            userExists: true
          });
        } else {
          // User doesn't exist - send invitation
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

    // Save workspace if members were added
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
    res.status(500).json({ message: "Error fetching workSpaces", err });
  }
};  


exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const workSpaceData = await workSpace.findById(id).populate("owner").populate("members");
    res.status(200).json(workSpaceData);

  } catch (err) {
    res.status(500).json({ message: "Error fetching workSpace", err });
  }
};


exports.Update = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedWorkSpace = await workSpace.findByIdAndUpdate(id, req.body, { new: true }).populate("owner").populate("members");
    res.status(200).json(updatedWorkSpace);

  } catch (err) {
    res.status(500).json({ message: "Error updating workSpace", err });
  }
};


exports.Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedWorkSpace = await workSpace.findByIdAndDelete(id);
    res.status(200).json(deletedWorkSpace);

  } catch (err) {
    res.status(500).json({ message: "Error deleting workSpace", err });
  }
};