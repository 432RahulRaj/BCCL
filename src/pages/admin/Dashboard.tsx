import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComplaints } from '../../contexts/ComplaintContext';
import { FileText, CheckCircle, AlertTriangle, Clock, Users, ArrowRight, TrendingUp, RefreshCw } from 'lucide-react';
import ComplaintCard from '../../components/ui/ComplaintCard';

const AdminDashboard: React.FC = () => {
  const { complaints, refreshComplaints, loading } = useComplaints();
  const navigate = useNavigate();

  // Auto-refresh complaints every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshComplaints();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshComplaints]);
  
  // Get counts by status
  const statusCounts = {
    new: complaints.filter(c => c.status === 'new').length,
    assigned: complaints.filter(c => c.status === 'assigned').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    completed: complaints.filter(c => c.status === 'completed').length,
    escalated: complaints.filter(c => c.status === 'escalated').length,
  };

  // Get counts by type
  const typeCounts = {
    water: complaints.filter(c => c.type === 'water').length,
    electrical: complaints.filter(c => c.type === 'electrical').length,
    plumbing: complaints.filter(c => c.type === 'plumbing').length,
    carpentry: complaints.filter(c => c.type === 'carpentry').length,
    civil: complaints.filter(c => c.type === 'civil').length,
    other: complaints.filter(c => c.type === 'other').length,
  };

  // Get recent unassigned complaints
  const unassignedComplaints = complaints
    .filter(c => c.status === 'new')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Calculate completion rate
  const totalProcessed = complaints.filter(c => c.status !== 'new').length;
  const completionRate = totalProcessed > 0 ? Math.round((statusCounts.completed / totalProcessed) * 100) : 0;

  const stats = [
    {
      title: 'New Complaints',
      value: statusCounts.new,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      title: 'In Progress',
      value: statusCounts.assigned + statusCounts.inProgress,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      change: '+5%',
      changeType: 'increase' as const,
    },
    {
      title: 'Completed',
      value: statusCounts.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+18%',
      changeType: 'increase' as const,
    },
    {
      title: 'Escalated',
      value: statusCounts.escalated,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      change: '-8%',
      changeType: 'decrease' as const,
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className={`${stat.bgColor} rounded-xl p-6 border border-gray-100`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    stat.changeType === 'decrease' ? 'rotate-180' : ''
                  }`} />
                  {stat.change}
                </div>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/complaints')}
              className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-gray-900">Manage Complaints</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
            
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">Manage Users</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
            
            <button
              onClick={() => navigate('/admin/analytics')}
              className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium text-gray-900">View Analytics</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    completionRate >= 80 ? 'bg-green-500' : 
                    completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
                <p className="text-sm text-gray-500">Total Complaints</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">2.3</p>
                <p className="text-sm text-gray-500">Avg. Resolution (days)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints by Type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">
                {type === 'water' && '💧'}
                {type === 'electrical' && '⚡'}
                {type === 'plumbing' && '🔧'}
                {type === 'carpentry' && '🪚'}
                {type === 'civil' && '🏗️'}
                {type === 'other' && '📋'}
              </div>
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500 capitalize">{type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Unassigned Complaints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Unassigned Complaints</h2>
          {unassignedComplaints.length > 0 && (
            <button
              onClick={() => navigate('/admin/complaints')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          )}
        </div>
        
        {unassignedComplaints.length > 0 ? (
          <div className="space-y-4">
            {unassignedComplaints.map(complaint => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onClick={() => navigate('/admin/complaints')}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-2 text-gray-500">There are no unassigned complaints.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;