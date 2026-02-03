import { LayoutDashboard, FileText, BarChart3, Settings, MessageSquare, Users, CheckSquare, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useIsMobile } from '@/components/ui/use-mobile';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: FileText, label: 'Documents', path: '/admin/documents' },
  { icon: Users, label: 'User Management', path: '/admin/users' },
  { icon: CheckSquare, label: 'Task Management', path: '/admin/tasks' },
  { icon: MessageSquare, label: 'Conversations', path: '/admin/conversations' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export function AdminSidebarContent({ onItemClick, minified = false }: { onItemClick?: () => void; minified?: boolean }) {
  const location = useLocation();

  return (
    <div className={cn("h-full flex flex-col transition-all duration-300", minified ? "items-center py-2" : "p-6 pt-2")}>
      <nav className="space-y-1 flex-1 w-full mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

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
              onClick={() => onItemClick?.()}
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
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className={cn(
                "flex items-center overflow-hidden transition-all duration-300 ease-in-out",
                minified ? "hidden" : "flex-1 w-auto opacity-100 ml-3"
              )}>
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

interface AdminSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
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

        <AdminSidebarContent 
          minified={!isOpen} 
          onItemClick={isOpen ? onToggle : undefined} 
        />
      </div>
    </aside>
  );
}
