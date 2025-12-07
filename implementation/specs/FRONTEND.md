# Frontend Implementation Guidelines

## Overview

AITrace Datasets frontend is a Vue.js single-page application with an Airtable-inspired, data-focused UI. Blue color scheme, light mode only.

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Vue 3 (Composition API) |
| Build Tool | Vite |
| Router | Vue Router |
| State Management | Pinia |
| UI Components | PrimeVue (or similar, reuse existing) |
| Icons | Lucide (or similar, keep consistent) |
| HTTP Client | Axios or fetch |
| Styling | Tailwind CSS |

---

## Design Principles

### Style

- **Airtable-inspired**: Clean, data-focused, spreadsheet-like where appropriate
- **Color scheme**: Blue tones (primary), neutral grays
- **Mode**: Light mode only (for now)
- **Density**: Comfortable spacing, not too cramped

### Consistency

- Reuse existing UI components where possible
- Keep icon set consistent throughout app
- Uniform spacing, typography, and color usage

---

## Layout Structure

### Main Layout

```
┌─────────────────────────────────────────────────────────┐
│  Top Navbar                                             │
│  [Logo] [Breadcrumbs]                    [User Menu ▼]  │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │         Main Content Area                │
│              │                                          │
│  - Datasets  │                                          │
│  - Schemas   │                                          │
│  - Users*    │                                          │
│  - Settings  │                                          │
│              │                                          │
│              │                                          │
│  *Admin only │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Top Navbar

- Logo (left) — "AITrace Datasets" (placeholder for now)
- Breadcrumbs (center/left) — Shows current location
- User menu (right) — Profile, Logout

### Sidebar

- Datasets
- Schemas
- Users (visible to admin only)
- Settings

---

## Routes & URLs

Use descriptive URLs with resource IDs. Even as a SPA, URLs should be bookmarkable and shareable.

### Route Structure

| Route | Page | Description |
|-------|------|-------------|
| `/` | Redirect | → `/datasets` (if logged in) or `/login` |
| `/login` | Login | Login form |
| `/setup` | First User Setup | Create first admin (only if no users exist) |
| `/datasets` | Dataset List | All datasets with pending counts |
| `/datasets/new` | Create Dataset | New dataset form |
| `/datasets/:id` | Dataset Detail | Rows list, queue tab, settings |
| `/datasets/:id/rows/new` | Add Row | Image + form side-by-side |
| `/datasets/:id/rows/:rowId` | Edit Row | Image + form side-by-side |
| `/datasets/:id/queue` | Review Queue | Pending rows for review |
| `/datasets/:id/import` | CSV Import | Upload and map columns |
| `/schemas` | Schema List | All schemas |
| `/schemas/new` | Create Schema | Schema builder |
| `/schemas/:id` | Edit Schema | Schema builder |
| `/users` | User List | Admin only |
| `/users/new` | Add User | Admin only |
| `/settings` | Settings | Profile, change password |

### Route Examples

```
http://localhost:3000/datasets
http://localhost:3000/datasets/abc-123
http://localhost:3000/datasets/abc-123/rows/xyz-789
http://localhost:3000/datasets/abc-123/queue
http://localhost:3000/schemas/def-456
```

---

## Pages

### Authentication

#### Login (`/login`)

- Email + password form
- "Remember me" checkbox
- Error display for invalid credentials
- Redirects to `/datasets` on success

#### First User Setup (`/setup`)

- Only shown when no users exist in system
- Create admin account form (email + password + confirm)
- Brief welcome message
- Redirects to `/datasets` on success

---

### Datasets

#### Dataset List (`/datasets`)

- Table or card view (flexible for FE developer)
- Columns: Name, Schema, Rows count, Pending count, Created, Actions
- Pending count prominently displayed (e.g., badge)
- "New Dataset" button
- Empty state: "Create your first dataset" with quick onboarding tips

#### Create Dataset (`/datasets/new`)

- Form: Name, Description, Select Schema
- Option to create new schema inline or select existing
- Option to copy from existing schema

#### Dataset Detail (`/datasets/:id`)

- Tabs or sections:
  - **Rows** — All rows in table format
  - **Queue** — Pending rows only (dedicated tab)
  - **Settings** — Dataset name, description, danger zone (delete)
- Header shows: Dataset name, pending count badge
- Actions: Add Row, Import CSV, Export CSV

---

### Rows

#### Row List (within Dataset Detail)

- Table view with columns based on schema fields
- Image thumbnail column
- Status column (Pending/Reviewed badge)
- Checkbox column for bulk selection
- Bulk action toolbar (appears when items selected):
  - Mark as Pending
  - Delete
  - Export Selected

#### Add/Edit Row (`/datasets/:id/rows/new`, `/datasets/:id/rows/:rowId`)

- **Layout**: Side-by-side
  - Left (50%): Image preview (prominent)
  - Right (50%): Form fields based on schema
- Image URL input with preview
- Real-time validation
- Save button
- After save: Stay on form, clear for next row (streamlined batch entry)
- "Save & Close" option to return to dataset

#### Review Queue (`/datasets/:id/queue`)

- Dedicated tab/page for reviewing pending rows
- Same side-by-side layout as edit row
- Navigation: Previous/Next pending row
- Counter: "3 of 12 pending"
- Quick workflow for reviewing many rows

---

### Schemas

#### Schema List (`/schemas`)

- Table view: Name, Fields count, Datasets using it, Created, Actions
- "New Schema" button
- Option to copy existing schema

#### Create/Edit Schema (`/schemas/new`, `/schemas/:id`)

- Schema name input
- Field builder:
  - Add field button
  - For each field:
    - Name (text input)
    - Type (dropdown: Boolean, Enum, Text, Numeric)
    - Required (checkbox)
    - Default value (based on type)
    - Type-specific config (e.g., enum options, numeric min/max)
  - Drag to reorder fields
  - Delete field (with warning if schema in use)
- Warning if schema has no required fields

---

### Users (Admin Only)

#### User List (`/users`)

- Table: Email, Role, Created, Actions
- "Add User" button
- Actions: Reset Password, Delete

#### Add User (`/users/new`)

- Form: Email, Role (User/Admin)
- On submit: Show temporary password (one-time display)

---

### Settings (`/settings`)

- **Profile section**
  - Email (read-only)
  - Change password form

---

## Components

### Common Components

| Component | Description |
|-----------|-------------|
| `AppLayout` | Main layout with sidebar + navbar |
| `Sidebar` | Navigation sidebar |
| `Navbar` | Top navigation bar |
| `Breadcrumbs` | Current location breadcrumbs |
| `UserMenu` | Dropdown with profile/logout |
| `DataTable` | Reusable table with sorting, selection |
| `Pagination` | Page navigation |
| `Modal` | Dialog/modal wrapper |
| `ConfirmDialog` | Styled confirmation modal for destructive actions |
| `Toast` | Notification toasts |
| `EmptyState` | Empty state with icon, message, action button |
| `Badge` | Status badges (Pending, Reviewed) |
| `FormField` | Form field wrapper with label, error |
| `BulkActionToolbar` | Toolbar for bulk actions on selected items |

### Schema Field Components

| Component | Description |
|-----------|-------------|
| `BooleanField` | Checkbox or toggle |
| `EnumField` | Dropdown select |
| `TextField` | Text input or textarea (multiline) |
| `NumericField` | Number input |

---

## State Management

Use Pinia stores for:

| Store | Purpose |
|-------|---------|
| `authStore` | Current user, login/logout |
| `datasetStore` | Datasets list, current dataset |
| `schemaStore` | Schemas list |
| `userStore` | Users list (admin) |
| `uiStore` | Sidebar state, toasts, loading states |

---

## UX Patterns

### Loading States

- Use skeleton loaders for initial page loads
- Use spinners for actions (save, delete)
- Disable buttons while loading

### Notifications (Toasts)

- Success: "Dataset created", "Row saved"
- Error: "Failed to save. Please try again."
- Position: Top-right
- Auto-dismiss after 5 seconds

### Confirmation Dialogs

- Styled modal (not browser confirm)
- For destructive actions: Delete dataset, Delete user, Delete rows
- Clear message: "Are you sure you want to delete [name]? This cannot be undone."

### Empty States

- Friendly illustration or icon
- Clear message: "No datasets yet"
- Action button: "Create your first dataset"
- Optional: Quick tips for getting started

### Form Validation

- Real-time validation as user types
- Error messages below fields
- Disable submit until valid

---

## Folder Structure

```
frontend/
├── src/
│   ├── assets/              # Images, fonts
│   ├── components/          # Reusable components
│   │   ├── common/          # Generic (Button, Modal, Table)
│   │   ├── layout/          # AppLayout, Sidebar, Navbar
│   │   ├── forms/           # Form components
│   │   └── schema-fields/   # BooleanField, EnumField, etc.
│   ├── composables/         # Vue composables (useAuth, useToast)
│   ├── pages/               # Page components
│   │   ├── auth/            # Login, Setup
│   │   ├── datasets/        # Dataset pages
│   │   ├── schemas/         # Schema pages
│   │   ├── users/           # User pages
│   │   └── settings/        # Settings pages
│   ├── router/              # Vue Router config
│   ├── stores/              # Pinia stores
│   ├── services/            # API client services
│   ├── types/               # TypeScript types
│   ├── utils/               # Helper functions
│   ├── App.vue              # Root component
│   ├── main.ts              # Entry point
│   └── ee/                  # Enterprise features (Proprietary)
│       ├── multi-team/
│       ├── invites/
│       └── billing/
├── tests/                   # Frontend tests
├── public/                  # Static assets
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## EE Folder (Future)

