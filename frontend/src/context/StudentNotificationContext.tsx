import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { API_BASE_URL } from '../utils/config';

interface NotificationItem {
  id: string;
  type: 'milestone' | 'document' | 'resource';
  subType?: 'new' | 'completed';
  title: string;
  content?: string;
  created_at: string;
  path: string;
}

interface StudentNotificationContextType {
  notifications: NotificationItem[];
  hasNewMilestone: boolean;
  hasNewDocument: boolean;
  hasNewResource: boolean;
  markAsViewed: (type: 'milestone' | 'document' | 'resource') => void;
  refreshNotifications: () => Promise<void>;
}

const StudentNotificationContext = createContext<StudentNotificationContextType | undefined>(undefined);

export function StudentNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [graduateId, setGraduateId] = useState<string | null>(null);

  // Counters (Timestamps)
  const [latestMilestoneTime, setLatestMilestoneTime] = useState(0);
  const [latestDocTime, setLatestDocTime] = useState(0);
  
  // Flags
  const [hasNewMilestone, setHasNewMilestone] = useState(false);
  const [hasNewDocument, setHasNewDocument] = useState(false);
  const [hasNewResource, setHasNewResource] = useState(false);

  // Track currently completed milestones to update LS on view
  const [currentCompletedMilestoneIds, setCurrentCompletedMilestoneIds] = useState<string[]>([]);

  const getMaxTime = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    return Math.max(...items.map(i => new Date(i.created_at).getTime()));
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 1. Get User ID if not set
      let currentGradId = graduateId;
      if (!currentGradId) {
        const authRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!authRes.ok) return;
        const userData = await authRes.json();
        currentGradId = userData.id;
        setGraduateId(currentGradId);
      }
      
      if (!currentGradId) return;

      const newNotifications: NotificationItem[] = [];

      // 2. Get Milestones
      const mileRes = await fetch(`${API_BASE_URL}/timeline/${currentGradId}/milestones-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let mileTime = 0;
      if (mileRes.ok) {
        const milestones = await mileRes.json();
        mileTime = getMaxTime(milestones);
        setLatestMilestoneTime(mileTime);

        // Track completed IDs for saving later
        const completedIds = milestones
          .filter((m: any) => m.admin_status === 'completed')
          .map((m: any) => String(m.milestone_id));
        setCurrentCompletedMilestoneIds(completedIds);

        const lastViewedTime = parseInt(localStorage.getItem(`grad_milestone_viewed_time_${currentGradId}`) || '0', 10);
        
        // Get known completed IDs from LS
        let knownCompletedIds: string[] = [];
        try {
          const stored = localStorage.getItem(`grad_known_completed_milestones_${currentGradId}`);
          if (stored) {
            knownCompletedIds = JSON.parse(stored);
          }
        } catch (e) {
          console.error("Error parsing known completed milestones", e);
        }

        let hasNew = false;

        milestones.forEach((m: any) => {
           // Check for New Creation
           if (new Date(m.created_at).getTime() > lastViewedTime) {
             hasNew = true;
             newNotifications.push({
               id: String(m.milestone_id),
               type: 'milestone',
               subType: 'new',
               title: m.title,
               content: m.tasks?.map((t: any) => t.name).join(', ') || m.week_label,
               created_at: m.created_at,
               path: '/student/timeline'
             });
           }
           // Check for Completion (Admin Status)
            // If admin_status is completed AND we haven't seen it completed before
            else if (m.admin_status === 'completed' && !knownCompletedIds.includes(String(m.milestone_id))) {
              hasNew = true;
              newNotifications.push({
                id: String(m.milestone_id),
                type: 'milestone',
                subType: 'completed',
                title: m.title,
                content: 'All tasks completed',
                created_at: new Date().toISOString(), // Use current time so it appears at the top
                path: '/student/timeline'
              });
            }
        });

        setHasNewMilestone(hasNew);
      }

      // 3. Get Documents & Resources
      const docRes = await fetch(`${API_BASE_URL}/documents/get-documents`);
      
      let docTime = 0;
      if (docRes.ok) {
        const docs = await docRes.json();
        docTime = getMaxTime(docs);
        setLatestDocTime(docTime);

        const lastViewedDoc = parseInt(localStorage.getItem(`grad_document_viewed_time_${currentGradId}`) || '0', 10);
        if (docTime > lastViewedDoc) {
          setHasNewDocument(true);
          docs.forEach((d: any) => {
            if (new Date(d.created_at).getTime() > lastViewedDoc) {
               newNotifications.push({
                 id: d.id,
                 type: 'document',
                 subType: 'new',
                 title: d.file_name,
                 content: d.description,
                 created_at: d.created_at,
                 path: '/student/documents'
               });
            }
          });
        } else {
          setHasNewDocument(false);
        }

        const lastViewedRes = parseInt(localStorage.getItem(`grad_resource_viewed_time_${currentGradId}`) || '0', 10);
        if (docTime > lastViewedRes) {
          setHasNewResource(true);
          docs.forEach((d: any) => {
            if (new Date(d.created_at).getTime() > lastViewedRes) {
               const existing = newNotifications.find(n => n.id === d.id && n.type === 'document');
               if (!existing) {
                   newNotifications.push({
                     id: d.id,
                     type: 'resource',
                     subType: 'new',
                     title: d.file_name,
                     content: d.description,
                     created_at: d.created_at,
                     path: '/student/resources'
                   });
               }
            }
          });
        } else {
          setHasNewResource(false);
        }
      }

      // Sort by date desc
      newNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(newNotifications);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [graduateId]);

  const markAsViewed = (type: 'milestone' | 'document' | 'resource') => {
    if (!graduateId) return;

    if (type === 'milestone') {
      setHasNewMilestone(false);
      localStorage.setItem(`grad_milestone_viewed_time_${graduateId}`, latestMilestoneTime.toString());
      
      // Merge currently completed IDs into known list
      let knownCompletedIds: string[] = [];
      try {
        const stored = localStorage.getItem(`grad_known_completed_milestones_${graduateId}`);
        if (stored) knownCompletedIds = JSON.parse(stored);
      } catch (e) {}
      
      const updatedKnown = Array.from(new Set([...knownCompletedIds, ...currentCompletedMilestoneIds]));
      localStorage.setItem(`grad_known_completed_milestones_${graduateId}`, JSON.stringify(updatedKnown));

      setNotifications(prev => prev.filter(n => n.type !== 'milestone'));
    } else if (type === 'document') {
      setHasNewDocument(false);
      localStorage.setItem(`grad_document_viewed_time_${graduateId}`, latestDocTime.toString());
      setNotifications(prev => prev.filter(n => n.type !== 'document'));
    } else if (type === 'resource') {
      setHasNewResource(false);
      localStorage.setItem(`grad_resource_viewed_time_${graduateId}`, latestDocTime.toString());
      setNotifications(prev => prev.filter(n => n.type !== 'resource'));
    }
  };

  return (
    <StudentNotificationContext.Provider value={{
      notifications,
      hasNewMilestone,
      hasNewDocument,
      hasNewResource,
      markAsViewed,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </StudentNotificationContext.Provider>
  );
}

export const useStudentNotifications = () => {
  const context = useContext(StudentNotificationContext);
  if (!context) {
    throw new Error('useStudentNotifications must be used within a StudentNotificationProvider');
  }
  return context;
};
