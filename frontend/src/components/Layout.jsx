import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Check mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for sidebar state changes from Sidebar component
  const handleSidebarChange = useCallback(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  useEffect(() => {
    // Initial check
    handleSidebarChange();

    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', handleSidebarChange);
    
    // Listen for custom event (same-tab)
    window.addEventListener('sidebarStateChange', handleSidebarChange);
    
    return () => {
      window.removeEventListener('storage', handleSidebarChange);
      window.removeEventListener('sidebarStateChange', handleSidebarChange);
    };
  }, [handleSidebarChange]);

  // On mobile: sidebar overlays, content takes full width
  // On desktop: content adjusts to sidebar width
  const mainMargin = isMobile 
    ? 'ml-0' 
    : sidebarCollapsed 
      ? 'ml-[72px]' 
      : 'ml-64';

  return (
    <div 
      className="flex min-h-screen bg-[#0a0a0f]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Sidebar />
      
      <main 
        className={`flex-1 transition-all duration-300 ease-out ${mainMargin}`}
      >
        {/* Mobile header */}
        {isMobile && (
          <div className="h-14 border-b border-white/[0.06] bg-[#180F20]/90 flex items-center px-4 sticky top-0 z-10 backdrop-blur-xl">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('sidebarToggle'));
              }}
              className="text-[#9C8AA0] hover:text-[#F6EDE9] transition-colors p-1 -ml-1"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex-1 flex justify-center">
              <span 
                className="italic text-[#F6EDE9] text-lg tracking-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Heartbeat
              </span>
            </div>
            <div className="w-8" />
          </div>
        )}
        
        {/* Page content */}
        <div className={isMobile ? 'min-h-[calc(100vh-3.5rem)]' : 'min-h-screen'}>
          {children}
        </div>
      </main>

      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz@1,9..144&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}