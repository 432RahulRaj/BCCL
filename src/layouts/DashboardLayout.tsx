import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { 
  Building2, 
  User, 
  FileText, 
  ClipboardList, 
  BarChart2, 
  LogOut, 
  Settings,
  Menu,
  X,
  Home,
  Users,
  CheckSquare,
  Wifi,
  WifiOff,
  Wrench,
  UserPlus
} from 'lucide-react';

interface DashboardLayoutProps {
  dashboardType: UserRole;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ dashboardType }) => {
  const { user, logout, connectionStatus } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    switch (dashboardType) {
      case 'employee':
        return [
          { title: 'Dashboard', path: '/employee', icon: <Home size={20} /> },
          { title: 'Submit Complaint', path: '/employee/submit', icon: <FileText size={20} /> },
          { title: 'Track Complaints', path: '/employee/track', icon: <ClipboardList size={20} /> },
        ];
      case 'admin':
        return [
          { title: 'Dashboard', path: '/admin', icon: <Home size={20} /> },
          { title: 'Complaints', path: '/admin/complaints', icon: <ClipboardList size={20} /> },
          { title: 'Users', path: '/admin/users', icon: <Users size={20} /> },
          { title: 'Analytics', path: '/admin/analytics', icon: <BarChart2 size={20} /> },
        ];
      case 'department':
        return [
          { title: 'Dashboard', path: '/department', icon: <Home size={20} /> },
          { title: 'Assigned Tasks', path: '/department/tasks', icon: <CheckSquare size={20} /> },
          { title: 'Manage Staff', path: '/department/staff', icon: <UserPlus size={20} /> },
        ];
      case 'department_staff':
        return [
          { title: 'Dashboard', path: '/staff', icon: <Home size={20} /> },
          { title: 'My Tasks', path: '/staff/tasks', icon: <Wrench size={20} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getDashboardTitle = () => {
    switch (dashboardType) {
      case 'employee':
        return 'Employee Portal';
      case 'admin':
        return 'Admin Portal';
      case 'department':
        return user?.department || 'Department Portal';
      case 'department_staff':
        return `${user?.department} - Staff Portal`;
      default:
        return 'Portal';
    }
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">BCCL Portal</h1>
              <div className="flex items-center space-x-1">
                {connectionStatus === 'online' ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-orange-500" />
                )}
                <span className="text-xs text-gray-500">
                  {connectionStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col justify-between flex-1 overflow-y-auto">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                end={item.path.split('/').length <= 2}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.staffInfo?.specialization && (
                  <p className="text-xs text-blue-600 truncate">{user.staffInfo.specialization}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <NavLink
                to={`/${dashboardType === 'department_staff' ? 'staff' : dashboardType}/profile`}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings size={16} className="mr-2" />
                Profile
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 bg-white border-b border-gray-200 md:hidden px-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">BCCL Portal</h1>
              <div className="flex items-center space-x-1">
                {connectionStatus === 'online' ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-orange-500" />
                )}
                <span className="text-xs text-gray-500">
                  {connectionStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 focus:outline-none transition-colors"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="absolute inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-500 rounded-lg hover:text-gray-900 focus:outline-none"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <nav className="px-3 py-4 space-y-1">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                        end={item.path.split('/').length <= 2}
                      >
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </NavLink>
                    ))}
                  </nav>
                </div>
                
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      {user?.staffInfo?.specialization && (
                        <p className="text-xs text-blue-600">{user.staffInfo.specialization}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <NavLink
                      to={`/${dashboardType === 'department_staff' ? 'staff' : dashboardType}/profile`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Settings size={16} className="mr-2" />
                      Profile
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="px-4 sm:px-6 md:px-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{getDashboardTitle()}</h1>
                <p className="text-gray-600">Welcome back, {user?.name}</p>
              </div>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;