import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { NotificationsSkeleton } from '../components/Skeleton';
import { notificationsApi } from '../services/notifications';
import { useToast } from '../context/ToastContext';

// SVG Icons
const Icons = {
  Bell: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  CheckAll: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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
  Empty: () => (
    <svg className="w-20 h-20" style={{ color: 'rgba(255,255,255,0.08)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
};

const getNotificationStyle = (type) => {
  switch (type) {
    case 'INCIDENT_CREATED':
      return {
        icon: <Icons.Alert />,
        bgColor: 'rgba(255,93,115,0.05)',
        borderColor: 'rgba(255,93,115,0.2)',
        iconBg: 'rgba(255,93,115,0.1)',
        iconColor: '#FF8FA3',
        dot: '#FF5D73',
        badgeBg: 'rgba(255,93,115,0.1)',
        badgeColor: '#FF8FA3',
      };
    case 'INCIDENT_RESOLVED':
      return {
        icon: <Icons.CheckCircle />,
        bgColor: 'rgba(125,217,166,0.05)',
        borderColor: 'rgba(125,217,166,0.2)',
        iconBg: 'rgba(125,217,166,0.1)',
        iconColor: '#7DD9A6',
        dot: '#7DD9A6',
        badgeBg: 'rgba(125,217,166,0.1)',
        badgeColor: '#7DD9A6',
      };
    default:
      return {
        icon: <Icons.Bell />,
        bgColor: 'rgba(126,200,255,0.05)',
        borderColor: 'rgba(126,200,255,0.2)',
        iconBg: 'rgba(126,200,255,0.1)',
        iconColor: '#7EC8FF',
        dot: '#7EC8FF',
        badgeBg: 'rgba(126,200,255,0.1)',
        badgeColor: '#7EC8FF',
      };
  }
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data.results || []);
      setError(null);
      if (isRefresh) toast.success(null, 'Notifications refreshed');
    } catch (err) {
      setError('Failed to load notifications');
      if (!isRefresh) toast.error('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    setActionLoading(id);
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      toast.success(null, 'Notification marked as read');
    } catch (err) {
      toast.error('Error', 'Failed to mark as read');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      toast.success(null, 'All notifications marked as read');
    } catch (err) {
      toast.error('Error', 'Failed to mark all as read');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Loading State - Skeleton
  if (loading) {
    return (
      <Layout>
        <NotificationsSkeleton />
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
              setLoading(true);
              setError(null);
              loadNotifications();
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
      <div className="p-6 max-w-4xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F6EDE9] tracking-tight">Notifications</h1>
            <p className="text-[#9C8AA0] text-sm mt-1">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadNotifications(true)}
              disabled={refreshing}
              className="p-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ color: '#9C8AA0' }}
              title="Refresh notifications"
            >
              <span className={refreshing ? 'animate-spin block' : ''}>
                <Icons.Refresh />
              </span>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ 
                  backgroundColor: 'rgba(255,93,115,0.1)', 
                  color: '#FF8FA3',
                  border: '1px solid rgba(255,93,115,0.2)'
                }}
              >
                <Icons.CheckAll />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl border w-fit" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { key: 'read', label: 'Read' },
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

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const style = getNotificationStyle(notification.type);
              const isRead = notification.is_read;
              
              return (
                <div
                  key={notification.id}
                  className="relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200"
                  style={{
                    backgroundColor: isRead ? 'rgba(31,19,41,0.5)' : style.bgColor,
                    borderColor: isRead ? 'rgba(255,255,255,0.06)' : style.borderColor,
                  }}
                >
                  {/* Unread dot */}
                  {!isRead && (
                    <div 
                      className="absolute top-4 left-4 w-2 h-2 rounded-full"
                      style={{ backgroundColor: style.dot }}
                    />
                  )}
                  
                  {/* Icon */}
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-opacity"
                    style={{ 
                      backgroundColor: style.iconBg, 
                      color: style.iconColor,
                      opacity: isRead ? 0.4 : 1
                    }}
                  >
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 
                        className="text-sm font-semibold"
                        style={{ color: isRead ? '#9C8AA0' : '#F6EDE9' }}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs flex-shrink-0" style={{ color: '#9C8AA0' }}>
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: isRead ? 'rgba(156,138,160,0.5)' : 'rgba(156,138,160,0.9)' }}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span 
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          color: style.badgeColor,
                          backgroundColor: style.badgeBg,
                        }}
                      >
                        {notification.type_display}
                      </span>
                      
                      {!isRead && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={actionLoading === notification.id}
                          className="flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
                          style={{ color: '#9C8AA0' }}
                        >
                          {actionLoading === notification.id ? (
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <Icons.Check />
                          )}
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4">
              <Icons.Empty />
            </div>
            <h3 className="text-[#F6EDE9] font-medium mb-1">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-[#9C8AA0] text-sm">
              {filter === 'unread' 
                ? 'You\'re all caught up!' 
                : 'Notifications about your services will appear here'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}