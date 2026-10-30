import type { OfflineSummary } from '../game/types'
import { Modal } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { formatNumber, formatDuration } from '../ui/format'
import { MATERIALS } from '../game/data/materials'
import { RARITY } from '../game/data/classes'

export function OfflineModal({ summary, onClose }: { summary: OfflineSummary | null; onClose: () => void }) {
  if (!summary) return null
  return (
    <Modal open onClose={onClose} title="While You Were Away" className="offline-modal" wide>
      <div className="offline-hero">
        <div className="offline-moon">
          <Icon name="clock" size={30} />
        </div>
        <div>
          <span className="eyebrow">The ember kept burning</span>
          <h3>{formatDuration(summary.seconds)} of auto-farming</h3>
          <p>
            Your wanderer held the line for {formatNumber(summary.kills)} kills.
            {summary.levels > 0 ? ` You gained ${summary.levels} level${summary.levels === 1 ? '' : 's'}.` : ''}
          </p>
        </div>
      </div>

      <div className="offline-grid">
        <div className="reward-tile">
          <Icon name="xp" size={20} />
          <span>Experience</span>
          <strong>+{formatNumber(summary.xp)}</strong>
        </div>
        <div className="reward-tile">
          <Icon name="coins" size={20} />
          <span>Gold</span>
          <strong>+{formatNumber(summary.gold)}</strong>
        </div>
        <div className="reward-tile">
          <Icon name="spark" size={20} />
          <span>Monsters</span>
          <strong>{formatNumber(summary.kills)}</strong>
        </div>
        <div className="reward-tile">
          <Icon name="flame" size={20} />
          <span>Levels</span>
          <strong>+{summary.levels}</strong>
        </div>
      </div>

      {summary.items.length > 0 && (
        <div className="offline-items">
          <span className="eyebrow">Spoils</span>
          <div className="offline-item-list">
            {summary.items.slice(0, 8).map((item) => (
              <span key={item.uid} className="offline-item" style={{ color: RARITY[item.rarity].color }}>
                {item.name}
              </span>
            ))}
            {summary.items.length > 8 && <span className="muted">+{summary.items.length - 8} more</span>}
          </div>
        </div>
      )}

      {summary.materialText && (
        <p className="offline-materials">
          <Icon name="stones" size={14} /> {summary.materialText}
        </p>
      )}

      <button className="btn btn-primary btn-block" onClick={onClose}>
        Claim & Continue
      </button>
      <p className="fineprint center">Offline rewards are capped at 12 hours. Higher stages and power earn more.</p>
    </Modal>
  )
}

export function MaterialLine({ materials }: { materials: Record<string, number | undefined> }) {
  return (
    <span>
      {Object.entries(materials)
        .filter(([, v]) => v)
        .map(([id, v]) => `${v}× ${MATERIALS[id as keyof typeof MATERIALS]?.name ?? id}`)
        .join(' · ')}
    </span>
  )
}
