import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export type ComplaintStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'escalated' | 'authority_assigned' | 'authority_resolved';
export type ComplaintType = 'water' | 'electrical' | 'plumbing' | 'carpentry' | 'civil' | 'other';

export interface Complaint {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_quarter: string;
  employee_area: string;
  employee_contact: string;
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  department_id?: string;
  department_name?: string;
  assigned_employee_id?: string;
  assigned_at?: string;
  estimated_resolution_date?: string;
  completed_at?: string;
  escalated_to_authority?: string;
  escalated_authority_at?: string;
  authority_resolution_date?: string;
  authority_comments?: string;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
  status_history?: StatusHistory[];
}

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  comment: string;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  status: ComplaintStatus;
  updated_by: string;
  comments?: string;
  created_at: string;
}

interface ComplaintContextType {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<Complaint>;
  updateComplaintStatus: (complaintId: string, status: ComplaintStatus, comments?: string) => Promise<boolean>;
  assignComplaint: (complaintId: string, departmentId: string, departmentName: string, estimatedDate: string) => Promise<boolean>;
  assignToAuthority: (complaintId: string, authorityName: string, authorityEmail: string, estimatedDate: string, comments?: string) => Promise<boolean>;
  addComment: (complaintId: string, comment: string) => Promise<boolean>;
  escalateComplaint: (complaintId: string, reason: string) => Promise<boolean>;
  fetchComplaints: () => Promise<void>;
  getComplaintById: (id: string) => Complaint | undefined;
  refreshComplaints: () => Promise<void>;
}

const ComplaintContext = createContext<ComplaintContextType | null>(null);

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};

// Demo data for offline mode
const DEMO_COMPLAINTS: Complaint[] = [
  {
    id: 'C001',
    employee_id: 'employee-1',
    employee_name: 'John Employee',
    employee_quarter: 'A-123',
    employee_area: 'Sector 5',
    employee_contact: '9876543210',
    type: 'water',
    description: 'No water supply since morning',
    status: 'new',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    comments: [],
    status_history: [{
      id: 'SH001',
      status: 'new',
      updated_by: 'System',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    }],
  },
  {
    id: 'C002',
    employee_id: 'employee-1',
    employee_name: 'John Employee',
    employee_quarter: 'A-123',
    employee_area: 'Sector 5',
    employee_contact: '9876543210',
    type: 'electrical',
    description: 'Power fluctuation in the quarter',
    status: 'assigned',
    department_name: 'Electrical Department',
    assigned_at: new Date(Date.now() - 72000000).toISOString(),
    estimated_resolution_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 72000000).toISOString(),
    comments: [{
      id: 'CM001',
      user_id: 'admin-1',
      user_name: 'Admin User',
      user_role: 'admin',
      comment: 'Assigned to Electrical Department',
      created_at: new Date(Date.now() - 72000000).toISOString(),
    }],
    status_history: [
      {
        id: 'SH002',
        status: 'new',
        updated_by: 'System',
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'SH003',
        status: 'assigned',
        updated_by: 'Admin User',
        comments: 'Assigned to Electrical Department',
        created_at: new Date(Date.now() - 72000000).toISOString(),
      },
    ],
  },
];

