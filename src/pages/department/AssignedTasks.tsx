import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints, ComplaintStatus } from '../../contexts/ComplaintContext';
import ComplaintCard from '../../components/ui/ComplaintCard';
import { Filter, ArrowLeft, Search, RefreshCw } from 'lucide-react';

const AssignedTasks: React.FC = () => {
  const { user } = useAuth();
  const { complaints, refreshComplaints, loading } = useComplaints();
  const navigate = useNavigate();
  
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'pending' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auto-refresh complaints every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshComplaints();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshComplaints]);
  
  // Filter complaints for this department
  const departmentComplaints = complaints.filter(c => 
    c.department_name === user?.department
  );
  
  // Apply status filter
  const filteredComplaints = (() => {
    let filtered = departmentComplaints;
    
    if (statusFilter === 'pending') {
      filtered = filtered.filter(c => c.status === 'assigned' || c.status === 'in_progress');
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  })();
  
  // Sort complaints: pending ones first, then by date
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    // Status priority: assigned > in_progress > others
    const getStatusPriority = (status: ComplaintStatus) => {
      if (status === 'assigned') return 0;
      if (status === 'in_progress') return 1;
      return 2;
    };
    
    const priorityA = getStatusPriority(a.status);
    const priorityB = getStatusPriority(b.status);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same status, sort by date
    if (priorityA < 2) {
      // For pending tasks, prioritize those with closest deadlines
      if (a.estimated_resolution_date && b.estimated_resolution_date) {
        return new Date(a.estimated_resolution_date).getTime() - new Date(b.estimated_resolution_date).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      // For completed/escalated, show newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleRefresh = async () => {
    await refreshComplaints();
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/department')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assigned Tasks</h1>
            <p className="text-gray-600">Manage and update your department's tasks</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'pending' | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending (Assigned + In Progress)</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {sortedComplaints.length > 0 ? (
        <div className="space-y-4">
          {sortedComplaints.map(complaint => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              showActions={complaint.status !== 'completed' && complaint.status !== 'escalated'}
              onUpdateAction={() => navigate(`/department/update/${complaint.id}`)}
              onClick={() => navigate(`/department/update/${complaint.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {statusFilter === 'all' && searchTerm === '' 
              ? "Your department doesn't have any assigned tasks." 
              : "No tasks match your current filters."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AssignedTasks;