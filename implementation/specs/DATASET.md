# Dataset & Schema Management

### Overview

Users can create datasets to store structured data. Each dataset uses a schema that defines its fields. Schemas can be created from scratch or copied from existing ones for reuse.

---

### Entities

#### Schema

| Field       | Type     | Constraints                              |
|-------------|----------|------------------------------------------|
| id          | uuid     | primary key                              |
| name        | string   | required, unique per team, max 100 chars |
| description | string   | optional, max 500 chars                  |
| fields      | Field[]  | min: 0                                   |
| team_id     | uuid     | foreign key                              |
| created_by  | uuid     | foreign key (user)                       |
| created_at  | datetime |                                          |
| updated_by  | uuid     | foreign key (user)                       |
| updated_at  | datetime |                                          |

#### Field

| Field         | Type                              | Constraints                                         |
|---------------|-----------------------------------|-----------------------------------------------------|
| id            | uuid                              | primary key                                         |
| schema_id     | uuid                              | foreign key                                         |
| name          | string                            | required, alphanumeric + spaces, unique within schema |
| type          | enum                              | boolean, enum, text, numeric                        |
| required      | boolean                           | default: false                                      |
| default_value | varies by type                    | optional                                            |
| position      | integer                           | for ordering                                        |
| config        | json                              | type-specific (see below)                           |

**Type-specific config:**

| Type    | Config                                      |
|---------|---------------------------------------------|
| boolean | —                                           |
| enum    | `options: string[]`                         |
| text    | `max_length: int` (default 5000), `multiline: bool` |
| numeric | `decimal: bool`, `min?: number`, `max?: number` |

#### Enum Option

| Field    | Type   | Constraints                |
|----------|--------|----------------------------|
| id       | uuid   | primary key                |
| field_id | uuid   | foreign key                |
| value    | string | required, unique per field |

> **Deletion rule:** Cannot delete an enum option if any dataset row references it.

#### Dataset

| Field       | Type     | Constraints                              |
|-------------|----------|------------------------------------------|
| id          | uuid     | primary key                              |
| name        | string   | required, unique per team, max 100 chars |
| description | string   | optional, max 500 chars                  |
| schema_id   | uuid     | foreign key                              |
| team_id     | uuid     | foreign key                              |
| created_by  | uuid     | foreign key (user)                       |
| created_at  | datetime |                                          |
| updated_by  | uuid     | foreign key (user)                       |
| updated_at  | datetime |                                          |

#### Dataset Row

| Field       | Type     | Constraints          |
|-------------|----------|----------------------|
| id          | uuid     | primary key          |
| dataset_id  | uuid     | foreign key          |
| image_url   | string   | required             |
| data        | json     | field values by field_id |
| created_by  | uuid     | foreign key (user)   |
| created_at  | datetime |                      |
| updated_by  | uuid     | foreign key (user)   |
| updated_at  | datetime |                      |

---

### Permissions

| Role   | Can do                                      |
|--------|---------------------------------------------|
| User   | CRUD schemas, datasets, rows within team    |
| Admin  | All user permissions + manage team users    |

All schemas and datasets are visible to the entire team (public within team).

---

### User Flows

#### Create Schema

1. User clicks "New Schema"
2. Options:
   - **Start from scratch** — empty schema
   - **Copy from existing** — select an existing schema to duplicate
3. User names the schema, adds/edits fields
4. Save

#### Create Dataset

1. User clicks "New Dataset"
2. User provides name, description
3. User selects an existing schema (required)
4. Save

---

### Validation Rules

| Entity       | Rule                                                        |
|--------------|-------------------------------------------------------------|
| Schema name  | Unique per team                                             |
| Dataset name | Unique per team                                             |
| Field name   | Alphanumeric + spaces only, unique within schema            |
| Enum option  | Cannot delete if referenced by any row                      |
| image_url    | Required on every dataset row                               |

---
Perfect, I have everything I need. Here's the full spec:

---

# Feature: Add Row to Dataset

### Overview

Users can add rows to a dataset either individually via a form or in bulk via CSV upload. Each row represents one image with associated field values defined by the dataset's schema. Rows have a status (pending/reviewed) that drives a review queue workflow.

---

### Entities

#### Dataset Row

| Field        | Type     | Constraints                        |
|--------------|----------|------------------------------------|
| id           | uuid     | primary key                        |
| dataset_id   | uuid     | foreign key                        |
| image_url    | string   | required                           |
| image_hash   | string   | md5 of image content, unique per dataset |
| data         | json     | field values keyed by field_id     |
| status       | enum     | `pending`, `reviewed`              |
| created_by   | uuid     | foreign key (user)                 |
| created_at   | datetime |                                    |
| updated_by   | uuid     | foreign key (user)                 |
| updated_at   | datetime |                                    |

---

### Status Logic

| Status   | Condition                                      |
|----------|------------------------------------------------|
| Pending  | One or more required fields are empty          |
| Reviewed | All required fields are filled                 |

**Behavior:**

- Status is **auto-calculated** on row create/update based on required field completeness
- Status can be **manually set to pending** (e.g., to flag for re-review)
- Schema changes (new required fields) **do not** retroactively change existing row statuses

**Edge case:** If schema has zero required fields, all rows are immediately "reviewed" — display a warning to user when this occurs.

---

### Image Handling

| Rule              | Detail                                              |
|-------------------|-----------------------------------------------------|
| Source            | User provides external URL                          |
| Validation        | Quick check that image is not corrupted (Python)    |
| Deduplication     | md5 hash of image content; reject if hash exists in same dataset |
| One image per row | Always exactly one                                  |

---

### User Flows

#### 1. Add Single Row (Form)

**Layout:** Side-by-side — image preview (50%) | form fields (50%)

**Steps:**

1. User navigates to dataset → clicks "Add Row"
2. User enters image URL
3. System fetches image, displays preview, computes md5 hash
4. If duplicate hash → show error, block save
5. If image corrupted → show error, block save
6. User fills in field values (real-time validation)
7. User clicks "Save"
8. Row is saved with auto-calculated status
9. Form clears and stays open for next row (streamlined batch entry)

**Validation:**

- Real-time: field type validation as user types
- On submit: required field check, duplicate check, image check

#### 2. Bulk Upload (CSV)

**Steps:**

1. User navigates to dataset → clicks "Import CSV"
2. User uploads CSV file
3. System parses CSV, shows column mapping UI
4. User maps CSV columns to schema fields (flexible mapping)
5. User confirms import
6. System processes rows:
   - Fetches each image, computes hash
   - Skips duplicates (same hash already in dataset)
   - Skips corrupted images
   - Saves valid rows
7. System shows summary:
   - X rows imported
   - Y duplicates skipped
   - Z corrupted/invalid skipped

**Default status on import:**

- If all required fields present → `reviewed`
- Otherwise → `pending`

---

### Queue / Review Workflow

**Queue scope:** Per dataset

**Access:** Dedicated "Review Queue" tab on dataset page

**Queue behavior:**

1. Shows all rows with status = `pending`
2. User clicks into a row → opens row detail (side-by-side layout)
3. User fills/updates fields
4. On save, status auto-updates if all required fields filled
5. Returns to queue or next pending row

**Queue visibility:**

| Location            | Display                          |
|---------------------|----------------------------------|
| Dataset list        | "Dataset A — 12 pending"         |
| Dataset detail page | Header shows pending count       |
| Review Queue tab    | List of pending rows             |

---

### Bulk Actions

**Selection:**

- Checkboxes on each row
- "Select All" option (selects all in current view/filter)

**Available bulk actions:**

| Action           | Description                                |
|------------------|--------------------------------------------|
| Mark as Pending  | Set selected rows' status to `pending`     |
| Delete           | Hard delete selected rows                  |
| Export CSV       | Download selected rows (or all) as CSV     |

---

### Export

**Trigger:** Bulk action or "Export Dataset" button

**Output:** CSV file containing:

- `image_url`
- `status`
- All schema field columns
- `created_by`, `created_at`, `updated_by`, `updated_at`

---

### Permissions

| Role  | Can do                              |
|-------|-------------------------------------|
| User  | Add, edit, delete rows within team  |
| Admin | Same + manage team users            |

---

### Validation Rules Summary

| Rule                     | When                     | Error message                        |
|--------------------------|--------------------------|--------------------------------------|
| Image URL required       | Create/edit              | "Image URL is required"              |
| Image corrupted          | Create/edit              | "Image could not be loaded"          |
| Duplicate image          | Create/edit              | "This image already exists in the dataset" |
| Field type mismatch      | Real-time + submit       | "Invalid value for [field name]"     |
| Required field missing   | Submit (if not draft)    | "Field [name] is required"           |

---

### Warnings

| Condition                        | Warning message                                         |
|----------------------------------|---------------------------------------------------------|
| Schema has no required fields    | "This schema has no required fields. All rows will be marked as reviewed automatically." |

---

### Open Questions / Future Considerations

1. **Image caching** — Do we cache/proxy images or always fetch from source URL?
2. **Broken images later** — If an external image URL stops working after row creation, how do we handle it?
3. **Queue ordering** — Any specific sort order for queue? (oldest first, newest first, random?)
