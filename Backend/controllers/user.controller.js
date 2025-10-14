const User = require("../models/User");

const workSpace = require("../models/Workspace");
const Project = require("../models/Project");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


exports.register = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password, wsId, projectId } = req.body;
    
    // Validation checks
    if (!firstName || !lastName || !userName || !email || !password) {
      return res.status(400).json({ 
        message: "All fields are required: firstName, lastName, userName, email, and password" 
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Validate username length
    if (userName.length < 3 || userName.length > 30) {
      return res.status(400).json({ message: "Username must be between 3 and 30 characters" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const existingUserByUsername = await User.findOne({ userName: userName });
    if (existingUserByUsername) {
      return res.status(409).json({ message: "This username is already taken" });
    }
    
    const usr = new User({
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      userName: userName.trim(), 
      email: email.toLowerCase().trim(), 
      password
    });

    const salt = await bcrypt.genSalt(10);
    const cryptedPassword = await bcrypt.hash(usr.password, salt);
    usr.password = cryptedPassword;
    
    const registredUser = await usr.save();

    // Handle workspace invitation
    if (wsId) {
      const workspace = await workSpace.findById(wsId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found. Please check your invitation link." });
      }
      
      // Check if user is already a member
      if (!workspace.members.includes(registredUser._id)) {
        workspace.members.push(registredUser._id);
        await workspace.save();
      }
    }

    // Handle project invitation
    if (projectId) {
      const project = await Project.findById(projectId).populate('workspace');
      if (!project) {
        return res.status(404).json({ message: "Project not found. Please check your invitation link." });
      }

      // Add to project members
      if (!project.members.includes(registredUser._id)) {
        project.members.push(registredUser._id);
        await project.save();
      }
      
      // Add to workspace members
      if (project.workspace) {
        const workspace = await workSpace.findById(project.workspace._id);
        if (workspace && !workspace.members.includes(registredUser._id)) {
          workspace.members.push(registredUser._id);
          await workspace.save();
        }
      }
    }
    
    // Return user without password
    const userResponse = {
      _id: registredUser._id,
      firstName: registredUser.firstName,
      lastName: registredUser.lastName,
      userName: registredUser.userName,
      email: registredUser.email,
      createdAt: registredUser.createdAt
    };

    res.status(201).json({ 
      message: "Registration successful! You can now log in.",
      user: userResponse 
    });

  } catch (err) {
    console.error("Registration error:", err);
    
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'email' 
        ? "An account with this email already exists" 
        : "This username is already taken";
      return res.status(409).json({ message });
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }

    // Handle invalid ObjectId errors
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Invalid workspace or project ID" });
    }

    // Generic error
    res.status(500).json({ 
      message: "Registration failed. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation checks
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if account is active
    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact support." });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ message: "Server configuration error. Please contact support." });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token
    const payload = { 
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(200).json({ 
      myToken: token,
      message: "Login successful"
    });

  } catch (err) {
    console.error("Login error:", err);
    
    // Handle specific errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(500).json({ message: "Token generation failed. Please try again." });
    }

    // Generic error
    res.status(500).json({ 
      message: "Login failed. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};
