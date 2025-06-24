import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Wifi, WifiOff, Server } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { connectionStatus } = useAuth();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'local':
        return {
          icon: <Server className="h-4 w-4" />,
          text: 'Local',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          description: 'Connected to local Supabase'
        };
      case 'online':
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: 'Online',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          description: 'Connected to hosted Supabase'
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Offline',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          description: 'Using demo data only'
        };
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Unknown',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          description: 'Connection status unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
        title={config.description}
      >
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;