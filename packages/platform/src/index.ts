import axios from 'axios';

export interface PlatformConfig {
  backendUrl: string;
  workerUrl?: string;
  apiKey?: string;
}

export class PlatformClient {
  private config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  /**
   * Fetch system telemetry and meta-information.
   */
  async getSystemStats() {
    try {
      const response = await axios.get(`${this.config.backendUrl}/api/v1/meta/stats`);
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
      const response = await axios.get(`${this.config.backendUrl}/api/v1/competitors`);
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
      const response = await axios.post(`${this.config.backendUrl}/api/v1/competitors/${competitorId}/scan`);
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
      const response = await axios.get(`${this.config.backendUrl}/api/v1/meta/logs`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }
}

export const platformClient = new PlatformClient({
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
});
