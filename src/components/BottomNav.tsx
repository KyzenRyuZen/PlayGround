import { BOTTOM_TABS, TAB_META, type Tab } from '../ui/nav'
import { Icon } from '../ui/Icon'

export function BottomNav({ tab, onNavigate, onMore }: { tab: Tab; onNavigate: (t: Tab) => void; onMore: () => void }) {
  return (
    <nav className="bottom-nav">
      {BOTTOM_TABS.map((item) => (
        <button key={item} className={`bottom-link ${tab === item ? 'active' : ''}`} onClick={() => onNavigate(item)}>
          <Icon name={TAB_META[item].icon} size={21} />
          <span>{TAB_META[item].label === 'Blacksmith' ? 'Forge' : TAB_META[item].label === 'Premium Shop' ? 'Shop' : TAB_META[item].label}</span>
        </button>
      ))}
      <button className={`bottom-link ${!BOTTOM_TABS.includes(tab) ? 'active' : ''}`} onClick={onMore}>
        <span className="more-dots">
          <i /><i /><i />
        </span>
        <span>More</span>
      </button>
    </nav>
  )
}
