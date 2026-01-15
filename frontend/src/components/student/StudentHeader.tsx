import { Button } from '../ui/button';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ConfirmDialog } from '../ui/confirm-dialog';

const pageLabels: Record<string, string> = {
  '/student': 'Dashboard',
  '/student/chat': 'Chat Assistant',
  '/student/resources': 'Resources',
  '/student/timeline': 'My Timeline',
  '/student/documents': 'Documents',
  '/student/profile': 'Profile',
};

export function StudentHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) return;
        const data: any = await res.json();

        // Common field names returned by /auth/me
        const f = data.first_name || data.given_name || data.firstName || data.first || (data.name ? data.name.split(' ')[0] : null);
        const l = data.last_name || data.family_name || data.lastName || data.last || (data.name ? data.name.split(' ').slice(1).join(' ') : null);

        if (f) setFirstName(f);
        if (l) setLastName(l);
      } catch {
        // ignore errors silently
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };


  return (
    <header className="fixed top-0 left-0 right-0 border-b z-40 h-16" style={{
      backgroundColor: 'var(--background)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)'
    }}>
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-64">
          <h1 style={{ color: 'var(--foreground)' }}>{pageLabels[location.pathname] || 'My Dashboard'}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
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

          <div className="h-8 w-px" style={{ backgroundColor: 'var(--border)' }} />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm">
              {firstName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-sm">
              <p style={{ color: 'var(--foreground)' }}>{firstName} {lastName}</p>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>Graduate 2025</p>
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
