import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { servicesApi } from '../services/services';
import { monitoringApi } from '../services/monitoring';
import { useToast } from '../context/ToastContext';

// SVG Icons
const Icons = {
  ArrowLeft: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Test: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
  Database: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
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

const formatDuration = (seconds) => {
  if (!seconds) return 'N/A';
  if (seconds < 60) return `${seconds.toFixed(0)}ms`;
  if (seconds < 1000) return `${seconds.toFixed(1)}ms`;
  return `${(seconds / 1000).toFixed(2)}s`;
};

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [service, setService] = useState(null);
  const [healthChecks, setHealthChecks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fetchedRef = useRef(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh && fetchedRef.current) return;
    if (!isRefresh) fetchedRef.current = true;

    try {
      const [serviceRes, checksRes, incidentsRes] = await Promise.all([
        servicesApi.getById(id),
        monitoringApi.getHealthChecks(),
        monitoringApi.getIncidents(),
      ]);
      
      setService(serviceRes.data);
      
      // Filter health checks for this service
      const serviceChecks = (checksRes.data.results || checksRes.data || [])
        .filter(check => check.service === parseInt(id))
        .slice(0, 20);
      setHealthChecks(serviceChecks);
      
      // Filter incidents for this service
      const serviceIncidents = (incidentsRes.data.results || incidentsRes.data || [])
        .filter(inc => inc.service === parseInt(id));
      setIncidents(serviceIncidents);
      
      setError(null);
    } catch (err) {
      console.error('Failed to load service:', err);
      setError('Failed to load service details');
      toast.error('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadData();
    return () => { fetchedRef.current = false; };
  }, [loadData]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await servicesApi.testConnection(id);
      if (res.data.status === 'HEALTHY') {
        toast.success('Connection successful', `Response time: ${res.data.response_time}ms`);
      } else {
        toast.error('Connection failed', res.data.error_message || 'Unknown error');
      }
      loadData(true);
    } catch (err) {
      toast.error('Error', 'Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const handleToggle = async () => {
    try {
      await servicesApi.toggle(id);
      setService(prev => ({ ...prev, enabled: !prev.enabled }));
      toast.success(null, `Service ${service.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      toast.error('Error', 'Failed to toggle service');
    }
  };

  const handleDelete = async () => {
    try {
      await servicesApi.delete(id);
      toast.success('Service deleted', 'Redirecting...');
      navigate('/services');
    } catch (err) {
      toast.error('Error', 'Failed to delete service');
    }
  };

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-8 h-8 animate-spin" style={{ color: '#FF5D73' }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-[#9C8AA0] text-sm">Loading service details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error State
  if (error || !service) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF5D731F' }}>
            <Icons.Alert />
          </div>
          <p className="text-[#9C8AA0]">{error || 'Service not found'}</p>
          <div className="flex gap-2">
            <Link
              to="/services"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#FF5D731F', color: '#FF8FA3' }}
            >
              Back to Services
            </Link>
            <button
              onClick={() => {
                fetchedRef.current = false;
                setLoading(true);
                setError(null);
                loadData();
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ color: '#9C8AA0', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isHealthy = service.current_status === 'HEALTHY';
  const isUnhealthy = service.current_status === 'UNHEALTHY';

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Breadcrumb */}
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: '#9C8AA0' }}
        >
          <Icons.ArrowLeft />
          Back to Services
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span
                className="block w-3.5 h-3.5 rounded-full"
                style={{
                  backgroundColor: isHealthy ? '#7DD9A6' : isUnhealthy ? '#FF5D73' : '#6B5C6E',
                  boxShadow: isHealthy ? '0 0 12px rgba(125,217,166,0.6)' : isUnhealthy ? '0 0 12px rgba(255,93,115,0.6)' : 'none',
                }}
              />
              {isHealthy && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: '#7DD9A6' }} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F6EDE9]">{service.name}</h1>
              <p className="text-sm text-[#9C8AA0] mt-0.5">
                {service.service_type_display} • {service.provider_display}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{ color: '#7EC8FF', backgroundColor: '#7EC8FF1F' }}
            >
              {testing ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <Icons.Test />
              )}
              Test Connection
            </button>
            <button
              onClick={handleToggle}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                color: service.enabled ? '#7DD9A6' : '#9C8AA0',
                backgroundColor: service.enabled ? '#7DD9A61F' : 'rgba(156,138,160,0.1)',
              }}
            >
              {service.enabled ? 'Monitoring On' : 'Monitoring Off'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: '#FF8FA3', backgroundColor: '#FF5D731F' }}
              title="Delete service"
            >
              <Icons.Trash />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowDeleteConfirm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF5D731F' }}>
                  <Icons.Trash />
                </div>
                <h3 className="text-[#F6EDE9] font-bold mb-1">Delete {service.name}?</h3>
                <p className="text-[#9C8AA0] text-sm mb-4">This will permanently delete this service and all its data.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border" style={{ color: '#9C8AA0', borderColor: 'rgba(255,255,255,0.08)' }}>
                    Cancel
                  </button>
                  <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FF5D73', color: '#1B0E12' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connection Details */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F6EDE9] mb-4">
                <Icons.Server />
                Connection Details
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Host', value: service.host },
                  { label: 'Port', value: service.port },
                  { label: 'Database', value: service.database_name || 'N/A' },
                  { label: 'SSL Mode', value: service.ssl_mode },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-[#9C8AA0]">{item.label}</span>
                    <span className="text-xs text-[#F6EDE9] font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F6EDE9] mb-4">
                <Icons.Shield />
                Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#9C8AA0]">Current Status</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                    color: isHealthy ? '#7DD9A6' : isUnhealthy ? '#FF8FA3' : '#9C8AA0',
                    backgroundColor: isHealthy ? '#7DD9A61F' : isUnhealthy ? '#FF5D731F' : 'rgba(156,138,160,0.1)',
                  }}>
                    {service.status_display}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#9C8AA0]">Monitoring</span>
                  <span className="text-xs font-medium" style={{ color: service.enabled ? '#7DD9A6' : '#9C8AA0' }}>
                    {service.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#9C8AA0]">Check Interval</span>
                  <span className="text-xs text-[#F6EDE9]">{service.check_interval}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#9C8AA0]">Last Checked</span>
                  <span className="text-xs text-[#F6EDE9]">{getTimeAgo(service.last_checked_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Checks History */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F6EDE9]">
                  <Icons.Clock />
                  Health Check History
                </h3>
                <span className="text-xs text-[#9C8AA0]">Last 20 checks</span>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {healthChecks.length > 0 ? healthChecks.map((check, i) => (
                  <div key={check.id || i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full" style={{
                        backgroundColor: check.status === 'HEALTHY' ? '#7DD9A6' : '#FF5D73',
                      }} />
                      <span className="text-sm" style={{ color: check.status === 'HEALTHY' ? '#7DD9A6' : '#FF8FA3' }}>
                        {check.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#9C8AA0]">
                        {check.response_time ? `${check.response_time}ms` : 'N/A'}
                      </span>
                      <span className="text-xs text-[#9C8AA0]/70 w-16 text-right">
                        {getTimeAgo(check.checked_at)}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-[#9C8AA0]">No health checks recorded yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Incidents */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F6EDE9]">
                  <Icons.Alert />
                  Incidents
                </h3>
                <span className="text-xs text-[#9C8AA0]">{incidents.length} total</span>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {incidents.length > 0 ? incidents.map((incident) => (
                  <div key={incident.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {incident.status === 'OPEN' ? (
                          <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: '#FF5D73' }} />
                        ) : (
                          <Icons.CheckCircle />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: incident.status === 'OPEN' ? '#FF8FA3' : '#7DD9A6' }}>
                            {incident.status === 'OPEN' ? 'Ongoing' : 'Resolved'}
                          </span>
                          <span className="text-xs text-[#9C8AA0]">{getTimeAgo(incident.started_at)}</span>
                        </div>
                        <p className="text-xs text-[#9C8AA0]/70 mt-1">{incident.reason}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-[#9C8AA0]">No incidents recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}