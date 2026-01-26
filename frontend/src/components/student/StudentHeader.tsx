import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Bell, LogOut, Moon, Sun, MessageSquare, User, BookOpen, Calendar, FileText, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { useStudentNotifications } from '../../context/StudentNotificationContext';
import { API_BASE_URL } from '../../utils/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const pageLabels: Record<string, string> = {
  '/student': 'Dashboard',
  '/student/chat': 'Chat Assistant',
  '/student/resources': 'Resources',
  '/student/timeline': 'My Timeline',
  '/student/documents': 'Documents',
  '/student/profile': 'Profile',
};

const pageIcons: Record<string, any> = {
  '/student': Home,
  '/student/chat': MessageSquare,
  '/student/resources': BookOpen,
  '/student/timeline': Calendar,
  '/student/documents': FileText,
  '/student/profile': User,
};

export function StudentHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState<boolean>(false);
  const [avatarVersion, setAvatarVersion] = useState<number>(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const { notifications, markAsViewed } = useStudentNotifications();


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

  // Listen for avatar updates coming from other parts of the app (e.g. StudentProfile)
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleNotificationClick = (item: any) => {
    markAsViewed(item.type);
    navigate(item.path);
  };

  const CurrentIcon = pageIcons[location.pathname];

  return (
    <header className="fixed top-0 left-0 right-0 border-b z-40 h-16" style={{
      backgroundColor: 'var(--background)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)'
    }}>
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-64">
          {CurrentIcon && <CurrentIcon className="w-6 h-6" />}
          <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{pageLabels[location.pathname] || 'My Dashboard'}</h1>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              sideOffset={12}
              className="w-[700px] z-[100] border shadow-md"
              style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#ffffff' : '#000000' }}
            >
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((item) => (
                    <DropdownMenuItem 
                      key={`${item.type}-${item.id}`}
                      className="cursor-pointer flex flex-col items-start gap-1 p-3"
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="font-medium text-sm">
                        {item.subType === 'completed' ? 'Milestone Completed' :
                         item.type === 'milestone' ? 'New Milestone' : 
                         item.type === 'resource' ? 'New Resource' : 'New Document'}
                      </div>
                      <div className="text-xs font-semibold text-foreground line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
