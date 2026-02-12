import { cn } from '@/components/ui/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Moon, Sun, LayoutDashboard, FileText, BarChart3, Settings, MessageSquare, Users, CheckSquare, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useIsMobile } from '@/components/ui/use-mobile';
import { API_BASE_URL } from '@/utils/config';

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
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState<boolean>(false);
  const [avatarVersion, setAvatarVersion] = useState<number>(0);

  const resolveAvatarUrl = (url: string | null) => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
    return `${API_BASE_URL}/${trimmed}`;
  };

  const getInitials = (first: string | null, last: string | null) => {
    const f = first?.trim()?.[0] ?? '';
    const l = last?.trim()?.[0] ?? '';
    const initials = `${f}${l}`.toUpperCase();
    return initials || '?';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;
        const data: any = await res.json();

        // Common field names returned by /auth/me
        const f =
          data.first_name ||
          data.given_name ||
          data.firstName ||
          data.first ||
          (data.name ? data.name.split(' ')[0] : null);
        const l =
          data.last_name ||
          data.family_name ||
          data.lastName ||
          data.last ||
          (data.name ? data.name.split(' ').slice(1).join(' ') : null);

        if (f) setFirstName(f);
        if (l) setLastName(l);
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
          setAvatarLoading(true);
          setAvatarVersion((v) => v + 1);
        }
      } catch {
        // ignore errors silently
      }
    })();
  }, []);

  // Listen for avatar updates coming from other parts of the app
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{
        avatar_url?: string | null;
        firstName?: string;
        lastName?: string;
      }>;

      if (typeof custom.detail?.avatar_url !== 'undefined') {
        setAvatarUrl(custom.detail.avatar_url ?? null);
        if (custom.detail.avatar_url) {
          setAvatarLoading(true);
        }
        setAvatarVersion((v) => v + 1);
      }

      if (custom.detail?.firstName) {
        setFirstName(custom.detail.firstName);
      }

      if (custom.detail?.lastName) {
        setLastName(custom.detail.lastName);
      }
    };

    window.addEventListener('avatarUpdated', handler);
    return () => window.removeEventListener('avatarUpdated', handler);
  }, []);

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
            <div className="relative w-8 h-8">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={
                    resolveAvatarUrl(avatarUrl)
                      ? `${resolveAvatarUrl(avatarUrl)}${resolveAvatarUrl(avatarUrl)?.includes('?') ? '&' : '?'}v=${avatarVersion}`
                      : undefined
                  }
                  onLoad={() => setAvatarLoading(false)}
                  onError={() => setAvatarLoading(false)}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-sm">
                  {getInitials(firstName, lastName)}
                </AvatarFallback>
              </Avatar>
              {avatarLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="text-sm">
              <p style={{ color: 'var(--foreground)' }}>{firstName} {lastName}</p>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>Admin User</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
