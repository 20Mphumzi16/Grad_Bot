import { MessageSquare, User, BookOpen, Calendar, FileText, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useTheme } from '@/context/ThemeContext';
import logo from '../../assets/logo.png';
import logo1 from '../../assets/logo1.png';
import { useStudentNotifications } from '@/context/StudentNotificationContext';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/student' },
  { icon: MessageSquare, label: 'Chat Assistant', path: '/student/chat' },
  { icon: BookOpen, label: 'Resources', path: '/student/resources' },
  { icon: Calendar, label: 'My Timeline', path: '/student/timeline' },
  { icon: FileText, label: 'Documents', path: '/student/documents' },
  { icon: User, label: 'Profile', path: '/student/profile' },
];

export function StudentSidebar() {
  const location = useLocation();
  const { isDark } = useTheme();
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
  };

  return (
    <aside 
      className="fixed left-0 top-16 bottom-0 w-64 border-r z-30"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)'
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <img 
            src={isDark ? logo1 : logo} 
            alt="Datacentrix Logo" 
            className="h-8 w-auto"
          />
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            const showDot = 
              (item.path === '/student/timeline' && hasNewMilestone) ||
              (item.path === '/student/documents' && hasNewDocument) ||
              (item.path === '/student/resources' && hasNewResource);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleLinkClick(item.path)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  backgroundColor: isActive ? undefined : 'transparent',
                  backgroundImage: isActive ? 'linear-gradient(to right, #3b82f6, #14b8a6)' : undefined,
                  color: isActive ? 'white' : 'var(--muted-foreground)'
                }}
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
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {showDot && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--background)]" />
                  )}
                </div>
                <div className="flex items-center justify-between flex-1">
                  <span>{item.label}</span>
                  {showDot && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
