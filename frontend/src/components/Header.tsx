import { Button } from './ui/button';
import { Link } from 'react-router';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500" />
          <span className="text-gray-900">Grad Knowledge Assistant</span>
        </Link>
        
        <nav className="flex items-center gap-8">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
            About
          </Button>
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
            How it Works
          </Button>
          <Link to="/student/login">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              Student Login
            </Button>
          </Link>
          <Link to="/admin/login">
            <Button variant="ghost" className="text-gray-400 hover:text-gray-600">
              Admin Login
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}