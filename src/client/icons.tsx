/**
 * Inline SVG icon set (no external icon dependency).
 *
 * @module dsh-mcp-manager/client/icons
 */

interface IconProps {
  size?: number
  className?: string
}

function base(size: number | undefined, className: string | undefined) {
  return {
    width: size ?? 16,
    height: size ?? 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true as const,
  }
}

/** Server / database icon used on the sidebar trigger. */
export function ServerIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </svg>
  )
}

/** Close (×) icon. */
export function CloseIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

/** Plus icon. */
export function PlusIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

/** Trash icon. */
export function TrashIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
    </svg>
  )
}

/** Pencil (edit) icon. */
export function EditIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

/** Refresh icon. */
export function RefreshIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </svg>
  )
}

/** Plug / connection-test icon. */
export function PlugIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <path d="M12 22v-5M9 8V3M15 8V3M6 8h12v4a6 6 0 0 1-12 0Z" />
    </svg>
  )
}

/** Power (enable/disable) icon. */
export function PowerIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0" />
    </svg>
  )
}

/** Chevron-down icon. */
export function ChevronDownIcon({ size, className }: IconProps): JSX.Element {
  return (
    <svg {...base(size, className)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
