import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, ArrowLeft, Shield, Building2, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'department' | 'employee';
  department?: string;
  created_at: string;
}

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const { connectionStatus } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'department' | 'employee',
    department: '',
  });

  // Demo users data
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@coalindia.in',
      role: 'admin',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'John Employee',
      email: 'employee@coalindia.in',
      role: 'employee',
      created_at: '2024-01-20T10:00:00Z',
    },
    {
      id: '3',
      name: 'Water Department',
      email: 'water@coalindia.in',
      role: 'department',
      department: 'Water Department',
      created_at: '2024-01-10T10:00:00Z',
    },
    {
      id: '4',
      name: 'Electrical Department',
      email: 'electrical@coalindia.in',
      role: 'department',
      department: 'Electrical Department',
      created_at: '2024-01-10T10:00:00Z',
    },
  ]);

  useEffect(() => {
    fetchUsers();
  }, [connectionStatus]);

  const fetchUsers = async () => {
    if (connectionStatus === 'online') {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform data to match our interface
        const transformedUsers = data?.map(user => ({
          id: user.id,
          name: user.email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: user.email,
          role: user.role,
          department: user.department,
          created_at: user.created_at,
        })) || [];

        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users from database, using demo data');
      } finally {
        setLoading(false);
      }
    } else {
      // Load from localStorage in offline mode
      const storedUsers = localStorage.getItem('bccl_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    }
  };

  const saveToLocalStorage = (updatedUsers: User[]) => {
    localStorage.setItem('bccl_users', JSON.stringify(updatedUsers));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!newUser.email.endsWith('@coalindia.in')) {
      toast.error('Email must end with @coalindia.in');
      return;
    }

    if (newUser.role === 'department' && !newUser.department) {
      toast.error('Please select a department for department users');
      return;
    }

    setLoading(true);
    try {
      const user: User = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.role === 'department' ? newUser.department : undefined,
        created_at: new Date().toISOString(),
      };

      if (connectionStatus === 'online') {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            email: newUser.email,
            role: newUser.role,
            department: newUser.role === 'department' ? newUser.department : null,
          }])
          .select()
          .single();

        if (error) throw error;

        // Transform the response to match our interface
        const transformedUser: User = {
          id: data.id,
          name: newUser.name,
          email: data.email,
          role: data.role,
          department: data.department,
          created_at: data.created_at,
        };

        setUsers(prev => [transformedUser, ...prev]);
      } else {
        // Offline mode
        const updatedUsers = [user, ...users];
        setUsers(updatedUsers);
        saveToLocalStorage(updatedUsers);
      }

      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: 'employee', department: '' });
      toast.success('User added successfully');
    } catch (error: any) {
      console.error('Error adding user:', error);
      if (error.code === '23505') {
        toast.error('A user with this email already exists');
      } else {
        toast.error('Failed to add user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    if (!newUser.name || !newUser.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUser.role === 'department' && !newUser.department) {
      toast.error('Please select a department for department users');
      return;
    }

    setLoading(true);
    try {
      if (connectionStatus === 'online') {
        const { error } = await supabase
          .from('users')
          .update({
            role: newUser.role,
            department: newUser.role === 'department' ? newUser.department : null,
          })
          .eq('id', editingUser.id);

        if (error) throw error;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? {
              ...user,
              name: newUser.name,
              role: newUser.role,
              department: newUser.role === 'department' ? newUser.department : undefined,
            }
          : user
      ));

      if (connectionStatus === 'offline') {
        saveToLocalStorage(users);
      }
      
      setEditingUser(null);
      setNewUser({ name: '', email: '', role: 'employee', department: '' });
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setLoading(true);
    try {
      if (connectionStatus === 'online') {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;
      }

      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      
      if (connectionStatus === 'offline') {
        saveToLocalStorage(updatedUsers);
      }

      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', role: 'employee', department: '' });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'department':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'employee':
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'department':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600">Add, edit, and manage system users</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new user.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                
                <form onSubmit={editingUser ? handleEditUser : handleAddUser} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      disabled={!!editingUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@coalindia.in"
                    />
                    {!editingUser && (
                      <p className="mt-1 text-xs text-gray-500">Must end with @coalindia.in</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any, department: '' })}
                    >
                      <option value="employee">Employee</option>
                      <option value="department">Department</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {newUser.role === 'department' && (
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        id="department"
                        name="department"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newUser.department}
                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      >
                        <option value="">Select Department</option>
                        <option value="Water Department">Water Department</option>
                        <option value="Electrical Department">Electrical Department</option>
                        <option value="Plumbing Department">Plumbing Department</option>
                        <option value="Carpentry Department">Carpentry Department</option>
                        <option value="Civil Department">Civil Department</option>
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingUser ? 'Updating...' : 'Adding...'}
                        </div>
                      ) : (
                        editingUser ? 'Update User' : 'Add User'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;