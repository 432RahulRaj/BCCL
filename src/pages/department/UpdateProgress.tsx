import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints, ComplaintStatus } from '../../contexts/ComplaintContext';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Send } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

const UpdateProgress: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { complaints, updateComplaintStatus, addComment, refreshComplaints } = useComplaints();
  
  const [status, setStatus] = useState<ComplaintStatus>('assigned');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const complaint = complaints.find(c => c.id === id);
  
  // Initialize status when complaint is found
  useEffect(() => {
    if (complaint) {
      console.log('🔄 Setting initial status to:', complaint.status);
      setStatus(complaint.status);
    }
  }, [complaint?.id, complaint?.status]);
  
  // Refresh complaint data when component mounts
  useEffect(() => {
    console.log('🔄 Refreshing complaints on mount');
    refreshComplaints();
  }, [refreshComplaints]);
  
  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Complaint not found</h3>
        <p className="text-gray-500 mb-6">The complaint you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate('/department/tasks')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </button>
      </div>
    );
  }
  
  // Check if the complaint belongs to the current department
  if (complaint.department_name !== user?.department) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500 mb-6">This complaint is assigned to a different department.</p>
        <button
          onClick={() => navigate('/department/tasks')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </button>
      </div>
    );
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast.error('Please add a comment about the status update');
      return;
    }
    
    console.log('📤 Submitting status update:', { 
      complaintId: complaint.id, 
      currentStatus: complaint.status,
      newStatus: status, 
      comment: comment.trim() 
    });
    
    setIsSubmitting(true);
    
    try {
      // Update the status first
      console.log('🔄 Calling updateComplaintStatus...');
      const statusUpdated = await updateComplaintStatus(complaint.id, status, comment.trim());
      
      if (statusUpdated) {
        console.log('✅ Status updated successfully');
        
        // Add the comment if user exists
        if (user && comment.trim()) {
          console.log('💬 Adding comment...');
          await addComment(complaint.id, comment.trim());
        }
        
        // Force refresh the complaints data
        console.log('🔄 Force refreshing complaints...');
        await refreshComplaints();
        
        // Show success message
        toast.success(`Status updated to ${status.replace('_', ' ')}`);
        
        // Navigate back with a delay to ensure state updates
        console.log('🔄 Navigating back to tasks...');
        setTimeout(() => {
          navigate('/department/tasks');
        }, 1000);
      } else {
        throw new Error('Status update failed');
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
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
  
  const isDeadlineNear = () => {
    if (!complaint.estimated_resolution_date) return false;
    
    const deadline = new Date(complaint.estimated_resolution_date);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 1;
  };

  // Get available status options based on current status
  const getAvailableStatusOptions = () => {
    const currentStatus = complaint.status;
    
    switch (currentStatus) {
      case 'assigned':
        return [
          { value: 'assigned', label: 'Assigned' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' }
        ];
      case 'in_progress':
        return [
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' }
        ];
      case 'completed':
        return [
          { value: 'completed', label: 'Completed' }
        ];
      case 'escalated':
        return [
          { value: 'escalated', label: 'Escalated' }
        ];
      default:
        return [
          { value: 'assigned', label: 'Assigned' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' }
        ];
    }
  };

  const availableStatusOptions = getAvailableStatusOptions();

  // Handle status change with proper logging and state update
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ComplaintStatus;
    console.log('🔄 Status changing from', status, 'to', newStatus);
    setStatus(newStatus);
    
    // Clear comment when status changes to encourage fresh input
    if (newStatus !== status) {
      setComment('');
    }
  };

  // Get placeholder text based on selected status
  const getPlaceholderText = () => {
    switch (status) {
      case 'assigned':
        return 'Provide details about starting the work and expected timeline...';
      case 'in_progress':
        return 'Provide an update on the current progress and any important information...';
      case 'completed':
        return 'Describe the work completed and any follow-up instructions...';
      default:
        return 'Provide an update on the current progress...';
    }
  };

  // Get help text based on selected status
  const getHelpText = () => {
    switch (status) {
      case 'assigned':
        return 'Provide details about starting the work and expected timeline.';
      case 'in_progress':
        return 'Provide an update on the current progress and any important information.';
      case 'completed':
        return 'Describe the work completed and any follow-up instructions for the employee.';
      default:
        return 'Provide relevant information about the status update.';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/department/tasks')}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Update Task Progress</h1>
          <p className="text-gray-600">Update status and add progress comments</p>
        </div>
      </div>

      {/* Complaint Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Complaint Details</h3>
            <p className="text-sm text-gray-500">ID: {complaint.id}</p>
          </div>
          <StatusBadge status={complaint.status} size="lg" />
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Type</h4>
              <p className="text-gray-900 capitalize">{complaint.type}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Submitted</h4>
              <p className="text-gray-900">{formatDate(complaint.created_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Employee</h4>
              <p className="text-gray-900">{complaint.employee_name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Location</h4>
              <p className="text-gray-900">{complaint.employee_quarter}, {complaint.employee_area}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Contact</h4>
              <p className="text-gray-900">{complaint.employee_contact}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Deadline</h4>
              <p className={`text-gray-900 ${isDeadlineNear() ? 'text-red-600 font-medium' : ''}`}>
                {formatDate(complaint.estimated_resolution_date)}
                {isDeadlineNear() && ' (Urgent)'}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{complaint.description}</p>
          </div>
        </div>
      </div>

      {/* Update Form or Completion Message */}
      {(complaint.status === 'completed' || complaint.status === 'escalated') ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {complaint.status === 'completed' ? 'Task Completed' : 'Task Escalated'}
          </h3>
          <p className="text-gray-500 mb-6">
            {complaint.status === 'completed' 
              ? 'This task has been marked as completed. No further action is required.' 
              : 'This task has been escalated. Please contact administration for more information.'}
          </p>
          <button
            onClick={() => navigate('/department/tasks')}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Update Progress</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={handleStatusChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer"
                required
                disabled={isSubmitting}
              >
                {availableStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {status === 'assigned' && 'Task is assigned but work has not started yet'}
                {status === 'in_progress' && 'Work is currently in progress'}
                {status === 'completed' && 'Task has been completed successfully'}
              </p>
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Progress Comment *
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={getPlaceholderText()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                required
                disabled={isSubmitting}
              />
              <p className="mt-2 text-xs text-gray-500">
                {getHelpText()}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/department/tasks')}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Previous Comments Section */}
      {complaint.comments && complaint.comments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Previous Updates</h3>
          <div className="space-y-4">
            {[...complaint.comments].reverse().map((comment) => (
              <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                    {comment.user_name.charAt(0)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{comment.user_name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      comment.user_role === 'admin' ? 'bg-red-100 text-red-800' :
                      comment.user_role === 'department' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {comment.user_role === 'admin' ? 'Administrator' : 
                       comment.user_role === 'department' ? 'Department Staff' : 'Employee'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {formatDate(comment.created_at)}
                  </p>
                  <p className="text-sm text-gray-700">{comment.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProgress;