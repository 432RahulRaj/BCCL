import React from 'react';
import { ComplaintStatus } from '../../contexts/ComplaintContext';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: ComplaintStatus) => {
    const configs = {
      new: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'New',
        dot: 'bg-blue-500'
      },
      assigned: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Assigned',
        dot: 'bg-yellow-500'
      },
      in_progress: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        label: 'In Progress',
        dot: 'bg-purple-500'
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Completed',
        dot: 'bg-green-500'
      },
      escalated: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Escalated',
        dot: 'bg-red-500'
      }
    };
    
    return configs[status] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: status,
      dot: 'bg-gray-500'
    };
  };

  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5'
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      <span className={`${dotSizes[size]} ${config.dot} rounded-full mr-1.5`}></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;