export interface User {
  id: string;
  username: string;
  roles: string[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  roles: string[];
}

export interface UpdatePasswordRequest {
  password: string;
}
