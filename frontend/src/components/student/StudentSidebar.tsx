import { MessageSquare, User, BookOpen, Calendar, FileText, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router';

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

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-30">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500" />
          <span className="text-gray-900">Graduate Portal</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
