import axios from 'axios';

export interface PlatformConfig {
  backendUrl: string;
  workerUrl?: string;
  apiKey?: string;
}

export class PlatformClient {
  private config: PlatformConfig;

  private token: string | null = null;

  constructor(config: PlatformConfig) {
    this.config = config;
    // Auto-load token from localStorage if available in browser
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('scout_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('scout_token', token);
      else localStorage.removeItem('scout_token');
    }
  }

  private getHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async login(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await axios.post(`${this.config.backendUrl}/api/v1/auth/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      this.setToken(response.data.access_token);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(data: any) {
    try {
      const response = await axios.post(`${this.config.backendUrl}/api/v1/auth/register`, data);
      this.setToken(response.data.access_token);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Fetch system telemetry and meta-information.
   */
  async getSystemStats() {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/v1/meta/stats`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      throw error;
    }
  }

  /**
   * Fetch active competitors and their scan status.
   */
  async getCompetitors() {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/v1/competitors`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
      throw error;
    }
  }

  /**
   * Trigger a real-time scan job.
   */
  async triggerScan(competitorId: string) {
    try {
      const response = await axios.post(`${this.config.backendUrl}/api/v1/competitors/${competitorId}/scan`, {}, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to trigger scan:', error);
      throw error;
    }
  }

  /**
   * Fetch audit logs for the admin panel.
   */
  async getAuditLogs() {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/v1/meta/logs`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  /**
   * Fetch worker nodes status.
   */
  async getWorkers() {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/v1/meta/workers`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch workers:', error);
      throw error;
    }
  }

  /**
   * Fetch chart data for signals.
   */
  async getChartData() {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/v1/meta/chart-data`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      throw error;
    }
  }

  /**
   * Fetch masked vault entries.
   */
  async getVault() {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/v1/meta/vault`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch vault data:', error);
      throw error;
    }
  }

  /**
   * Admin: Fetch all users in the system.
   */
  async getAdminUsers() {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/v1/admin/users`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
      throw error;
    }
  }

  /**
   * Admin: Manually create a new user.
   */
  async createAdminUser(data: any) {
    try {
      const response = await axios.post(`${this.config.backendUrl}/api/v1/admin/users`, data, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create admin user:', error);
      throw error;
    }
  }

  /**
   * Admin: Delete a user and purge their data.
   */
  async deleteAdminUser(userId: string) {
    try {
      const response = await axios.delete(`${this.config.backendUrl}/api/v1/admin/users/${userId}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to delete admin user:', error);
      throw error;
    }
  }
}

const getBackendUrl = () => {
  try {
    // Check for Node.js / Next.js environment
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) {
      // @ts-ignore
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    // Check for Vite environment
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) {
      // @ts-ignore
      return import.meta.env.VITE_BACKEND_URL;
    }
  } catch (e) {
    // Fallback if environment access fails
  }
  return 'http://localhost:8000';
};


export const platformClient = new PlatformClient({
  backendUrl: getBackendUrl(),
});

