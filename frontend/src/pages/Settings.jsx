import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { notificationsApi } from '../services/notifications';
import { authService } from '../services/auth';

// SVG Icons
const Icons = {
  User: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Key: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  Save: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
};

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const isMountedRef = useRef(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Notification preferences
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    in_app_enabled: true,
    incident_alerts: true,
    recovery_alerts: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(true);

  // Load user profile data
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  }, [user]);

  // Load notification preferences
  useEffect(() => {
    isMountedRef.current = true;

    const loadPreferences = async () => {
      try {
        const res = await notificationsApi.getPreferences();
        if (isMountedRef.current && res.data) {
          setPreferences({
            email_enabled: res.data.email_enabled ?? true,
            in_app_enabled: res.data.in_app_enabled ?? true,
            incident_alerts: res.data.incident_alerts ?? true,
            recovery_alerts: res.data.recovery_alerts ?? true,
          });
        }
      } catch (err) {
        console.log('Preferences not found, using defaults');
      } finally {
        if (isMountedRef.current) setPrefsLoading(false);
      }
    };

    loadPreferences();
    return () => { isMountedRef.current = false; };
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Only send non-empty values
      const updateData = {};
      const username = profileForm.username?.trim();
      const email = profileForm.email?.trim();
      const firstName = profileForm.first_name?.trim();
      const lastName = profileForm.last_name?.trim();

      if (username) updateData.username = username;
      if (email) updateData.email = email;
      updateData.first_name = firstName || '';
      updateData.last_name = lastName || '';

      await authService.updateProfile(updateData);
      toast.success('Profile updated', 'Your profile has been saved');
    } catch (err) {
      const errorMsg = err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to update profile';
      toast.error('Error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Error', 'Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Error', 'Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(passwordForm);
      toast.success('Password changed', 'Your password has been updated');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error('Error', err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await notificationsApi.updatePreferences(newPreferences);
      toast.success(null, 'Preferences updated');
    } catch (err) {
      setPreferences(preferences);
      toast.error('Error', 'Failed to update preferences');
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: <Icons.User /> },
    { key: 'password', label: 'Password', icon: <Icons.Key /> },
    { key: 'notifications', label: 'Notifications', icon: <Icons.Bell /> },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F6EDE9] tracking-tight">Settings</h1>
          <p className="text-[#9C8AA0] text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl border w-fit" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                color: activeTab === tab.key ? '#FF8FA3' : '#9C8AA0',
                backgroundColor: activeTab === tab.key ? 'rgba(255,93,115,0.1)' : 'transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="rounded-2xl border p-6" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5D73] to-[#FFB4A8] flex items-center justify-center text-[#1B0E12] text-2xl font-bold flex-shrink-0 shadow-lg shadow-[#FF5D73]/20">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F6EDE9]">{user?.username}</h2>
                <p className="text-sm text-[#9C8AA0]">{user?.email}</p>
                <p className="text-xs text-[#9C8AA0]/70 mt-1">Member since {new Date(user?.date_joined).toLocaleDateString()}</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none transition-colors"
                    style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none transition-colors"
                    style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none transition-colors"
                    style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none transition-colors"
                    style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: '#FF5D73', color: '#1B0E12' }}
              >
                {saving ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <Icons.Save />
                )}
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="rounded-2xl border p-6" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#F6EDE9] flex items-center gap-2">
                <Icons.Shield />
                Change Password
              </h2>
              <p className="text-sm text-[#9C8AA0] mt-1">Use a strong password that you don't use elsewhere</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none transition-colors"
                  style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none transition-colors"
                  style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9C8AA0] mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F6EDE9] border outline-none transition-colors"
                  style={{ backgroundColor: '#180F20', borderColor: 'rgba(255,255,255,0.08)' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: '#FF5D73', color: '#1B0E12' }}
              >
                {saving ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <Icons.Key />
                )}
                Change Password
              </button>
            </form>
          </div>
        )}
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="rounded-2xl border p-6" style={{ backgroundColor: '#1F1329', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#F6EDE9] flex items-center gap-2">
                <Icons.Bell />
                Notification Preferences
              </h2>
              <p className="text-sm text-[#9C8AA0] mt-1">Choose how and when you want to be notified</p>
            </div>

            {prefsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-[#180F20] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {[
                  { key: 'in_app_enabled', label: 'In-App Notifications', description: 'Receive notifications within the application' },
                  { key: 'email_enabled', label: 'Email Notifications', description: 'Receive notifications via email' },
                  { key: 'incident_alerts', label: 'Incident Alerts', description: 'Get notified when a service goes down' },
                  { key: 'recovery_alerts', label: 'Recovery Alerts', description: 'Get notified when a service recovers' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#F6EDE9]">{item.label}</p>
                      <p className="text-xs text-[#9C8AA0] mt-0.5">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handlePreferencesUpdate(item.key, !preferences[item.key])}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        preferences[item.key] ? 'bg-[#FF5D73]' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                          preferences[item.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}