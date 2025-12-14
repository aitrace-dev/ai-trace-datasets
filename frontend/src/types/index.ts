// Common types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// User types
export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  role: UserRole
  team_id: string
  must_reset_pwd: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

export interface LoginResponse {
  user: User
  must_reset_pwd: boolean
}

// Schema types
export type FieldType = 'boolean' | 'enum' | 'text' | 'numeric'

export interface FieldConfig {
  options?: string[]
  max_length?: number
  multiline?: boolean
  decimal?: boolean
  min?: number
  max?: number
}

export interface SchemaField {
  id: string
  schema_id: string
  name: string
  type: FieldType
  required: boolean
  default_value?: string | null
  position: number
  config: FieldConfig
  created_at: string
  updated_at: string
}

export interface Schema {
  id: string
  name: string
  description?: string | null
  team_id: string
  created_by?: string | null
  created_at: string
  updated_by?: string | null
  updated_at: string
  fields: SchemaField[]
}

export interface CreateSchemaRequest {
  name: string
  description?: string | null
  fields: Omit<SchemaField, 'id' | 'schema_id' | 'created_at' | 'updated_at'>[]
  copy_from_schema_id?: string | null
}

export type SchemaResponse = Schema

// Dataset types
export interface Dataset {
  id: string
  name: string
  description?: string | null
  schema_id: string
  team_id: string
  created_by?: string | null
  created_at: string
  updated_by?: string | null
  updated_at: string
  rows_count: number
  pending_count: number
}

export interface CreateDatasetRequest {
  name: string
  description?: string | null
  schema_id: string
}

// Row types
export type RowStatus = 'pending' | 'reviewed'

export interface DatasetRow {
  id: string
  dataset_id: string
  image_url: string
  image_hash: string
  data: Record<string, any>
  status: RowStatus
  created_by?: string | null
  created_by_email?: string | null
  created_at: string
  updated_by?: string | null
  updated_by_email?: string | null
  updated_at: string
}

export interface CreateRowRequest {
  image_url: string
  data: Record<string, any>
}

export interface CSVImportRequest {
  file_content: string
  column_mapping: Record<string, string>
  mark_all_pending?: boolean
}

export interface CSVImportResponse {
  imported: number
  skipped_duplicates: number
  skipped_invalid: number
  errors: string[]
}
