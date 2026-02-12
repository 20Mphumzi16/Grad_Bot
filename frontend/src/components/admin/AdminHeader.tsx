import { cn } from '@/components/ui/utils';
import { Button } from '../ui/button';
import { Moon, Sun, LayoutDashboard, FileText, BarChart3, Settings, MessageSquare, Users, CheckSquare, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useIsMobile } from '@/components/ui/use-mobile';

const pageLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/documents': 'Documents',
  '/admin/users': 'User Management',
  '/admin/conversations': 'Conversations',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
  '/admin/tasks': 'Task Management',
};

const pageIcons: Record<string, any> = {
  '/admin': LayoutDashboard,
  '/admin/documents': FileText,
  '/admin/users': Users,
  '/admin/conversations': MessageSquare,
  '/admin/analytics': BarChart3,
  '/admin/settings': Settings,
  '/admin/tasks': CheckSquare,
};

export function AdminHeader({ onMobileMenuToggle, isSidebarOpen }: { onMobileMenuToggle?: () => void; isSidebarOpen?: boolean }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Removed internal state as it's not used

  const isMobile = useIsMobile();
  const CurrentIcon = pageIcons[location.pathname];

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 flex-shrink-0 transition-all duration-300",
        isMobile 
          ? "w-full border-b h-16" 
          : "m-4 w-[calc(100%-2rem)] rounded-2xl border shadow-md h-16"
      )}
      style={{
        background: 'var(--header-background)',
        backdropFilter: isDark ? 'blur(12px)' : 'none',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    >
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 pl-0">
          {CurrentIcon && <CurrentIcon className="w-6 h-6 hidden md:block" />}
          <h1 className="text-xl font-semibold truncate">{pageLabels[location.pathname] || 'Admin Dashboard'}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            style={{ color: 'var(--muted-foreground)' }}
            className="hover:opacity-75"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <div 
            className="h-8 w-px"
            style={{ backgroundColor: 'var(--border)' }}
          />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500" />
            <div className="text-sm">
              <p style={{ color: 'var(--foreground)' }}>Admin User</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
