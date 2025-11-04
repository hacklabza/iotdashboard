import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Device } from '@/types/device';

interface DeviceCardProps {
  device: Device;
  onPress?: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(device)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{device.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: device.active ? '#4CAF50' : '#9E9E9E' }
        ]}>
          <Text style={styles.statusText}>
            {device.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {device.description && (
        <Text style={styles.description}>{device.description}</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.id}>ID: {device.id.substring(0, 8)}...</Text>
        <Text style={styles.type}>Type: {device.type.name}</Text>
      </View>

      {device.updated_at && (
        <Text style={styles.timestamp}>
          Updated: {new Date(device.updated_at).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  id: {
    fontSize: 12,
    color: '#999',
  },
  type: {
    fontSize: 12,
    color: '#999',
  },
  timestamp: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 8,
  },
});
