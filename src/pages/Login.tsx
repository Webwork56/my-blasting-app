import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Button, Input } from '../components/ui';

export function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter username');
      return;
    }
    if (!password) {
      setError('Please enter password');
      return;
    }
    const ok = login(email, password);
    if (!ok) setError('Invalid username or password');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-cyan-200/40 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-200/40 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xl font-bold shadow-xl shadow-cyan-500/25">
            IB
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IBTIKAR BMS</h1>
          <p className="text-sm text-cyan-600 mt-1 font-medium">Blasting Management System</p>
          <p className="text-xs text-slate-500 mt-2">Enterprise Operations Platform</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4"
        >
          <div className="text-center mb-2">
            <h2 className="text-base font-semibold text-slate-900">Sign in</h2>
            <p className="text-xs text-slate-500 mt-1">Enter username and password to continue</p>
          </div>

          <Input
            label="Username"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Username"
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400">
            © 2026 IBTIKAR · Confidential
          </p>
        </div>
      </div>
    </div>
  );
}
