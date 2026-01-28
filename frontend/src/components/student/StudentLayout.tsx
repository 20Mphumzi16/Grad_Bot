import { Outlet, useLocation } from 'react-router';
import { StudentSidebar } from './StudentSidebar';
import { StudentHeader } from './StudentHeader';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '../ui/PageTransition';
import { StudentNotificationProvider } from '@/context/StudentNotificationContext';

export function StudentLayout() {
  const location = useLocation();

  return (
    <StudentNotificationProvider>
      <div 
        className="min-h-screen"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <StudentHeader />
        <div className="flex">
          <StudentSidebar />
          <main className="flex-1 ml-64 p-8">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname} className="h-full">
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </StudentNotificationProvider>
  );
}
