import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints, Complaint, ComplaintStatus } from '../../contexts/ComplaintContext';
import ComplaintCard from '../../components/ui/ComplaintCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { Filter, AlertTriangle, Clock, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TrackComplaints: React.FC = () => {
  const { user } = useAuth();
  const { complaints, escalateComplaint } = useComplaints();
  const navigate = useNavigate();
  
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  
  // Filter complaints for the current employee
  const userComplaints = complaints.filter(c => c.employee_id === user?.id);
  
  // Apply filters
  const filteredComplaints = userComplaints.filter(complaint => {
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  // Sort complaints by creation date (newest first)
  const sortedComplaints = [...filteredComplaints].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };

  const handleCloseDetails = () => {
    setSelectedComplaint(null);
  };

  const handleEscalate = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowEscalateModal(true);
  };

  const handleSubmitEscalation = async () => {
    if (!selectedComplaint) return;
    
    if (!escalationReason.trim()) {
      toast.error('Please provide a reason for escalation');
      return;
    }
    
    try {
      await escalateComplaint(selectedComplaint.id, escalationReason);
      setShowEscalateModal(false);
      setEscalationReason('');
      setSelectedComplaint(null);
    } catch (error) {
      toast.error('Failed to escalate complaint');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/employee')}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Track Complaints</h1>
          <p className="text-gray-600">Monitor the status of your submitted complaints</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {sortedComplaints.length > 0 ? (
        <div className="space-y-4">
          {sortedComplaints.map(complaint => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onClick={() => handleViewComplaint(complaint)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-500 mb-6">
            {statusFilter === 'all' && searchTerm === '' 
              ? "You haven't submitted any complaints yet." 
              : "No complaints match your current filters."}
          </p>
          {statusFilter === 'all' && searchTerm === '' && (
            <button
              onClick={() => navigate('/employee/submit')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Your First Complaint
            </button>
          )}
        </div>
      )}
      
      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseDetails}></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Complaint Details
                    </h3>
                    <StatusBadge status={selectedComplaint.status} />
                  </div>
                  
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">ID:</span>
                          <span className="ml-2 text-gray-900">{selectedComplaint.id}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Type:</span>
                          <span className="ml-2 text-gray-900 capitalize">{selectedComplaint.type}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Submitted:</span>
                          <span className="ml-2 text-gray-900">{formatDate(selectedComplaint.created_at)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Status:</span>
                          <span className="ml-2 text-gray-900 capitalize">{selectedComplaint.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="font-medium text-gray-500">Description:</span>
                        <p className="mt-1 text-gray-900">{selectedComplaint.description}</p>
                      </div>
                    </div>
                    
                    {/* Department Info */}
                    {selectedComplaint.department_name && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Assignment Details</h4>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium text-gray-500">Assigned to:</span>
                            <span className="ml-2 text-gray-900">{selectedComplaint.department_name}</span>
                          </div>
                          {selectedComplaint.assigned_at && (
                            <div>
                              <span className="font-medium text-gray-500">Assigned on:</span>
                              <span className="ml-2 text-gray-900">{formatDate(selectedComplaint.assigned_at)}</span>
                            </div>
                          )}
                          {selectedComplaint.estimated_resolution_date && (
                            <div>
                              <span className="font-medium text-gray-500">Expected completion:</span>
                              <span className="ml-2 text-gray-900">{formatDate(selectedComplaint.estimated_resolution_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Status History */}
                    {selectedComplaint.status_history && selectedComplaint.status_history.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Status History</h4>
                        <div className="flow-root">
                          <ul className="-mb-8">
                            {[...selectedComplaint.status_history].reverse().map((item, index, array) => (
                              <li key={item.id}>
                                <div className="relative pb-8">
                                  {index < array.length - 1 && (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          <span className="font-medium text-gray-900 capitalize">
                                            {item.status.replace('_', ' ')}
                                          </span>
                                          {item.comments && (
                                            <span className="ml-1">- {item.comments}</span>
                                          )}
                                        </p>
                                        <p className="text-xs text-gray-400">by {item.updated_by}</p>
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        {formatDate(item.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    {selectedComplaint.status !== 'completed' && 
                     selectedComplaint.status !== 'escalated' &&
                     selectedComplaint.department_name && (
                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => handleEscalate(selectedComplaint)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Escalate Issue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowEscalateModal(false)}></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Escalate Complaint
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Please provide a reason for escalation. This will notify management about the issue.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6">
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Reason for escalation..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                />
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                    onClick={handleSubmitEscalation}
                  >
                    Escalate
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => setShowEscalateModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackComplaints;