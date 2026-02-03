import { Outlet, useLocation } from 'react-router';
import { StudentSidebar } from './StudentSidebar';
import { StudentHeader } from './StudentHeader';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '../ui/PageTransition';
import { StudentNotificationProvider } from '@/context/StudentNotificationContext';
import { useState } from 'react';
import { cn } from '@/components/ui/utils';

export function StudentLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <StudentNotificationProvider>
      <div 
        className="min-h-screen"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <StudentHeader onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <div className="flex pt-32">
          <StudentSidebar isOpen={isMobileMenuOpen} onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        {/* Spacer for Minified Sidebar - ensures content is never cut */}
        <div className="w-16 flex-shrink-0" aria-hidden="true" />

        <main className={cn(
            "flex-1 p-4 md:p-8 pb-20 md:pb-8 transition-all duration-300",
            // Removed manual margins as Spacer handles the offset
          )}>
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
