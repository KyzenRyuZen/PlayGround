import type { Tab } from '../ui/nav'
import { NAV_GROUPS, TAB_META } from '../ui/nav'
import { Icon } from '../ui/Icon'
import { HeroArt } from '../ui/HeroArt'
import { useGame } from '../game/state/store'
import { getPlayerStats } from '../game/engine/stats'
import { xpToNext } from '../game/engine/progression'
import { CLASSES } from '../game/data/classes'
import { Bar } from '../ui/ui'

export function Sidebar({ tab, onNavigate }: { tab: Tab; onNavigate: (tab: Tab) => void }) {
  const state = useGame()
  const stats = getPlayerStats(state)
  const cls = CLASSES[state.player.classId]
  const costumeIds = Object.values(state.costumes.equipped)
  return (
    <aside className="sidebar">
      <div className="sidebar-hero">
        <div className="sidebar-art">
          <HeroArt classId={state.player.classId} size={130} costumeIds={costumeIds} />
        </div>
        <div className="sidebar-hero-info">
          <span className="eyebrow">{cls.title}</span>
          <strong>{state.player.name}</strong>
          <span className="muted">Level {state.player.level} {cls.name}</span>
          <Bar value={state.player.xp} max={xpToNext(state.player.level)} kind="xp" compact showText={false} />
          <span className="sidebar-power">{stats.power.toLocaleString()} power</span>
        </div>
      </div>
      <nav className="side-nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <span className="nav-group-label">{group.label}</span>
            {group.tabs.map((item) => {
              const meta = TAB_META[item]
              return (
                <button
                  key={item}
                  className={`nav-link ${tab === item ? 'active' : ''}`}
                  onClick={() => onNavigate(item)}
                >
                  <Icon name={meta.icon} size={18} />
                  <span>{meta.label}</span>
                  {item === 'dungeons' && state.lastDungeonResult && <i className="nav-dot" />}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">v1.0 · Original idle fantasy</div>
    </aside>
  )
}
