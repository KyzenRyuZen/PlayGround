import type { DungeonResult } from '../game/types'
import { Modal } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { ItemIcon } from '../ui/ItemIcon'
import { RarityTag } from '../ui/Icon'
import { formatNumber } from '../ui/format'
import { MATERIALS } from '../game/data/materials'

export function DungeonResultModal({ result, onClose }: { result: DungeonResult | null; onClose: () => void }) {
  if (!result) return null
  return (
    <Modal open onClose={onClose} title={result.victory ? 'Guardian Vanquished' : 'The Guardian Endures'} className={result.victory ? 'victory-modal' : 'defeat-modal'}>
      <div className={`dungeon-result ${result.victory ? 'win' : 'loss'}`}>
        <div className="result-emblem">
          <Icon name={result.victory ? 'crown' : 'flame'} size={38} />
        </div>
        <span className="eyebrow">{result.name}</span>
        <h3>{result.victory ? 'The dark gives up its dead.' : 'You were cast out.'}</h3>
        {result.victory ? (
          <>
            <div className="reward-grid">
              <div className="reward-tile">
                <Icon name="xp" size={18} />
                <span>Experience</span>
                <strong>+{formatNumber(result.xp)}</strong>
              </div>
              <div className="reward-tile">
                <Icon name="coins" size={18} />
                <span>Gold</span>
                <strong>+{formatNumber(result.gold)}</strong>
              </div>
            </div>
            {result.item && (
              <div className="result-item">
                <ItemIcon slot={result.item.slot} rarity={result.item.rarity} plus={result.item.plus} size={58} />
                <div>
                  <RarityTag rarity={result.item.rarity} />
                  <strong>{result.item.name}</strong>
                  <span className="muted">Item level {result.item.level}</span>
                </div>
              </div>
            )}
            {Object.entries(result.materials).filter(([, v]) => v).length > 0 && (
              <p className="muted result-materials">
                {Object.entries(result.materials)
                  .filter(([, v]) => v)
                  .map(([id, v]) => `${v}× ${MATERIALS[id as keyof typeof MATERIALS]?.name}`)
                  .join(' · ')}
              </p>
            )}
          </>
        ) : (
          <p className="muted">No spoils this time. Strengthen your gear and try again — attempts refresh daily.</p>
        )}
        <button className="btn btn-primary btn-block" onClick={onClose}>
          Return to the Hunt
        </button>
      </div>
    </Modal>
  )
}
