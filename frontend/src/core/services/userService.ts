import { ENDPOINTS } from '@/config';
import { authHeaders } from '@/core/utils/auth';
import { User, CreateUserRequest, UpdatePasswordRequest } from '@/core/types/user';

/**
 * Service for managing users in the admin panel
 */
export const userService = {
  /**
   * Get a list of all users
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${ENDPOINTS.ADMIN_USERS}`, {
        method: 'GET',
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${ENDPOINTS.ADMIN_USERS}`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update a user's password
   */
  async updateUserPassword(userId: string, passwordData: UpdatePasswordRequest): Promise<void> {
    try {
      const response = await fetch(`${ENDPOINTS.ADMIN_USERS}/${userId}/password`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update password: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error updating password for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${ENDPOINTS.ADMIN_USERS}/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },
};
