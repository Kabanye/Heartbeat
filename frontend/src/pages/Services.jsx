import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ServicesSkeleton } from '../components/Skeleton';
import { servicesApi } from '../services/services';
import { useToast } from '../context/ToastContext';

// SVG Icons
const Icons = {
  Add: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
  Empty: () => (
    <svg className="w-24 h-24" style={{ color: 'rgba(255,255,255,0.06)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

const PROVIDERS = ['AIVEN', 'AWS', 'GCP', 'AZURE', 'SELF_HOSTED', 'OTHER'];
const SERVICE_TYPES = ['POSTGRESQL', 'MYSQL', 'REDIS', 'REST_API', 'WEBSITE'];

const defaultForm = {
  name: '',
  provider: 'AIVEN',
  service_type: 'POSTGRESQL',
  host: '',
  port: '',
  database_name: '',
  username: '',
  password: '',
  ssl_mode: 'require',
  enabled: true,
  check_interval: 300,
};

export default function Services() {
  const navigate = useNavigate();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const MAX_RETRIES = 2;

  const fetchServices = useCallback(async () => {
    const res = await servicesApi.getAll();
    return res.data.results || [];
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    const loadData = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;

      try {
        const data = await fetchServices();
        if (!cancelled && isMountedRef.current) {
          setServices(data);
          setError(null);
          retryCountRef.current = 0;
        }
      } catch (err) {
        if (cancelled || !isMountedRef.current) return;
        console.error('Services load error:', err.message);
        
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          retryTimeoutRef.current = setTimeout(() => {
            if (!cancelled && isMountedRef.current) {
              fetchedRef.current = false;
              loadData();
            }
          }, 3000 * retryCountRef.current);
          return;
        }
        
        setError('Failed to load services');
        toast.error('Error', 'Failed to load services');
      } finally {
        if (!cancelled && isMountedRef.current) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchServices();
      if (isMountedRef.current) {
        setServices(data);
        setError(null);
        toast.success(null, 'Services refreshed');
      }
    } catch (err) {
      if (isMountedRef.current) toast.error('Error', 'Failed to refresh');
    } finally {
      if (isMountedRef.current) setRefreshing(false);
    }
  }, [fetchServices, toast]);

  const reloadServices = useCallback(async () => {
    try {
      const data = await fetchServices();
      if (isMountedRef.current) setServices(data);
    } catch (err) {
      // Silently fail
    }
  }, [fetchServices]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEditForm = (e, service) => {
    e.stopPropagation();
    setEditingId(service.id);
    setForm({
      name: service.name,
      provider: service.provider,
      service_type: service.service_type,
      host: service.host,
      port: service.port.toString(),
      database_name: service.database_name || '',
      username: '',
      password: '',
      ssl_mode: service.ssl_mode,
      enabled: service.enabled,
      check_interval: service.check_interval,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        port: parseInt(form.port) || 0,
        check_interval: parseInt(form.check_interval) || 300,
      };

      if (editingId) {
        if (!payload.password) delete payload.password;
        if (!payload.username) delete payload.username;
        await servicesApi.update(editingId, payload);
        toast.success('Service updated', `${payload.name} has been updated`);
      } else {
        await servicesApi.create(payload);
        toast.success('Service created', `${payload.name} is now being monitored`);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
      reloadServices();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Please check your inputs';
      toast.error('Failed to save service', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (e, id) => {
    e.stopPropagation();
    try {
      await servicesApi.toggle(id);
      setServices(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
      toast.success(null, 'Service toggled');
    } catch (err) {
      toast.error('Error', 'Failed to toggle service');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await servicesApi.delete(deleteConfirm);
      setServices(prev => prev.filter(s => s.id !== deleteConfirm));
      setDeleteConfirm(null);
      toast.success('Service deleted', 'The service has been removed');
    } catch (err) {
      toast.error('Error', 'Failed to delete service');
    }
  };

  const handleTestConnection = async (e, id) => {
    e.stopPropagation();
    setTestingId(id);
    try {
      const res = await servicesApi.testConnection(id);
      if (res.data.status === 'HEALTHY') {
        toast.success('Connection successful', `Response time: ${res.data.response_time}ms`);
      } else {
        toast.error('Connection failed', res.data.error_message || 'Unknown error');
      }
    } catch (err) {
      toast.error('Error', 'Failed to test connection');
    } finally {
      setTestingId(null);
    }
  };

  const handleServiceClick = (id) => {
    navigate(`/services/${id}`);
  };

  if (loading) {
    return (
      <Layout>
        <ServicesSkeleton />
      </Layout>
    );
  }

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
              retryCountRef.current = 0;
              setLoading(true);
              setError(null);
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            style={{ backgroundColor: '#FF5D731F', color: '#FF8FA3' }}
          >
            <Icons.Refresh />
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F6EDE9] tracking-tight">Services</h1>
            <p className="text-[#9C8AA0] text-sm mt-1">
              {services.length} service{services.length !== 1 ? 's' : ''} monitored
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg transition-colors disabled:opacity-50" style={{ color: '#9C8AA0' }} title="Refresh">
              <span className={refreshing ? 'animate-spin block' : ''}><Icons.Refresh /></span>
            </button>
            <button onClick={openCreateForm} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ backgroundColor: '#FF5D731F', color: '#FF8FA3' }}>
              <Icons.Add /> Add Service
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowForm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h2 className="text-lg font-bold text-[#F6EDE9]">{editingId ? 'Edit Service' : 'Add New Service'}</h2>
                  <button onClick={() => setShowForm(false)} style={{ color: '#9C8AA0' }}><Icons.Close /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Service Name</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }} placeholder="My Service" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Provider</label>
                      <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}>
                        {PROVIDERS.map(p => (<option key={p} value={p}>{p.replace('_', ' ')}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Service Type</label>
                      <select value={form.service_type} onChange={(e) => {
                        const newType = e.target.value;
                        if (newType === 'REST_API' || newType === 'WEBSITE') {
                          setForm({ ...form, service_type: newType, host: '', port: '', database_name: '', username: '', password: '' });
                        } else {
                          setForm({ ...form, service_type: newType });
                        }
                      }} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}>
                        {SERVICE_TYPES.map(t => (<option key={t} value={t}>{t.replace('_', ' ')}</option>))}
                      </select>
                    </div>
                  </div>

                  {/* URL field for REST API / Website */}
                  {(form.service_type === 'REST_API' || form.service_type === 'WEBSITE') ? (
                    <div>
                      <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">URL</label>
                      <input type="url" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }} placeholder="https://example.com" required />
                      <p className="text-[10px] text-[#9C8AA0]/60 mt-1">Enter the full URL including https://</p>
                    </div>
                  ) : (
                    /* Database fields for PostgreSQL, MySQL, Redis */
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Host</label>
                          <input type="text" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }} placeholder="host.aivencloud.com" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Port</label>
                          <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }} placeholder="21699" required />
                        </div>
                      </div>

                      {form.service_type !== 'REDIS' && (
                        <div>
                          <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Database Name</label>
                          <input type="text" value={form.database_name} onChange={(e) => setForm({ ...form, database_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }} placeholder="defaultdb" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Username {editingId && <span className="text-[#FFB454]">(leave empty to keep)</span>}</label>
                          <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }} placeholder={form.service_type === 'REDIS' ? 'default' : 'avnadmin'} required={!editingId} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Password {editingId && <span className="text-[#FFB454]">(leave empty to keep)</span>}</label>
                          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none" style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }} placeholder="••••••••" required={!editingId} />
                        </div>
                      </div>
                    </>
                  )}

                  <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50" style={{ backgroundColor: '#FF5D73', color: '#1B0E12' }}>
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>{editingId ? 'Updating...' : 'Creating...'}</span>
                    ) : (editingId ? 'Update Service' : 'Create Service')}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setDeleteConfirm(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF5D731F' }}><Icons.Trash /></div>
                <h3 className="text-[#F6EDE9] font-bold mb-1">Delete Service?</h3>
                <p className="text-[#9C8AA0] text-sm mb-4">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border" style={{ color: '#9C8AA0', borderColor: 'rgba(255,255,255,0.08)' }}>Cancel</button>
                  <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FF5D73', color: '#1B0E12' }}>Delete</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Services List */}
        {services.length > 0 ? (
          <div className="space-y-2">
            {services.map((service) => (
              <div key={service.id} onClick={() => handleServiceClick(service.id)} className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group cursor-pointer" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: service.current_status === 'HEALTHY' ? '#7DD9A6' : service.current_status === 'UNHEALTHY' ? '#FF5D73' : '#6B5C6E', boxShadow: service.current_status === 'HEALTHY' ? '0 0 8px rgba(125,217,166,0.5)' : service.current_status === 'UNHEALTHY' ? '0 0 8px rgba(255,93,115,0.5)' : 'none' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#F6EDE9] font-medium text-sm truncate group-hover:text-[#FF8FA3] transition-colors">{service.name}</p>
                    <p className="text-xs text-[#9C8AA0]/70 mt-0.5 truncate">{service.service_type_display} • {service.host}{service.port ? `:${service.port}` : ''}</p>
                  </div>
                  <Icons.ArrowRight />
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium hidden sm:block" style={{ color: service.current_status === 'HEALTHY' ? '#7DD9A6' : service.current_status === 'UNHEALTHY' ? '#FF8FA3' : '#9C8AA0', backgroundColor: service.current_status === 'HEALTHY' ? '#7DD9A61F' : service.current_status === 'UNHEALTHY' ? '#FF5D731F' : 'rgba(156,138,160,0.1)' }}>{service.status_display}</span>
                  <button onClick={(e) => handleTestConnection(e, service.id)} disabled={testingId === service.id} className="p-2 rounded-lg transition-colors disabled:opacity-50 hidden sm:block" style={{ color: '#9C8AA0' }} title="Test connection">{testingId === service.id ? (<svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>) : (<Icons.Test />)}</button>
                  <button onClick={(e) => handleToggle(e, service.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ color: service.enabled ? '#7DD9A6' : '#9C8AA0', backgroundColor: service.enabled ? '#7DD9A61F' : 'rgba(156,138,160,0.1)' }}>{service.enabled ? 'On' : 'Off'}</button>
                  <button onClick={(e) => openEditForm(e, service)} className="p-2 rounded-lg transition-colors" style={{ color: '#9C8AA0' }} title="Edit"><Icons.Edit /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(service.id); }} className="p-2 rounded-lg transition-colors" style={{ color: '#9C8AA0' }} title="Delete"><Icons.Trash /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6"><Icons.Empty /></div>
            <h3 className="text-[#F6EDE9] font-semibold text-lg mb-1">No services yet</h3>
            <p className="text-[#9C8AA0] text-sm mb-6 max-w-sm">Add your first service to start monitoring. We support PostgreSQL, Redis, MySQL, REST APIs, and Websites.</p>
            <button onClick={openCreateForm} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all" style={{ backgroundColor: '#FF5D731F', color: '#FF8FA3' }}><Icons.Add /> Add Your First Service</button>
          </div>
        )}
      </div>
    </Layout>
  );
}