# Invite members integration steps :

## 📌 Step 1 — Setup Nodemailer

1. Install:

   ```bash
   npm install nodemailer
   ```
2. Configure with your email provider (Gmail, Outlook, custom SMTP, or a service like SendGrid).
   Example config you’ll keep in `.env`:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   APP_URL=http://localhost:4200  # frontend
   ```

---

## 📌 Step 2 — Endpoints you need

### 1. `POST /api/workspaces/:id/invite`

* **Who can call**: Workspace owner.
* **Body**: `{ email: "invitee@example.com"}`.
* **Flow**:

  1. Check if user with that email exists in `User` collection.
  2. If exists:

     * Add their `_id` to workspace’s `members`.
     * Send email: “You were added to workspace X” with a link to log in.
  3. If not exists:

     * Don’t add anything yet.
     * Send email: “You’ve been invited to workspace X — sign up with this email to join.”
     * When they later register, system checks pending invites (see below).

---

### 2. `POST /api/projects/:id/invite`

* Same as above, but scoped to a project.

---

### 3. update `POST /register`

if in the request body there is a variable that holds the workspace_id :
   - after the user is created add the user_id to the members list of that workspace
if in the request body there is a variable that holds the project_id :
   - after the user is created add the user_id to the members list of that project and to the members of the workspace that the project belongs to 
---

### 4. `GET /api/workspaces/:id/members`

* Returns list of users in the workspace (to display in frontend).

---

## 📌 Step 3 — Frontend integration (Angular)

1. In **Workspace page**, have an input where the owner types an email and clicks **Invite**.
2. Call `POST /api/workspaces/:id/invite`.
3. Show success/failure message (e.g. “Invitation sent” or “User already member”).
4. If the invitee already had an account, they’ll log in and immediately see the workspace.
5. If not, when they click the signup link in the email → they register with that email → backend adds them to workspace.

## same logic for the projects page