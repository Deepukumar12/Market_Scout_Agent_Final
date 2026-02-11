
import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getCompetitors = async () => {
    const response = await api.get('/competitors');
    return response.data;
};

export const createCompetitor = async (data: any) => {
    const response = await api.post('/competitors', data);
    return response.data;
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

export default api;
