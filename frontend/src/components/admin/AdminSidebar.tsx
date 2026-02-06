import { LayoutDashboard, FileText, BarChart3, Settings, MessageSquare, Users, CheckSquare, Menu, PanelLeftClose, ChevronRight, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { useIsMobile } from '@/components/ui/use-mobile';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import logo from '@/assets/logo.png';
import logo1 from '@/assets/logo1.png';
import logo2 from '@/assets/logo2.png';

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
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className={cn("flex-1 min-h-0 flex flex-col transition-all duration-300", minified ? "items-center py-2" : "p-6 pt-2")}>
      <nav className="space-y-1 flex-1 w-full mt-4 overflow-y-auto">
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
            minified ? "hidden" : "flex-1 w-auto opacity-100 ml-3"
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

interface AdminSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  
  // Logic:
  // - Desktop (md): Always w-64, no hamburger, not minified.
  // - Mobile: w-16 (closed) or w-64 (open). Hamburger visible. Minified when closed.
  
  return (
    <aside 
      className={cn(
        "z-50 transition-all duration-300 bg-background flex flex-col relative overflow-visible",
        // Mobile: Fixed positioning
        isMobile 
          ? "fixed inset-y-0 left-0 h-full border-r" 
          : "sticky top-0 m-4 h-[calc(100vh-2rem)] rounded-2xl border shadow-xl",
        isOpen ? "w-64" : "w-16",
      )}
      style={{
        backgroundColor: isDark ? 'var(--background)' : '#eff6ff',
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
        <div className={cn(
          "flex items-center transition-all duration-300 h-16", 
          isOpen ? "justify-between px-4" : "justify-center"
        )}>
          {isOpen ? (
            <>
              <div className="flex items-center gap-2">
                {isDark ? (
                  <img src={logo1} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <img src={logo} alt="Logo" className="h-8 object-contain" />
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle} className="text-muted-foreground hover:text-foreground">
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <img 
              src={logo2} 
              alt="GradBot" 
              className="h-8 w-8 object-contain"
            />
          )}
        </div>

        {/* Desktop Spacer - Hidden on Mobile */}
        <div className="hidden md:block pt-2"></div>

        <AdminSidebarContent 
          minified={!isOpen} 
          onItemClick={isMobile && isOpen ? onToggle : undefined} 
        />
      </div>
    </aside>
  );
}
