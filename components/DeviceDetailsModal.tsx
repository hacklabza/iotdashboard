import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import moment from 'moment';
import { Device } from '@/types/device';
import { useTheme } from '@/hooks/useTheme';

interface DeviceDetailsModalProps {
  visible: boolean;
  device: Device | null;
  onClose: () => void;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  visible,
  device,
  onClose,
}) => {
  const { colors } = useTheme();

  // Helper function to get display config for a status value
  const getDisplayConfig = (statusKey: string) => {
    if (!device?.pins) return null;

    for (const pin of device.pins) {
      const displayItem = pin.display.find(d => d.value === statusKey && d.visible);
      if (displayItem) {
        return displayItem;
      }
    }
    return null;
  };

  // Helper function to get color value
  const getColorValue = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      red: '#EF5350',
      blue: '#42A5F5',
      green: '#66BB6A',
      yellow: '#FFEE58',
      orange: '#FFA726',
      purple: '#AB47BC',
      pink: '#EC407A',
      teal: '#26A69A',
      cyan: '#26C6DA',
      lime: '#D4E157',
      amber: '#FFCA28',
      indigo: '#5C6BC0',
    };
    return colorMap[colorName.toLowerCase()] || colors.primary;
  };

  // Helper function to flatten nested status structure with display config
  const getStatusItems = () => {
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
          const displayConfig = getDisplayConfig(statusKey);

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
        const displayConfig = getDisplayConfig(key);

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

  const statusItems = getStatusItems();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {device && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{device.name}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={[styles.closeButtonText, { color: colors.primary }]}>Close</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  {statusItems.length > 0 ? (
                    <View style={styles.statusGrid}>
                      {statusItems.map((item) => {
                        const cardColor = item.color ? getColorValue(item.color) : colors.primary;
                        const iconMap: { [key: string]: string } = {
                          thermometer: '🌡️',
                          humidity: '💧',
                          light: '💡',
                        };
                        const iconEmoji = item.icon ? iconMap[item.icon.toLowerCase()] || '📌' : '📌';

                        const unitMap: { [key: string]: string } = {
                          celsius: '°C',
                          fahrenheit: '°F',
                          percentage: '%',
                        };
                        const unit = item.unit ? unitMap[item.unit.toLowerCase()] || item.unit : '';

                        return (
                          <View
                            key={item.key}
                            style={[
                              styles.statusCard,
                              {
                                backgroundColor: cardColor + '20', // Add transparency
                                borderLeftWidth: 4,
                                borderLeftColor: cardColor,
                              }
                            ]}
                          >
                            <View style={styles.cardHeader}>
                              <View style={styles.cardHeaderLeft}>
                                <Text style={styles.iconText}>{iconEmoji}</Text>
                                <Text style={[styles.statusTypeName, { color: colors.text }]}>
                                  {item.label}
                                </Text>
                              </View>
                              {device.last_status && (
                                <Text style={[styles.statusTime, { color: colors.text }]}>
                                  {moment(device.last_status.created_at).fromNow()}
                                </Text>
                              )}
                            </View>
                            <View style={styles.valueContainer}>
                              <Text style={[styles.statusValue, { color: cardColor }]}>
                                {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
                              </Text>
                              {unit && (
                                <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                                  {unit}
                                </Text>
                              )}
                            </View>
                            {item.aggregation && (
                              <View style={styles.aggregationContainer}>
                                <View style={styles.aggregationRow}>
                                  <View style={styles.aggregationItem}>
                                    <Text style={[styles.aggregationLabel, { color: colors.textSecondary }]}>
                                      Min
                                    </Text>
                                    <Text style={[styles.aggregationValue, { color: colors.text }]}>
                                      {item.aggregation.minimum.toFixed(1)}{unit}
                                    </Text>
                                  </View>
                                  <View style={styles.aggregationItem}>
                                    <Text style={[styles.aggregationLabel, { color: colors.textSecondary }]}>
                                      Avg
                                    </Text>
                                    <Text style={[styles.aggregationValue, { color: colors.text }]}>
                                      {item.aggregation.average.toFixed(1)}{unit}
                                    </Text>
                                  </View>
                                  <View style={styles.aggregationItem}>
                                    <Text style={[styles.aggregationLabel, { color: colors.textSecondary }]}>
                                      Max
                                    </Text>
                                    <Text style={[styles.aggregationValue, { color: colors.text }]}>
                                      {item.aggregation.maximum.toFixed(1)}{unit}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No status information available
                      </Text>
                    </View>
                  )}
                </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    paddingVertical: 10,
    maxHeight: 500,
  },
  statusGrid: {
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 10,
  },
  statusCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  iconText: {
    fontSize: 24,
  },
  statusTypeName: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 52,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusTime: {
    fontSize: 10,
    fontWeight: '500',
    flexShrink: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  aggregationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  aggregationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  aggregationItem: {
    flex: 1,
    alignItems: 'center',
  },
  aggregationLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  aggregationValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
