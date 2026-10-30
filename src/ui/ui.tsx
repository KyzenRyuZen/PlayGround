import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

export function Panel({ children, className = '', title, actions }: { children: ReactNode; className?: string; title?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <header className="panel-head">
          <div className="panel-title">{title}</div>
          <div className="panel-actions">{actions}</div>
        </header>
      )}
      {children}
    </section>
  )
}

export function Bar({
  value,
  max,
  kind = 'hp',
  label,
  compact = false,
  showText = true,
}: {
  value: number
  max: number
  kind?: 'hp' | 'mp' | 'xp' | 'boss' | 'progress' | 'timer'
  label?: string
  compact?: boolean
  showText?: boolean
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))
  return (
    <div className={`bar-wrap ${compact ? 'compact' : ''}`}>
      {label && <span className="bar-label">{label}</span>}
      <div className={`bar bar-${kind}`}>
        <div className="bar-fill" style={{ width: `${pct}%` }} />
        {showText && (
          <span className="bar-text">
            {Math.round(value).toLocaleString()} / {Math.round(max).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: () => void
  label: string
  hint?: string
}) {
  return (
    <button type="button" className={`toggle-row ${checked ? 'on' : ''}`} onClick={onChange} aria-pressed={checked}>
      <span className="toggle-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <span className="toggle">
        <span className="toggle-knob" />
      </span>
    </button>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  className = '',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  wide?: boolean
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal ${wide ? 'modal-wide' : ''} ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-ornament top" />
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        <div className="modal-ornament bottom" />
      </div>
    </div>,
    document.body,
  )
}

export function EmptyState({ icon = 'spark', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={34} />
      <h4>{title}</h4>
      {children && <p>{children}</p>}
    </div>
  )
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children && <div className="section-actions">{children}</div>}
    </header>
  )
}

export function CostChip({ icon, children, ok = true }: { icon: string; children: ReactNode; ok?: boolean }) {
  return (
    <span className={`cost-chip ${ok ? '' : 'missing'}`}>
      <Icon name={icon} size={14} />
      {children}
    </span>
  )
}

export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="stat-line">
      <span>{label}</span>
      <strong style={accent ? { color: accent } : undefined}>{value}</strong>
    </div>
  )
}
