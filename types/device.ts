export interface DeviceType {
  id: number;
  name: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  description?: string;
}

export interface DeviceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Device[];
}
