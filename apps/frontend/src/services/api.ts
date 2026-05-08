
import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
            if (!isAuthEndpoint) {
                localStorage.removeItem('scoutiq_token');
                // We don't force a redirect here anymore because public pages 
                // like the LandingPage might trigger 401s for non-essential metrics.
                // The ProtectedDashboard component in main.tsx handles redirects for private routes.
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



export const runScan = async (payload: {
    company_name: string;
    website?: string | null;
    time_window_days?: number;
}) => {
    // The backend expects ScanRequest: { company_name, website, time_window_days }
    const response = await api.post('/scan', payload);
    return response.data;
};

export const analyzeCompany = async (company: { name: string, domain: string }) => {
    return runScan({ company_name: company.name, website: company.domain });
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
export const getGlobalMetrics = async () => {
    const response = await api.get('/intelligence/global-metrics');
    return response.data;
};

export const getIntelligenceStream = async (limit = 20) => {
    const response = await api.get('/intelligence/stream', { params: { limit } });
    return response.data;
};

export const getRecommendations = async () => {
    const response = await api.get('/intelligence/recommendations');
    return response.data;
};

export const getInnovationTrends = async () => {
    const response = await api.get('/intelligence/innovation-trends');
    return response.data;
};

export const getMarketComparison = async () => {
    const response = await api.get('/intelligence/market-comparison');
    return response.data;
};

export const getLastSevenDays = async (competitor?: string) => {
    const response = await api.get('/intelligence/last-seven-days', {
        params: competitor ? { competitor } : {}
    });
    return response.data;
};

export const getMissionBriefing = async () => {
    const response = await api.get('/intelligence/mission-briefing');
    return response.data;
};

export const getStrategicPlan = async (payload: { competitor_id: string, focus_area: string, risk_level: string }) => {
    const response = await api.post('/intelligence/strategic-plan', payload);
    return response.data;
};

export const getPredictivePipeline = async () => {
    const response = await api.get('/intelligence/predictive-pipeline');
    return response.data;
};

export const getSentimentMatrix = async () => {
    const response = await api.get('/intelligence/sentiment-matrix');
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

export const getRiskMatrix = async () => {
    const response = await api.get('/intelligence/risk-matrix');
    return response.data;
};

export const getRiskAssessment = async (competitorId: string) => {
    const response = await api.get('/intelligence/risk-assessment', {
        params: { competitor_id: competitorId }
    });
    return response.data;
};

export const getActivityTimeline = async () => {
    const response = await api.get('/intelligence/activity-timeline');
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

export const updateSchedulerConfig = async (data: { interval_unit: string, interval_value: number }) => {
    const response = await api.post('/settings/scheduler', data);
    return response.data;
};

export const searchCompanies = async (query: string) => {
    const response = await api.get('/discovery/search', { params: { q: query } });
    return response.data;
};

export default api;
