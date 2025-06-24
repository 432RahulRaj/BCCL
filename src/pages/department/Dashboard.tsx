import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints } from '../../contexts/ComplaintContext';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Calendar,
  RefreshCw
} from 'lucide-react';
import ComplaintCard from '../../components/ui/ComplaintCard';

const DepartmentDashboard: React.FC = () => {
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
  
  // Filter complaints for this department (using department name for demo)
  const departmentComplaints = complaints.filter(c => 
    c.department_name === user?.department
  );
  
  // Get counts by status
  const statusCounts = {
    assigned: departmentComplaints.filter(c => c.status === 'assigned').length,
    inProgress: departmentComplaints.filter(c => c.status === 'in_progress').length,
    completed: departmentComplaints.filter(c => c.status === 'completed').length,
    escalated: departmentComplaints.filter(c => c.status === 'escalated').length,
  };
  
  // Get recent pending complaints
  const pendingComplaints = departmentComplaints
    .filter(c => c.status === 'assigned' || c.status === 'in_progress')
    .sort((a, b) => {
      // Prioritize by status and then by date
      if (a.status === 'assigned' && b.status !== 'assigned') return -1;
      if (a.status !== 'assigned' && b.status === 'assigned') return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .slice(0, 3);
  
  // Calculate completion rate
  const totalProcessed = departmentComplaints.filter(c => c.status !== 'new').length;
  const completionRate = totalProcessed > 0
    ? Math.round((statusCounts.completed / totalProcessed) * 100)
    : 0;

  const stats = [
    {
      title: 'Assigned',
      value: statusCounts.assigned,
      icon: CheckSquare,
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
      icon: CheckSquare,
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
          <h1 className="text-2xl font-bold text-gray-900">Department Dashboard</h1>
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

      {/* Stats Overview */}
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

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    completionRate >= 80 ? 'bg-green-500' : 
                    completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{departmentComplaints.length}</p>
                <p className="text-sm text-gray-500">Total Tasks</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">2.1</p>
                <p className="text-sm text-gray-500">Avg. Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/department/tasks')}
              className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <CheckSquare className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-gray-900">View All Tasks</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
            
            <button
              onClick={() => navigate('/department/tasks')}
              className="w-full flex items-center justify-between p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="font-medium text-gray-900">Pending Tasks ({statusCounts.assigned + statusCounts.inProgress})</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
        
        <div className="space-y-4">
          {departmentComplaints
            .filter(c => c.status === 'assigned' || c.status === 'in_progress')
            .filter(c => c.estimated_resolution_date)
            .sort((a, b) => new Date(a.estimated_resolution_date!).getTime() - new Date(b.estimated_resolution_date!).getTime())
            .slice(0, 3)
            .map((complaint) => {
              const dueDate = new Date(complaint.estimated_resolution_date!);
              const today = new Date();
              const diffTime = dueDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              let statusColor = 'text-green-600';
              let bgColor = 'bg-green-50';
              if (diffDays <= 0) {
                statusColor = 'text-red-600';
                bgColor = 'bg-red-50';
              } else if (diffDays <= 1) {
                statusColor = 'text-orange-600';
                bgColor = 'bg-orange-50';
              } else if (diffDays <= 3) {
                statusColor = 'text-yellow-600';
                bgColor = 'bg-yellow-50';
              }
              
              return (
                <div key={complaint.id} className={`flex items-center justify-between p-4 ${bgColor} rounded-lg`}>
                  <div className="flex items-center space-x-3">
                    <Calendar className={`h-5 w-5 ${statusColor}`} />
                    <div>
                      <p className="font-medium text-gray-900">{complaint.id}: {complaint.type.charAt(0).toUpperCase() + complaint.type.slice(1)} Issue</p>
                      <p className="text-sm text-gray-600">From {complaint.employee_name}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${statusColor}`}>
                    {diffDays === 0 ? 'Due Today' : 
                     diffDays < 0 ? `Overdue by ${Math.abs(diffDays)} days` : 
                     `Due in ${diffDays} days`}
                  </div>
                </div>
              );
            })}
            
          {departmentComplaints.filter(c => (c.status === 'assigned' || c.status === 'in_progress') && c.estimated_resolution_date).length === 0 && (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No upcoming deadlines</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Pending Tasks</h2>
          {pendingComplaints.length > 0 && (
            <button
              onClick={() => navigate('/department/tasks')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          )}
        </div>
        
        {pendingComplaints.length > 0 ? (
          <div className="space-y-4">
            {pendingComplaints.map(complaint => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                showActions={true}
                onUpdateAction={() => navigate(`/department/update/${complaint.id}`)}
                onClick={() => navigate(`/department/update/${complaint.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-2 text-gray-500">There are no pending tasks for your department.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentDashboard;