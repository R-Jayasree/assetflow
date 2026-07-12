import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        const res = await api.post('/auth/signup', {
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, password: form.password, phone: form.phone,
        });
        login(res.data.data.token, res.data.data.user);
      } else {
        const res = await api.post('/auth/login', {
          email: form.email, password: form.password,
        });
        login(res.data.data.token, res.data.data.user);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 mb-4">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AssetFlow</h1>
          <p className="text-muted-foreground mt-2">Enterprise Asset & Resource Management</p>
        </div>

        <div className="card p-8 shadow-xl">
          <h2 className="text-2xl font-semibold mb-1">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignup ? 'Sign up as a new employee' : 'Sign in to your account'}
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">First Name</label>
                    <input className="input" value={form.firstName}
                      onChange={e => setForm({...form, firstName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Last Name</label>
                    <input className="input" value={form.lastName}
                      onChange={e => setForm({...form, lastName: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone</label>
                  <input className="input" type="tel" value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-sm text-primary hover:underline">
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground text-center">
            <p><strong>Default Admin:</strong> admin@assetflow.com</p>
            <p>Password: admin123</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          AssetFlow Enterprise System v1.0
        </p>
      </div>
    </div>
  );
};

export default Login;
