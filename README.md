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
* **Body**: `{ email: "invitee@example.com", projectId?: "..." }`.
* **Flow**:

  1. Check if user with that email exists in `User` collection.
  2. If exists:

     * Add their `_id` to workspace’s `members`.
     * If `projectId` present, also add to that project’s `members`.
     * Send email: “You were added to workspace X” with a link to log in.
  3. If not exists:

     * Don’t add anything yet.
     * Send email: “You’ve been invited to workspace X — sign up with this email to join.”
     * When they later register, system checks pending invites (see below).

---

### 2. `POST /api/projects/:id/invite`

* Same as above, but scoped to a project.

---

### 3. `POST /api/auth/signup`

* Normal signup endpoint.
* After creating a new user:

  * Search for any workspace or project where `members` already contains their email (if you stored it temporarily), **OR**
  * Simpler: when you invited them, you didn’t add them yet → now on signup check if their email matches any "pending invites". Since we’re not making a separate `Invitation` model, you can:

    * Either store emails temporarily in a simple “pendingInvites” array in workspace/project,
    * Or re-send invite after they register.
* Add the new user’s `_id` to `members`.

---

### 4. (Optional) `GET /api/workspaces/:id/members`

* Returns list of users in the workspace (to display in frontend).

---

## 📌 Step 3 — Frontend integration (Angular)

1. In **Workspace settings page**, have an input where the owner types an email and clicks **Invite**.
2. Call `POST /api/workspaces/:id/invite`.
3. Show success/failure message (e.g. “Invitation sent” or “User already member”).
4. If the invitee already had an account, they’ll log in and immediately see the workspace.
5. If not, when they click the signup link in the email → they register with that email → backend adds them to workspace.

---

## 📌 Step 4 — Email contents (via Nodemailer)

Two templates are enough:

1. **Existing user**:

   * Subject: “You’ve been added to Workspace X”
   * Body: “Log in at \[APP\_URL]/login to start working.”

2. **New user**:

   * Subject: “Invitation to Workspace X”
   * Body: “Sign up at \[APP\_URL]/signup?email=[invitee@example.com](mailto:invitee@example.com) to join.”

---

## 📌 Step 5 — Edge cases

1. **Already a member** → backend returns error (don’t send invite again).
2. **Invited email not registered** → they must use same email at signup.
3. **Wrong email at signup** → they won’t be added until they register with invited email.
4. **Owner removes a member** → just remove their `_id` from `members`.
5. **Re-invite** → if they never signed up, owner can resend invite email.

---

## 📌 Step 6 — Flow summary

1. Owner clicks “Invite”, enters email.
2. Backend checks:

   * User exists → add ID → send “added” email.
   * User not exist → send “signup” email.
3. If new user signs up → backend checks if their email matches any pending invite → auto-add them to workspace/project.
4. On frontend, they log in → workspace/projects load → they see membership.