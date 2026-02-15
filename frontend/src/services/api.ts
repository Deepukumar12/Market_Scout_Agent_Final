
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
    const formData = new FormData();
    formData.append('username', email); // OAuth2PasswordRequestForm expects username
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
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

export default api;
