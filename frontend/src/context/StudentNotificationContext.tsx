import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface NotificationItem {
  id: string;
  type: 'milestone' | 'document' | 'resource';
  title: string;
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
        const authRes = await fetch('http://127.0.0.1:8000/auth/me', {
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
      const mileRes = await fetch(`http://127.0.0.1:8000/timeline/${currentGradId}/milestones-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let mileTime = 0;
      if (mileRes.ok) {
        const milestones = await mileRes.json();
        mileTime = getMaxTime(milestones);
        setLatestMilestoneTime(mileTime);

        const lastViewed = parseInt(localStorage.getItem(`grad_milestone_viewed_time_${currentGradId}`) || '0', 10);
        if (mileTime > lastViewed) {
          setHasNewMilestone(true);
          // Add new milestones to list
          milestones.forEach((m: any) => {
             if (new Date(m.created_at).getTime() > lastViewed) {
               newNotifications.push({
                 id: m.id,
                 type: 'milestone',
                 title: m.title,
                 created_at: m.created_at,
                 path: '/student/timeline'
               });
             }
          });
        } else {
          setHasNewMilestone(false);
        }
      }

      // 3. Get Documents & Resources
      const docRes = await fetch('http://127.0.0.1:8000/documents/get-documents');
      
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
                 title: d.file_name,
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
          // Duplicate check to avoid showing same doc twice if it's both new doc and resource? 
          // The user treats them as separate tabs but same data source.
          // We can add them as 'resource' type too if we want them in the list distinctively, 
          // but usually it's the same file. 
          // However, for the dropdown, maybe we just show "New Document: X". 
          // But if we want to redirect to Resources tab, we might need a separate entry or just link to one.
          // Let's stick to adding them as Documents mostly, but if we need to show Resources specifically...
          // Actually, the request says "Resources - name of resource". 
          // Since they are the same data, I'll just check if it's already in the list as document.
          // But wait, the Sidebar has separate indicators.
          // If I click Documents, it clears Document dot. Resources dot might remain?
          // The logic in Sidebar was: check docTime against lastViewedDocTime AND lastViewedResTime separately.
          // So if I viewed Documents, docTime <= lastViewedDocTime. But if I haven't viewed Resources, docTime > lastViewedResTime.
          // So the "new item" is technically new to the "Resources" tab too.
          // I will add it as 'resource' if it's new to resources.
          
          docs.forEach((d: any) => {
            if (new Date(d.created_at).getTime() > lastViewedRes) {
               // Check if we already added this as document
               const existing = newNotifications.find(n => n.id === d.id && n.type === 'document');
               if (!existing) {
                   newNotifications.push({
                     id: d.id,
                     type: 'resource',
                     title: d.file_name,
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

export function useStudentNotifications() {
  const context = useContext(StudentNotificationContext);
  if (context === undefined) {
    throw new Error('useStudentNotifications must be used within a StudentNotificationProvider');
  }
  return context;
}
