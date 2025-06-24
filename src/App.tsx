import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ComplaintProvider } from './contexts/ComplaintContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Profile from './pages/Profile';
import EmployeeDashboard from './pages/employee/Dashboard';
import SubmitComplaint from './pages/employee/SubmitComplaint';
import TrackComplaints from './pages/employee/TrackComplaints';
import AdminDashboard from './pages/admin/Dashboard';
import ManageComplaints from './pages/admin/ManageComplaints';
import ManageUsers from './pages/admin/ManageUsers';
import Analytics from './pages/admin/Analytics';
import DepartmentDashboard from './pages/department/Dashboard';
import AssignedTasks from './pages/department/AssignedTasks';
import UpdateProgress from './pages/department/UpdateProgress';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ComplaintProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Redirect root to login */}
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="login" element={<Login />} />
            
            {/* Employee Routes */}
            <Route path="employee" element={
              <ProtectedRoute requiredRole="employee">
                <DashboardLayout dashboardType="employee" />
              </ProtectedRoute>
            }>
              <Route index element={<EmployeeDashboard />} />
              <Route path="submit" element={<SubmitComplaint />} />
              <Route path="track" element={<TrackComplaints />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout dashboardType="admin" />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="complaints" element={<ManageComplaints />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Department Routes */}
            <Route path="department" element={
              <ProtectedRoute requiredRole="department">
                <DashboardLayout dashboardType="department" />
              </ProtectedRoute>
            }>
              <Route index element={<DepartmentDashboard />} />
              <Route path="tasks" element={<AssignedTasks />} />
              <Route path="update/:id" element={<UpdateProgress />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ComplaintProvider>
    </AuthProvider>
  );
}

export default App;