import { Button } from '../ui/button';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';


export function StudentHeader() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

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
  const [showConfirm, setShowConfirm] = useState(false);


  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-64">
          <h1 className="text-gray-900">My Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
          </Button>

          <div className="h-8 w-px bg-gray-200" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm">
              {firstName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-sm">
              <p className="text-gray-900">{firstName} {lastName}</p>
              <p className="text-gray-500 text-xs">Graduate 2025</p>
            </div>
          </div>

          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConfirm(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
            </Button>

            {showConfirm && (
  <div className="fixed inset-0 z-50">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => setShowConfirm(false)}
    />

    {/* Centered dialog */}
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to log out?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white"
            onClick={() => {
              setShowConfirm(false);
              handleLogout();
            }}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  </div>
)}

          </>
        </div>
      </div>
    </header>
  );
}
