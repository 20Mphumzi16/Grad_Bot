import { Button } from '../ui/button';
import { LogOut, Moon, Sun, LayoutDashboard, FileText, BarChart3, Settings, MessageSquare, Users, CheckSquare, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ConfirmDialog } from '../ui/confirm-dialog';
import logo from '../../assets/logo.png';
import logo1 from '../../assets/logo1.png';

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

export function AdminHeader({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const CurrentIcon = pageIcons[location.pathname];

  return (
    <header 
      className="fixed top-0 left-0 right-0 border-b z-40 h-16"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    >
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-16 pl-4 md:pl-8">
          <div className="md:hidden flex items-center mr-2 shrink-0">
            <img 
              src={isDark ? logo1 : logo} 
              alt="Datacentrix Logo" 
              className="h-8 w-auto object-contain"
            />
          </div>

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

          <>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowConfirm(true)}
              style={{ color: 'var(--muted-foreground)' }}
              className="hover:opacity-75"
            >
              <LogOut className="w-5 h-5" />
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
          </>
        </div>
      </div>
    </header>
  );
}
