import { Device, DeviceListResponse } from '@/types/device';

// Replace this with your actual API base URL
const API_BASE_URL = 'http://192.168.68.101:8000'; // Update this to your IoT server URL

export const deviceService = {
  /**
   * Fetch all devices from the API
   * @param token Authentication token
   * @param params Optional query parameters for filtering
   * @returns Promise with device list response
   */
  async getDevices(
    token: string,
    params?: {
      active?: boolean;
      type?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<DeviceListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.active !== undefined) {
        queryParams.append('active', String(params.active));
      }
      if (params?.type !== undefined) {
        queryParams.append('type', String(params.type));
      }
      if (params?.limit !== undefined) {
        queryParams.append('limit', String(params.limit));
      }
      if (params?.offset !== undefined) {
        queryParams.append('offset', String(params.offset));
      }

      const url = `${API_BASE_URL}/api/devices/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  },

  /**
   * Fetch a single device by ID
   * @param token Authentication token
   * @param id Device UUID
   * @returns Promise with device data
   */
  async getDeviceById(token: string, id: string): Promise<Device> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching device:', error);
      throw error;
    }
  },

  /**
   * Toggle device state
   * @param token Authentication token
   * @param id Device UUID
   * @returns Promise with updated device data
   */
  async toggleDevice(token: string, id: string): Promise<Device> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${id}/toggle/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error toggling device:', error);
      throw error;
    }
  },

  /**
   * Fetch historical device statuses
   * @param token Authentication token
   * @param deviceId Device UUID
   * @param startDate Start date for the query (ISO string)
   * @param endDate End date for the query (ISO string)
   * @returns Promise with array of device statuses
   */
  async getDeviceStatuses(
    token: string,
    deviceId: string,
    startDate: string,
    endDate: string,
    sampleSize: number
  ): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        device: deviceId,
        start_date: startDate,
        end_date: endDate,
        sample_size: sampleSize.toString(),
      });

      const url = `${API_BASE_URL}/api/devices/statuses/?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching device statuses:', error);
      throw error;
    }
  },
};
