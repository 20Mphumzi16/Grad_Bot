import { MessageSquare, User, BookOpen, Calendar, FileText, Home, ChevronRight, PanelLeftClose, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { useStudentNotifications } from '@/context/StudentNotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/components/ui/use-mobile';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import logo from '@/assets/logo.png';
import logo1 from '@/assets/logo1.png';
import logo2 from '@/assets/logo2.png';

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
  const navigate = useNavigate();
  const { hasNewMilestone, hasNewDocument, hasNewResource, markAsViewed } = useStudentNotifications();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

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
    <div className={cn("flex-1 min-h-0 flex flex-col transition-all duration-300", minified ? "items-center py-2" : "p-6 pt-2")}>
      <nav className="space-y-1 flex-1 w-full mt-4 overflow-y-auto">
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
                minified ? "w-0 opacity-0 ml-0" : "flex-1 w-auto opacity-100 ml-3"
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

      <div className="mt-auto w-full pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => setShowConfirm(true)}
          className={cn(
            "flex items-center transition-all duration-300 rounded-xl relative group w-full hover:bg-red-50 hover:text-red-600",
            minified ? "w-10 h-10 justify-center p-0 mx-auto" : "px-4 py-3 justify-start"
          )}
          title={minified ? "Logout" : undefined}
        >
          <div className="relative flex-shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          
          <div className={cn(
            "flex items-center overflow-hidden transition-all duration-300 ease-in-out",
            minified ? "w-0 opacity-0 ml-0" : "flex-1 w-auto opacity-100 ml-3"
          )}>
            <span className="truncate whitespace-nowrap">Logout</span>
          </div>
        </Button>

        <ConfirmDialog
          open={showConfirm}
          title="Confirm Logout"
          description="Are you sure you want to log out?"
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            handleLogout();
          }}
          confirmText="Log out"
        />
      </div>
    </div>
  );
}

interface StudentSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function StudentSidebar({ isOpen, onToggle }: StudentSidebarProps) {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  
  // Logic:
  // - Desktop (md): Always w-64, no hamburger, not minified.
  // - Mobile: w-16 (closed) or w-64 (open). Hamburger visible. Minified when closed.
  
  return (
    <aside 
      className={cn(
        "z-50 transition-all duration-300 bg-background flex flex-col relative overflow-visible",
        isMobile 
          ? "fixed inset-y-0 left-0 h-full border-r" 
          : "sticky top-0 m-4 h-[calc(100vh-2rem)] rounded-2xl border shadow-xl",
        isOpen ? "w-64" : "w-16", 
      )}
      style={{
        backgroundColor: isDark ? 'var(--sidebar)' : '#eff6ff',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    >
      {/* Toggle Button - Absolute Positioned on Desktop - Only visible when minified */}
      {!isMobile && !isOpen && (
        <Button
          onClick={onToggle}
          className={cn(
            "absolute -right-3 top-[70px] z-[100] h-6 w-6 rounded-full border shadow-md p-0",
            "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <div className="h-full flex flex-col">
        {/* Logo Section */}
        <div className="relative h-16 w-full overflow-hidden">
          {/* Full Logo + Toggle Button (Visible when open) */}
          <div 
            className={cn(
              "absolute inset-0 flex items-center justify-between px-4 transition-all duration-300 ease-in-out",
              isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
            )}
          >
            <div className="flex items-center gap-2">
              <img src={isDark ? logo1 : logo} alt="Logo" className="h-8 object-contain" />
            </div>
            <Button variant="ghost" size="icon" onClick={onToggle} className="text-muted-foreground hover:text-foreground">
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>

          {/* Icon Logo (Visible when closed) */}
          <div 
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out",
              !isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            )}
          >
            <img 
              src={logo2} 
              alt="GradBot" 
              className="h-8 w-8 object-contain"
            />
          </div>
        </div>

        {/* Desktop Spacer - Hidden on Mobile */}
        <div className="hidden md:block pt-2"></div>

        <StudentSidebarContent 
          minified={!isOpen} 
          onItemClick={isMobile && isOpen ? onToggle : undefined} 
        />
      </div>
    </aside>
  );
}
