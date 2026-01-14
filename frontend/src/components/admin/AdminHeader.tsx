import { Button } from '../ui/button';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useTheme } from '../../context/ThemeContext';

const pageLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/documents': 'Documents',
  '/admin/conversations': 'Conversations',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
};

export function AdminHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 border-b z-40 h-16"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-64">
          <h1>{pageLabels[location.pathname] || 'Admin Dashboard'}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell 
              className="w-5 h-5"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

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

          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            style={{ color: 'var(--muted-foreground)' }}
            className="hover:opacity-75"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
