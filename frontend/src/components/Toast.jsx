import { useEffect, useState, useCallback } from 'react';

const Icons = {
  Success: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Error: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
      <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" />
    </svg>
  ),
  Close: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
    </svg>
  ),
};

// Tints chosen to sit on the #1F1329 plum surface rather than stock Tailwind hues.
const variants = {
  success: { icon: <Icons.Success />, accent: '#7DD9A6', label: 'Success' },
  error:   { icon: <Icons.Error />,   accent: '#FF5D73', label: 'Error'   },
  warning: { icon: <Icons.Warning />, accent: '#FFB454', label: 'Warning' },
  info:    { icon: <Icons.Info />,    accent: '#B39DFF', label: 'Info'    },
};

function ToastItem({ id, type = 'info', title, message, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const variant = variants[type] || variants.info;

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 250);
  }, [id, onRemove]);

  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleRemove();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [handleRemove]);

  return (
    <div
      role="status"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className={`relative flex items-start gap-3 p-4 pb-5 rounded-2xl border border-white/[0.06]
        bg-[#1F1329]/90 backdrop-blur-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]
        transition-all duration-250 ease-out overflow-hidden
        ${isExiting ? 'opacity-0 translate-x-3 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-[toastIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]'}`}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${variant.accent}1F`, color: variant.accent }}
      >
        {variant.icon}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        {title && <p className="text-sm font-semibold text-[#F6EDE9]">{title}</p>}
        <p className="text-[13px] text-[#9C8AA0] mt-0.5 leading-snug">{message}</p>
      </div>

      <button
        onClick={handleRemove}
        aria-label="Dismiss"
        className="flex-shrink-0 w-6 h-6 -mt-0.5 -mr-1 rounded-full flex items-center justify-center text-[#9C8AA0] hover:text-[#F6EDE9] hover:bg-white/[0.06] transition-colors"
      >
        <Icons.Close />
      </button>

      {/* progress */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.06]">
        <div
          className="h-full rounded-r-full transition-[width] duration-75 ease-linear"
          style={{ width: `${progress}%`, backgroundColor: variant.accent }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer({ toasts, setToasts }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
        </div>
      ))}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        @keyframes toastIn {
          0%   { opacity: 0; transform: translateX(24px) scale(0.92); }
          60%  { opacity: 1; transform: translateX(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}