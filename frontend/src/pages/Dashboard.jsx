import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import { DashboardSkeleton } from '../components/Skeleton';
import { servicesApi } from '../services/services';
import { monitoringApi } from '../services/monitoring';
import { notificationsApi } from '../services/notifications';

// SVG Icons for stat cards
const StatIcons = {
  Services: () => (
    <svg className="w-6 h-6" style={{ color: '#7EC8FF' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="8" rx="2" strokeLinecap="round" />
      <rect x="2" y="14" width="20" height="8" rx="2" strokeLinecap="round" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  Incidents: () => (
    <svg className="w-6 h-6" style={{ color: '#FF5D73' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
    </svg>
  ),
  Alerts: () => (
    <svg className="w-6 h-6" style={{ color: '#FFB454' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
    </svg>
  ),
  Add: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Empty: () => (
    <svg className="w-16 h-16 text-white/[0.12]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetchedRef = useRef(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh && fetchedRef.current) return;
    if (!isRefresh) fetchedRef.current = true;
    
    if (isRefresh) setRefreshing(true);

    try {
      const [servicesRes, incidentsRes, countRes] = await Promise.all([
        servicesApi.getAll(),
        monitoringApi.getOpenIncidents(),
        notificationsApi.getUnreadCount(),
      ]);
      setServices(servicesRes.data.results || []);
      setIncidents(Array.isArray(incidentsRes.data) ? incidentsRes.data : []);
      setUnreadCount(countRes.data.count || 0);
      setError(null);
      if (isRefresh) toast.success(null, 'Dashboard refreshed');
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Unable to load dashboard data');
      if (!isRefresh) toast.error('Connection Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    return () => {
      fetchedRef.current = false;
    };
  }, [loadData]);

  // Loading State - Skeleton
  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  // Error State
  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF5D731F' }}>
            <svg className="w-8 h-8" style={{ color: '#FF8FA3' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[#9C8AA0] text-sm">{error}</p>
          <button
            onClick={() => {
              fetchedRef.current = false;
              setLoading(true);
              setError(null);
              loadData();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            style={{ backgroundColor: '#FF5D731F', color: '#FF8FA3' }}
          >
            <StatIcons.Refresh />
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F6EDE9] tracking-tight">
              Dashboard
            </h1>
            <p className="text-[#9C8AA0] mt-1 text-sm">
              Welcome back, <span className="text-[#FF8FA3] font-medium">{user?.username}</span>
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ color: '#9C8AA0' }}
            title="Refresh dashboard"
          >
            <span className={refreshing ? 'animate-spin block' : ''}>
              <StatIcons.Refresh />
            </span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1F1329] rounded-2xl border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#9C8AA0] text-sm font-medium">Services</p>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: '#7EC8FF1F' }}>
                <StatIcons.Services />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#F6EDE9]">{services.length}</p>
            <p className="text-xs text-[#9C8AA0]/70 mt-1">Active monitors</p>
          </div>

          <div className="bg-[#1F1329] rounded-2xl border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#9C8AA0] text-sm font-medium">Incidents</p>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: incidents.length > 0 ? '#FF5D732E' : '#FF5D731F' }}
              >
                <StatIcons.Incidents />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: incidents.length > 0 ? '#FF8FA3' : '#F6EDE9' }}>
              {incidents.length}
            </p>
            <p className="text-xs mt-1" style={{ color: incidents.length > 0 ? '#FF8FA3B3' : 'rgba(156,138,160,0.7)' }}>
              {incidents.length > 0 ? 'Requires attention' : 'All systems operational'}
            </p>
          </div>

          <div className="bg-[#1F1329] rounded-2xl border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#9C8AA0] text-sm font-medium">Alerts</p>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: unreadCount > 0 ? '#FFB4542E' : '#FFB4541F' }}
              >
                <StatIcons.Alerts />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: unreadCount > 0 ? '#FFB454' : '#F6EDE9' }}>
              {unreadCount}
            </p>
            <p className="text-xs text-[#9C8AA0]/70 mt-1">Unread notifications</p>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-[#1F1329] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#F6EDE9]">Your Services</h2>
              <p className="text-xs text-[#9C8AA0]/70 mt-0.5">
                {services.length} service{services.length !== 1 ? 's' : ''} monitored
              </p>
            </div>
            <Link
              to="/services"
              className="flex items-center gap-1.5 text-sm text-[#FF8FA3] hover:text-[#FFB4A8] transition-colors font-medium"
            >
              View all
              <StatIcons.ArrowRight />
            </Link>
          </div>

          <div className="p-5">
            {services.length > 0 ? (
              <div className="space-y-2">
                {services.slice(0, 5).map((service) => (
                  <Link
                    key={service.id}
                    to={`/services/${service.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group border border-transparent hover:border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <span
                          className="block w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              service.current_status === 'HEALTHY' ? '#7DD9A6' :
                              service.current_status === 'UNHEALTHY' ? '#FF5D73' : '#6B5C6E',
                            boxShadow:
                              service.current_status === 'HEALTHY' ? '0 0 8px rgba(125,217,166,0.5)' :
                              service.current_status === 'UNHEALTHY' ? '0 0 8px rgba(255,93,115,0.5)' : 'none',
                          }}
                        />
                        {service.current_status === 'HEALTHY' && (
                          <span
                            className="absolute inset-0 rounded-full animate-ping opacity-30"
                            style={{ backgroundColor: '#7DD9A6' }}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-[#F6EDE9] font-medium group-hover:text-[#FF8FA3] transition-colors text-sm">
                          {service.name}
                        </p>
                        <p className="text-xs text-[#9C8AA0]/70 mt-0.5 font-mono">
                          {service.host}:{service.port}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          color:
                            service.current_status === 'HEALTHY' ? '#7DD9A6' :
                            service.current_status === 'UNHEALTHY' ? '#FF8FA3' : '#9C8AA0',
                          backgroundColor:
                            service.current_status === 'HEALTHY' ? '#7DD9A61F' :
                            service.current_status === 'UNHEALTHY' ? '#FF5D731F' : 'rgba(156,138,160,0.1)',
                        }}
                      >
                        {service.status_display}
                      </span>
                      <svg className="w-4 h-4 text-[#9C8AA0]/50 group-hover:text-[#9C8AA0] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <StatIcons.Empty />
                </div>
                <h3 className="text-[#F6EDE9] font-medium mb-1">No services yet</h3>
                <p className="text-[#9C8AA0] text-sm mb-4">
                  Start monitoring your first service to see it here
                </p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: '#FF5D731F', color: '#FF8FA3' }}
                >
                  <StatIcons.Add />
                  Add Service
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {services.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/services"
              className="p-4 bg-[#1F1329] rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all text-center group"
            >
              <p className="text-sm font-medium text-[#F6EDE9] group-hover:text-[#FF8FA3] transition-colors">
                Manage Services
              </p>
              <p className="text-xs text-[#9C8AA0]/70 mt-1">Add, edit, or remove services</p>
            </Link>
            <Link
              to="/incidents"
              className="p-4 bg-[#1F1329] rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all text-center group"
            >
              <p className="text-sm font-medium text-[#F6EDE9] group-hover:text-[#FF8FA3] transition-colors">
                View Incidents
              </p>
              <p className="text-xs text-[#9C8AA0]/70 mt-1">Check service outage history</p>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}