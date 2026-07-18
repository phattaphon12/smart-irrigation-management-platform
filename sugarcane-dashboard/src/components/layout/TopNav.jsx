const TABS = [
  { id: 'graphs', label: '📊 Graph Dashboard' },
  { id: 'battery', label: '🔋 Battery Status' },
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
          {tab.label}
        </div>
      ))}
    </div>
  );
}
