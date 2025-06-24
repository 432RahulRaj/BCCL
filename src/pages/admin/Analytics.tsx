import React, { useState } from 'react';
import { useComplaints } from '../../contexts/ComplaintContext';
import { Calendar, TrendingUp, TrendingDown, BarChart3, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Analytics: React.FC = () => {
  const { complaints } = useComplaints();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Calculate metrics
  const totalComplaints = complaints.length;
  const completedComplaints = complaints.filter(c => c.status === 'completed').length;
  const pendingComplaints = complaints.filter(c => ['new', 'assigned', 'in_progress'].includes(c.status)).length;
  const escalatedComplaints = complaints.filter(c => c.status === 'escalated').length;
  
  const completionRate = totalComplaints > 0 ? Math.round((completedComplaints / totalComplaints) * 100) : 0;
  
  // Complaints by type
  const complaintsByType = {
    water: complaints.filter(c => c.type === 'water').length,
    electrical: complaints.filter(c => c.type === 'electrical').length,
    plumbing: complaints.filter(c => c.type === 'plumbing').length,
    carpentry: complaints.filter(c => c.type === 'carpentry').length,
    civil: complaints.filter(c => c.type === 'civil').length,
    other: complaints.filter(c => c.type === 'other').length,
  };

  // Average resolution time (mock data)
  const avgResolutionTime = '2.3 days';
  
  // Trend data (mock)
  const trends = {
    complaints: { value: '+12%', isPositive: false },
    resolution: { value: '+8%', isPositive: true },
    satisfaction: { value: '+15%', isPositive: true },
    escalation: { value: '-5%', isPositive: true },
  };

  const metrics = [
    {
      title: 'Total Complaints',
      value: totalComplaints,
      change: trends.complaints.value,
      isPositive: trends.complaints.isPositive,
      icon: BarChart3,
      color: 'bg-blue-500',
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      change: trends.resolution.value,
      isPositive: trends.resolution.isPositive,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Issues',
      value: pendingComplaints,
      change: trends.satisfaction.value,
      isPositive: trends.satisfaction.isPositive,
      icon: TrendingUp,
      color: 'bg-yellow-500',
    },
    {
      title: 'Escalated',
      value: escalatedComplaints,
      change: trends.escalation.value,
      isPositive: trends.escalation.isPositive,
      icon: TrendingDown,
      color: 'bg-red-500',
    },
  ];

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`${metric.color} rounded-lg p-3`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center text-sm font-medium ${
                  metric.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.isPositive ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {metric.change}
                </div>
                <p className="text-xs text-gray-500">vs last period</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints by Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Complaints by Type</h3>
          <div className="space-y-4">
            {Object.entries(complaintsByType).map(([type, count]) => {
              const percentage = totalComplaints > 0 ? (count / totalComplaints) * 100 : 0;
              const colors: Record<string, string> = {
                water: 'bg-blue-500',
                electrical: 'bg-yellow-500',
                plumbing: 'bg-green-500',
                carpentry: 'bg-purple-500',
                civil: 'bg-orange-500',
                other: 'bg-gray-500',
              };
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${colors[type]}`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[type]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Resolution Rate</span>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{avgResolutionTime}</p>
                <p className="text-sm text-gray-500">Avg. Resolution Time</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">94%</p>
                <p className="text-sm text-gray-500">Satisfaction Rate</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Department Performance</h4>
              <div className="space-y-2">
                {['Water Dept', 'Electrical Dept', 'Plumbing Dept'].map((dept, index) => {
                  const performance = [95, 87, 92][index];
                  return (
                    <div key={dept} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{dept}</span>
                      <span className="font-medium text-gray-900">{performance}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {complaints.slice(0, 5).map((complaint) => (
            <div key={complaint.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {complaint.type.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {complaint.type.charAt(0).toUpperCase() + complaint.type.slice(1)} complaint from {complaint.employee_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  complaint.status === 'completed' ? 'bg-green-100 text-green-800' :
                  complaint.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  complaint.status === 'new' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {complaint.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;