import api from './api';

export const monitoringApi = {
  getHealthChecks: () => api.get('/health-checks/'),
  getLatestChecks: () => api.get('/health-checks/latest/'),
  getIncidents: () => api.get('/incidents/'),
  getOpenIncidents: () => api.get('/incidents/open/'),
};