import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import { Device } from '@/types/device';
import { useTheme } from '@/hooks/useTheme';
import { deviceService } from '@/services/api/deviceService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateInterval } from '@/utils/formatters';
import { getColorValue, getIconEmoji, getUnitSymbol } from '@/utils/helpers';
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
  const [togglingPin, setTogglingPin] = useState<string | null>(null);
  const [toggleOverrides, setToggleOverrides] = useState<{ [key: string]: boolean }>({});

  // Helper function to check if a pin is a toggle
  const isTogglePin = (statusKey: string): boolean => {
    if (!device?.pins) return false;

    for (const pin of device.pins) {
      const displayItem = pin.display.find(d => d.value === statusKey);
      if (displayItem && pin.type?.identifier === 'toggle') {
        return true;
      }
    }
    return false;
  };

  // Handle toggle pin
  const handleTogglePin = async (statusKey: string, currentValue: boolean) => {
    if (!device || !token) return;

    setTogglingPin(statusKey);
    const newState = currentValue ? 'off' : 'on';
    const optimisticValue = !currentValue;

    // Optimistically update the toggle state immediately
    setToggleOverrides(prev => ({
      ...prev,
      [statusKey]: optimisticValue,
    }));

    try {
      await deviceService.toggleDevicePin(token, device.id, newState);

      // Optionally refresh in background to sync any other changes
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Revert the optimistic update on error
      setToggleOverrides(prev => {
        const updated = { ...prev };
        delete updated[statusKey];
        return updated;
      });
    } finally {
      setTogglingPin(null);
    }
  };

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
  const handleCardPress = async (statusKey: string, value: any) => {
    // Don't expand toggles - they're handled by the toggle control
    if (isTogglePin(statusKey)) {
      return;
    }

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
      setToggleOverrides({});
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
                        const isToggle = isTogglePin(item.key);

                        if (isHidden) return null;

                        const cardColor = item.color ? getColorValue(item.color) : colors.primary;
                        const iconEmoji = getIconEmoji(item.icon);
                        const unit = getUnitSymbol(item.unit);
                        const isTogglingThis = togglingPin === item.key;

                        // Use optimistic toggle value if available, otherwise use actual value
                        const displayValue = toggleOverrides.hasOwnProperty(item.key)
                          ? toggleOverrides[item.key]
                          : item.value;

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
                            onPress={() => handleCardPress(item.key, item.value)}
                            activeOpacity={isToggle ? 1 : 0.7}
                            disabled={isToggle}
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

                            {isToggle ? (
                              <View style={styles.toggleContainer}>
                                <TouchableOpacity
                                  style={[
                                    styles.toggleButton,
                                    {
                                      backgroundColor: displayValue ? cardColor : colors.textDisabled,
                                    }
                                  ]}
                                  onPress={() => handleTogglePin(item.key, displayValue as boolean)}
                                  disabled={isTogglingThis}
                                  activeOpacity={0.7}
                                >
                                  {isTogglingThis ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                  ) : (
                                    <View style={[
                                      styles.toggleIndicator,
                                      {
                                        transform: [{ translateX: displayValue ? 22 : 2 }],
                                      }
                                    ]} />
                                  )}
                                </TouchableOpacity>
                                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                                  {displayValue ? 'ON' : 'OFF'}
                                </Text>
                              </View>
                            ) : (
                              <>
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

                            {!isToggle && isExpanded && (
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
                              </>
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
