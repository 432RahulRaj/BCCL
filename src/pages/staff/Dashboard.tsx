import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints } from '../../contexts/ComplaintContext';
import { 
  Wrench, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  RefreshCw,
  User,
  Phone
} from 'lucide-react';
import ComplaintCard from '../../components/ui/ComplaintCard';

const StaffDashboard: React.FC = () => {
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
  
  // Filter complaints for this department (staff can see all department complaints)
  const departmentComplaints = complaints.filter(c => 
    c.department_name === user?.department
  );
  
  // Filter complaints assigned to this staff member (if we implement staff assignment)
  const myComplaints = departmentComplaints.filter(c => 
    c.assigned_staff_id === user?.staffInfo?.departmentId || 
    (c.status === 'assigned' || c.status === 'in_progress') // All active tasks are available
  );
  
  // Get counts by status for department complaints
  const statusCounts = {
    assigned: departmentComplaints.filter(c => c.status === 'assigned').length,
    inProgress: departmentComplaints.filter(c => c.status === 'in_progress').length,
    completed: departmentComplaints.filter(c => c.status === 'completed').length,
    escalated: departmentComplaints.filter(c => c.status === 'escalated').length,
  };

  // Get my active tasks
  const myActiveTasks = myComplaints.filter(c => 
    c.status === 'assigned' || c.status === 'in_progress'
  ).slice(0, 3);

  // Get urgent tasks (due soon)
  const urgentTasks = departmentComplaints.filter(c => {
    if (!c.estimated_resolution_date || c.status === 'completed') return false;
    const dueDate = new Date(c.estimated_resolution_date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 && diffDays >= 0; // Due today or tomorrow
  });

  const stats = [
    {
      title: 'Available Tasks',
      value: statusCounts.assigned,
      icon: Wrench,
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
      title: 'Completed Today',
      value: statusCounts.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Urgent Tasks',
      value: urgentTasks.length,
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
          {user?.staffInfo?.specialization && (
            <p className="text-sm text-blue-600">{user.staffInfo.specialization}</p>
          )}
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

      {/* Staff Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Wrench className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Specialization</p>
              <p className="font-medium text-gray-900">{user?.staffInfo?.specialization || 'General Technician'}</p>
            </div>
          </div>
          {user?.staffInfo?.phoneNumber && (
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{user.staffInfo.phoneNumber}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/staff/tasks')}
            className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <Wrench className="h-5 w-5 text-blue-600 mr-3" />
              <span className="font-medium text-gray-900">View All Tasks</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </button>
          
          <button
            onClick={() => navigate('/staff/tasks')}
            className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-3" />
              <span className="font-medium text-gray-900">Active Tasks ({statusCounts.assigned + statusCounts.inProgress})</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-red-900">🚨 Urgent Tasks - Due Soon</h2>
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {urgentTasks.length} task{urgentTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-4">
            {urgentTasks.map(task => (
              <div key={task.id} className="bg-white rounded-lg border border-red-200 p-4">
                <ComplaintCard
                  complaint={task}
                  onClick={() => navigate(`/staff/update/${task.id}`)}
                />
                <div className="mt-3 flex items-center text-sm text-red-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Due: {task.estimated_resolution_date ? 
                      new Date(task.estimated_resolution_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Active Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Available Tasks</h2>
          {myActiveTasks.length > 0 && (
            <button
              onClick={() => navigate('/staff/tasks')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          )}
        </div>
        
        {myActiveTasks.length > 0 ? (
          <div className="space-y-4">
            {myActiveTasks.map(task => (
              <ComplaintCard
                key={task.id}
                complaint={task}
                showActions={true}
                onUpdateAction={() => navigate(`/staff/update/${task.id}`)}
                onClick={() => navigate(`/staff/update/${task.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-2 text-gray-500">
              {departmentComplaints.length === 0 
                ? "No tasks available for your department right now."
                : "All tasks are either completed or being handled by other staff members."}
            </p>
            {departmentComplaints.length > 0 && (
              <button
                onClick={() => navigate('/staff/tasks')}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Wrench className="h-4 w-4 mr-2" />
                View All Department Tasks
              </button>
            )}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{departmentComplaints.length}</p>
            <p className="text-sm text-gray-500">Total Department Tasks</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {departmentComplaints.length > 0 
                ? Math.round((statusCounts.completed / departmentComplaints.length) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-500">Completion Rate</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">2.1</p>
            <p className="text-sm text-gray-500">Avg. Days to Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;