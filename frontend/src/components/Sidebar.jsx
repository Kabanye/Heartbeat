import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { notificationsApi } from '../services/notifications';

// SVG Icons
const Icons = {
  Heartbeat: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
        <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.2s" repeatCount="indefinite" />
      </path>
    </svg>
  ),
  Dashboard: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Server: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const navItems = [
  { path: '/', label: 'Dashboard', icon: <Icons.Dashboard /> },
  { path: '/services', label: 'Services', icon: <Icons.Server /> },
  { path: '/incidents', label: 'Incidents', icon: <Icons.Alert /> },
  { path: '/notifications', label: 'Alerts', icon: <Icons.Bell /> },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Stable refs to prevent effect re-runs
  const intervalRef = useRef(null);
  const failedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Sync collapsed state to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
    window.dispatchEvent(new CustomEvent('sidebarStateChange'));
  }, [collapsed]);

  // Listen for mobile toggle from Layout
  useEffect(() => {
    const handleToggle = () => setCollapsed(prev => !prev);
    window.addEventListener('sidebarToggle', handleToggle);
    return () => window.removeEventListener('sidebarToggle', handleToggle);
  }, []);

  // Fetch unread count - stable, stops on error
  const fetchUnreadCount = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (failedRef.current) return; // Stop if previous fetch failed
    
    try {
      const res = await notificationsApi.getUnreadCount();
      if (isMountedRef.current) {
        setUnreadCount(res.data?.count || 0);
        failedRef.current = false;
      }
    } catch (err) {
      // Stop polling on auth errors
      if (err.response?.status === 401) {
        failedRef.current = true;
        if (isMountedRef.current) setUnreadCount(0);
      }
      // Silently ignore network errors
    }
  }, []);

  // Poll for notifications - only when user exists
  useEffect(() => {
    isMountedRef.current = true;
    failedRef.current = false;
    
    if (!user) return;

    // Initial fetch
    fetchUnreadCount();
    
    // Poll every 2 minutes
    intervalRef.current = setInterval(() => {
      if (!failedRef.current) {
        fetchUnreadCount();
      }
    }, 120000);
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, fetchUnreadCount]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out', 'See you soon!');
      navigate('/login', { replace: true });
    } catch (error) {
      navigate('/login', { replace: true });
    }
  };

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden animate-fadeIn"
          onClick={() => {
  setCollapsed(true);
  window.dispatchEvent(new CustomEvent('sidebarToggle'));
}}
        />
      )}

      <aside
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        className={`fixed top-0 left-0 h-full bg-[#180F20] border-r border-white/[0.06] z-30 transition-all duration-300 ease-out flex flex-col shadow-2xl ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/[0.06] ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          <div className="text-[#FF5D73] flex-shrink-0 transition-transform hover:scale-110">
            <Icons.Heartbeat />
          </div>
          {!collapsed && (
            <span
              style={{ fontFamily: "'Fraunces', serif" }}
              className="italic text-[#F6EDE9] text-lg tracking-tight whitespace-nowrap"
            >
              Heartbeat
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isNotifications = item.path === '/notifications';

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
  if (window.innerWidth < 1024) {
    setCollapsed(true);
    window.dispatchEvent(new CustomEvent('sidebarToggle'));
  }
}}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#FF5D73]/[0.12] text-[#FF8FA3] font-medium'
                    : 'text-[#9C8AA0] hover:text-[#F6EDE9] hover:bg-white/[0.04]'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="flex-shrink-0 relative">
                  {item.icon}
                  {isNotifications && unreadCount > 0 && collapsed && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5D73] text-[#1B0E12] text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                
                {!collapsed && (
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                )}

                {isNotifications && unreadCount > 0 && !collapsed && (
                  <span className="ml-auto flex items-center justify-center bg-[#FF5D73] text-[#1B0E12] text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}

                {isActive && (
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-[#FF5D73] rounded-l-full ${
                    collapsed ? 'hidden' : ''
                  }`} />
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1F1329] border border-white/[0.08] rounded-lg text-xs text-[#F6EDE9] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-xl">
                    {item.label}
                    {isNotifications && unreadCount > 0 && (
                      <span className="ml-1 text-[#FF8FA3]">({unreadCount})</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-white/[0.06] p-3">
          {!collapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-white/[0.02]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5D73] to-[#FFB4A8] flex items-center justify-center text-[#1B0E12] text-sm font-bold flex-shrink-0 shadow-lg shadow-[#FF5D73]/20">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F6EDE9] font-medium truncate">{user.username}</p>
                <p className="text-xs text-[#9C8AA0] truncate">{user.email}</p>
              </div>
            </div>
          )}

          <div className={`flex ${collapsed ? 'flex-col' : 'flex-row'} gap-1`}>
            <button
              onClick={() => navigate('/settings')}
              className={`flex items-center justify-center gap-2 p-2 rounded-lg text-[#9C8AA0] hover:text-[#F6EDE9] hover:bg-white/[0.05] transition-all ${
                collapsed ? 'w-full' : 'flex-1'
              }`}
              title="Settings"
            >
              <Icons.Settings />
              {!collapsed && <span className="text-xs font-medium">Settings</span>}
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center gap-2 p-2 rounded-lg text-[#9C8AA0] hover:text-[#FF8FA3] hover:bg-[#FF5D73]/[0.1] transition-all ${
                collapsed ? 'w-full' : 'flex-1'
              }`}
              title="Sign out"
            >
              <Icons.Logout />
              {!collapsed && <span className="text-xs font-medium">Sign out</span>}
            </button>
          </div>
        </div>

        {/* Collapse Toggle - hidden on mobile */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#1F1329] border border-white/[0.08] rounded-full hidden lg:flex items-center justify-center text-[#9C8AA0] hover:text-[#F6EDE9] hover:border-[#FF5D73]/40 transition-all shadow-[0_4px_12px_-2px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_16px_-2px_rgba(255,93,115,0.2)]"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
        </button>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz@1,9..144&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </>
  );
}