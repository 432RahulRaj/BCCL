import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints, ComplaintType } from '../../contexts/ComplaintContext';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const SubmitComplaint: React.FC = () => {
  const { user } = useAuth();
  const { addComplaint } = useComplaints();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<{
    type: ComplaintType;
    description: string;
  }>({
    type: 'water',
    description: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const complaintTypes = [
    { value: 'water', label: 'Water Supply', icon: '💧', description: 'Water supply issues, leakage, quality problems' },
    { value: 'electrical', label: 'Electrical', icon: '⚡', description: 'Power outages, wiring issues, electrical faults' },
    { value: 'plumbing', label: 'Plumbing', icon: '🔧', description: 'Pipe leaks, drainage issues, toilet problems' },
    { value: 'carpentry', label: 'Carpentry', icon: '🪚', description: 'Door/window repairs, furniture issues' },
    { value: 'civil', label: 'Civil Work', icon: '🏗️', description: 'Structural issues, construction problems' },
    { value: 'other', label: 'Other', icon: '📋', description: 'Any other maintenance issues' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Please provide a description of the issue');
      return;
    }
    
    if (!user?.id || !user?.name || !user?.employeeInfo) {
      toast.error('User information is incomplete');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const complaint = await addComplaint({
        employee_id: user.id,
        employee_name: user.name,
        employee_quarter: user.employeeInfo.quarter,
        employee_area: user.employeeInfo.area,
        employee_contact: user.employeeInfo.contactNumber,
        type: formData.type,
        description: formData.description,
      });
      
      toast.success(`Complaint ${complaint.id} submitted successfully`);
      navigate('/employee/track');
    } catch (error) {
      toast.error('Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/employee')}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit New Complaint</h1>
          <p className="text-gray-600">Report an issue in your quarter</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Information (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 text-gray-900">{user?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{user?.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Quarter:</span>
                <span className="ml-2 text-gray-900">
                  {user?.employeeInfo?.quarter}, {user?.employeeInfo?.area}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Contact:</span>
                <span className="ml-2 text-gray-900">{user?.employeeInfo?.contactNumber}</span>
              </div>
            </div>
          </div>
          
          {/* Complaint Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-3">
              Problem Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {complaintTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </div>
                  {formData.type === type.value && (
                    <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Problem Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Please describe the issue in detail. Include any relevant information such as when the problem started, its severity, and any steps you've already taken..."
              value={formData.description}
              onChange={handleChange}
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Provide as much detail as possible to help us resolve your issue quickly.
            </p>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/employee')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.description.trim()}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;