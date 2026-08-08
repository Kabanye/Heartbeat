import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { monitoringApi } from '../services/monitoring';
import { useToast } from '../context/ToastContext';

// SVG Icons
const Icons = {
  Alert: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Server: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  Empty: () => (
    <svg className="w-24 h-24" style={{ color: 'rgba(255,255,255,0.06)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
};

const getTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDowntime = (duration) => {
  if (!duration) return 'N/A';
  // Parse the duration string (e.g., "5 minutes, 30 seconds")
  return duration;
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | open | resolved
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const fetchedRef = useRef(false);

  const loadIncidents = useCallback(async (isRefresh = false) => {
    if (!isRefresh && fetchedRef.current) return;
    if (!isRefresh) fetchedRef.current = true;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await monitoringApi.getIncidents();
      setIncidents(res.data.results || res.data || []);
      setError(null);
      if (isRefresh) toast.success(null, 'Incidents refreshed');
    } catch (err) {
      setError('Failed to load incidents');
      if (!isRefresh) toast.error('Error', 'Failed to load incidents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadIncidents();
    return () => { fetchedRef.current = false; };
  }, [loadIncidents]);

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'open') return inc.status === 'OPEN';
    if (filter === 'resolved') return inc.status === 'RESOLVED';
    return true;
  });

  const openCount = incidents.filter(inc => inc.status === 'OPEN').length;
  const resolvedCount = incidents.filter(inc => inc.status === 'RESOLVED').length;

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto space-y-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-48 bg-[#1F1329] rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-[#1F1329] rounded animate-pulse" />
          </div>
          {/* Filter skeleton */}
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 w-20 bg-[#1F1329] rounded-lg animate-pulse" />
            ))}
          </div>
          {/* Cards skeleton */}
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-[#1F1329] rounded-2xl animate-pulse" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F6EDE9] tracking-tight">Incidents</h1>
            <p className="text-[#9C8AA0] text-sm mt-1">
              {openCount > 0 
                ? `${openCount} open incident${openCount !== 1 ? 's' : ''} requires attention`
                : 'All incidents resolved'}
            </p>
          </div>
          <button
            onClick={() => loadIncidents(true)}
            disabled={refreshing}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ color: '#9C8AA0' }}
            title="Refresh"
          >
            <span className={refreshing ? 'animate-spin block' : ''}>
              <Icons.Refresh />
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div 
            className="rounded-2xl border p-5"
            style={{ 
              backgroundColor: openCount > 0 ? 'rgba(255,93,115,0.05)' : '#1F1329',
              borderColor: openCount > 0 ? 'rgba(255,93,115,0.2)' : 'rgba(255,255,255,0.06)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icons.Alert />
              <span className="text-sm font-medium text-[#9C8AA0]">Open</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: openCount > 0 ? '#FF8FA3' : '#F6EDE9' }}>
              {openCount}
            </p>
          </div>
          <div 
            className="rounded-2xl border p-5"
            style={{ 
              backgroundColor: '#1F1329',
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icons.CheckCircle />
              <span className="text-sm font-medium text-[#9C8AA0]">Resolved</span>
            </div>
            <p className="text-3xl font-bold text-[#F6EDE9]">{resolvedCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl border w-fit" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { key: 'all', label: `All (${incidents.length})` },
            { key: 'open', label: `Open (${openCount})` },
            { key: 'resolved', label: `Resolved (${resolvedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                color: filter === tab.key ? '#FF8FA3' : '#9C8AA0',
                backgroundColor: filter === tab.key ? 'rgba(255,93,115,0.1)' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Incidents List */}
        {filteredIncidents.length > 0 ? (
          <div className="space-y-3">
            {filteredIncidents.map((incident) => {
              const isOpen = incident.status === 'OPEN';
              
              return (
                <Link
                  key={incident.id}
                  to={`/services/${incident.service}`}
                  className="block rounded-2xl border p-5 transition-all duration-200 hover:border-opacity-50"
                  style={{
                    backgroundColor: isOpen ? 'rgba(255,93,115,0.03)' : '#1F1329',
                    borderColor: isOpen ? 'rgba(255,93,115,0.15)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`flex-shrink-0 mt-0.5 ${isOpen ? 'animate-pulse' : ''}`}>
                        {isOpen ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF5D731F' }}>
                            <Icons.Alert />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7DD9A61F' }}>
                            <Icons.CheckCircle />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#F6EDE9] text-sm">
                            {incident.service_name || `Service #${incident.service}`}
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{
                              color: isOpen ? '#FF8FA3' : '#7DD9A6',
                              backgroundColor: isOpen ? '#FF5D731F' : '#7DD9A61F',
                            }}
                          >
                            {isOpen ? 'OPEN' : 'RESOLVED'}
                          </span>
                        </div>
                        <p className="text-xs text-[#9C8AA0]/80 line-clamp-2">
                          {incident.reason}
                        </p>
                      </div>
                    </div>
                    <Icons.ArrowRight />
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icons.Calendar />
                        <span className="text-xs text-[#9C8AA0]">Started</span>
                      </div>
                      <p className="text-xs text-[#F6EDE9]">{formatDate(incident.started_at)}</p>
                    </div>
                    {incident.resolved_at && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icons.CheckCircle />
                          <span className="text-xs text-[#9C8AA0]">Resolved</span>
                        </div>
                        <p className="text-xs text-[#F6EDE9]">{formatDate(incident.resolved_at)}</p>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icons.Clock />
                        <span className="text-xs text-[#9C8AA0]">Downtime</span>
                      </div>
                      <p className="text-xs text-[#F6EDE9]">
                        {incident.downtime_duration || (isOpen ? 'Ongoing' : 'N/A')}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6">
              <Icons.Empty />
            </div>
            <h3 className="text-[#F6EDE9] font-semibold text-lg mb-1">
              {filter === 'open' ? 'No open incidents' : filter === 'resolved' ? 'No resolved incidents' : 'No incidents yet'}
            </h3>
            <p className="text-[#9C8AA0] text-sm max-w-sm">
              {filter === 'open'
                ? 'All your services are running smoothly!'
                : filter === 'resolved'
                  ? 'Resolved incidents will appear here'
                  : 'Incidents are created when a service fails multiple health checks'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}