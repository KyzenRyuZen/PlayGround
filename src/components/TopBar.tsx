import type { GameState } from '../game/types'
import { getPlayerStats } from '../game/engine/stats'
import { timeLeft } from '../ui/format'
import { Icon } from '../ui/Icon'
import { useGame } from '../game/state/store'

interface TopBarProps {
  onMenu: () => void
  onNavigateShop: () => void
}

export function TopBar({ onMenu, onNavigateShop }: TopBarProps) {
  const state = useGame()
  const now = Date.now()
  const membership = state.shop.membershipUntil > now
  const xpBoost = state.shop.xpBoostUntil > now
  const lootBoost = state.shop.lootBoostUntil > now
  const stats = getPlayerStats(state)

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open navigation">
        <span className="hamburger" />
      </button>
      <div className="brand">
        <span className="brand-rune">
          <svg viewBox="0 0 40 40" width="30" height="30" aria-hidden>
            <path d="M20 3 L34 11 L34 29 L20 37 L6 29 L6 11 Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M20 9 L28 14 L28 26 L20 31 L12 26 L12 14 Z" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
            <path d="M20 12 L24 20 L20 28 L16 20 Z" fill="currentColor" />
          </svg>
        </span>
        <span className="brand-text">
          <strong>Aetherfall</strong>
          <small>Sundered Realms</small>
        </span>
      </div>

      <div className="topbar-spacer" />

      <div className="booster-strip">
        {membership && (
          <span className="boost-chip member">
            <Icon name="crown" size={13} /> {timeLeft(state.shop.membershipUntil, now)}
          </span>
        )}
        {xpBoost && (
          <span className="boost-chip xp">
            <Icon name="xp" size={13} /> 2× XP {timeLeft(state.shop.xpBoostUntil, now)}
          </span>
        )}
        {lootBoost && (
          <span className="boost-chip loot">
            <Icon name="spark" size={13} /> 2× Loot {timeLeft(state.shop.lootBoostUntil, now)}
          </span>
        )}
      </div>

      <div className="currency-bar">
        <button className="currency gold" onClick={onNavigateShop} title="Gold">
          <span className="coin-dot" />
          <span>{state.player.gold.toLocaleString()}</span>
        </button>
        <button className="currency premium" onClick={onNavigateShop} title="Premium Coins">
          <Icon name="premium" size={15} />
          <span>{state.player.premiumCoins.toLocaleString()}</span>
          <span className="currency-plus">+</span>
        </button>
      </div>

      <div className="topbar-power" title="Combat power">
        <span className="power-label">POWER</span>
        <span className="power-value">{stats.power.toLocaleString()}</span>
      </div>
    </header>
  )
}
