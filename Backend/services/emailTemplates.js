const getEmailTemplate = (type, data) => {
  const baseStyles = `
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        margin: 0; 
        padding: 0; 
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        min-height: 100vh;
      }
      .email-container {
        max-width: 650px;
        margin: 40px auto;
        padding: 20px;
      }
      .container { 
        background-color: #ffffff; 
        border-radius: 16px; 
        overflow: hidden; 
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.8);
      }
      .header { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        padding: 40px 30px; 
        text-align: center; 
        position: relative;
      }
      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><polygon points="30,0 60,30 30,60 0,30"/></g></svg>') repeat;
        opacity: 0.3;
      }
      .header h1 { 
        color: white; 
        margin: 0; 
        font-size: 32px; 
        font-weight: 700; 
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
        z-index: 1;
      }
      .header-emoji {
        font-size: 48px;
        display: block;
        margin-bottom: 10px;
        position: relative;
        z-index: 1;
      }
      .content { 
        padding: 50px 40px; 
        background: white;
      }
      .welcome { 
        font-size: 20px; 
        color: #333; 
        margin-bottom: 25px; 
        line-height: 1.6; 
      }
      .welcome-name {
        color: #667eea;
        font-weight: 600;
      }
      .highlight { 
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-left: 5px solid #667eea; 
        padding: 25px; 
        margin: 30px 0; 
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      .highlight strong { 
        color: #667eea; 
        font-size: 18px;
      }
      .feature-list {
        background: #f8f9ff;
        padding: 25px;
        border-radius: 12px;
        margin: 25px 0;
        border: 2px dashed #667eea;
      }
      .feature-list h4 {
        color: #667eea;
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 16px;
        font-weight: 600;
      }
      .feature-list ul {
        margin: 0;
        padding-left: 20px;
        color: #555;
        line-height: 1.8;
      }
      .feature-list li {
        margin-bottom: 8px;
      }
      .btn { 
        display: inline-block; 
        padding: 18px 40px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
        text-decoration: none; 
        border-radius: 50px; 
        font-weight: 700; 
        font-size: 16px;
        margin: 25px 0; 
        transition: all 0.3s ease;
        box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .btn:hover { 
        transform: translateY(-3px); 
        box-shadow: 0 12px 25px rgba(102, 126, 234, 0.4);
      }
      .secondary-btn { 
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        color: #667eea; 
        border: 3px solid #667eea; 
        box-shadow: 0 4px 10px rgba(102, 126, 234, 0.2);
      }
      .secondary-btn:hover {
        background: #667eea;
        color: white;
        transform: translateY(-2px);
      }
      .footer { 
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 30px; 
        text-align: center; 
        color: #666; 
        font-size: 14px; 
        line-height: 1.6;
      }
      .info-grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 20px; 
        margin: 30px 0; 
      }
      .info-item { 
        background: linear-gradient(135deg, #f8f9ff 0%, #e6f2ff 100%);
        padding: 25px; 
        border-radius: 12px; 
        text-align: center;
        border: 2px solid rgba(102, 126, 234, 0.1);
        transition: transform 0.2s ease;
      }
      .info-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(102, 126, 234, 0.1);
      }
      .info-item strong { 
        display: block; 
        color: #667eea; 
        font-size: 18px; 
        margin-bottom: 8px; 
        font-weight: 700;
      }
      .info-item span {
        color: #555;
        font-size: 15px;
        font-weight: 500;
      }
      .action-buttons {
        text-align: center;
        margin: 40px 0;
      }
      .steps-section {
        background: #f8fffe;
        padding: 30px;
        border-radius: 12px;
        margin: 25px 0;
        border-left: 5px solid #46A049;
      }
      .steps-section h4 {
        color: #46A049;
        margin-top: 0;
        font-size: 18px;
        font-weight: 600;
      }
      .step {
        display: flex;
        align-items: center;
        margin: 15px 0;
        padding: 10px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .step-number {
        background: linear-gradient(135deg, #46A049 0%, #52B788 100%);
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 15px;
        flex-shrink: 0;
      }
      .note {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        color: #856404;
        line-height: 1.6;
      }
      .note strong {
        color: #533f03;
      }
      @media (max-width: 600px) {
        .email-container { margin: 20px auto; padding: 10px; }
        .content { padding: 30px 25px; }
        .header { padding: 30px 20px; }
        .header h1 { font-size: 24px; }
        .info-grid { grid-template-columns: 1fr; gap: 15px; }
        .btn { padding: 15px 30px; font-size: 14px; }
      }
    </style>
  `;

  const templates = {
    // Workspace - User already exists
    WORKSPACE_ADD_EXISTING: `
      ${baseStyles}
      <div class="email-container">
        <div class="container">
          <div class="header">
            <span class="header-emoji">🎉</span>
            <h1>Welcome to ${data.workspaceName}!</h1>
          </div>
          <div class="content">
            <p class="welcome">Hi <span class="welcome-name">there</span>!</p>
            <p class="welcome">🚀 <strong>Exciting news!</strong> You've been added to the workspace <strong>${data.workspaceName}</strong> and you're ready to start collaborating immediately!</p>
            
            <div class="highlight">
              <strong>✅ You're all set!</strong> Since you already have an account with FlowBoard, you can jump right into your new workspace and start contributing to amazing projects.
            </div>

            <div class="feature-list">
              <h4>🎯 What you can do in FlowBoard:</h4>
              <ul>
                <li>📋 Create and manage projects</li>
                <li>👥 Collaborate with team members in real-time</li>
                <li>📊 Track project progress with intuitive dashboards</li>
                <li>💬 Communicate through integrated team chat</li>
                <li>📁 Organize tasks and deadlines efficiently</li>
                <li>📱 Access from any device, anywhere</li>
              </ul>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <strong>🏢 Workspace</strong>
                <span>${data.workspaceName}</span>
              </div>
              <div class="info-item">
                <strong>👤 Added by</strong>
                <span>${data.inviterName || 'Team Admin'}</span>
              </div>
            </div>

            <div class="action-buttons">
              <a href="http://localhost:4200/login" class="btn">🚀 Access Workspace Now</a>
            </div>

            <div class="steps-section">
              <h4>🎯 Next Steps:</h4>
              <div class="step">
                <div class="step-number">1</div>
                <div>Log in to your FlowBoard account</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div>Find your new workspace in the dashboard</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div>Start exploring projects and connect with your team</div>
              </div>
            </div>

            <div class="note">
              <strong>💡 Pro Tip:</strong> Make sure to complete your profile and set up notifications to stay updated on important project activities!
            </div>
          </div>
          <div class="footer">
            <p><strong>🌟 Welcome to the FlowBoard family!</strong></p>
            <p>This is an automated message from FlowBoard. If you have any questions, please contact your team administrator or visit our help center.</p>
          </div>
        </div>
      </div>
    `,

    // Workspace - New user invitation
    WORKSPACE_INVITE_NEW: `
      ${baseStyles}
      <div class="email-container">
        <div class="container">
          <div class="header">
            <span class="header-emoji">📧</span>
            <h1>You're Invited to ${data.workspaceName}!</h1>
          </div>
          <div class="content">
            <p class="welcome">Hello <span class="welcome-name">Future Team Member</span>!</p>
            <p class="welcome">🎉 <strong>Congratulations!</strong> You've been invited to join <strong>${data.workspaceName}</strong> on FlowBoard - a cutting-edge collaborative project management platform where teams turn ideas into reality.</p>
            
            <div class="highlight">
              <strong>🚀 What is FlowBoard?</strong> FlowBoard is where productivity meets collaboration. It's a modern workspace designed to help teams organize projects, track progress, and achieve goals together - all in one beautiful, intuitive platform.
            </div>

            <div class="feature-list">
              <h4>✨ Amazing features waiting for you:</h4>
              <ul>
                <li>🎯 <strong>Smart Project Management</strong> - Organize tasks with drag-and-drop simplicity</li>
                <li>👥 <strong>Real-time Collaboration</strong> - Work together seamlessly from anywhere</li>
                <li>📊 <strong>Visual Progress Tracking</strong> - Beautiful dashboards that make sense</li>
                <li>💬 <strong>Integrated Communication</strong> - Stay connected with your team</li>
                <li>📱 <strong>Mobile-First Design</strong> - Work on any device, anytime</li>
                <li>🔒 <strong>Enterprise Security</strong> - Your data is safe and secure</li>
              </ul>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <strong>🏢 Workspace</strong>
                <span>${data.workspaceName}</span>
              </div>
              <div class="info-item">
                <strong>👤 Invited by</strong>
                <span>${data.inviterName || 'Team Admin'}</span>
              </div>
            </div>

            <div class="action-buttons">
              <a href="http://localhost:4200/register?wsId=${data.workspaceId}" class="btn">🎯 Create Account & Join Now</a>
              <br>
              <a href="http://localhost:4200/login" class="secondary-btn">Already have an account? Sign In</a>
            </div>

            <div class="steps-section">
              <h4>🎯 Getting Started is Easy:</h4>
              <div class="step">
                <div class="step-number">1</div>
                <div>Click the button above to create your free account</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div>Verify your email address (this one: ${data.email})</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div>Complete your profile setup</div>
              </div>
              <div class="step">
                <div class="step-number">4</div>
                <div>Start collaborating with your team immediately!</div>
              </div>
            </div>

            <div class="note">
              <strong>🔐 Important:</strong> Make sure to use this email address (<strong>${data.email}</strong>) when creating your account to automatically join the workspace. The invitation is linked to this specific email!
            </div>
          </div>
          <div class="footer">
            <p><strong>🎊 Welcome to FlowBoard - Where Teams Thrive!</strong></p>
            <p>This invitation was sent by <strong>${data.inviterName || 'a team member'}</strong>. If you believe this was sent in error, you can safely ignore this email.</p>
          </div>
        </div>
      </div>
    `,

    // Project - User already exists
    PROJECT_ADD_EXISTING: `
      ${baseStyles}
      <div class="email-container">
        <div class="container">
          <div class="header">
            <span class="header-emoji">🚀</span>
            <h1>Welcome to ${data.projectName}!</h1>
          </div>
          <div class="content">
            <p class="welcome">Hi <span class="welcome-name">Team Member</span>!</p>
            <p class="welcome">🎯 <strong>Fantastic news!</strong> You've been added to the project <strong>${data.projectName}</strong> in the <strong>${data.workspaceName}</strong> workspace, and you're ready to make an impact!</p>
            
            <div class="highlight">
              <strong>🎉 You're ready to contribute!</strong> Your account has been automatically added to both the project and workspace. Time to roll up your sleeves and create something amazing with your team!
            </div>

            <div class="info-grid">
              <div class="info-item">
                <strong>🎯 Project</strong>
                <span>${data.projectName}</span>
              </div>
              <div class="info-item">
                <strong>🏢 Workspace</strong>
                <span>${data.workspaceName}</span>
              </div>
              <div class="info-item">
                <strong>📊 Status</strong>
                <span style="text-transform: capitalize; color: ${data.projectStatus === 'active' ? '#46A049' : data.projectStatus === 'completed' ? '#2196f3' : '#ff9800'};">${data.projectStatus || 'Active'}</span>
              </div>
              <div class="info-item">
                <strong>👤 Added by</strong>
                <span>${data.inviterName || 'Project Lead'}</span>
              </div>
            </div>

            <div class="feature-list">
              <h4>🛠️ What you can do in this project:</h4>
              <ul>
                <li>📋 View and manage project tasks</li>
                <li>👥 Collaborate with project team members</li>
                <li>📈 Track project milestones and deadlines</li>
                <li>💬 Participate in project discussions</li>
                <li>📎 Share files and resources</li>
                <li>🔔 Get notified about important updates</li>
              </ul>
            </div>

            <div class="action-buttons">
              <a href="http://localhost:4200/login" class="btn">🎯 Start Working on Project</a>
            </div>

            <div class="steps-section">
              <h4>🎯 Next Steps:</h4>
              <div class="step">
                <div class="step-number">1</div>
                <div>Log in to your FlowBoard account</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div>Navigate to the project dashboard</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div>Review project details and current tasks</div>
              </div>
              <div class="step">
                <div class="step-number">4</div>
                <div>Start contributing to the project goals</div>
              </div>
            </div>

            <div class="note">
              <strong>💡 Quick Tip:</strong> Check out the project timeline and see what tasks need your expertise. Your team is excited to have you on board!
            </div>
          </div>
          <div class="footer">
            <p><strong>🌟 Let's build something amazing together!</strong></p>
            <p>This is an automated message from FlowBoard. Questions about the project? Reach out to your project administrator or team lead.</p>
          </div>
        </div>
      </div>
    `,

    // Project - New user invitation
    PROJECT_INVITE_NEW: `
      ${baseStyles}
      <div class="email-container">
        <div class="container">
          <div class="header">
            <span class="header-emoji">🎯</span>
            <h1>Project Invitation: ${data.projectName}</h1>
          </div>
          <div class="content">
            <p class="welcome">Hello <span class="welcome-name">Future Team Member</span>!</p>
            <p class="welcome">🚀 <strong>Exciting opportunity ahead!</strong> You've been invited to contribute to <strong>${data.projectName}</strong> on FlowBoard - be part of something great!</p>
            
            <div class="highlight">
              <strong>🎊 Join the team!</strong> You're being invited to work on an exciting project with a dedicated, talented team. This is your chance to make a real impact while using the best project management tools available.
            </div>

            <div class="info-grid">
              <div class="info-item">
                <strong>🎯 Project</strong>
                <span>${data.projectName}</span>
              </div>
              <div class="info-item">
                <strong>🏢 Workspace</strong>
                <span>${data.workspaceName}</span>
              </div>
              <div class="info-item">
                <strong>📊 Status</strong>
                <span style="text-transform: capitalize; color: ${data.projectStatus === 'active' ? '#46A049' : data.projectStatus === 'completed' ? '#2196f3' : '#ff9800'};">${data.projectStatus || 'Active'}</span>
              </div>
              <div class="info-item">
                <strong>👤 Invited by</strong>
                <span>${data.inviterName || 'Project Lead'}</span>
              </div>
            </div>

            <div class="feature-list">
              <h4>🎯 Why you'll love working on FlowBoard:</h4>
              <ul>
                <li>🎨 <strong>Intuitive Interface</strong> - Beautiful design that just makes sense</li>
                <li>⚡ <strong>Lightning Fast</strong> - No waiting around, everything loads instantly</li>
                <li>🔄 <strong>Real-time Sync</strong> - See updates as they happen</li>
                <li>📱 <strong>Work Anywhere</strong> - Mobile-optimized for on-the-go productivity</li>
                <li>🔒 <strong>Secure & Reliable</strong> - Your work is safe and always accessible</li>
                <li>🎯 <strong>Goal-Oriented</strong> - Stay focused on what matters most</li>
              </ul>
            </div>

            <div class="action-buttons">
              <a href="http://localhost:4200/register?projectId=${data.projectId}" class="btn">🚀 Join Project Now</a>
              <br>
              <a href="http://localhost:4200/login" class="secondary-btn">Already have an account? Sign In</a>
            </div>

            <div class="steps-section">
              <h4>🎯 Your Journey Starts Here:</h4>
              <div class="step">
                <div class="step-number">1</div>
                <div>Create your free FlowBoard account</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div>Verify your email (${data.email})</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div>Get automatically added to the project and workspace</div>
              </div>
              <div class="step">
                <div class="step-number">4</div>
                <div>Meet your team and start contributing immediately</div>
              </div>
            </div>

            <div class="note">
              <strong>🔐 Important:</strong> Use this email address (<strong>${data.email}</strong>) when registering to automatically join the project and workspace. The team is waiting for you!
            </div>
          </div>
          <div class="footer">
            <p><strong>🚀 Ready to build something incredible?</strong></p>
            <p>This invitation was sent by <strong>${data.inviterName || 'a project team member'}</strong>. Questions? Feel free to reach out to them or ignore this email if sent in error.</p>
          </div>
        </div>
      </div>
    `
  };

  return templates[type] || templates.WORKSPACE_INVITE_NEW;
};

module.exports = { getEmailTemplate };