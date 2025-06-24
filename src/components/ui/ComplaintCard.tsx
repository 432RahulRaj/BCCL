import React from 'react';
import { Complaint } from '../../contexts/ComplaintContext';
import StatusBadge from './StatusBadge';
import { Clock, MapPin, Phone, User, Calendar } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
  onClick?: () => void;
  showActions?: boolean;
  onUpdateAction?: () => void;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ 
  complaint, 
  onClick, 
  showActions = false,
  onUpdateAction 
}) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      water: '💧',
      electrical: '⚡',
      plumbing: '🔧',
      carpentry: '🪚',
      civil: '🏗️',
      other: '📋',
    };
    return icons[type] || '📋';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      water: 'bg-blue-100 text-blue-800',
      electrical: 'bg-yellow-100 text-yellow-800',
      plumbing: 'bg-green-100 text-green-800',
      carpentry: 'bg-purple-100 text-purple-800',
      civil: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                {getTypeIcon(complaint.type)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {complaint.type.charAt(0).toUpperCase() + complaint.type.slice(1)} Issue
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(complaint.type)}`}>
                  {complaint.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">ID: {complaint.id}</p>
              <p className="text-gray-700 line-clamp-2">{complaint.description}</p>
            </div>
          </div>
          <StatusBadge status={complaint.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>Submitted: {formatDate(complaint.created_at)}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">{complaint.employee_quarter}, {complaint.employee_area}</span>
          </div>
          {complaint.department_name && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span className="truncate">Dept: {complaint.department_name}</span>
            </div>
          )}
          {complaint.estimated_resolution_date && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="truncate">Due: {formatDate(complaint.estimated_resolution_date)}</span>
            </div>
          )}
        </div>

        {showActions && complaint.status !== 'completed' && onUpdateAction && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateAction();
              }}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Update Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;