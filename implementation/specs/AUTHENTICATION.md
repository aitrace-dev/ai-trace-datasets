Got it! Here's the full spec:

---

## Feature: Login / Authentication

### Overview

Simple email + password authentication for the open source version. Single team auto-created on first install. First user becomes Admin and invites others. Code structured to support future EE features (multi-team, invite links, quotas).

---

### Entities

#### User

| Field          | Type     | Constraints                     |
|----------------|----------|---------------------------------|
| id             | uuid     | primary key                     |
| email          | string   | required, unique, lowercase     |
| password_hash  | string   | bcrypt                          |
| role           | enum     | `admin`, `user`                 |
| team_id        | uuid     | foreign key                     |
| must_reset_pwd | boolean  | default: true (for new users)   |
| created_at     | datetime |                                 |
| updated_at     | datetime |                                 |

#### Team

| Field      | Type     | Constraints          |
|------------|----------|----------------------|
| id         | uuid     | primary key          |
| name       | string   | required             |
| created_at | datetime |                      |

#### Session

| Field       | Type     | Constraints             |
|-------------|----------|-------------------------|
| id          | uuid     | primary key             |
| user_id     | uuid     | foreign key             |
| token       | string   | unique, secure random   |
| expires_at  | datetime |                         |
| remember_me | boolean  | affects expiration      |
| created_at  | datetime |                         |

---

### Password Rules

| Rule            | Requirement          |
|-----------------|----------------------|
| Min length      | 8 characters         |
| Max length      | 128 characters       |
| Hashing         | bcrypt               |

---

### Session Rules

| Scenario        | Duration   |
|-----------------|------------|
| Remember me     | 7 days     |
| No remember me  | 24 hours   |

- Multiple devices allowed
- Session token stored in HTTP-only cookie

---

### Roles & Permissions

| Role  | Can do                                           |
|-------|--------------------------------------------------|
| User  | CRUD schemas, datasets, rows                     |
| Admin | All User permissions + manage users, add admins  |

---

### User Flows

#### 1. First Install (Bootstrap)

1. App starts, detects no team exists
2. Show registration screen: "Create Admin Account"
3. User enters email + password
4. System creates:
   - Team (default name, e.g., "My Team")
   - User with role = `admin`, `must_reset_pwd = false`
5. User is logged in, redirected to dashboard

#### 2. Admin Adds User

1. Admin navigates to Settings → Users → "Add User"
2. Admin enters:
   - Email
   - Role (User or Admin)
3. System generates temporary password
4. System creates user with `must_reset_pwd = true`
5. Admin sees temporary password (one-time display) to share with new user

#### 3. Login

1. User navigates to `/login`
2. User enters email + password
3. Optional: check "Remember me"
4. System validates credentials
5. If valid:
   - Create session (7 days if remember me, else 24 hours)
   - Set HTTP-only cookie
   - If `must_reset_pwd = true` → redirect to password reset screen
   - Else → redirect to dashboard
6. If invalid:
   - Show error "Invalid email or password"
   - No indication of which field is wrong (security)

#### 4. First Login (New User)

1. User logs in with temporary password
2. System detects `must_reset_pwd = true`
3. Redirect to "Set New Password" screen
4. User enters new password + confirm
5. System updates password, sets `must_reset_pwd = false`
6. Redirect to dashboard

#### 5. Logout

1. User clicks "Logout"
2. System deletes session
3. Clear cookie
4. Redirect to `/login`

#### 6. Admin Resets User Password

1. Admin navigates to Settings → Users
2. Admin clicks "Reset Password" on a user
3. System generates new temporary password
4. System sets `must_reset_pwd = true`
5. Admin sees temporary password (one-time display) to share with user

#### 7. Delete User

1. Admin navigates to Settings → Users
2. Admin clicks "Delete" on a user
3. Confirmation dialog: "This will remove the user. Their data (rows, etc.) will be preserved."
4. System:
   - Sets `created_by` / `updated_by` to `null` on all related records
   - Deletes all user sessions
   - Deletes user record

**Restriction:** Cannot delete yourself. Cannot delete if you're the last admin.

---

### Validation Rules

| Rule                        | Error message                              |
|-----------------------------|--------------------------------------------|
| Email format invalid        | "Please enter a valid email"               |
| Email already exists        | "A user with this email already exists"    |
| Password too short          | "Password must be at least 8 characters"   |
| Password mismatch (confirm) | "Passwords do not match"                   |
| Invalid credentials         | "Invalid email or password"                |
| Cannot delete last admin    | "Cannot delete the last admin"             |
| Cannot delete yourself      | "Cannot delete your own account"           |

---

### API Endpoints (Suggested)

| Method | Endpoint              | Description              | Auth     |
|--------|-----------------------|--------------------------|----------|
| POST   | `/api/auth/login`     | Login                    | Public   |
| POST   | `/api/auth/logout`    | Logout                   | Required |
| GET    | `/api/auth/me`        | Get current user         | Required |
| PUT    | `/api/auth/password`  | Change own password      | Required |
| GET    | `/api/users`          | List users               | Admin    |
| POST   | `/api/users`          | Create user              | Admin    |
| PUT    | `/api/users/:id`      | Update user role         | Admin    |
| DELETE | `/api/users/:id`      | Delete user              | Admin    |
| POST   | `/api/users/:id/reset-password` | Reset user password | Admin |

---

### Security Considerations

| Item                     | Implementation                              |
|--------------------------|---------------------------------------------|
| Password storage         | bcrypt with cost factor 10+                 |
| Session token            | Secure random (256-bit)                     |
| Cookie                   | HTTP-only, Secure (HTTPS), SameSite=Strict  |
| Brute force protection   | Future: rate limiting on login endpoint     |
| Timing attacks           | Use constant-time comparison for passwords  |

---

### Open Questions / Future (EE)

| Feature                  | Notes                                       |
|--------------------------|---------------------------------------------|
| Multi-team               | User can belong to multiple teams           |
| Invite links             | Shareable link with expiration              |
| Quotas                   | Limit users per team based on plan          |
| Email verification       | Required before accessing app               |
| Social login             | Google, GitHub OAuth                        |
| 2FA                      | TOTP-based                                  |

---

Does this look good? Anything to adjust or add?