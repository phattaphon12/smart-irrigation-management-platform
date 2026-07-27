import Sidebar from '../components/layout/Sidebar';
import SoilTensionChart from '../components/charts/SoilTensionChart';
import EvapotranspirationChart from '../components/charts/EvapotranspirationChart';
import WaterBalanceChart from '../components/charts/WaterBalanceChart';
import WeatherLoadingCard from '../components/charts/WeatherLoadingCard';
import ZoneDepthControls from '../components/filters/ZoneDepthControls';
import SeriesToggle from '../components/filters/SeriesToggle';
import { IconDiamond } from '../components/icons/Icons';

export default function GraphDashboardPage({
  soilNodes,
  nodeIds,
  labels,
  timeRange,
  onChangeTimeRange,
  weatherSummary,
  weatherLoading,
  weatherProgress,
  waterBalance,
  nodeSelection,
  weatherToggle,
}) {
  const {
    activeNodes,
    viewMode,
    setViewMode,
    toggleNode,
    selectAll,
    selectNone,
    selectByTreatment,
    selectByDepth,
    selectOk,
    selectFlagged,
  } = nodeSelection;

  const { seriesOn, toggleSeries, cumulative, toggleCumulative } = weatherToggle;

  return (
    <div className="layout">
      <Sidebar
        soilNodes={soilNodes}
        nodeIds={nodeIds}
        activeNodes={activeNodes}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        timeRange={timeRange}
        onChangeTimeRange={onChangeTimeRange}
        onToggleNode={toggleNode}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        onSelectOk={selectOk}
        onSelectFlagged={selectFlagged}
      />

      <div className="main" id="main-graphs">
        <div className="main-inner">
          <SoilTensionChart
            labels={labels}
            soilNodes={soilNodes}
            activeNodes={activeNodes}
            viewMode={viewMode}
            nodeIds={nodeIds}
            //controls={<ZoneDepthControls onSelectTreatment={selectByTreatment} onSelectDepth={selectByDepth} />}
          />

          {weatherLoading ? (
            <WeatherLoadingCard progress={weatherProgress} />
          ) : (
            <div className="chart-card">
              <div className="chart-hd">
                <div>
                  <div className="chart-ttl">Water Use & Rainfall (mm/day)</div>
                  <div className="chart-sub">Daily data from the plot's automatic weather station</div>
                </div>
                <SeriesToggle
                  seriesOn={seriesOn}
                  onToggleSeries={toggleSeries}
                  cumulative={cumulative}
                  onToggleCumulative={toggleCumulative}
                />
              </div>
              <div className="chart-glossary">
                <b>ETo</b> = reference water loss from weather · <b>ETc</b> = water the crop actually needs · <b>Rain</b> = rainfall at the plot
              </div>
              <EvapotranspirationChart summary={weatherSummary} seriesOn={seriesOn} cumulative={cumulative} />
            </div>
          )}

          <div className="chart-card">
            <div className="chart-hd">
              <div>
                <div className="chart-ttl">Soil Water Balance (mm/day)</div>
                <div className="chart-sub" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  Rainfall minus crop water use, compared against the actual soil moisture change measured by sensors
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ea580c' }}>
                    · <IconDiamond size={8} /> = irrigation event
                  </span>
                </div>
              </div>
            </div>
            <WaterBalanceChart waterBalance={waterBalance} />
          </div>
        </div>
      </div>
    </div>
  );
}
