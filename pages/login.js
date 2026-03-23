import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const { role } = router.query; // 'admin' or 'kitchen'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = role === 'admin';
  const title = isAdmin ? 'Admin Portal' : 'Kitchen Dashboard';
  const hint = isAdmin ? 'admin@quikbites.com' : 'kitchen@quikbites.com';

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      // Route based on email
      if (user.email?.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/kitchen');
      }
      toast.success(`Welcome back!`);
    } catch (err) {
      console.error(err);
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{title} — QuikBites</title>
      </Head>
      <div className="min-h-screen bg-bg-warm flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden mb-3">
              <Image src="/logo.png" alt="QuikBites" fill style={{ objectFit: 'cover' }} />
            </div>
            <h1 className="font-display font-bold text-secondary text-2xl">QuikBites</h1>
            <p className="text-text-muted text-sm">{title}</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            <h2 className="font-display font-bold text-secondary text-lg text-center">
              {isAdmin ? '⚙️' : '👨‍🍳'} Sign In
            </h2>

            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={hint}
                required
                className="w-full bg-bg-warm border border-orange-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-bg-warm border border-orange-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Switch role links */}
          <div className="mt-4 text-center text-xs text-text-muted space-y-1">
            <p>
              {isAdmin ? (
                <a href="/login?role=kitchen" className="text-primary font-semibold hover:underline">
                  → Kitchen Login
                </a>
              ) : (
                <a href="/login?role=admin" className="text-primary font-semibold hover:underline">
                  → Admin Login
                </a>
              )}
            </p>
            <a href="/" className="text-text-muted hover:text-primary">← Back to Menu</a>
          </div>
        </div>
      </div>
    </>
  );
}
