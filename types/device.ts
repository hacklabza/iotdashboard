export interface DeviceType {
  id: number;
  name: string;
}

export interface DeviceLocation {
  id: number;
  name: string;
  position: {
    type: string;
    coordinates: [number, number];
  };
}

export interface DeviceHealth {
  id: number;
  status: boolean;
  created_at: string;
  updated_at: string;
  device: string;
}

export interface DeviceStatus {
  id: number;
  created_at: string;
  status: {
    [key: string]: number | boolean | { [key: string]: number };
  };
  device: string;
}

export interface PinType {
  id: number;
  name: string;
  identifier: string;
}

export interface PinDisplay {
  icon: string;
  label: string;
  value: string;
  colour: string;
  visible: boolean;
  unit_of_measure?: string;
}

export interface PinRule {
  input: {
    threshold?: number;
    sensor_type?: string;
    topic?: string;
  };
  action: string;
}

export interface DevicePin {
  id: number;
  devices: string[];
  type: PinType;
  active: boolean;
  name: string;
  identifier: string;
  pin_number: number;
  interval: number;
  analog: boolean;
  read: boolean;
  i2c: boolean;
  rule: PinRule;
  display: PinDisplay[];
}

export interface AggregatedStatus {
  [key: string]: {
    [subKey: string]: {
      minimum: number;
      maximum: number;
      average: number;
    } | {
      minimum: number;
      maximum: number;
      average: number;
    };
  } | {
    minimum: number;
    maximum: number;
    average: number;
  };
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  location: DeviceLocation;
  active: boolean;
  ip_address: string;
  mac_address: string;
  health?: DeviceHealth;
  last_status?: DeviceStatus;
  aggregated_status?: AggregatedStatus;
  pins?: DevicePin[];
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
