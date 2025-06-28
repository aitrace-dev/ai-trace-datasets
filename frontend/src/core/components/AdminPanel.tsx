import React, { useState, useEffect } from "react";
import { isUserAdmin } from "@/core/utils/auth";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { useToast } from "@/core/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/core/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { userService } from "@/core/services/userService";
import { User, CreateUserRequest, UpdatePasswordRequest } from "@/core/types/user";
import { FeatureFlag, getFeatureFlags, updateFeatureFlag } from '@/core/services/featureFlags';
import { Loader2, Trash2, Key, Copy } from "lucide-react";
import { ENDPOINTS } from '@/config';
import { authHeaders } from '@/core/utils/auth';

// API Key interfaces
interface APIKeyPreview {
  id: string;
  api_key_preview: string;
  created_at: string;
}

interface APIKeyCreateResponse {
  id: string;
  api_key: string;
  api_key_preview: string;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const { toast } = useToast();
  
  // Admin check state
  const [isAdmin, setIsAdmin] = useState(false);
  // Check if we're in SASS mode
  const isSaasMode = import.meta.env.VITE_DEPLOYMENT_MODE === 'SASS';
  
  // User Management state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    username: '',
    password: '',
    roles: ['user']
  });
  const [passwordUpdateData, setPasswordUpdateData] = useState<{
    userId: string;
    username: string;
    password: string;
  }>({ userId: '', username: '', password: '' });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Feature Flags state
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKeyPreview[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  
  // Fetch data on component mount
  useEffect(() => {
    // Check if user is admin
    setIsAdmin(isUserAdmin());
    fetchUsers();
    fetchFeatureFlags();
    fetchApiKeys();
  }, []);
  
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // Prevent admin endpoint access in SASS mode
      if (isSaasMode) {
        setUsers([]);
        return;
      }
      
      // Only fetch users if not in SASS mode
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setUsersLoading(false);
    }
  };
  
  const fetchFeatureFlags = async () => {
    setFlagsLoading(true);
    setFlagsError(null);
    try {
      const flags = await getFeatureFlags();
      setFeatureFlags(flags);
    } catch (error) {
      setFlagsError('Failed to load feature flags. Please try again.');
      console.error('Error loading feature flags:', error);
    } finally {
      setFlagsLoading(false);
    }
  };
  
  const fetchApiKeys = async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const response = await fetch(ENDPOINTS.KEY_MANAGEMENT, { headers: authHeaders() });
      if (!response.ok) throw new Error("Failed to load API keys");
      const keys = await response.json();
      setApiKeys(keys);
    } catch (error) {
      setKeysError('Failed to load API keys. Please try again.');
      console.error('Error loading API keys:', error);
    } finally {
      setKeysLoading(false);
    }
  };
  
  const handleCreateUser = async () => {
    try {
      // Prevent admin endpoint access in SASS mode
      if (isSaasMode) {
        return;
      }
      
      await userService.createUser(newUser);
      toast({
        title: "Success",
        description: `User ${newUser.username} created successfully.`
      });
      setNewUserDialogOpen(false);
      setNewUser({ username: '', password: '', roles: ['user'] });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdatePassword = async () => {
    try {
      // Prevent admin endpoint access in SASS mode
      if (isSaasMode) {
        return;
      }
      
      await userService.updateUserPassword(passwordUpdateData.userId, {
        password: passwordUpdateData.password
      });
      toast({
        title: "Success",
        description: `Password updated for ${passwordUpdateData.username}.`
      });
      setPasswordDialogOpen(false);
      setPasswordUpdateData({ userId: '', username: '', password: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    try {
      // Prevent admin endpoint access in SASS mode
      if (isSaasMode) {
        return;
      }
      
      await userService.deleteUser(deleteUserId);
      toast({
        title: "Success",
        description: "User deleted successfully."
      });
      setDeleteDialogOpen(false);
      setDeleteUserId(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleToggleFeature = async (flag: FeatureFlag) => {
    try {
      setFlagsLoading(true);
      const updatedFlag = await updateFeatureFlag(flag.name, !flag.enabled);
      
      // Update the feature flags list with the updated flag
      setFeatureFlags(prevFlags => 
        prevFlags.map(f => f.id === updatedFlag.id ? updatedFlag : f)
      );
      
      toast({
        title: "Success",
        description: `${flag.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${updatedFlag.enabled ? 'enabled' : 'disabled'} successfully.`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update feature flag. Please try again.",
        variant: "destructive"
      });
      console.error('Error updating feature flag:', err);
    } finally {
      setFlagsLoading(false);
    }
  };
  
  const handleCopy = (idx: number, key?: string) => {
    const val = key || apiKeys[idx]?.api_key_preview;
    if (val) navigator.clipboard.writeText(val);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  const handleCreateApiKey = async () => {
    try {
      setCreatingKey(true);
      setKeysError(null);
      const response = await fetch(ENDPOINTS.KEY_MANAGEMENT, {
        method: "POST",
        headers: authHeaders()
      });
      
      if (!response.ok) throw new Error("Failed to create API key");
      
      const data: APIKeyCreateResponse = await response.json();
      setNewKey(data.api_key);
      fetchApiKeys(); // Refresh the list
      
      toast({
        title: "Success",
        description: "New API key created successfully. Make sure to copy it now!"
      });
    } catch (error) {
      setKeysError('Failed to create API key. Please try again.');
      console.error('Error creating API key:', error);
      
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreatingKey(false);
    }
  };
  
  const handleDeleteApiKey = async (keyId: string) => {
    try {
      setKeysLoading(true);
      const response = await fetch(`${ENDPOINTS.KEY_MANAGEMENT}/${keyId}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      
      if (!response.ok) throw new Error("Failed to delete API key");
      
      // Remove the key from the list
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      toast({
        title: "Success",
        description: "API key deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setKeysLoading(false);
    }
  };

  const openPasswordDialog = (user: User) => {
    setPasswordUpdateData({
      userId: user.id,
      username: user.username,
      password: ''
    });
    setPasswordDialogOpen(true);
  };
  
  const openDeleteDialog = (userId: string) => {
    setDeleteUserId(userId);
    setDeleteDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="features">AI Features</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>
        
        {/* USER MANAGEMENT TAB */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>
              {isAdmin ? (
                <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Add User</Button>
                  </DialogTrigger>
                  <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system. All fields are required.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <select 
                        id="role"
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={newUser.roles[0]}
                        onChange={(e) => setNewUser({...newUser, roles: [e.target.value]})}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              ) : (
                <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-md">
                  Only admin users can manage users
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!isAdmin ? (
                <div className="bg-amber-50 p-6 rounded-md text-center">
                  <p className="text-amber-800 font-medium text-lg mb-2">
                    Admin Access Required
                  </p>
                  <p className="text-amber-700">
                    Only administrators can manage users. Please contact an administrator if you need assistance.
                  </p>
                </div>
              ) : usersLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    No users found. Click "Add User" to create one.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.roles.join(', ')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openPasswordDialog(user)}
                            className="mr-2"
                            title="Change Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(user.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Password Update Dialog */}
              <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Password</DialogTitle>
                    <DialogDescription>
                      Set a new password for user: {passwordUpdateData.username}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-password" className="text-right">
                        New Password
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordUpdateData.password}
                        onChange={(e) => setPasswordUpdateData({...passwordUpdateData, password: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdatePassword}>Update Password</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Delete User Confirmation Dialog */}
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the user account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI FEATURES TAB */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>AI Features</CardTitle>
              <CardDescription>Enable or disable AI features in the application</CardDescription>
            </CardHeader>
            <CardContent>
              {flagsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {flagsError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                      {flagsError}
                    </div>
                  )}
                  
                  {featureFlags.length === 0 ? (
                    <div className="bg-muted p-4 rounded-md text-center">
                      <p className="text-sm text-muted-foreground">
                        No feature flags available.
                      </p>
                    </div>
                  ) : (
                    featureFlags.map(flag => (
                      <div key={flag.id} className="py-3 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{flag.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                            {flag.description && (
                              <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                            )}
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={flag.enabled}
                              onChange={() => handleToggleFeature(flag)}
                              disabled={flagsLoading}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API KEYS TAB */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage API keys for programmatic access</CardDescription>
              </div>
              <Button onClick={handleCreateApiKey} disabled={creatingKey}>
                {creatingKey ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create API Key'
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {newKey && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-6">
                  <h3 className="font-medium text-amber-800 mb-2">New API Key Created</h3>
                  <p className="text-sm text-amber-700 mb-3">
                    This key will only be shown once. Make sure to copy it now!
                  </p>
                  <div className="flex items-center justify-between bg-white border border-amber-300 rounded p-2">
                    <code className="text-sm font-mono text-amber-900 truncate mr-2">{newKey}</code>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        handleCopy(-1, newKey);
                        setNewKey(null);
                      }}
                    >
                      {copiedIdx === -1 ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              )}
              
              {keysError && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                  {keysError}
                </div>
              )}
              
              {keysLoading && !newKey ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                    No API keys found. Click "Create API Key" to generate one.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>API Key</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key, idx) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-mono">{key.api_key_preview}</TableCell>
                        <TableCell>{new Date(key.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(idx)}
                            className="mr-2"
                            title="Copy Key Preview"
                          >
                            <Copy className="h-4 w-4" />
                            {copiedIdx === idx && <span className="sr-only">Copied!</span>}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteApiKey(key.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete API Key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
