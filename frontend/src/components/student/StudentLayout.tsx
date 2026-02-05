import { Outlet, useLocation, useOutletContext } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '../ui/PageTransition';

type SidebarContext = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
};

export function StudentLayout() {
  const location = useLocation();
  // We can still consume context if needed, but layout is simplified
  const { isSidebarOpen, setIsSidebarOpen, isMobile } = useOutletContext<SidebarContext>();

  return (
    <div className="min-h-full p-8 md:p-8 pb-20 md:pb-8">
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname} className="h-full">
          <Outlet />
        </PageTransition>
      </AnimatePresence>
    </div>
  );
}
