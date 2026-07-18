import { useState } from 'react';
import Header from './components/layout/Header';
import TopNav from './components/layout/TopNav';
import GraphDashboardPage from './pages/GraphDashboardPage';
import BatteryStatusPage from './pages/BatteryStatusPage';
import { useSoilNodesData } from './hooks/useSoilNodesData';
import { useWeatherData } from './hooks/useWeatherData';
import { useNodeSelection } from './hooks/useNodeSelection';
import { useWeatherSeriesToggle } from './hooks/useWeatherSeriesToggle';
import { useTimelineLabels } from './hooks/useTimelineLabels';

const SYSTEM_UPDATED_LABEL = 'Jul 18, 2026';

export default function App() {
  const [activePage, setActivePage] = useState('graphs');

  const { nodes: soilNodes, error: soilError } = useSoilNodesData();
  const { summary: weatherSummary, waterBalance, error: weatherError } = useWeatherData();

  const nodeSelection = useNodeSelection(soilNodes);
  const weatherToggle = useWeatherSeriesToggle();
  const labels = useTimelineLabels(soilNodes, weatherSummary, waterBalance);

  return (
    <>
      <Header updatedLabel={SYSTEM_UPDATED_LABEL} />
      <TopNav activePage={activePage} onSelectPage={setActivePage} />

      {(soilError || weatherError) && (
        <div style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, padding: '8px 16px' }}>
          {soilError && <div>⚠ Failed to load soil sensor data: {soilError}</div>}
          {weatherError && <div>⚠ Failed to load weather data: {weatherError}</div>}
        </div>
      )}

      {activePage === 'graphs' ? (
        <GraphDashboardPage
          soilNodes={soilNodes}
          nodeIds={nodeSelection.nodeIds}
          labels={labels}
          weatherSummary={weatherSummary}
          waterBalance={waterBalance}
          nodeSelection={nodeSelection}
          weatherToggle={weatherToggle}
        />
      ) : (
        <BatteryStatusPage nodeIds={nodeSelection.nodeIds} soilNodes={soilNodes} />
      )}
    </>
  );
}
