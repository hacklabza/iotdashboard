import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import { Device } from '@/types/device';
import { useTheme } from '@/hooks/useTheme';
import { deviceService } from '@/services/api/deviceService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateInterval } from '@/utils/formatters';
import { getColorValue } from '@/utils/helpers';
import { normalizeStatusItems } from '@/utils/normalize';

interface DeviceDetailsModalProps {
  visible: boolean;
  device: Device | null;
  onClose: () => void;
  onRefresh?: () => void;
}

interface HistoricalData {
  [key: string]: Array<{ timestamp: string; value: number }>;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  visible,
  device,
  onClose,
  onRefresh,
}) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  const [loadingData, setLoadingData] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      // Also refresh the expanded card data if any
      if (expandedCard) {
        await fetchHistoricalData(expandedCard);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch historical data for a specific status key
  const fetchHistoricalData = async (statusKey: string) => {
    if (!device || !token) return;

    setLoadingData(statusKey);
    try {
      const endDate = moment();
      const startDate = moment().subtract(72, 'hours');
      const sampleSize = 6;

      const response = await deviceService.getDeviceStatuses(
        token,
        device.id,
        startDate.toISOString(),
        endDate.toISOString(),
        sampleSize
      );

      // Parse the response and extract data for the specific status key
      const dataPoints: Array<{ timestamp: string; value: number }> = [];

      if (response.results) {
        response.results.forEach((status: any) => {
          const keys = statusKey.split('.');
          let value = status.status;

          // Navigate through nested structure
          for (const key of keys) {
            if (value && typeof value === 'object') {
              value = value[key];
            }
          }

          if (typeof value === 'number') {
            dataPoints.push({
              timestamp: status.created_at,
              value: value,
            });
          }
        });
      }

      setHistoricalData((prev) => ({
        ...prev,
        [statusKey]: dataPoints,
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoadingData(null);
    }
  };

  // Handle card click
  const handleCardPress = async (statusKey: string) => {
    if (expandedCard === statusKey) {
      // Collapse if already expanded
      setExpandedCard(null);
    } else {
      // Expand and fetch data if not already loaded
      setExpandedCard(statusKey);
      if (!historicalData[statusKey]) {
        await fetchHistoricalData(statusKey);
      }
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setExpandedCard(null);
      setHistoricalData({});
    }
  }, [visible]);

  const statusItems = normalizeStatusItems(device || undefined);

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
                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        onPress={handleRefresh}
                        style={styles.refreshButton}
                        disabled={isRefreshing}
                      >
                        <Text style={[styles.refreshButtonText, { color: colors.primary }]}>↻</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                </View>
                <ScrollView style={styles.modalBody}>
                  {statusItems.length > 0 ? (
                    <View style={styles.statusGrid}>
                      {statusItems.map((item) => {
                        const isExpanded = expandedCard === item.key;
                        const isHidden = expandedCard !== null && expandedCard !== item.key;

                        if (isHidden) return null;

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
                          <TouchableOpacity
                            key={item.key}
                            style={[
                              styles.statusCard,
                              {
                                backgroundColor: cardColor + '20', // Add transparency
                                borderLeftWidth: 4,
                                borderLeftColor: cardColor,
                              }
                            ]}
                            onPress={() => handleCardPress(item.key)}
                            activeOpacity={0.7}
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

                            {isExpanded && (
                              <View style={styles.chartContainer}>
                                {loadingData === item.key ? (
                                  <ActivityIndicator size="large" color={cardColor} />
                                ) : historicalData[item.key] && historicalData[item.key].length > 0 ? (
                                  <>
                                    <Text style={[styles.chartTitle, { color: colors.text }]}>
                                      Last 72 Hours
                                    </Text>
                                    <LineChart
                                      data={{
                                        labels: historicalData[item.key]
                                          .filter((_, index) => index % Math.ceil(historicalData[item.key].length / 6) === 0)
                                          .map(d => formatDateInterval(moment(d.timestamp).toDate())),
                                        datasets: [{
                                          data: historicalData[item.key].map(d => d.value),
                                          color: () => cardColor,
                                          strokeWidth: 2,
                                        }]
                                      }}
                                      width={Dimensions.get('window').width - 80}
                                      height={220}
                                      chartConfig={{
                                        backgroundColor: colors.surface,
                                        backgroundGradientFrom: colors.surface,
                                        backgroundGradientTo: colors.surface,
                                        decimalPlaces: 1,
                                        color: (opacity = 1) => `rgba(${parseInt(cardColor.slice(1, 3), 16)}, ${parseInt(cardColor.slice(3, 5), 16)}, ${parseInt(cardColor.slice(5, 7), 16)}, ${opacity})`,
                                        labelColor: () => colors.text,
                                        style: {
                                          borderRadius: 16
                                        },
                                        propsForDots: {
                                          r: '0',
                                        },
                                        propsForBackgroundLines: {
                                          strokeDasharray: '',
                                          stroke: 'transparent',
                                        }
                                      }}
                                      withDots={false}
                                      withInnerLines={false}
                                      withOuterLines={false}
                                      bezier
                                      style={styles.chart}
                                    />
                                  </>
                                ) : (
                                  <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                                    No historical data available
                                  </Text>
                                )}
                              </View>
                            )}
                          </TouchableOpacity>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 5,
  },
  refreshButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
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
  chartContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
