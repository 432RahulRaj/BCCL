import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints } from '../../contexts/ComplaintContext';
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import ComplaintCard from '../../components/ui/ComplaintCard';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { complaints, refreshComplaints, loading } = useComplaints();
  const navigate = useNavigate();

  // Auto-refresh complaints every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshComplaints();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshComplaints]);

  // Filter complaints for the current employee
  const userComplaints = complaints.filter(c => c.employee_id === user?.id);
  
  // Get counts by status
  const statusCounts = {
    new: userComplaints.filter(c => c.status === 'new').length,
    inProgress: userComplaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length,
    completed: userComplaints.filter(c => c.status === 'completed').length,
    escalated: userComplaints.filter(c => c.status === 'escalated').length,
  };

  // Get most recent complaints
  const recentComplaints = [...userComplaints]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const stats = [
    {
      title: 'New',
      value: statusCounts.new,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'In Progress',
      value: statusCounts.inProgress,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      title: 'Completed',
      value: statusCounts.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Escalated',
      value: statusCounts.escalated,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  ];

  const handleRefresh = async () => {
    await refreshComplaints();
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className={`${stat.bgColor} rounded-xl p-6 border border-gray-100`}>
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/employee/submit')}
            className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Submit New Complaint
          </button>
          <button
            onClick={() => navigate('/employee/track')}
            className="flex items-center justify-center px-6 py-4 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            <FileText className="h-5 w-5 mr-2" />
            Track Complaints
          </button>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
          {userComplaints.length > 3 && (
            <button
              onClick={() => navigate('/employee/track')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          )}
        </div>
        
        {recentComplaints.length > 0 ? (
          <div className="space-y-4">
            {recentComplaints.map(complaint => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onClick={() => navigate('/employee/track')}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No complaints yet</h3>
            <p className="mt-2 text-gray-500">Get started by submitting your first complaint.</p>
            <button
              onClick={() => navigate('/employee/submit')}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Complaint
            </button>
          </div>
        )}
      </div>

      {/* Employee Info */}
      {user?.employeeInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Quarter</p>
              <p className="text-gray-900">{user.employeeInfo.quarter}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Area</p>
              <p className="text-gray-900">{user.employeeInfo.area}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Contact</p>
              <p className="text-gray-900">{user.employeeInfo.contactNumber}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;