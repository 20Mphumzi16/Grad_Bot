import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useIsMobile } from '@/components/ui/use-mobile';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { CursorEffect } from '@/components/ui/CursorEffect';

type SidebarContext = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
};

export function AdminShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="fixed inset-0 flex w-full h-full bg-background overflow-hidden">
      <CursorEffect />
      {/* Sidebar: Fixed on mobile, Relative on desktop */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      {/* Main Content Column */}
      <div className="relative z-10 flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <AdminHeader 
          onMobileMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
        />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 h-full overflow-hidden relative">
          <Outlet context={{ isSidebarOpen, setIsSidebarOpen, isMobile } satisfies SidebarContext} />
        </main>
      </div>
    </div>
  );
}
