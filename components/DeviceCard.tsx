import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Device } from '@/types/device';
import { useTheme } from '@/hooks/useTheme';

interface DeviceCardProps {
  device: Device;
  onPress?: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onPress }) => {
  const { colors } = useTheme();

  // Generate static map URL with marker
  const getStaticMapUrl = () => {
    if (!device.location?.position?.coordinates) {
      return null;
    }

    // Check if coordinates is an array [longitude, latitude] or object
    const [longitude, latitude] = device.location.position.coordinates;

    const zoom = 17;
    const width = 600;
    const height = 200;

    const url = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=${width},${height}&z=${zoom}&l=map&pt=${longitude},${latitude},pm2rdm`;
    return url;
  };

  const mapUrl = getStaticMapUrl();

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

      {mapUrl && (
        <View style={styles.mapContainer}>
          <Image
            source={{ uri: mapUrl }}
            style={styles.mapImage}
            resizeMode="cover"
          />
          {device.location?.name && (
            <View style={[styles.locationLabel, { backgroundColor: colors.surface }]}>
              <Text style={[styles.locationText, { color: colors.text }]}>
                📍 {device.location.name}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.deviceDetail, { color: colors.textTertiary }]}>ID: {device.id.substring(0, 8)}...</Text>
        <Text style={[styles.deviceDetail, { color: colors.textTertiary }]}>Type: {device.type.name}</Text>
        <Text style={[styles.deviceDetail, { color: colors.textTertiary }]}>IP: {device.ip_address}</Text>
        <Text style={[styles.deviceDetail, { color: colors.textTertiary }]}>MAC: {device.mac_address}</Text>
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
  mapContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  locationLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  deviceDetail: {
    fontSize: 12,
    width: '48%',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 8,
  },
});
