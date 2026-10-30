import { useState } from 'react'
import { useGame, game } from '../game/state/store'
import { DAILIES } from '../game/data/dailies'
import { MATERIALS } from '../game/data/materials'
import { Panel, SectionTitle, Toggle, Modal } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/format'

export function SettingsScreen({ onReset }: { onReset?: () => void }) {
  const state = useGame()
  const [exported, setExported] = useState('')
  const [importCode, setImportCode] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const doExport = async () => {
    const code = game.exportCode()
    setExported(code)
    try {
      await navigator.clipboard.writeText(code)
      toast('Save code copied to clipboard.', 'success')
    } catch {
      toast('Save code generated. Copy it from the box below.', 'info')
    }
  }

  const doImport = () => {
    const result = game.importCode(importCode.trim())
    toast(result.message ?? (result.ok ? 'Save imported.' : 'Import failed.'), result.ok ? 'success' : 'error')
    if (result.ok) {
      setImportCode('')
      setExported('')
    }
  }

  const reset = () => {
    game.resetGame()
    setConfirmReset(false)
    onReset?.()
  }

  const claim = (id: string) => {
    const result = game.claimDaily(id)
    toast(result.message ?? (result.ok ? 'Challenge claimed.' : 'Cannot claim.'), result.ok ? 'success' : 'error')
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="The Wanderer's Ledger" title="Settings & Records">
        <span className="tag gold">Aetherfall v1.0</span>
      </SectionTitle>

      <div className="settings-grid">
        <Panel title="Daily Trials" className="daily-panel">
          <p className="muted small">Challenges refresh at midnight (device time). Rewards are claimed manually.</p>
          <div className="daily-list">
            {DAILIES.map((daily) => {
              const progress = Math.min(daily.target, state.dailies[daily.metric])
              const done = progress >= daily.target
              const claimed = state.dailies.claimed.includes(daily.id)
              return (
                <div className={`daily-row ${done ? 'done' : ''} ${claimed ? 'claimed' : ''}`} key={daily.id}>
                  <div className="daily-mark">
                    {claimed ? <Icon name="check" size={16} /> : <span>{progress}/{daily.target}</span>}
                  </div>
                  <div className="daily-info">
                    <strong>{daily.title}</strong>
                    <small className="muted">{daily.description}</small>
                    <div className="daily-track"><i style={{ width: `${(progress / daily.target) * 100}%` }} /></div>
                    <div className="daily-rewards">
                      {daily.rewards.gold && <span><Icon name="coins" size={11} /> {daily.rewards.gold.toLocaleString()}</span>}
                      {daily.rewards.premiumCoins && <span><Icon name="premium" size={11} /> {daily.rewards.premiumCoins}</span>}
                      {daily.rewards.materials && Object.entries(daily.rewards.materials).map(([id, count]) => (
                        <span key={id} title={MATERIALS[id as keyof typeof MATERIALS]?.name}>{count}× {MATERIALS[id as keyof typeof MATERIALS]?.name}</span>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" disabled={!done || claimed} onClick={() => claim(daily.id)}>
                    {claimed ? 'Claimed' : done ? 'Claim' : 'In progress'}
                  </button>
                </div>
              )
            })}
          </div>
        </Panel>

        <div className="settings-stack">
          <Panel title="Preferences">
            <Toggle
              checked={state.settings.reducedMotion}
              onChange={() => game.toggleSetting('reducedMotion')}
              label="Reduced motion"
              hint="Disable drifting embers and ambient animation"
            />
            <Toggle
              checked={state.settings.sound}
              onChange={() => game.toggleSetting('sound')}
              label="Sound effects"
              hint="Interface and combat cues"
            />
            <div className="settings-row">
              <div><span>Game version</span><small className="muted">Original idle fantasy build</small></div>
              <strong>1.0.0</strong>
            </div>
            <div className="settings-row">
              <div><span>Class</span><small className="muted">Chosen at the ember gate</small></div>
              <strong className="capitalize">{state.player.classId}</strong>
            </div>
            <div className="settings-row">
              <div><span>Created</span><small className="muted">First ember lit</small></div>
              <strong>{new Date(state.createdAt).toLocaleDateString()}</strong>
            </div>
          </Panel>

          <Panel title="Records">
            <div className="record-grid">
              <div><span>Total kills</span><strong>{state.statistics.kills.toLocaleString()}</strong></div>
              <div><span>Guardians slain</span><strong>{state.statistics.bosses.toLocaleString()}</strong></div>
              <div><span>Items found</span><strong>{state.statistics.itemsFound.toLocaleString()}</strong></div>
              <div><span>Dungeons cleared</span><strong>{state.statistics.dungeonsCleared.toLocaleString()}</strong></div>
              <div><span>Upgrades forged</span><strong>{state.statistics.upgrades.toLocaleString()}</strong></div>
              <div><span>Fusions</span><strong>{state.statistics.fusions.toLocaleString()}</strong></div>
              <div><span>Gold earned</span><strong>{state.statistics.goldEarned.toLocaleString()}</strong></div>
              <div><span>Deaths</span><strong>{state.statistics.deaths.toLocaleString()}</strong></div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="settings-grid">
        <Panel title="Save Data" className="save-panel">
          <p className="muted small">
            Progress is stored automatically on this device. Export a code to move your wanderer to another device or
            keep a backup. Importing replaces the current save.
          </p>
          <div className="save-actions">
            <button className="btn btn-ghost" onClick={doExport}>
              <Icon name="inventory" size={15} /> Export & copy
            </button>
            <button className="btn btn-ghost" onClick={() => game.saveNow()}>
              <Icon name="check" size={15} /> Save now
            </button>
          </div>
          {exported && (
            <textarea className="save-code" readOnly value={exported} onFocus={(e) => e.currentTarget.select()} />
          )}
          <label className="field-label" htmlFor="import-code">Import save code</label>
          <textarea
            id="import-code"
            className="save-code import"
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            placeholder="Paste an Aetherfall save code here…"
          />
          <button className="btn btn-primary btn-block" disabled={!importCode.trim()} onClick={doImport}>
            Import save
          </button>
        </Panel>

        <div className="settings-stack">
          <Panel title="About Aetherfall">
            <div className="lore-block">
              <Icon name="flame" size={18} />
              <p>
                Aetherfall: Sundered Realms is an original idle dark-fantasy RPG. Every hero, monster, relic and region is
                drawn procedurally in this app — no third-party game assets are used. Inspired by the feeling of classic
                grind-and-forge MMOs, built with its own world, names and art.
              </p>
            </div>
            <div className="about-tags">
              <span>Original art</span>
              <span>Offline progress</span>
              <span>No pay-to-win walls</span>
              <span>Server-verified IAP</span>
            </div>
          </Panel>

          <Panel title="Danger Zone" className="danger-panel">
            <p className="muted small">
              Resetting permanently erases this wanderer, every relic, companion and purchase record stored locally.
              Purchases remain in your Google Play account and can be restored after resetting.
            </p>
            <button className="btn btn-danger btn-block" onClick={() => setConfirmReset(true)}>
              <Icon name="trash" size={15} /> Reset all progress
            </button>
          </Panel>
        </div>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Erase this wanderer?">
        <div className="confirm-body">
          <div className="confirm-mark"><Icon name="flame" size={30} /></div>
          <p>
            This cannot be undone. Your level {state.player.level} {state.player.classId}, {state.inventory.length} relics
            and {(state.player.gold + state.player.premiumCoins).toLocaleString()} currencies will be lost.
          </p>
          <div className="confirm-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Keep playing</button>
            <button className="btn btn-danger" onClick={reset}>Erase everything</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
