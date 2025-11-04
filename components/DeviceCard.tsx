import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Device } from '@/types/device';
import { useTheme } from '@/hooks/useTheme';

interface DeviceCardProps {
  device: Device;
  onPress?: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
      onPress={() => onPress?.(device)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>{device.name}</Text>
        <View style={styles.badges}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: device.active ? colors.success : colors.inactive }
          ]}>
            <Text style={[styles.statusText, { color: colors.primaryText }]}>
              {device.active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {device.health && (
            <View style={[
              styles.healthBadge,
              { backgroundColor: device.health.status ? colors.info : colors.warning }
            ]}>
              <Text style={[styles.statusText, { color: colors.primaryText }]}>
                {device.health.status ? '✓ Healthy' : '⚠ Unhealthy'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {device.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{device.description}</Text>
      )}

      <View style={styles.footer}>
        <Text style={[styles.id, { color: colors.textTertiary }]}>ID: {device.id.substring(0, 8)}...</Text>
        <Text style={[styles.type, { color: colors.textTertiary }]}>Type: {device.type.name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
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
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
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
  },
  type: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 8,
  },
});
