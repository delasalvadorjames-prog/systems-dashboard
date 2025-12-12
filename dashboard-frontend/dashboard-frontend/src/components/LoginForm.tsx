import React, { useState } from 'react';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginFormProps {
  title: string;
  role: 'admin' | 'teacher';
  onLogin: (credentials: any) => void;
  onBack: () => void;
  demoInfo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ title, role, onLogin, onBack, demoInfo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'admin') {
        // Admin auth check (demo)
        if (email === 'admin@school.com' && password === 'admin123') {
          localStorage.setItem('adminId', '1');
          localStorage.setItem('adminName', 'Admin');
          onLogin({ email, role: 'admin' });
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Teacher auth via API
        const response = await fetch('http://localhost:4000/api/teachers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const teacher = data.data;
            localStorage.setItem('teacherId', String(teacher.id));
            onLogin(teacher);
          } else {
            setError(data.message || 'Invalid credentials');
          }
        } else {
          const data = await response.json();
          setError(data.message || 'Invalid credentials');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${require('../images/bg.png')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-96 border border-white/20 animate-fadeIn">
        <h1 className={`text-3xl font-bold text-center bg-gradient-to-r ${
          role === 'admin' ? 'from-sky-600 to-sky-700' : 'from-blue-600 to-blue-700'
        } bg-clip-text text-transparent mb-8`}>
          {title}
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'admin' ? 'admin@school.com' : 'teacher@school.com'}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 rounded-lg font-semibold transition duration-200 disabled:bg-gray-400 ${
              role === 'admin'
                ? 'bg-sky-600 hover:bg-sky-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-right mt-2">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition duration-200"
          >
            Back
          </button>
        </form>

        {demoInfo && (
          <p className="text-center text-gray-600 text-sm mt-4">
            {demoInfo}
          </p>
        )}

        {showForgot && <ForgotPasswordModal role={role} onClose={() => setShowForgot(false)} />}
      </div>
    </div>
  );
};

export default LoginForm;
