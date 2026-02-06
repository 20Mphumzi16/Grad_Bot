import { Outlet, useLocation, useOutletContext } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '../ui/PageTransition';

type SidebarContext = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
};

export function AdminLayout() {
  const location = useLocation();
  // We can still consume context if needed, but layout is simplified
  const { isSidebarOpen, setIsSidebarOpen, isMobile } = useOutletContext<SidebarContext>();

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname} className="min-h-full">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </div>
    </div>
  );
}
