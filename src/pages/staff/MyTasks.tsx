import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints, ComplaintStatus } from '../../contexts/ComplaintContext';
import ComplaintCard from '../../components/ui/ComplaintCard';
import { Filter, ArrowLeft, Search, RefreshCw, Wrench } from 'lucide-react';

const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const { complaints, refreshComplaints, loading } = useComplaints();
  const navigate = useNavigate();
  
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'available' | 'all'>('available');
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
    
    if (statusFilter === 'available') {
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
  
  // Sort complaints: urgent first, then by date
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    // Check urgency first (due within 24 hours)
    const getUrgency = (complaint: any) => {
      if (!complaint.estimated_resolution_date) return 2;
      const dueDate = new Date(complaint.estimated_resolution_date);
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);
      
      if (diffHours <= 0) return 0; // Overdue
      if (diffHours <= 24) return 1; // Due within 24 hours
      return 2; // Not urgent
    };
    
    const urgencyA = getUrgency(a);
    const urgencyB = getUrgency(b);
    
    if (urgencyA !== urgencyB) {
      return urgencyA - urgencyB; // Most urgent first
    }
    
    // If same urgency, sort by creation date (oldest first for pending tasks)
    if (statusFilter === 'available' || a.status === 'assigned' || a.status === 'in_progress') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      // For completed tasks, newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleRefresh = async () => {
    await refreshComplaints();
  };

  const isTaskUrgent = (complaint: any) => {
    if (!complaint.estimated_resolution_date) return false;
    const dueDate = new Date(complaint.estimated_resolution_date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours >= 0;
  };

  const isTaskOverdue = (complaint: any) => {
    if (!complaint.estimated_resolution_date) return false;
    const dueDate = new Date(complaint.estimated_resolution_date);
    const now = new Date();
    return dueDate.getTime() < now.getTime();
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/staff')}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600">View and work on department tasks</p>
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

      {/* Staff Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Wrench className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-900">{user?.name}</p>
            <p className="text-sm text-blue-700">{user?.staffInfo?.specialization || 'General Technician'}</p>
          </div>
        </div>
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
              onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'available' | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="available">Available (Assigned + In Progress)</option>
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
          {sortedComplaints.map(complaint => {
            const isUrgent = isTaskUrgent(complaint);
            const isOverdue = isTaskOverdue(complaint);
            
            return (
              <div 
                key={complaint.id} 
                className={`rounded-xl border-2 overflow-hidden ${
                  isOverdue ? 'border-red-300 bg-red-50' :
                  isUrgent ? 'border-orange-300 bg-orange-50' :
                  'border-gray-200 bg-white'
                }`}
              >
                {(isUrgent || isOverdue) && (
                  <div className={`px-4 py-2 text-sm font-medium ${
                    isOverdue ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {isOverdue ? '🚨 OVERDUE' : '⚠️ URGENT - Due within 24 hours'}
                  </div>
                )}
                
                <div className="p-4">
                  <ComplaintCard
                    complaint={complaint}
                    showActions={complaint.status !== 'completed' && complaint.status !== 'escalated'}
                    onUpdateAction={() => navigate(`/staff/update/${complaint.id}`)}
                    onClick={() => navigate(`/staff/update/${complaint.id}`)}
                  />
                  
                  {complaint.estimated_resolution_date && (
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Due: </span>
                      {new Date(complaint.estimated_resolution_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {statusFilter === 'all' && searchTerm === '' 
              ? "No tasks available for your department right now." 
              : "No tasks match your current filters."}
          </p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTasks;