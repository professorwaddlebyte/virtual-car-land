import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (data.user.role === 'dealer') {
        router.push('/dealership/dashboard');
      } else {
        router.push('/');
      }

    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const fillDemo = (email) => {
    setEmail(email);
    setPassword('admin123');
  };

  return (
    <>
      <Head>
        <title>Login — Virtual Car Land</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg">

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🚗</div>
            <h1 className="text-2xl font-bold" style={{color: '#0055A4'}}>Virtual Car Land</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
              style={{background: '#0055A4'}}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 mb-3">Demo Accounts — click to fill:</p>
            <div className="space-y-2">
              {[
                { label: '⚙️ Admin', email: 'admin@uaecars.ae' },
                { label: '🏪 Al Mansouri Motors', email: 'dealer1@uaecars.ae' },
                { label: '🏪 Kumar Auto Trading', email: 'dealer2@uaecars.ae' },
                { label: '🏪 Al Rashid Cars', email: 'dealer3@uaecars.ae' },
              ].map((d, i) => (
                <button
                  key={i}
                  onClick={() => fillDemo(d.email)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {d.label} <span className="text-gray-400">— {d.email}</span>
                </button>
              ))}
              <p className="text-xs text-gray-400 mt-2 text-center">All use password: admin123</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

