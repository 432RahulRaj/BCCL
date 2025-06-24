import React, { useState, useEffect } from 'react';
import { useComplaints, Complaint, ComplaintStatus, ComplaintType } from '../../contexts/ComplaintContext';
import ComplaintCard from '../../components/ui/ComplaintCard';
import { Filter, Search, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface Department {
  id: string;
  name: string;
  email: string;
}

const ManageComplaints: React.FC = () => {
  const { complaints, assignComplaint, fetchComplaints } = useComplaints();
  const navigate = useNavigate();
  
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('new');
  const [typeFilter, setTypeFilter] = useState<ComplaintType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    departmentId: '',
    departmentName: '',
    estimatedDays: '3'
  });
  
  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, email')
        .order('name');
      
      if (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
        return;
      }
      
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };
  
  // Apply filters
  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesType = typeFilter === 'all' || complaint.type === typeFilter;
    const matchesSearch = searchTerm === '' || 
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });
  
  // Sort complaints by creation date (newest first)
  const sortedComplaints = [...filteredComplaints].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleAssign = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowAssignModal(true);
    setAssignmentData({
      departmentId: complaint.department_id || '',
      departmentName: complaint.department_name || '',
      estimatedDays: '3'
    });
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'departmentId') {
      const selected = departments.find(dept => dept.id === value);
      if (selected) {
        setAssignmentData(prev => ({
          ...prev,
          departmentName: selected.name
        }));
      }
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedComplaint || !assignmentData.departmentId) {
      toast.error('Please select a department');
      return;
    }
    
    const days = parseInt(assignmentData.estimatedDays, 10) || 3;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + days);
    
    try {
      await assignComplaint(
        selectedComplaint.id,
        assignmentData.departmentId,
        assignmentData.departmentName,
        estimatedDate.toISOString()
      );
      
      setShowAssignModal(false);
      setAssignmentData({ departmentId: '', departmentName: '', estimatedDays: '3' });
      setSelectedComplaint(null);
    } catch (error) {
      toast.error('Failed to assign complaint');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Complaints</h1>
          <p className="text-gray-600">Review and assign complaints to departments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'all')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ComplaintType | 'all')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="water">Water Supply</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="carpentry">Carpentry</option>
            <option value="civil">Civil Work</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={fetchComplaints}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Complaints List */}
      {sortedComplaints.length > 0 ? (
        <div className="space-y-4">
          {sortedComplaints.map(complaint => (
            <div key={complaint.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <ComplaintCard
                complaint={complaint}
                onClick={() => handleViewComplaint(complaint)}
              />
              {complaint.status === 'new' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleAssign(complaint)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Assign to Department
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-500">
            Try adjusting your filters to see more results.
          </p>
        </div>
      )}
      
      {/* Assignment Modal */}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAssignModal(false)}></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Assign Complaint to Department
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Complaint Details</h4>
                    <p className="text-sm text-gray-600">ID: {selectedComplaint.id}</p>
                    <p className="text-sm text-gray-600">Type: {selectedComplaint.type}</p>
                    <p className="text-sm text-gray-600">Employee: {selectedComplaint.employee_name}</p>
                  </div>
                  
                  <div>
                    <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      id="departmentId"
                      name="departmentId"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={assignmentData.departmentId}
                      onChange={handleAssignmentChange}
                      required
                      disabled={loadingDepartments}
                    >
                      <option value="">
                        {loadingDepartments ? 'Loading departments...' : 'Select Department'}
                      </option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    {departments.length === 0 && !loadingDepartments && (
                      <p className="text-sm text-red-600 mt-1">
                        No departments available. Please contact your administrator.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="estimatedDays" className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Days to Resolve
                    </label>
                    <input
                      type="number"
                      id="estimatedDays"
                      name="estimatedDays"
                      min="1"
                      max="30"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={assignmentData.estimatedDays}
                      onChange={handleAssignmentChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitAssignment}
                    disabled={loadingDepartments || !assignmentData.departmentId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageComplaints;