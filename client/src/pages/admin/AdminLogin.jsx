import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import Logo from '../../components/ui/Logo';
import { InlineAlert, PageLoader, Spinner } from '../../components/ui/States';

export default function AdminLogin() {
  usePageTitle('Admin sign in');
  const { admin, loading, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from && location.state.from.startsWith('/admin') ? location.state.from : '/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-mist px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo to="/" /></div>
        <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
          <div><h1 className="font-serif text-2xl font-bold text-navy">Admin sign in</h1><p className="mt-1 text-sm text-muted">Sign in to manage your store.</p></div>
          {error && <InlineAlert>{error}</InlineAlert>}
          <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" autoComplete="username" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label htmlFor="password" className="label">Password</label><input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <button type="submit" className="btn-primary h-12 w-full" disabled={busy}>{busy ? <><Spinner /> Signing in&hellip;</> : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