export const ComplaintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, connectionStatus } = useAuth();

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user, connectionStatus]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching complaints...', { connectionStatus });

      if (connectionStatus === 'offline') {
        // Offline mode - use demo data
        const storedComplaints = localStorage.getItem('bccl_complaints');
        const complaintsData = storedComplaints ? JSON.parse(storedComplaints) : DEMO_COMPLAINTS;
        console.log('📱 Loaded offline complaints:', complaintsData.length);
        setComplaints(complaintsData);
        return;
      }

      // Online mode - fetch from database
      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select(`
          *,
          complaint_comments(*),
          complaint_status_history(*)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedComplaints = data?.map(complaint => ({
        ...complaint,
        comments: complaint.complaint_comments || [],
        status_history: complaint.complaint_status_history || [],
      })) || [];

      console.log('🌐 Loaded online complaints:', transformedComplaints.length);
      setComplaints(transformedComplaints);
      
      // Also save to localStorage for offline access
      localStorage.setItem('bccl_complaints', JSON.stringify(transformedComplaints));
    } catch (err: any) {
      console.error('❌ Error fetching complaints:', err);
      setError(err.message);
      
      // Fallback to offline mode
      if (err.message.includes('fetch')) {
        toast.error('Connection failed. Using offline mode.');
        const storedComplaints = localStorage.getItem('bccl_complaints');
        const complaintsData = storedComplaints ? JSON.parse(storedComplaints) : DEMO_COMPLAINTS;
        setComplaints(complaintsData);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshComplaints = async () => {
    console.log('🔄 Refreshing complaints...');
    await fetchComplaints();
  };

  const updateLocalStorage = (updatedComplaints: Complaint[]) => {
    console.log('💾 Updating localStorage with', updatedComplaints.length, 'complaints');
    localStorage.setItem('bccl_complaints', JSON.stringify(updatedComplaints));
    setComplaints(updatedComplaints);
  };

  const addComplaint = async (newComplaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Complaint> => {
    try {
      const complaint: Complaint = {
        ...newComplaint,
        id: `C${String(complaints.length + 1).padStart(3, '0')}`,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        comments: [],
        status_history: [{
          id: `SH${Date.now()}`,
          status: 'new',
          updated_by: 'System',
          created_at: new Date().toISOString(),
        }],
      };

      if (connectionStatus === 'online') {
        const { data, error } = await supabase
          .from('complaints')
          .insert([{
            ...newComplaint,
            status: 'new',
          }])
          .select()
          .single();

        if (error) throw error;

        // Add status history
        await supabase
          .from('complaint_status_history')
          .insert([{
            complaint_id: data.id,
            status: 'new',
            updated_by: 'System',
          }]);

        await fetchComplaints();
        toast.success('Complaint submitted successfully');
        return data;
      } else {
        // Offline mode
        const updatedComplaints = [...complaints, complaint];
        updateLocalStorage(updatedComplaints);
        toast.success('Complaint submitted successfully (Offline mode)');
        return complaint;
      }
    } catch (err: any) {
      console.error('Error adding complaint:', err);
      toast.error('Failed to submit complaint');
      throw err;
    }
  };

  const updateComplaintStatus = async (complaintId: string, status: ComplaintStatus, comments?: string): Promise<boolean> => {
    try {
      console.log('🔄 Starting status update:', { 
        complaintId, 
        status, 
        comments, 
        connectionStatus,
        currentComplaintsCount: complaints.length 
      });
      
      if (connectionStatus === 'online') {
        const updateData: any = { 
          status,
          updated_at: new Date().toISOString()
        };
        if (status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }

        console.log('📤 Sending update to database:', updateData);

        const { error } = await supabase
          .from('complaints')
          .update(updateData)
          .eq('id', complaintId);

        if (error) {
          console.error('❌ Database update error:', error);
          throw error;
        }

        console.log('✅ Database update successful');

        // Add status history
        const { error: historyError } = await supabase
          .from('complaint_status_history')
          .insert([{
            complaint_id: complaintId,
            status,
            updated_by: user?.name || 'Unknown',
            comments,
          }]);

        if (historyError) {
          console.error('⚠️ Status history error:', historyError);
        }

        // Force refresh the complaints data
        console.log('🔄 Force refreshing complaints data...');
        await fetchComplaints();
        console.log('✅ Complaints data refreshed');
      } else {
        // Offline mode
        console.log('📱 Updating in offline mode');
        const updatedComplaints = complaints.map(complaint => {
          if (complaint.id === complaintId) {
            const updatedComplaint = {
              ...complaint,
              status,
              updated_at: new Date().toISOString(),
              status_history: [
                ...(complaint.status_history || []),
                {
                  id: `SH${Date.now()}`,
                  status,
                  updated_by: user?.name || 'Unknown',
                  comments,
                  created_at: new Date().toISOString(),
                },
              ],
            };
            
            if (status === 'completed') {
              updatedComplaint.completed_at = new Date().toISOString();
            }
            
            console.log('📱 Updated complaint offline:', updatedComplaint);
            return updatedComplaint;
          }
          return complaint;
        });
        
        console.log('📱 Saving updated complaints offline:', updatedComplaints.length);
        updateLocalStorage(updatedComplaints);
      }

      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      return true;
    } catch (err: any) {
      console.error('❌ Error updating complaint status:', err);
      toast.error('Failed to update complaint status');
      return false;
    }
  };

  const assignComplaint = async (complaintId: string, departmentId: string, departmentName: string, estimatedDate: string): Promise<boolean> => {
    try {
      if (connectionStatus === 'online') {
        const { error } = await supabase
          .from('complaints')
          .update({
            status: 'assigned',
            department_id: departmentId,
            department_name: departmentName,
            assigned_at: new Date().toISOString(),
            estimated_resolution_date: estimatedDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', complaintId);

        if (error) throw error;

        await supabase
          .from('complaint_status_history')
          .insert([{
            complaint_id: complaintId,
            status: 'assigned',
            updated_by: user?.name || 'Admin',
            comments: `Assigned to ${departmentName}`,
          }]);

        await fetchComplaints();
      } else {
        // Offline mode
        const updatedComplaints = complaints.map(complaint => {
          if (complaint.id === complaintId) {
            return {
              ...complaint,
              status: 'assigned' as ComplaintStatus,
              department_id: departmentId,
              department_name: departmentName,
              assigned_at: new Date().toISOString(),
              estimated_resolution_date: estimatedDate,
              updated_at: new Date().toISOString(),
              status_history: [
                ...(complaint.status_history || []),
                {
                  id: `SH${Date.now()}`,
                  status: 'assigned' as ComplaintStatus,
                  updated_by: user?.name || 'Admin',
                  comments: `Assigned to ${departmentName}`,
                  created_at: new Date().toISOString(),
                },
              ],
            };
          }
          return complaint;
        });
        
        updateLocalStorage(updatedComplaints);
      }

      toast.success(`Complaint assigned to ${departmentName}`);
      return true;
    } catch (err: any) {
      console.error('Error assigning complaint:', err);
      toast.error('Failed to assign complaint');
      return false;
    }
  };

  const assignToAuthority = async (complaintId: string, authorityName: string, authorityEmail: string, estimatedDate: string, comments?: string): Promise<boolean> => {
    try {
      if (connectionStatus === 'online') {
        const { error } = await supabase
          .from('complaints')
          .update({
            status: 'authority_assigned',
            escalated_to_authority: `${authorityName} (${authorityEmail})`,
            escalated_authority_at: new Date().toISOString(),
            authority_resolution_date: estimatedDate,
            authority_comments: comments,
            updated_at: new Date().toISOString(),
          })
          .eq('id', complaintId);

        if (error) throw error;

        await supabase
          .from('complaint_status_history')
          .insert([{
            complaint_id: complaintId,
            status: 'authority_assigned',
            updated_by: user?.name || 'Admin',
            comments: `Assigned to higher authority: ${authorityName}${comments ? ` - ${comments}` : ''}`,
          }]);

        await fetchComplaints();
      } else {
        // Offline mode
        const updatedComplaints = complaints.map(complaint => {
          if (complaint.id === complaintId) {
            return {
              ...complaint,
              status: 'authority_assigned' as ComplaintStatus,
              escalated_to_authority: `${authorityName} (${authorityEmail})`,
              escalated_authority_at: new Date().toISOString(),
              authority_resolution_date: estimatedDate,
              authority_comments: comments,
              updated_at: new Date().toISOString(),
              status_history: [
                ...(complaint.status_history || []),
                {
                  id: `SH${Date.now()}`,
                  status: 'authority_assigned' as ComplaintStatus,
                  updated_by: user?.name || 'Admin',
                  comments: `Assigned to higher authority: ${authorityName}${comments ? ` - ${comments}` : ''}`,
                  created_at: new Date().toISOString(),
                },
              ],
            };
          }
          return complaint;
        });
        
        updateLocalStorage(updatedComplaints);
      }

      toast.success(`Complaint assigned to ${authorityName}`);
      return true;
    } catch (err: any) {
      console.error('Error assigning to authority:', err);
      toast.error('Failed to assign to higher authority');
      return false;
    }
  };

  const addComment = async (complaintId: string, comment: string): Promise<boolean> => {
    try {
      if (!user) throw new Error('User not authenticated');

      if (connectionStatus === 'online') {
        const { error } = await supabase
          .from('complaint_comments')
          .insert([{
            complaint_id: complaintId,
            user_id: user.id,
            user_name: user.name,
            user_role: user.role,
            comment,
          }]);

        if (error) throw error;
        await fetchComplaints();
      } else {
        // Offline mode
        const updatedComplaints = complaints.map(complaint => {
          if (complaint.id === complaintId) {
            return {
              ...complaint,
              comments: [
                ...(complaint.comments || []),
                {
                  id: `CM${Date.now()}`,
                  user_id: user.id,
                  user_name: user.name,
                  user_role: user.role,
                  comment,
                  created_at: new Date().toISOString(),
                },
              ],
            };
          }
          return complaint;
        });
        
        updateLocalStorage(updatedComplaints);
      }

      toast.success('Comment added successfully');
      return true;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
      return false;
    }
  };

  const escalateComplaint = async (complaintId: string, reason: string): Promise<boolean> => {
    try {
      await updateComplaintStatus(complaintId, 'escalated', reason);
      await addComment(complaintId, `Complaint escalated: ${reason}`);
      toast.success('Complaint has been escalated');
      return true;
    } catch (err: any) {
      console.error('Error escalating complaint:', err);
      toast.error('Failed to escalate complaint');
      return false;
    }
  };

  const getComplaintById = (id: string): Complaint | undefined => {
    return complaints.find(complaint => complaint.id === id);
  };

  return (
    <ComplaintContext.Provider value={{
      complaints,
      loading,
      error,
      addComplaint,
      updateComplaintStatus,
      assignComplaint,
      assignToAuthority,
      addComment,
      escalateComplaint,
      fetchComplaints,
      getComplaintById,
      refreshComplaints,
    }}>
      {children}
    </ComplaintContext.Provider>
  );
};