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
  const { isSidebarOpen, setIsSidebarOpen, isMobile } =
    useOutletContext<SidebarContext>();

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="flex-1 w-full h-full overflow-y-auto p-8 pb-20 md:pb-8">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname} className="min-h-full">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </div>
    </div>
  );
}
