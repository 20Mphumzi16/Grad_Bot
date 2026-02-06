import { useState } from 'react';
import { Button } from './ui/button';
import { Link } from 'react-router';
import logo from '../assets/logo.png';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
            About
          </Button>
          <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
            How it Works
          </Button>
          <Link to="/student/login">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              Graduate Login
            </Button>
          </Link>
          <Link to="/admin/login">
            <Button variant="ghost" className="text-gray-400 hover:text-gray-600">
              Admin Login
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg p-4 flex flex-col gap-4">
          <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900">
            About
          </Button>
          <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900">
            How it Works
          </Button>
          <Link to="/student/login" className="w-full">
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900">
              Graduate Login
            </Button>
          </Link>
          <Link to="/admin/login" className="w-full">
            <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-gray-600">
              Admin Login
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
