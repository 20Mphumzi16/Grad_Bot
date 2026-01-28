import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { useLoading } from '../components/ui/loading';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '../components/ui/PageTransition';
import { API_BASE_URL } from '../utils/config';

export function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, setLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log(res.body)
      if (!res.ok) {
        const errText = await res.text();
        setError(`Login failed: ${res.status} ${errText}`);
        return;
      }

      const data = await res.json();

      console.log(data)

      if (data.status === 'FIRST_LOGIN_REQUIRED') {
        navigate('/activate-account', { state: { email: data.email, user_id: data.user_id } });
        return;
      }

      const token = data.token || data.access || data.access_token;

      if (!token) {
        setError('Login succeeded but no token returned by server.');
        return;
      }

      localStorage.setItem('token', token);
      await new Promise(r => setTimeout(r, 500));
      navigate('/student');
    } catch (err: any) {
      setError(err?.message || 'Network error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {show && (
        <PageTransition className="min-h-screen bg-gradient-to-br from-[var(--student-login-from)] to-[var(--student-login-to)] flex items-center justify-center px-6">
          <div className="w-full max-w-md">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            setShow(false);
            window.setTimeout(() => navigate('/'), 300);
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>

        {/* Login card */}
        <div className="bg-card rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/20 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-foreground mb-2">
              Graduate Login
            </h1>
            <p className="text-muted-foreground text-sm">
              Access your graduate programme assistant
            </p>
          </div>

          

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Contact your programme coordinator
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Demo credentials: Any email/password combination
        </p>
          </div>
        </PageTransition>
      )}
    </AnimatePresence>
  );
}
