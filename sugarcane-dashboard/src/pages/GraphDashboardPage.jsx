import Sidebar from '../components/layout/Sidebar';
import SoilTensionChart from '../components/charts/SoilTensionChart';
import EvapotranspirationChart from '../components/charts/EvapotranspirationChart';
import WaterBalanceChart from '../components/charts/WaterBalanceChart';
import ZoneDepthControls from '../components/filters/ZoneDepthControls';
import SeriesToggle from '../components/filters/SeriesToggle';

export default function GraphDashboardPage({
  soilNodes,
  nodeIds,
  labels,
  weatherSummary,
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
            controls={<ZoneDepthControls onSelectTreatment={selectByTreatment} onSelectDepth={selectByDepth} />}
          />

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

          <div className="chart-card">
            <div className="chart-hd">
              <div>
                <div className="chart-ttl">Soil Water Balance (mm/day)</div>
                <div className="chart-sub">Rainfall minus crop water use, compared against the actual soil moisture change measured by sensors · ◆ = irrigation event</div>
              </div>
            </div>
            <WaterBalanceChart waterBalance={waterBalance} />
          </div>
        </div>
      </div>
    </div>
  );
}
