import { useMemo, useState } from 'react';
import Header from './components/layout/Header';
import TopNav from './components/layout/TopNav';
import Footer from './components/layout/Footer';
import GraphDashboardPage from './pages/GraphDashboardPage';
import BatteryStatusPage from './pages/BatteryStatusPage';
import LogManagementPage from './pages/LogManagementPage';
import CalibrationLogPage from './pages/CalibrationLogPage';
import SettingsPage from './pages/SettingsPage';
import { IconWarning } from './components/icons/Icons';
import { useSoilNodesData } from './hooks/useSoilNodesData';
import { useWeatherData } from './hooks/useWeatherData';
import { useNodeSelection } from './hooks/useNodeSelection';
import { useWeatherSeriesToggle } from './hooks/useWeatherSeriesToggle';
import { useTimelineLabels } from './hooks/useTimelineLabels';
import { useTimeRange } from './hooks/useTimeRange';
import { filterWeatherSummary, filterWaterBalance } from './utils/filterByDateRange';
import { lastReadingTime } from './utils/nodeStatus';
import { formatDateTime } from './utils/formatters';

export default function App() {
  const [activePage, setActivePage] = useState('graphs');

  const { nodes: soilNodes, error: soilError } = useSoilNodesData();
  const { summary: weatherSummary, waterBalance, loading: weatherLoading, progress: weatherProgress, error: weatherError } = useWeatherData();

  // Two separate freshness signals rather than one blanket "Last Updated" —
  // the weather station and the soil sensors are two independent data
  // sources (see addendum §3.6) and can go stale independently of each other.
  const sensorUpdatedLabel = useMemo(() => {
    const times = Object.values(soilNodes).map(lastReadingTime).filter((t) => t != null);
    return times.length ? formatDateTime(Math.max(...times)) : '—';
  }, [soilNodes]);
  const weatherUpdatedLabel = weatherSummary?.timestamps?.length
    ? weatherSummary.timestamps[weatherSummary.timestamps.length - 1]
    : '—';

  const nodeSelection = useNodeSelection(soilNodes);
  const weatherToggle = useWeatherSeriesToggle();
  const labels = useTimelineLabels(soilNodes);
  const { range: timeRange, setRange: setTimeRange, cutoffDate, filteredLabels } = useTimeRange(labels);
  const filteredWeatherSummary = filterWeatherSummary(weatherSummary, cutoffDate);
  const filteredWaterBalance = filterWaterBalance(waterBalance, cutoffDate);

  return (
    <>
      <Header weatherUpdatedLabel={weatherUpdatedLabel} sensorUpdatedLabel={sensorUpdatedLabel} />
      <TopNav activePage={activePage} onSelectPage={setActivePage} />

      {(soilError || weatherError) && (
        <div style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, padding: '8px 16px' }}>
          {soilError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconWarning size={13} /> Failed to load soil sensor data: {soilError}
            </div>
          )}
          {weatherError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconWarning size={13} /> Failed to load weather data: {weatherError}
            </div>
          )}
        </div>
      )}

      {activePage === 'graphs' && (
        <GraphDashboardPage
          soilNodes={soilNodes}
          nodeIds={nodeSelection.nodeIds}
          labels={filteredLabels}
          timeRange={timeRange}
          onChangeTimeRange={setTimeRange}
          weatherSummary={filteredWeatherSummary}
          weatherLoading={weatherLoading}
          weatherProgress={weatherProgress}
          waterBalance={filteredWaterBalance}
          nodeSelection={nodeSelection}
          weatherToggle={weatherToggle}
        />
      )}
      {activePage === 'battery' && <BatteryStatusPage nodeIds={nodeSelection.nodeIds} soilNodes={soilNodes} />}
      {activePage === 'logs' && <LogManagementPage nodeIds={nodeSelection.nodeIds} />}
      {activePage === 'calibration' && <CalibrationLogPage nodeIds={nodeSelection.nodeIds} />}
      {activePage === 'settings' && <SettingsPage />}

      <Footer />
    </>
  );
}
