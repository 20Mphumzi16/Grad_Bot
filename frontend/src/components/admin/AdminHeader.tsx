import { Button } from '../ui/button';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';

export function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-64">
          <h1 className="text-gray-900">Admin Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          <div className="h-8 w-px bg-gray-200" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500" />
            <div className="text-sm">
              <p className="text-gray-900">Admin User</p>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
