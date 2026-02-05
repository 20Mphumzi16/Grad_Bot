import { Outlet } from 'react-router';
import { useState } from 'react';
import { useIsMobile } from '@/components/ui/use-mobile';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

type SidebarContext = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
};

export function AdminShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar: Fixed on mobile, Relative on desktop */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      {/* Main Content Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <AdminHeader 
          onMobileMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
        />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ isSidebarOpen, setIsSidebarOpen, isMobile } satisfies SidebarContext} />
        </main>
      </div>
    </div>
  );
}
