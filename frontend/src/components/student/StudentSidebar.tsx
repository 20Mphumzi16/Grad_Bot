import { MessageSquare, User, BookOpen, Calendar, FileText, Home, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useStudentNotifications } from '@/context/StudentNotificationContext';
import { useIsMobile } from '@/components/ui/use-mobile';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/student' },
  { icon: MessageSquare, label: 'Chat Assistant', path: '/student/chat' },
  { icon: BookOpen, label: 'Resources', path: '/student/resources' },
  { icon: Calendar, label: 'My Timeline', path: '/student/timeline' },
  { icon: FileText, label: 'Documents', path: '/student/documents' },
  { icon: User, label: 'Profile', path: '/student/profile' },
];

export function StudentSidebarContent({ onItemClick, minified = false }: { onItemClick?: () => void; minified?: boolean }) {
  const location = useLocation();
  const { hasNewMilestone, hasNewDocument, hasNewResource, markAsViewed } = useStudentNotifications();

  const handleLinkClick = (path: string) => {
    if (path === '/student/timeline' && hasNewMilestone) {
      markAsViewed('milestone');
    }
    if (path === '/student/documents' && hasNewDocument) {
      markAsViewed('document');
    }
    if (path === '/student/resources' && hasNewResource) {
      markAsViewed('resource');
    }
    onItemClick?.();
  };

  return (
    <div className={cn("h-full flex flex-col transition-all duration-300", minified ? "items-center py-2" : "p-6 pt-2")}>
      <nav className="space-y-1 flex-1 w-full mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          const showDot = 
            (item.path === '/student/timeline' && hasNewMilestone) ||
            (item.path === '/student/documents' && hasNewDocument) ||
            (item.path === '/student/resources' && hasNewResource);

          const activeStyle = isActive 
            ? (minified 
                ? { 
                    color: '#3b82f6', // Primary Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Subtle Blue BG
                    backgroundImage: 'none'
                  } 
                : { 
                    backgroundImage: 'linear-gradient(to right, #3b82f6, #14b8a6)', 
                    color: 'white' 
                  }
              )
            : { 
                color: 'var(--muted-foreground)', 
                backgroundColor: 'transparent',
                backgroundImage: 'none'
              };

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => handleLinkClick(item.path)}
              className={cn(
                "flex items-center transition-all duration-300 rounded-xl relative group",
                minified ? "w-10 h-10 justify-center p-0 mx-auto" : "px-4 py-3"
              )}
              style={activeStyle}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }
              }}
              title={minified ? item.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {showDot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--background)]" />
                )}
              </div>
              
              <div className={cn(
                "flex items-center justify-between overflow-hidden transition-all duration-300 ease-in-out",
                minified ? "hidden" : "flex-1 w-auto opacity-100 ml-3"
              )}>
                <span className="truncate whitespace-nowrap">{item.label}</span>
                {showDot && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

interface StudentSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function StudentSidebar({ isOpen, onToggle }: StudentSidebarProps) {
  const isMobile = useIsMobile();
  
  // Logic:
  // - Desktop (md): Always w-64, no hamburger, not minified.
  // - Mobile: w-16 (closed) or w-64 (open). Hamburger visible. Minified when closed.
  
  return (
    <aside 
      className={cn(
        "fixed left-0 top-16 bottom-0 border-r z-30 transition-all duration-300",
        isOpen ? "w-64" : "w-16" // Dynamic width on mobile and desktop
      )}
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    >
      <div className="h-full flex flex-col">
        {/* Hamburger Toggle */}
        <div className={cn(
          "flex items-center transition-all duration-300",
          isOpen ? "p-4" : "flex-col py-4 items-center"
        )}>
          <Button variant="ghost" size="icon" onClick={onToggle} className={isOpen ? "" : "mb-2"}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop Spacer - Hidden on Mobile */}
        <div className="hidden md:block pt-6"></div>

        <StudentSidebarContent 
          minified={!isOpen} 
          onItemClick={isOpen ? onToggle : undefined} 
        />
      </div>
    </aside>
  );
}
