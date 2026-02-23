
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
                delete api.defaults.headers.common['Authorization'];
                window.location.href = '/login';
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

/** Market Scout Agent: real search + scrape + structured output. No synthetic fallback. */
export const runScan = async (payload: {
    company_name: string;
    website?: string | null;
    time_window_days?: number;
}) => {
    // The backend expects ScanRequest: { company_name, website, time_window_days }
    const response = await api.post('/scan', payload);
    return response.data;
};

export const analyzeCompany = async (company: string) => {
    // This calls the /analyze endpoint (now under /api/v1 prefix) 
    const response = await api.post('/analyze', { company });
    return response.data.report;
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

export default api;
