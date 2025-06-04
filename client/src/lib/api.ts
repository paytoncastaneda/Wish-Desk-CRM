import { apiRequest } from "./queryClient";

export const api = {
  // Dashboard APIs
  dashboard: {
    getStats: () => fetch("/api/dashboard/stats").then(res => res.json()),
    getRecentActivity: () => fetch("/api/dashboard/recent-activity").then(res => res.json()),
  },

  // Tasks APIs
  tasks: {
    getAll: (params?: { status?: string; priority?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.priority) searchParams.set('priority', params.priority);
      if (params?.search) searchParams.set('search', params.search);
      
      const queryString = searchParams.toString();
      return fetch(`/api/tasks${queryString ? `?${queryString}` : ''}`).then(res => res.json());
    },
    create: (task: any) => apiRequest('POST', '/api/tasks', task).then(res => res.json()),
    update: (id: number, task: any) => apiRequest('PUT', `/api/tasks/${id}`, task).then(res => res.json()),
    delete: (id: number) => apiRequest('DELETE', `/api/tasks/${id}`),
  },

  // GitHub APIs
  github: {
    getRepos: () => fetch("/api/github/repos").then(res => res.json()),
    sync: () => apiRequest('POST', '/api/github/sync').then(res => res.json()),
    getStats: () => fetch("/api/github/stats").then(res => res.json()),
    getRepoDetails: (id: number) => fetch(`/api/github/repos/${id}`).then(res => res.json()),
  },

  // Email APIs
  emails: {
    getAll: () => fetch("/api/emails").then(res => res.json()),
    send: (email: any) => apiRequest('POST', '/api/emails', email).then(res => res.json()),
    getTemplates: () => fetch("/api/emails/templates").then(res => res.json()),
    getStats: () => fetch("/api/emails/stats").then(res => res.json()),
  },

  // Reports APIs
  reports: {
    getAll: () => fetch("/api/reports").then(res => res.json()),
    getTemplates: () => fetch("/api/reports/templates").then(res => res.json()),
    generate: (type: string, parameters?: any) => 
      apiRequest('POST', '/api/reports/generate', { type, parameters }).then(res => res.json()),
    getById: (id: number) => fetch(`/api/reports/${id}`).then(res => res.json()),
    getContent: (id: number) => fetch(`/api/reports/${id}/content`).then(res => res.text()),
  },

  // Documentation APIs
  docs: {
    getAll: (params?: { category?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      
      const queryString = searchParams.toString();
      return fetch(`/api/docs${queryString ? `?${queryString}` : ''}`).then(res => res.json());
    },
    create: (doc: any) => apiRequest('POST', '/api/docs', doc).then(res => res.json()),
    getCategoryStats: () => fetch("/api/docs/categories/stats").then(res => res.json()),
    getById: (id: number) => fetch(`/api/docs/${id}`).then(res => res.json()),
    getContent: (id: number) => fetch(`/api/docs/${id}/content`).then(res => res.text()),
    update: (id: number, doc: any) => apiRequest('PUT', `/api/docs/${id}`, doc).then(res => res.json()),
    delete: (id: number) => apiRequest('DELETE', `/api/docs/${id}`),
  },
};
