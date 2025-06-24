import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, ArrowLeft, UserCheck, UserX, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DepartmentStaff {
  id: string;
  user_id: string;
  staff_name: string;
  staff_email: string;
  specialization: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  assigned_by: string;
}

interface NewStaffForm {
  staff_name: string;
  staff_email: string;
  specialization: string;
  phone_number: string;
}

const ManageStaff: React.FC = () => {
  const { user, connectionStatus } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<DepartmentStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<DepartmentStaff | null>(null);
  const [newStaff, setNewStaff] = useState<NewStaffForm>({
    staff_name: '',
    staff_email: '',
    specialization: '',
    phone_number: '',
  });

  useEffect(() => {
    fetchStaff();
  }, [user]);

  const fetchStaff = async () => {
    if (!user?.department) return;
    
    setLoading(true);
    try {
      if (connectionStatus === 'online') {
        // Get department ID first
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id')
          .eq('name', user.department)
          .single();

        if (deptError) throw deptError;

        // Fetch staff for this department
        const { data, error } = await supabase
          .from('department_staff')
          .select('*')
          .eq('department_id', deptData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStaff(data || []);
      } else {
        // Offline mode - load from localStorage or use demo data
        const demoStaff: DepartmentStaff[] = [
          {
            id: '1',
            user_id: 'staff-1',
            staff_name: 'Raj Kumar',
            staff_email: 'water.tech1@coalindia.in',
            specialization: 'Water Supply Technician',
            phone_number: '9876543211',
            is_active: true,
            created_at: new Date().toISOString(),
            assigned_by: user.id,
          },
        ];
        setStaff(demoStaff);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStaff.staff_name || !newStaff.staff_email || !newStaff.specialization) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!newStaff.staff_email.endsWith('@coalindia.in')) {
      toast.error('Email must end with @coalindia.in');
      return;
    }

    setLoading(true);
    try {
      if (connectionStatus === 'online') {
        // Get department ID
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id')
          .eq('name', user?.department)
          .single();

        if (deptError) throw deptError;

        // First create user account
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            email: newStaff.staff_email,
            role: 'department_staff',
            department: user?.department,
          }])
          .select()
          .single();

        if (userError) throw userError;

        // Then create staff record
        const { data, error } = await supabase
          .from('department_staff')
          .insert([{
            user_id: userData.id,
            department_id: deptData.id,
            staff_name: newStaff.staff_name,
            staff_email: newStaff.staff_email,
            specialization: newStaff.specialization,
            phone_number: newStaff.phone_number || null,
            assigned_by: user?.id,
          }])
          .select()
          .single();

        if (error) throw error;

        setStaff(prev => [data, ...prev]);
      } else {
        // Offline mode
        const newStaffMember: DepartmentStaff = {
          id: Date.now().toString(),
          user_id: `user-${Date.now()}`,
          staff_name: newStaff.staff_name,
          staff_email: newStaff.staff_email,
          specialization: newStaff.specialization,
          phone_number: newStaff.phone_number,
          is_active: true,
          created_at: new Date().toISOString(),
          assigned_by: user?.id || '',
        };
        setStaff(prev => [newStaffMember, ...prev]);
      }

      setShowAddModal(false);
      setNewStaff({ staff_name: '', staff_email: '', specialization: '', phone_number: '' });
      toast.success('Staff member added successfully');
    } catch (error: any) {
      console.error('Error adding staff:', error);
      if (error.code === '23505') {
        toast.error('A user with this email already exists');
      } else {
        toast.error('Failed to add staff member');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (staffId: string, isActive: boolean) => {
    try {
      if (connectionStatus === 'online') {
        const { error } = await supabase
          .from('department_staff')
          .update({ is_active: !isActive })
          .eq('id', staffId);

        if (error) throw error;
      }

      setStaff(prev => prev.map(member => 
        member.id === staffId 
          ? { ...member, is_active: !isActive }
          : member
      ));

      toast.success(`Staff member ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast.error('Failed to update staff status');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member? This will also delete their user account.')) {
      return;
    }

    try {
      if (connectionStatus === 'online') {
        // Get the staff record to find user_id
        const staffMember = staff.find(s => s.id === staffId);
        if (!staffMember) return;

        // Delete staff record (this will cascade delete due to foreign key)
        const { error: staffError } = await supabase
          .from('department_staff')
          .delete()
          .eq('id', staffId);

        if (staffError) throw staffError;

        // Delete user account
        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('id', staffMember.user_id);

        if (userError) throw userError;
      }

      setStaff(prev => prev.filter(member => member.id !== staffId));
      toast.success('Staff member removed successfully');
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to remove staff member');
    }
  };

  const filteredStaff = staff.filter(member =>
    member.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.staff_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeStaff = filteredStaff.filter(s => s.is_active);
  const inactiveStaff = filteredStaff.filter(s => !s.is_active);

  const specializations = [
    'Water Supply Technician',
    'Water Quality Specialist',
    'Electrical Technician',
    'Power Systems Specialist',
    'Plumbing Specialist',
    'Pipe Fitter',
    'Carpenter',
    'Furniture Specialist',
    'Civil Engineer',
    'Construction Worker',
    'Maintenance Supervisor',
    'General Technician',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/department')}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Staff</h1>
          <p className="text-gray-600">Add and manage department staff members</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
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
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Staff Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">{activeStaff.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserX className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Inactive Staff</p>
              <p className="text-2xl font-bold text-gray-900">{inactiveStaff.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Staff */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Staff Members</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading staff...</p>
          </div>
        ) : activeStaff.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {activeStaff.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium">
                      {member.staff_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{member.staff_name}</h4>
                      <p className="text-sm text-blue-600">{member.specialization}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-1" />
                          {member.staff_email}
                        </div>
                        {member.phone_number && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-4 w-4 mr-1" />
                            {member.phone_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                    <button
                      onClick={() => handleToggleActive(member.id, member.is_active)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Deactivate staff member"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Remove staff member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active staff members</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No staff members match your search.' : 'Get started by adding your first staff member.'}
            </p>
          </div>
        )}
      </div>

      {/* Inactive Staff (if any) */}
      {inactiveStaff.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inactive Staff Members</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {inactiveStaff.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-400 flex items-center justify-center text-white font-medium">
                      {member.staff_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{member.staff_name}</h4>
                      <p className="text-sm text-gray-500">{member.specialization}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-1" />
                          {member.staff_email}
                        </div>
                        {member.phone_number && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-4 w-4 mr-1" />
                            {member.phone_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                    <button
                      onClick={() => handleToggleActive(member.id, member.is_active)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                      title="Activate staff member"
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Remove staff member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAddModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add New Staff Member
                </h3>
                
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div>
                    <label htmlFor="staff_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="staff_name"
                      name="staff_name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStaff.staff_name}
                      onChange={(e) => setNewStaff({ ...newStaff, staff_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="staff_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="staff_email"
                      name="staff_email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStaff.staff_email}
                      onChange={(e) => setNewStaff({ ...newStaff, staff_email: e.target.value })}
                      placeholder="staff@coalindia.in"
                    />
                    <p className="mt-1 text-xs text-gray-500">Must end with @coalindia.in</p>
                  </div>

                  <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization *
                    </label>
                    <select
                      id="specialization"
                      name="specialization"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStaff.specialization}
                      onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
                    >
                      <option value="">Select Specialization</option>
                      {specializations.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStaff.phone_number}
                      onChange={(e) => setNewStaff({ ...newStaff, phone_number: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
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
                          Adding...
                        </div>
                      ) : (
                        'Add Staff Member'
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

export default ManageStaff;