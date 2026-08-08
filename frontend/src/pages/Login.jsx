import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      toast.warning('Validation', 'Please fill in all fields');
      return;
    }

    setStatus('loading');
    try {
      await login(form);
      setStatus('success');
      toast.success('Welcome back!', `Signed in as ${form.username}`);
      setTimeout(() => navigate('/'), 850);
    } catch (error) {
      setStatus('error');
      const errorMsg = error.response?.data?.error ||
                       error.response?.data?.detail ||
                       'Invalid username or password';
      toast.error('Authentication failed', errorMsg);
      setTimeout(() => setStatus('idle'), 600);
    }
  };

  const busy = status === 'loading' || status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#170E1F] relative overflow-hidden px-4">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(600px circle at 50% 15%, rgba(255,93,115,0.14), transparent 60%)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="rounded-[28px] border border-white/[0.06] bg-[#1F1329]/80 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.65)] overflow-hidden">

          {/* Scrolling heartbeat monitor line */}
          <div className="h-14 border-b border-white/[0.06] bg-[#180F20] overflow-hidden relative">
            <svg
              viewBox="0 0 600 56"
              className="absolute inset-0 h-full w-[200%]"
              preserveAspectRatio="none"
            >
              <g stroke="#FF5D73" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
                <path d="M0,28 L68,28 L84,10 L100,46 L116,16 L132,28 L300,28" />
                <path d="M0,28 L68,28 L84,10 L100,46 L116,16 L132,28 L300,28" transform="translate(300,0)" />
                <animateTransform attributeName="transform" type="translate" from="0 0" to="-300 0" dur="3.2s" repeatCount="indefinite" />
              </g>
            </svg>
          </div>

          <div className="px-8 pt-7 pb-9">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF5D73">
                <path d="M12 21s-7.5-4.6-10-9.2C.4 8.2 2 4.5 5.8 4.1c2-.2 3.8.9 4.9 2.6C11.8 5 13.6 3.9 15.6 4.1c3.8.4 5.4 4.1 3.8 7.7C19.5 16.4 12 21 12 21z" />
                <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.1s" repeatCount="indefinite" additive="sum" />
              </svg>
              <h1 className="text-3xl text-[#F6EDE9] tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Heartbeat
              </h1>
            </div>
            <p className="text-center text-[13px] text-[#9C8AA0] mb-8">
              Every connection starts with a beat.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <FloatingInput
                label="Username"
                type="text"
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v })}
                disabled={busy}
                error={status === 'error'}
              />
              <FloatingInput
                label="Password"
                type="password"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                disabled={busy}
                error={status === 'error'}
              />

              <button
                type="submit"
                disabled={busy}
                className={`relative w-full h-12 rounded-full font-semibold text-[15px] overflow-hidden
                  transition-all duration-300 text-[#1B0E12]
                  shadow-[0_8px_24px_-8px_rgba(255,93,115,0.6)] disabled:cursor-not-allowed
                  ${status === 'error' ? 'animate-shake' : ''}
                  ${status === 'success'
                    ? 'bg-green-400 shadow-[0_8px_24px_-8px_rgba(74,222,128,0.6)]'
                    : 'bg-gradient-to-r from-[#FF5D73] to-[#FFB4A8] hover:brightness-110'}`}
              >
                {/* Default state */}
                <span className={`inline-flex items-center justify-center transition-all duration-200 ${
                  busy ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                }`}>
                  Sign in
                </span>

                {/* Loading state */}
                {status === 'loading' && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg width="72" height="20" viewBox="0 0 72 20">
                      <path
                        d="M0,10 L18,10 L22,2 L26,18 L30,6 L34,10 L72,10"
                        fill="none" stroke="#1B0E12" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                        pathLength="1" strokeDasharray="0.15 1"
                      >
                        <animate attributeName="stroke-dashoffset" from="0" to="-1.15" dur="0.9s" repeatCount="indefinite" />
                      </path>
                    </svg>
                    <span className="ml-2 text-[#1B0E12] text-sm">Authenticating</span>
                  </span>
                )}

                {/* Success state */}
                {status === 'success' && (
                  <span className="absolute inset-0 flex items-center justify-center gap-2 text-[#1B0E12]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12l5 5L20 6" pathLength="1" strokeDasharray="1" strokeDashoffset="1">
                        <animate attributeName="stroke-dashoffset" from="1" to="0" dur="0.35s" fill="freeze" />
                      </path>
                    </svg>
                    Welcome back
                  </span>
                )}

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
              </button>

              {/* Error hint */}
              {status === 'error' && (
                <p className="text-center text-[13px] text-[#FF5D73] animate-fadeIn">
                  Invalid credentials. Please try again.
                </p>
              )}
            </form>

            <p className="text-center text-[13px] text-[#9C8AA0] mt-6">
              No account?{' '}
              <Link to="/register" className="text-[#FF8FA3] hover:text-[#FFB4A8] transition-colors font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz@1,9..144&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #F6EDE9 !important;
          -webkit-box-shadow: 0 0 0 1000px #1F1329 inset !important;
          caret-color: #FF5D73 !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}

function FloatingInput({ label, type, value, onChange, disabled, error }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const active = focused || value.length > 0;
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="relative">
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        required
        autoComplete={isPassword ? 'current-password' : 'username'}
        className={`peer w-full pt-5 pb-2 pr-10 text-[15px] text-[#F6EDE9] bg-transparent outline-none
          transition-colors duration-200 disabled:opacity-50 border-0 border-b
          ${error ? 'border-[#FF5D73]' : 'border-white/[0.12] focus:border-[#FF5D73]'}`}
        style={{ caretColor: '#FF5D73' }}
        placeholder=" "
      />
      <label
        className={`absolute left-0 pointer-events-none transition-all duration-200 select-none
          ${active ? 'top-0 text-[11px] text-[#FF8FA3]' : 'top-5 text-[15px] text-[#9C8AA0]'}
          ${error ? 'text-[#FF5D73]' : ''}`}
      >
        {label}
      </label>

      {/* Password visibility toggle */}
      {isPassword && value.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-5 text-[#9C8AA0] hover:text-[#F6EDE9] transition-colors p-1"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}