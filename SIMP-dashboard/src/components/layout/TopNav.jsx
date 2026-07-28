import { IconChart, IconBattery, IconSettings, IconLogs, IconGauge } from '../icons/Icons';

const TABS = [
  { id: 'graphs', label: 'Graph Dashboard', Icon: IconChart },
  { id: 'battery', label: 'Battery Status', Icon: IconBattery },
  { id: 'logs', label: 'Log Management', Icon: IconLogs },
  { id: 'calibration', label: 'Calibration Log', Icon: IconGauge },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
];

export default function TopNav({ activePage, onSelectPage }) {
  return (
    <div className="nav">
      {TABS.map((tab) => (
        <div
          key={tab.id}
          role="button"
          tabIndex={0}
          className={`nav-btn${activePage === tab.id ? ' active' : ''}`}
          onClick={() => onSelectPage(tab.id)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectPage(tab.id)}
        >
          <tab.Icon size={16} />
          {tab.label}
        </div>
      ))}
    </div>
  );
}
