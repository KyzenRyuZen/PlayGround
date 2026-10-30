import { useCallback, useEffect, useState } from 'react'
import type { ClassId, OfflineSummary } from './game/types'
import { game, useGame } from './game/state/store'
import type { Tab } from './ui/nav'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import { ClassSelect } from './components/ClassSelect'
import { OfflineModal } from './components/OfflineModal'
import { DungeonResultModal } from './components/DungeonResultModal'
import { BattleScreen } from './screens/BattleScreen'
import { CharacterScreen } from './screens/CharacterScreen'
import { InventoryScreen } from './screens/InventoryScreen'
import { EquipmentScreen } from './screens/EquipmentScreen'
import { SkillsScreen } from './screens/SkillsScreen'
import { CompanionScreen } from './screens/CompanionScreen'
import { StagesScreen } from './screens/StagesScreen'
import { DungeonsScreen } from './screens/DungeonsScreen'
import { BlacksmithScreen } from './screens/BlacksmithScreen'
import { FusionScreen } from './screens/FusionScreen'
import { StonesScreen } from './screens/StonesScreen'
import { CostumesScreen } from './screens/CostumesScreen'
import { ShopScreen } from './screens/ShopScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { subscribeToasts, type ToastItem } from './ui/format'

const VALID_TABS: Tab[] = [
  'battle',
  'character',
  'inventory',
  'equipment',
  'skills',
  'pets',
  'mounts',
  'stages',
  'dungeons',
  'blacksmith',
  'fusion',
  'stones',
  'costumes',
  'shop',
  'settings',
]

function tabFromHash(): Tab {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return (VALID_TABS as string[]).includes(raw) ? (raw as Tab) : 'battle'
}

function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    return subscribeToasts((item) => {
      setItems((prev) => [...prev.slice(-3), item])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((toastItem) => toastItem.id !== item.id))
      }, 3600)
    })
  }, [])

  return (
    <div className="toast-host" aria-live="polite">
      {items.map((item) => (
        <div className={`toast toast-${item.kind}`} key={item.id}>
          <span className="toast-mark">{item.kind === 'error' ? '!' : item.kind === 'success' ? '✓' : item.kind === 'loot' ? '◆' : item.kind === 'level' ? '✦' : '·'}</span>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  )
}

function ScreenRouter({ tab, navigate }: { tab: Tab; navigate: (tab: Tab) => void }) {
  switch (tab) {
    case 'battle':
      return <BattleScreen onNavigateStages={() => navigate('stages')} />
    case 'character':
      return <CharacterScreen onNavigate={navigate} />
    case 'inventory':
      return <InventoryScreen onNavigate={navigate} />
    case 'equipment':
      return <EquipmentScreen onNavigateInventory={() => navigate('inventory')} />
    case 'skills':
      return <SkillsScreen />
    case 'pets':
      return <CompanionScreen kind="pet" onNavigate={navigate} />
    case 'mounts':
      return <CompanionScreen kind="mount" onNavigate={navigate} />
    case 'stages':
      return <StagesScreen />
    case 'dungeons':
      return <DungeonsScreen onNavigateBattle={() => navigate('battle')} />
    case 'blacksmith':
      return <BlacksmithScreen onNavigateFusion={() => navigate('fusion')} />
    case 'fusion':
      return <FusionScreen />
    case 'stones':
      return <StonesScreen />
    case 'costumes':
      return <CostumesScreen onNavigateShop={() => navigate('shop')} />
    case 'shop':
      return <ShopScreen />
    case 'settings':
      return <SettingsScreen onReset={() => navigate('battle')} />
    default:
      return <BattleScreen onNavigateStages={() => navigate('stages')} />
  }
}

export default function App() {
  const state = useGame()
  const [tab, setTab] = useState<Tab>(() => tabFromHash())
  const [menuOpen, setMenuOpen] = useState(false)
  const [offline, setOffline] = useState<OfflineSummary | null>(() => game.takeOfflineSummary())

  const navigate = useCallback((next: Tab) => {
    setTab(next)
    setMenuOpen(false)
    window.history.replaceState(null, '', `#/${next}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!game.started) return
    const interval = window.setInterval(() => game.tick(), 120)
    return () => window.clearInterval(interval)
  }, [game.started])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        game.saveNow()
      } else {
        const summary = game.handleReturn()
        if (summary) setOffline(summary)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', state.settings.reducedMotion)
  }, [state.settings.reducedMotion])

  useEffect(() => {
    document.body.classList.toggle('drawer-open', menuOpen)
    return () => document.body.classList.remove('drawer-open')
  }, [menuOpen])

  const start = (classId: ClassId, name: string) => {
    game.startGame(classId, name)
    setOffline(null)
    navigate('battle')
  }

  if (!game.started) {
    return (
      <>
        <ClassSelect onStart={start} />
        <ToastHost />
      </>
    )
  }

  return (
    <div className={`app-shell ${state.settings.reducedMotion ? 'no-motion' : ''}`}>
      <TopBar onMenu={() => setMenuOpen(true)} onNavigateShop={() => navigate('shop')} />

      <div className="app-body">
        <Sidebar tab={tab} onNavigate={navigate} />
        <main className="app-main" key={tab}>
          <ScreenRouter tab={tab} navigate={navigate} />
        </main>
      </div>

      <BottomNav tab={tab} onNavigate={navigate} onMore={() => setMenuOpen(true)} />

      {menuOpen && (
        <div className="drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <Sidebar tab={tab} onNavigate={navigate} />
          </div>
        </div>
      )}

      <OfflineModal summary={offline} onClose={() => setOffline(null)} />
      <DungeonResultModal result={state.lastDungeonResult} onClose={() => game.dismissDungeonResult()} />
      <ToastHost />
    </div>
  )
}
