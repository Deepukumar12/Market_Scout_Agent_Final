
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('scoutiq_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register') ||
                originalRequest.url?.includes('/auth/refresh') ||
                originalRequest.url?.includes('/auth/forgot-password') ||
                originalRequest.url?.includes('/auth/reset-password');

            if (!isAuthEndpoint) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return api(originalRequest);
                        })
                        .catch((err) => {
                            return Promise.reject(err);
                        });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const refreshToken = localStorage.getItem('scoutiq_refresh_token');
                if (refreshToken) {
                    try {
                        const response = await axios.post(
                            import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh` : '/api/v1/auth/refresh',
                            { refresh_token: refreshToken }
                        );

                        const { access_token, refresh_token } = response.data;

                        localStorage.setItem('scoutiq_token', access_token);
                        localStorage.setItem('scoutiq_refresh_token', refresh_token);

                        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;

                        processQueue(null, access_token);
                        isRefreshing = false;

                        return api(originalRequest);
                    } catch (refreshError) {
                        processQueue(refreshError, null);
                        isRefreshing = false;
                        localStorage.removeItem('scoutiq_token');
                        localStorage.removeItem('scoutiq_refresh_token');
                        window.dispatchEvent(new Event('auth-logout'));
                        return Promise.reject(refreshError);
                    }
                } else {
                    localStorage.removeItem('scoutiq_token');
                }
            }
        }
        return Promise.reject(error);
    }
);


export const getCompetitors = async (q?: string) => {
    const response = await api.get('/competitors', {
        params: q ? { q } : {}
    });
    return response.data;
};

export const createCompetitor = async (data: any) => {
    const response = await api.post('/competitors', data);
    return response.data;
};

export const deleteCompetitor = async (competitorId: string) => {
    const response = await api.delete(`/competitors/${competitorId}`);
    return response.data;
};

export const runCompetitorScan = async (competitorId: string) => {
    const response = await api.post(`/competitors/${competitorId}/scan`);
    return response.data;
};



export const triggerReport = async () => {
    const response = await api.post('/scan/trigger-report');
    return response.data;
};

export const runScan = async (payload: {
    company_name: string;
    website?: string | null;
    time_window_days?: number;
    force_refresh?: boolean;
}) => {
    // The backend expects ScanRequest: { company_name, website, time_window_days, force_refresh }
    const response = await api.post('/scan', payload);
    return response.data;
};

export const analyzeCompany = async (company: { name: string, domain: string }, forceRefresh = false) => {
    return runScan({ company_name: company.name, website: company.domain, force_refresh: forceRefresh });
};



export const login = async (email: string, password: string) => {
    // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded (not multipart)
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const response = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
}

export const register = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
}

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
}

export const updateProfile = async (userData: any) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
}

export const changePassword = async (passwordData: any) => {
    const response = await api.put('/auth/password', passwordData);
    return response.data;
}

// GitHub intelligence (requires GITHUB_TOKEN in backend .env for best rate limits)
export const getCompanyGitHub = async (companyName: string, maxRepos = 15) => {
    const response = await api.get(`/github/company/${encodeURIComponent(companyName)}`, {
        params: { max_repos: maxRepos },
    });
    return response.data;
};

export const searchGitHubRepos = async (q: string, sort = 'stars', perPage = 10, page = 1) => {
    const response = await api.get('/github/search/repos', {
        params: { q, sort, per_page: perPage, page },
    });
    return response.data;
};

export const getOrgRepos = async (org: string, perPage = 20, page = 1, sort = 'updated') => {
    const response = await api.get(`/github/orgs/${encodeURIComponent(org)}/repos`, {
        params: { per_page: perPage, page, sort },
    });
    return response.data;
};

// Intelligence Endpoints
export const getGlobalMetrics = async (competitor?: string) => {
    const response = await api.get('/intelligence/global-metrics', {
        params: competitor ? { competitor } : {}
    });
    return response.data;
};

export const getIntelligenceStream = async (limit = 20, q?: string) => {
    const response = await api.get('/intelligence/stream', { params: { limit, q } });
    return response.data;
};

export const getRecommendations = async () => {
    const response = await api.get('/intelligence/recommendations');
    return response.data;
};

export const getInnovationTrends = async (competitor?: string) => {
    const response = await api.get('/intelligence/innovation-trends', {
        params: competitor ? { competitor } : {}
    });
    return response.data;
};

export const getMarketComparison = async (competitor?: string) => {
    const response = await api.get('/intelligence/market-comparison', {
        params: competitor ? { competitor } : {}
    });
    return response.data;
};

export const getLastSevenDays = async (competitor?: string) => {
    const response = await api.get('/intelligence/last-seven-days', {
        params: competitor ? { competitor } : {}
    });
    return response.data;
};

export const getMissionBriefing = async (competitor?: string) => {
    const response = await api.get('/intelligence/mission-briefing', {
        params: competitor ? { competitor } : {}
    });
    return response.data;
};

export const getStrategicPlan = async (payload: { competitor_id: string, focus_area: string, risk_level: string }) => {
    const response = await api.post('/intelligence/strategic-plan', payload);
    return response.data;
};

export const getPredictivePipeline = async (competitor?: string) => {
    const response = await api.get('/intelligence/predictive-pipeline', {
        params: competitor ? { competitor } : {}
    });
    return response.data;
};

export const getSentimentMatrix = async (competitorId?: string) => {
    const response = await api.get('/intelligence/sentiment-matrix', {
        params: competitorId ? { competitor_id: competitorId } : {}
    });
    return response.data;
};

export const getSentimentAnalysis = async (competitorId: string) => {
    const response = await api.get('/intelligence/sentiment-analysis', {
        params: { competitor_id: competitorId }
    });
    return response.data;
};

export const getSignalAnalytics = async (competitorId?: string) => {
    const response = await api.get('/intelligence/analytics', {
        params: { competitor_id: competitorId || null }
    });
    return response.data;
};

export const getRiskMatrix = async (competitorId?: string) => {
    const response = await api.get('/intelligence/risk-matrix', {
        params: competitorId ? { competitor_id: competitorId } : {}
    });
    return response.data;
};

export const getRiskAssessment = async (competitorId: string) => {
    const response = await api.get('/intelligence/risk-assessment', {
        params: { competitor_id: competitorId }
    });
    return response.data;
};

export const getActivityTimeline = async (competitor?: string) => {
    const response = await api.get('/intelligence/activity-timeline', { params: { competitor } });
    return response.data;
};

export const getLatestReport = async () => {
    const response = await api.get('/intelligence/latest-report');
    return response.data;
};

export const getSystemStats = async () => {
    const response = await api.get('/meta/stats');
    return response.data;
};

// Notification Endpoints
export const getNotifications = async (limit = 50) => {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
};

export const markNotificationRead = async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsRead = async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
};

export const clearNotifications = async () => {
    const response = await api.delete('/notifications/clear');
    return response.data;
};

export const getSchedulerConfig = async () => {
    const response = await api.get('/settings/scheduler');
    return response.data;
};

export const updateSchedulerConfig = async (data: { interval_unit: string, interval_value: number, email_enabled: boolean }) => {
    const response = await api.post('/settings/scheduler', data);
    return response.data;
};

export const searchCompanies = async (query: string) => {
    const response = await api.get('/discovery/search', { params: { q: query } });
    return response.data;
};

export const getUserActivity = async () => {
    const response = await api.get('/auth/activity');
    return response.data;
};

export const getUserSessions = async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
};

export const revokeSession = async (sessionId: string) => {
    const response = await api.delete(`/auth/sessions/${sessionId}`);
    return response.data;
};

export const getSavedReports = async () => {
    const response = await api.get('/reports');
    return response.data;
};

export const deleteAccount = async () => {
    const response = await api.delete('/auth/me');
    return response.data;
};

export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// User Email Scheduler Endpoints
export const getEmailSchedules = async () => {
    const response = await api.get('/settings/email-schedules');
    return response.data;
};

export const createEmailSchedule = async (data: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'once';
    time_of_day: string;
    day_of_week?: number | null;
    day_of_month?: number | null;
    target_date?: string | null;
    is_enabled?: boolean;
    time_zone?: string;
}) => {
    const response = await api.post('/settings/email-schedules', data);
    return response.data;
};

export const updateEmailSchedule = async (scheduleId: string, data: {
    frequency?: 'daily' | 'weekly' | 'monthly' | 'once';
    time_of_day?: string;
    day_of_week?: number | null;
    day_of_month?: number | null;
    target_date?: string | null;
    is_enabled?: boolean;
    time_zone?: string;
}) => {
    const response = await api.put(`/settings/email-schedules/${scheduleId}`, data);
    return response.data;
};

export const deleteEmailSchedule = async (scheduleId: string) => {
    const response = await api.delete(`/settings/email-schedules/${scheduleId}`);
    return response.data;
};

export const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (data: { email: string; token: string; new_password: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
};

export default api;

