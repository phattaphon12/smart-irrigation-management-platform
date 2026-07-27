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
