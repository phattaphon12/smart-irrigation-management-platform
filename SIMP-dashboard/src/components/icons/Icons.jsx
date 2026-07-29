/**
 * Small hand-rolled inline SVG icons (no icon-library dependency). All use
 * currentColor so they inherit whatever text color the surrounding button/label
 * already has (e.g. white on the active gradient pill, muted gray otherwise).
 */

const BASE_PROPS = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconChart({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M3 17V10" />
      <path d="M9.5 17V5" />
      <path d="M16 17V12" />
      <path d="M2.5 17.5h15" strokeWidth="1.4" opacity="0.55" />
    </svg>
  );
}

export function IconBattery({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <rect x="2" y="6" width="14" height="8" rx="2" />
      <path d="M18 9v2" strokeWidth="2.2" />
      <rect x="4.2" y="8.2" width="7.5" height="3.6" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSettings({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <line x1="3" y1="6" x2="17" y2="6" />
      <circle cx="12" cy="6" r="2" />
      <line x1="3" y1="14" x2="17" y2="14" />
      <circle cx="8" cy="14" r="2" />
    </svg>
  );
}

export function IconWarning({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M10 3.2L18 17H2z" />
      <line x1="10" y1="8" x2="10" y2="12" />
      <circle cx="10" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconEdit({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M12.5 4.5l3 3L6 17H3v-3z" />
      <path d="M11 6l3 3" />
    </svg>
  );
}

export function IconPlus({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <line x1="10" y1="4" x2="10" y2="16" />
      <line x1="4" y1="10" x2="16" y2="10" />
    </svg>
  );
}

export function IconDiamond({ size = 10, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" stroke="none" {...props}>
      <polygon points="10,2 18,10 10,18 2,10" />
    </svg>
  );
}

export function IconTrash({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M4 6h12" />
      <path d="M8 6V4.5h4V6" />
      <path d="M5.5 6l.7 10a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9l.7-10" />
      <path d="M8.3 9v5" />
      <path d="M11.7 9v5" />
    </svg>
  );
}

export function IconRestore({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M4 10a6 6 0 1 0 2-4.5" />
      <path d="M4 3.5V6.5H7" />
    </svg>
  );
}

export function IconRefresh({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M16 10a6 6 0 1 1-2-4.5" />
      <path d="M16 3v3.5h-3.5" />
    </svg>
  );
}

export function IconFilter({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M3 4h14l-5.5 6.5V16l-3-1.5v-4L3 4z" />
    </svg>
  );
}

export function IconChevronDown({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M5 7.5L10 12.5L15 7.5" />
    </svg>
  );
}

export function IconLogs({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="6.5" y1="11.5" x2="10.5" y2="11.5" />
      <line x1="6.5" y1="14.2" x2="13.5" y2="14.2" />
    </svg>
  );
}

export function IconClock({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6v4.2l3 2" />
    </svg>
  );
}

export function IconSun({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <circle cx="10" cy="10" r="3.2" />
      <line x1="10" y1="2.3" x2="10" y2="4.3" />
      <line x1="10" y1="15.7" x2="10" y2="17.7" />
      <line x1="2.3" y1="10" x2="4.3" y2="10" />
      <line x1="15.7" y1="10" x2="17.7" y2="10" />
      <line x1="4.7" y1="4.7" x2="6.1" y2="6.1" />
      <line x1="13.9" y1="13.9" x2="15.3" y2="15.3" />
      <line x1="4.7" y1="15.3" x2="6.1" y2="13.9" />
      <line x1="13.9" y1="6.1" x2="15.3" y2="4.7" />
    </svg>
  );
}

export function IconDroplet({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M10 2.6C10 2.6 4.7 9.1 4.7 12.6a5.3 5.3 0 0 0 10.6 0C15.3 9.1 10 2.6 10 2.6z" />
    </svg>
  );
}

export function IconCloudRain({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M5.8 9.6a3.4 3.4 0 1 1 0.9-6.7A4.4 4.4 0 0 1 15 6.4a2.9 2.9 0 0 1-0.4 5.8H5.8z" />
      <line x1="7" y1="13.3" x2="6.1" y2="15.8" />
      <line x1="10.2" y1="13.3" x2="9.3" y2="15.8" />
      <line x1="13.4" y1="13.3" x2="12.5" y2="15.8" />
    </svg>
  );
}

export function IconCheckCircle({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M6.8 10.2l2.1 2.1 4.3-4.6" />
    </svg>
  );
}

export function IconWifiOff({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <line x1="3" y1="3" x2="17" y2="17" />
      <path d="M5.5 8.2a10 10 0 0 1 4-1.9" />
      <path d="M12 6.4a10 10 0 0 1 2.5 1.8" />
      <path d="M7.7 10.8a5.5 5.5 0 0 1 2.2-1" />
      <path d="M11 11.7a5.5 5.5 0 0 1 1.3 1" />
      <circle cx="10" cy="15" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSignal({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <line x1="4" y1="15" x2="4" y2="12" />
      <line x1="8" y1="15" x2="8" y2="9" />
      <line x1="12" y1="15" x2="12" y2="6" />
      <line x1="16" y1="15" x2="16" y2="3" />
    </svg>
  );
}

export function IconRuler({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <rect x="3" y="7" width="14" height="6" rx="1.2" />
      <line x1="6" y1="7" x2="6" y2="9.3" />
      <line x1="9" y1="7" x2="9" y2="9.3" />
      <line x1="12" y1="7" x2="12" y2="9.3" />
      <line x1="15" y1="7" x2="15" y2="9.3" />
    </svg>
  );
}

export function IconGauge({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...BASE_PROPS} {...props}>
      <path d="M3 13a7 7 0 1 1 14 0" />
      <line x1="10" y1="13" x2="13.5" y2="8.5" />
      <line x1="3" y1="16.5" x2="17" y2="16.5" />
    </svg>
  );
}
