import { Device } from '@/types/device';


const getDisplayConfig = (device: Device, statusKey: string) => {
    if (!device?.pins) return null;

    for (const pin of device.pins) {
        const displayItem = pin.display.find(d => d.value === statusKey && d.visible);
        if (displayItem) {
            return displayItem;
        }
    }
    return null;
};

export const normalizeStatusItems = (device?: Device) => {
    if (!device?.last_status?.status) return [];

    const items: Array<{
      key: string;
      value: string | number;
      label: string;
      icon?: string;
      color?: string;
      unit?: string;
      aggregation?: {
        minimum: number;
        maximum: number;
        average: number;
      };
    }> = [];

    Object.entries(device.last_status.status).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle nested objects like dht-sensor
        Object.entries(value).forEach(([subKey, subValue]) => {
          const statusKey = `${key}.${subKey}`;
          const displayConfig = getDisplayConfig(device, statusKey);

          // Get aggregated status for this nested value
          let aggregation;
          if (device.aggregated_status && device.aggregated_status[key]) {
            const aggKey = device.aggregated_status[key];
            if (typeof aggKey === 'object' && 'minimum' in aggKey && 'maximum' in aggKey) {
              // Direct aggregation object
              aggregation = undefined;
            } else if (typeof aggKey === 'object') {
              // Nested aggregation object
              const nestedAgg = aggKey as Record<string, any>;
              if (nestedAgg[subKey] && typeof nestedAgg[subKey] === 'object') {
                aggregation = nestedAgg[subKey] as { minimum: number; maximum: number; average: number };
              }
            }
          }

          if (!displayConfig || displayConfig.visible) {
            items.push({
              key: statusKey,
              value: subValue,
              label: displayConfig?.label || subKey,
              icon: displayConfig?.icon,
              color: displayConfig?.colour,
              unit: displayConfig?.unit_of_measure,
              aggregation,
            });
          }
        });
      } else {
        // Handle direct values like light-sensor
        const displayConfig = getDisplayConfig(device, key);

        // Get aggregated status for this direct value
        let aggregation;
        if (device.aggregated_status && device.aggregated_status[key]) {
          const aggData = device.aggregated_status[key];
          if ('minimum' in aggData && 'maximum' in aggData && 'average' in aggData) {
            aggregation = aggData as { minimum: number; maximum: number; average: number };
          }
        }

        if (!displayConfig || displayConfig.visible) {
          items.push({
            key,
            value,
            label: displayConfig?.label || key,
            icon: displayConfig?.icon,
            color: displayConfig?.colour,
            unit: displayConfig?.unit_of_measure,
            aggregation,
          });
        }
      }
    });

    return items;
  };