Enterprise features will live in `src/ee/`. Same rules as backend:

- Core code must never import from `ee/`
- EE code can import from core
- Feature flag controlled

---

## API Integration

### API Client

```typescript
// src/services/api.ts
const API_BASE = '/api/v1'

export const api = {
  get: (url: string) => fetch(`${API_BASE}${url}`),
  post: (url: string, data: any) => fetch(`${API_BASE}${url}`, { method: 'POST', body: JSON.stringify(data) }),
  // ...
}
```

### Service Examples

```typescript
// src/services/datasetService.ts
export const datasetService = {
  list: (page = 1, pageSize = 20) => api.get(`/datasets?page=${page}&page_size=${pageSize}`),
  get: (id: string) => api.get(`/datasets/${id}`),
  create: (data: CreateDatasetRequest) => api.post('/datasets', data),
  delete: (id: string) => api.delete(`/datasets/${id}`),
}
```

---

## Responsive Behavior

Basic responsive support (works on smaller screens, not fully optimized):

- Sidebar collapses to hamburger menu on small screens
- Tables scroll horizontally on small screens
- Forms stack vertically on small screens

---

## Color Reference

| Usage | Color |
|-------|-------|
| Primary | Blue (`#2563EB` or similar) |
| Primary hover | Darker blue |
| Success | Green |
| Warning | Yellow/Orange |
| Error | Red |
| Background | White / Light gray |
| Text | Dark gray / Black |
| Border | Light gray |

---

## Quick Reference

| Topic | Decision |
|-------|----------|
| Framework | Vue 3 + Composition API |
| Styling | Tailwind CSS |
| Components | PrimeVue (or similar) |
| Icons | Lucide (or similar, consistent) |
| State | Pinia |
| Routing | Vue Router with descriptive URLs |
| Mode | Light only |
| Style | Airtable-inspired, data-focused |
| Colors | Blue tones |
| Mobile | Basic responsive |
```
