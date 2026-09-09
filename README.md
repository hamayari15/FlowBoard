# Flowboard

Flowboard is a fully responsive task tracking web application that lets teams organize their work into workspaces, projects, and Kanban-style boards — complete with team collaboration and per-workspace analytics.

## 🖼️ Preview

Here's what Flowboard looks like in action, from workspace overview to board management.

![Home Page](docs/screenshots/Home.png)

![About Page](docs/screenshots/About.png)

![Privacy Page](docs/screenshots/Privacy.png)

<table>
  <tr>
    <td><img src="docs/screenshots/Register.png" width="750"></td>
    <td><img src="docs/screenshots/Login.png" width="750"></td>
  </tr>
</table>

![Workspaces Page](docs/screenshots/Workspaces.png)

![AddWorkspace Dialog](docs/screenshots/AddWorkspaceDialog.png)

![Workspaces Page](docs/screenshots/WorkspaceStats1.png)

![Workspaces Page](docs/screenshots/WorkspaceStats2.png)

![InviteViaEmailDialog Page](docs/screenshots/InviteViaEmailDialog.png)

![WorkspaceDetails Page](docs/screenshots/WorkspaceDetails.png)

![EditProject Dialog](docs/screenshots/EditProjectDialog.png)

<table>
  <tr>
    <td><img src="docs/screenshots/ArchiveProjectAlert.png" width="750"></td>
    <td><img src="docs/screenshots/DeleteProjectAlert.png" width="750"></td>
  </tr>
</table>

![ProjectDetails Page](docs/screenshots/ProjectDetails.png)

![AddSprintDialog Page](docs/screenshots/AddSprintDialog.png)

![BoardView Page](docs/screenshots/BoardView.png)

<table>
  <tr>
    <td><img src="docs/screenshots/TaskDetailsDialog.png" width="750"></td>
    <td><img src="docs/screenshots/EditCommentDialog.png" width="750"></td>
  </tr>
</table>

<table>
  <tr>
    <td><img src="docs/screenshots/HomeMobile.png" width="220px"></td>
    <td><img src="docs/screenshots/AboutMobile.png" width="220px"></td>
    <td><img src="docs/screenshots/WorskspacesMobile.png" width="220px"></td>
    <td><img src="docs/screenshots/WorkspaceDetailsMobile.png" width="220px"></td>
  </tr>
</table>

## 🛠️ Tech Stack
 
**Frontend**
- Angular 16
- Angular Material (UI components)
- Angular CDK Drag & Drop (moving tasks between columns on the board view)
- Angular Reactive Forms
- Chart.js / ng2-charts (workspace analytics)
- SweetAlert2 (alerts and confirmations)
**Backend**
- Node.js 18 (Express.js)
- MongoDB with Mongoose
- JWT (authentication)
- bcrypt (password hashing)
- Nodemailer (workspace and project invitation emails)
- dotenv (environment variable management)
  
## ✨ Features
 
### Public Pages
- Home page
- About page
- Privacy policy page
- Footer
### Authentication
- User registration
- User login (JWT-based)
- Protected routes via route guard
### Workspaces
- Create, view, and manage workspaces
- Workspace list with search and navigation
- Per-workspace statistics dashboard (charts, activity overview)
### Projects
- Create and manage projects within a workspace
- Project details view
### Boards
- Kanban-style board view per project
- Drag-and-drop tasks between columns
- Task creation, editing, and status tracking
- 
## 🚀 Getting Started
 
### Requirements
- Node.js 18+
- MongoDB (local instance or a cloud database like MongoDB Atlas)
- npm
  
### 1. Clone the repository
 
```bash
git clone https://github.com/hamayari15/FlowBoard.git
cd FlowBoard
```
 
### 2. Backend setup
 
```bash
cd backend
npm install
```
 
### 3. Environment variables
 
Create a `.env` file inside the `backend` folder with the following variables:
 
```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
 
SMPT_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_email_app_password
```
 
### 4. Start the backend server
 
```bash
node server.js
```
 
The API will be available at `http://localhost:3000`.
 
### 5. Frontend setup
 
In a new terminal:
 
```bash
cd frontend
npm install
ng serve
```
 
The app will be available at `http://localhost:4200`.
 
### 📁 Project Structure
 
```
flowboard/
├── backend/
│   ├── db/              # database connection logic
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── server.js
│   └── .env                  # not tracked in git
│
└── frontend/
    └── src/
        └── app/
            ├── features/
            │   ├── home/
            │   ├── about/
            │   ├── privacy/
            │   ├── page-not-found/
            │   ├── navbar/
            │   ├── footer/
            │   ├── auth/
            │   │   ├── register/
            │   │   └── login/
            │   ├── work-spaces-list/
            │   ├── work-space-details/
            │   ├── work-space-dialog/
            │   ├── work-space-stats/
            │   ├── workspace-invite-dialog/
            │   ├── project-details/
            │   ├── project-dialog/
            │   ├── project-invite-dialog/
            │   ├── board-view/
            │   ├── board-dialog/
            │   ├── task-dialog/
            │   ├── task-detail-dialog/
            │   └── edit-comment-dialog/
            │
            ├── core/
            │   ├── guards/
            │   │   └── user.guard.ts
            │   └── services/
            │
            ├── app-routing.module.ts
            └── app.module.ts

## 🗂️ Class Diagram
