import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints } from '../../contexts/ComplaintContext';
import { supabase } from '../../lib/supabase';
import { Plus, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface DepartmentEmployee {
  id: string;
  name: string;
  email: string;
}

const AssignTasks: React.FC = () => {
  const { user } = useAuth();
  const { complaints } = useComplaints();
  const [employees, setEmployees] = useState<DepartmentEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    employeeId: '',
    estimatedDays: '3'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      if (!user?.departmentName) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('department', user.departmentName)
        .eq('role', 'employee');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast.error('Failed to fetch employees');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter complaints for this department that are not yet assigned to an employee
  const unassignedComplaints = complaints.filter(c => 
    c.departmentId === user?.departmentId && 
    !c.assignedEmployeeId &&
    c.status !== 'completed' &&
    c.status !== 'escalated'
  );

  const handleAssign = (complaint: any) => {
    setSelectedComplaint(complaint);
    setShowAssignModal(true);
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !assignmentData.employeeId) return;

    try {
      // Update the complaint with employee assignment
      const { error } = await supabase
        .from('complaints')
        .update({
          assigned_employee_id: assignmentData.employeeId,
          estimated_completion_date: new Date(Date.now() + parseInt(assignmentData.estimatedDays) * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      toast.success('Task assigned successfully');
      setShowAssignModal(false);
      setAssignmentData({ employeeId: '', estimatedDays: '3' });
      setSelectedComplaint(null);
    } catch (error) {
      toast.error('Failed to assign task');
      console.error('Error:', error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">
          Assign Tasks to Employees
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Assign unassigned complaints to department employees
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {unassignedComplaints.map(complaint => (
            <div
              key={complaint.id}
              className="bg-white shadow-sm rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Complaint #{complaint.id}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {complaint.description}
                  </p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    Submitted on {new Date(complaint.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleAssign(complaint)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Assign
                </button>
              </div>
            </div>
          ))}

          {unassignedComplaints.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No unassigned tasks</h3>
              <p className="mt-1 text-sm text-gray-500">
                All complaints have been assigned to employees
              </p>
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Assign Task to Employee
                </h3>
                <form onSubmit={handleAssignmentSubmit} className="mt-5">
                  <div className="mb-4">
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                      Select Employee
                    </label>
                    <select
                      id="employeeId"
                      name="employeeId"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={assignmentData.employeeId}
                      onChange={(e) => setAssignmentData({ ...assignmentData, employeeId: e.target.value })}
                      required
                    >
                      <option value="">Select an employee</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="estimatedDays" className="block text-sm font-medium text-gray-700">
                      Estimated Days to Complete
                    </label>
                    <input
                      type="number"
                      id="estimatedDays"
                      name="estimatedDays"
                      min="1"
                      max="30"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={assignmentData.estimatedDays}
                      onChange={(e) => setAssignmentData({ ...assignmentData, estimatedDays: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
                    >
                      Assign Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTasks;