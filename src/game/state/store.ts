import { useEffect, useReducer } from 'react'
import type { ClassId, GameState, Item, MaterialId, OfflineSummary, Rarity, SlotId } from '../types'
import { createNewGame } from './initial'
import { clearSave, exportSave, importSave, loadGame, saveGame } from './persistence'
import { createRng } from '../rng'
import type { Rng } from '../rng'
import { getPlayerStats } from '../engine/stats'
import {
  AFFIX_OP_COSTS,
  addAffix as rollAddedAffix,
  affixCap,
  empowerRandomAffix,
  fuseCost,
  fuseItems,
  rerollAffixes as rollAffixes,
  resolveUpgrade,
  sellPrice,
  upgradeCost,
} from '../engine/items'
import {
  castSkill as engineCastSkill,
  dungeonAttemptsRemaining,
  leaveDungeon as engineLeaveDungeon,
  selectStage as engineSelectStage,
  spawnStageEnemy,
  startDungeon as engineStartDungeon,
  tickCombat,
} from '../engine/combat'
import {
  addLog,
  collectPendingLoot,
  grantGold,
  grantMaterials,
  hasMaterials,
  spendMaterials,
} from '../engine/rewards'
import { allocatePoint as engineAllocate, ensureDailyReset, trackDaily } from '../engine/progression'
import { simulateOffline } from '../engine/offline'
import { levelUpStone, stoneUpgrade, stoneValue } from '../engine/stones'
import { COIN_PACKAGES, SHOP_OFFERS } from '../../config/shop.config'
import { dailyById } from '../data/dailies'
import { DUNGEONS } from '../data/dungeons'
import { companionById, companionUpgradeCost, COMPANION_MAX_LEVEL } from '../data/companions'
import { costumeById } from '../data/costumes'
import { MATERIALS } from '../data/materials'
import { RARITY, RARITY_ORDER, SKILLS as SKILL_LIST } from '../data/classes'
import { billingAvailable, loadLocalizedPrices, purchaseCoinPackage, restorePurchases, type VerifiedPurchase } from '../../services/iap'
import { isBillingConfigured } from '../../config/iap'

export interface ActionResult {
  ok: boolean
  message?: string
  item?: Item
}

type Listener = () => void

export class GameStore {
  state: GameState
  started: boolean
  version = 0
  rng: Rng
  offlineSummary: OfflineSummary | null = null
  isPurchasing = false
  private listeners = new Set<Listener>()
  private lastTick = Date.now()
  private lastSave = Date.now()

  constructor() {
    const saved = loadGame()
    if (saved) {
      this.state = saved
      this.started = true
      this.rng = createRng(Date.now())
      this.catchUp()
      spawnStageEnemy(this.state, this.rng)
      saveGame(this.state)
      this.lastSave = Date.now()
    } else {
      this.state = createNewGame('warrior', 'Wanderer')
      this.started = false
      this.rng = createRng(Date.now())
    }
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getVersion = () => this.version

  private emit() {
    this.version += 1
    for (const listener of this.listeners) listener()
  }

  private commit(save = false) {
    if (save) this.saveNow()
    this.emit()
  }

  saveNow() {
    if (!this.started) return
    saveGame(this.state)
    this.lastSave = Date.now()
  }

  /** Apply offline rewards when the app is reopened. */
  private catchUp() {
    const away = (Date.now() - this.state.lastActiveAt) / 1000
    if (away > 60) {
      const summary = simulateOffline(this.state, away, this.rng)
      if (summary) {
        this.offlineSummary = summary
        this.state.lastDungeonResult = null
        addLog(this.state, `Offline rewards collected for ${Math.round(away / 60)} minutes away.`, 'system')
      }
    }
    const stats = getPlayerStats(this.state)
    this.state.player.hp = stats.maxHp
    this.state.player.mp = stats.maxMp
    this.state.lastActiveAt = Date.now()
  }

  takeOfflineSummary(): OfflineSummary | null {
    const summary = this.offlineSummary
    this.offlineSummary = null
    return summary
  }

  tick(): void {
    const now = Date.now()
    const dt = (now - this.lastTick) / 1000
    this.lastTick = now
    if (!this.started) return
    ensureDailyReset(this.state)
    tickCombat(this.state, dt, this.rng)
    if (now - this.lastSave > 7000) {
      this.saveNow()
    }
    this.emit()
  }

  /** Call when the tab becomes visible again. */
  handleReturn(): OfflineSummary | null {
    if (!this.started) return null
    const away = (Date.now() - this.state.lastActiveAt) / 1000
    this.lastTick = Date.now()
    if (away > 120) {
      const summary = simulateOffline(this.state, away, this.rng)
      if (summary) {
        this.offlineSummary = summary
        const stats = getPlayerStats(this.state)
        this.state.player.hp = stats.maxHp
        this.state.player.mp = stats.maxMp
        this.saveNow()
        this.emit()
        return summary
      }
    }
    this.state.lastActiveAt = Date.now()
    this.saveNow()
    this.emit()
    return null
  }

  // ── Boot / character ──────────────────────────────────────────────────────

  startGame(classId: ClassId, name: string): void {
    clearSave()
    this.state = createNewGame(classId, name.trim().slice(0, 18) || 'Wanderer')
    this.started = true
    this.rng = createRng(Date.now())
    this.lastTick = Date.now()
    spawnStageEnemy(this.state, this.rng)
    addLog(this.state, `${this.state.player.name} enters the Sundered Realms.`, 'system')
    saveGame(this.state)
    this.emit()
  }

  allocate(stat: keyof GameState['player']['attributes']): ActionResult {
    if (!engineAllocate(this.state, stat)) return { ok: false, message: 'No attribute points available.' }
    const stats = getPlayerStats(this.state)
    this.state.player.hp = Math.min(stats.maxHp, this.state.player.hp)
    this.commit()
    return { ok: true }
  }

  toggleAutoAssign(): void {
    this.state.player.autoAssign = !this.state.player.autoAssign
    addLog(this.state, `Auto-assign attributes ${this.state.player.autoAssign ? 'enabled' : 'disabled'}.`, 'system')
    this.commit(true)
  }

  upgradeSkill(id: string): ActionResult {
    const def = SKILL_LIST.find((s) => s.id === id)
    if (!def) return { ok: false, message: 'Unknown skill.' }
    if (this.state.player.level < def.unlockLevel) return { ok: false, message: `Unlocks at level ${def.unlockLevel}.` }
    const level = this.state.skillLevels[id] ?? 1
    if (level >= 10) return { ok: false, message: 'This skill is already at maximum level.' }
    if (this.state.player.skillPoints < 1) return { ok: false, message: 'No skill points available.' }
    const cost = 400 * level * level
    if (this.state.player.gold < cost) return { ok: false, message: 'Not enough gold.' }
    this.state.player.gold -= cost
    this.state.player.skillPoints -= 1
    this.state.skillLevels[id] = level + 1
    addLog(this.state, `${def.name} improved to rank ${level + 1}.`, 'level')
    this.commit(true)
    return { ok: true, message: `${def.name} is now rank ${level + 1}.` }
  }

  castSkill(id: string): void {
    engineCastSkill(this.state, id, this.rng, true)
    this.commit()
  }

  // ── Stage / auto settings ─────────────────────────────────────────────────

  selectStage(stage: number): ActionResult {
    if (this.state.combat.mode === 'dungeon') return { ok: false, message: 'Leave the dungeon first.' }
    const ok = engineSelectStage(this.state, stage, this.rng)
    this.commit(true)
    return ok ? { ok: true } : { ok: false, message: 'That stage is not unlocked yet.' }
  }

  toggleAuto(key: 'autoAdvance' | 'autoSkills' | 'autoLoot' | 'autoSellCommon'): void {
    this.state.progress[key] = !this.state.progress[key]
    const labels = {
      autoAdvance: 'Auto-advance',
      autoSkills: 'Auto-skills',
      autoLoot: 'Auto-loot',
      autoSellCommon: 'Auto-sell commons',
    }
    addLog(this.state, `${labels[key]} ${this.state.progress[key] ? 'enabled' : 'disabled'}.`, 'system')
    this.commit(true)
  }

  collectLoot(): number {
    const count = collectPendingLoot(this.state)
    this.commit(true)
    return count
  }

  // ── Inventory & equipment ─────────────────────────────────────────────────

  private findItem(uid: string): { item: Item; equippedSlot: SlotId | null } | null {
    const inv = this.state.inventory.find((i) => i.uid === uid)
    if (inv) return { item: inv, equippedSlot: null }
    for (const slot of Object.keys(this.state.equipment) as SlotId[]) {
      const item = this.state.equipment[slot]
      if (item?.uid === uid) return { item, equippedSlot: slot }
    }
    return null
  }

  private removeItem(uid: string): void {
    this.state.inventory = this.state.inventory.filter((i) => i.uid !== uid)
    for (const slot of Object.keys(this.state.equipment) as SlotId[]) {
      if (this.state.equipment[slot]?.uid === uid) this.state.equipment[slot] = null
    }
  }

  private clampVitals(): void {
    const stats = getPlayerStats(this.state)
    this.state.player.hp = Math.max(1, Math.min(this.state.player.hp, stats.maxHp))
    this.state.player.mp = Math.min(this.state.player.mp, stats.maxMp)
  }

  equipItem(uid: string): ActionResult {
    const found = this.findItem(uid)
    if (!found || found.equippedSlot) return { ok: false, message: 'Item not found in your bags.' }
    const item = found.item
    if (item.classReq && item.classReq !== this.state.player.classId) {
      return { ok: false, message: 'Your class cannot equip this weapon.' }
    }
    this.state.inventory = this.state.inventory.filter((i) => i.uid !== uid)
    const previous = this.state.equipment[item.slot]
    if (previous) this.state.inventory.push(previous)
    this.state.equipment[item.slot] = item
    addLog(this.state, `Equipped ${item.name}.`, 'system')
    this.clampVitals()
    this.commit(true)
    return { ok: true, message: `${item.name} equipped.` }
  }

  unequipSlot(slot: SlotId): ActionResult {
    const item = this.state.equipment[slot]
    if (!item) return { ok: false, message: 'Nothing equipped there.' }
    if (this.state.inventory.length >= 150) return { ok: false, message: 'Your bags are full.' }
    this.state.equipment[slot] = null
    this.state.inventory.push(item)
    addLog(this.state, `Unequipped ${item.name}.`, 'system')
    this.clampVitals()
    this.commit(true)
    return { ok: true }
  }

  sellItem(uid: string): ActionResult {
    const found = this.findItem(uid)
    if (!found || found.equippedSlot) return { ok: false, message: 'Unequip the item before selling it.' }
    if (found.item.locked) return { ok: false, message: 'This item is locked.' }
    const price = sellPrice(found.item)
    this.removeItem(uid)
    grantGold(this.state, price)
    addLog(this.state, `Sold ${found.item.name} for ${price.toLocaleString()} gold.`, 'loot')
    this.commit(true)
    return { ok: true, message: `Sold for ${price.toLocaleString()} gold.` }
  }

  toggleLock(uid: string): void {
    const found = this.findItem(uid)
    if (!found) return
    found.item.locked = !found.item.locked
    this.commit(true)
  }

  sellUnlockedBelow(rarity: Rarity): ActionResult {
    const threshold = RARITY_ORDER.indexOf(rarity)
    let sold = 0
    let gold = 0
    this.state.inventory = this.state.inventory.filter((item) => {
      if (!item.locked && RARITY_ORDER.indexOf(item.rarity) <= threshold) {
        sold += 1
        gold += sellPrice(item)
        return false
      }
      return true
    })
    if (!sold) return { ok: false, message: 'Nothing eligible to sell.' }
    grantGold(this.state, gold)
    addLog(this.state, `Sold ${sold} items for ${gold.toLocaleString()} gold.`, 'loot')
    this.commit(true)
    return { ok: true, message: `Sold ${sold} items for ${gold.toLocaleString()} gold.` }
  }

  // ── Blacksmith ────────────────────────────────────────────────────────────

  upgradeItem(uid: string, useProtection: boolean): ActionResult & {
    success?: boolean
    destroyed?: boolean
    downgraded?: boolean
    plus?: number
  } {
    const found = this.findItem(uid)
    if (!found) return { ok: false, message: 'Item not found.' }
    const item = found.item
    if (item.plus >= 15) return { ok: false, message: 'This item is already +15.' }
    const cost = upgradeCost(item)
    if (this.state.player.gold < cost.gold) return { ok: false, message: 'Not enough gold.' }
    if ((this.state.materials[cost.material] ?? 0) < cost.stones) {
      return { ok: false, message: `Not enough ${MATERIALS[cost.material].name}.` }
    }
    if (useProtection && (this.state.materials.protection_scroll ?? 0) < 1) {
      return { ok: false, message: 'No Ward Scrolls available.' }
    }

    this.state.player.gold -= cost.gold
    this.state.materials[cost.material] -= cost.stones
    if (useProtection) this.state.materials.protection_scroll -= 1
    const outcome = resolveUpgrade(item, this.rng, useProtection)
    this.state.statistics.upgrades += 1
    trackDaily(this.state, 'upgrades')

    if (outcome.success) {
      item.plus = outcome.nextPlus
      addLog(this.state, `${item.name} upgraded to +${item.plus}.`, 'forge')
    } else if (outcome.destroyed) {
      this.removeItem(uid)
      addLog(this.state, `${item.name} shattered in the forge.`, 'forge')
    } else if (outcome.downgraded) {
      item.plus = outcome.nextPlus
      addLog(this.state, `${item.name} lost an upgrade and fell to +${item.plus}.`, 'forge')
    } else {
      addLog(this.state, `The forge rejects ${item.name}. Nothing changed.`, 'forge')
    }
    this.clampVitals()
    this.commit(true)
    return {
      ok: true,
      success: outcome.success,
      destroyed: outcome.destroyed,
      downgraded: outcome.downgraded,
      plus: item.plus,
      message: outcome.destroyed
        ? `${item.name} was destroyed.`
        : outcome.success
          ? `Success! ${item.name} is now +${item.plus}.`
          : outcome.downgraded
            ? `Failure. The item fell to +${item.plus}.`
            : 'Failure. The item was not harmed.',
    }
  }

  addBonus(uid: string): ActionResult {
    const found = this.findItem(uid)
    if (!found) return { ok: false, message: 'Item not found.' }
    const item = found.item
    if (item.affixes.length >= affixCap(item)) return { ok: false, message: 'This item has no room for another bonus.' }
    if (this.state.player.gold < AFFIX_OP_COSTS.add.gold) return { ok: false, message: 'Not enough gold.' }
    if (!hasMaterials(this.state, AFFIX_OP_COSTS.add.materials)) return { ok: false, message: 'Requires a Mystic Rune.' }
    this.state.player.gold -= AFFIX_OP_COSTS.add.gold
    spendMaterials(this.state, AFFIX_OP_COSTS.add.materials)
    const affix = rollAddedAffix(this.rng, item)
    if (!affix) return { ok: false, message: 'No room for another bonus.' }
    addLog(this.state, `${item.name} gained a new bonus.`, 'forge')
    this.commit(true)
    return { ok: true, message: 'A new random bonus is etched into the item.' }
  }

  rerollBonuses(uid: string): ActionResult {
    const found = this.findItem(uid)
    if (!found) return { ok: false, message: 'Item not found.' }
    if (this.state.player.gold < AFFIX_OP_COSTS.reroll.gold) return { ok: false, message: 'Not enough gold.' }
    if (!hasMaterials(this.state, AFFIX_OP_COSTS.reroll.materials)) return { ok: false, message: 'Requires a Chaos Crystal.' }
    this.state.player.gold -= AFFIX_OP_COSTS.reroll.gold
    spendMaterials(this.state, AFFIX_OP_COSTS.reroll.materials)
    rollAffixes(this.rng, found.item)
    addLog(this.state, `${found.item.name}'s bonuses were rerolled.`, 'forge')
    this.commit(true)
    return { ok: true, message: 'All bonuses rerolled.' }
  }

  empowerBonus(uid: string): ActionResult {
    const found = this.findItem(uid)
    if (!found) return { ok: false, message: 'Item not found.' }
    if (this.state.player.gold < AFFIX_OP_COSTS.empower.gold) return { ok: false, message: 'Not enough gold.' }
    if (!hasMaterials(this.state, AFFIX_OP_COSTS.empower.materials)) {
      return { ok: false, message: 'Requires 2 Refinement Powder.' }
    }
    if (!found.item.affixes.some((a) => a.quality < 1.5)) {
      return { ok: false, message: 'Every bonus on this item is already empowered.' }
    }
    this.state.player.gold -= AFFIX_OP_COSTS.empower.gold
    spendMaterials(this.state, AFFIX_OP_COSTS.empower.materials)
    const affix = empowerRandomAffix(this.rng, found.item)
    addLog(this.state, `${found.item.name} resonates with power.`, 'forge')
    this.commit(true)
    return { ok: true, message: affix ? 'One random bonus was empowered.' : 'No bonus could be empowered.' }
  }

  // ── Fusion ────────────────────────────────────────────────────────────────

  fuse(uids: string[]): ActionResult {
    if (uids.length !== 4) return { ok: false, message: 'Select exactly 4 identical items.' }
    const items: Item[] = []
    for (const uid of uids) {
      const item = this.state.inventory.find((i) => i.uid === uid)
      if (!item) return { ok: false, message: 'All four items must be in your bags.' }
      items.push(item)
    }
    const first = items[0]!
    if (!items.every((i) => i.baseId === first.baseId && i.rarity === first.rarity)) {
      return { ok: false, message: 'All four items must share the same base and rarity.' }
    }
    if (first.rarity === 'divine') return { ok: false, message: 'Divine items cannot be fused.' }
    const cost = fuseCost(items)
    if (this.state.player.gold < cost) return { ok: false, message: `Fusion costs ${cost.toLocaleString()} gold.` }
    const result = fuseItems(this.rng, items)
    this.state.player.gold -= cost
    this.state.inventory = this.state.inventory.filter((i) => !uids.includes(i.uid))
    this.state.inventory.push(result)
    this.state.statistics.fusions += 1
    addLog(this.state, `Fused four ${RARITY[first.rarity].name} items into ${result.name}.`, 'forge')
    this.commit(true)
    return { ok: true, item: result, message: `Created ${result.name}!` }
  }

  // ── Stones ────────────────────────────────────────────────────────────────

  equipStone(uid: string, index: number): ActionResult {
    if (index < 0 || index > 2) return { ok: false, message: 'Invalid socket.' }
    const stone = this.state.stones.inventory.find((s) => s.uid === uid)
    if (!stone) return { ok: false, message: 'Stone not found.' }
    const previous = this.state.stones.equipped[index]
    this.state.stones.inventory = this.state.stones.inventory.filter((s) => s.uid !== uid)
    if (previous) this.state.stones.inventory.push(previous)
    this.state.stones.equipped[index] = stone
    addLog(this.state, `${stone.name} socketed.`, 'system')
    this.clampVitals()
    this.commit(true)
    return { ok: true }
  }

  unequipStone(index: number): ActionResult {
    const stone = this.state.stones.equipped[index]
    if (!stone) return { ok: false, message: 'That socket is empty.' }
    this.state.stones.equipped[index] = null
    this.state.stones.inventory.push(stone)
    this.clampVitals()
    this.commit(true)
    return { ok: true }
  }

  upgradeStone(uid: string): ActionResult {
    const stone =
      this.state.stones.equipped.find((s) => s?.uid === uid) ?? this.state.stones.inventory.find((s) => s.uid === uid)
    if (!stone) return { ok: false, message: 'Stone not found.' }
    if (stone.level >= 12) return { ok: false, message: 'This stone is at maximum level.' }
    const cost = stoneUpgrade(stone.level)
    if ((this.state.materials.stone_dust ?? 0) < cost.dust) return { ok: false, message: 'Not enough Runestone Dust.' }
    if (this.state.player.gold < cost.gold) return { ok: false, message: 'Not enough gold.' }
    this.state.materials.stone_dust -= cost.dust
    this.state.player.gold -= cost.gold
    levelUpStone(stone)
    addLog(this.state, `${stone.name} empowered to level ${stone.level}.`, 'forge')
    this.clampVitals()
    this.commit(true)
    return { ok: true, message: `${stone.name} is now level ${stone.level}.` }
  }

  sellStone(uid: string): ActionResult {
    const stone = this.state.stones.inventory.find((s) => s.uid === uid)
    if (!stone) return { ok: false, message: 'Stone not found.' }
    const gold = stoneValue(stone)
    this.state.stones.inventory = this.state.stones.inventory.filter((s) => s.uid !== uid)
    grantGold(this.state, gold)
    grantMaterials(this.state, { stone_dust: 2 + stone.grade })
    addLog(this.state, `Crushed ${stone.name} for ${gold} gold and dust.`, 'loot')
    this.commit(true)
    return { ok: true, message: `Crushed for ${gold} gold and dust.` }
  }

  // ── Companions ────────────────────────────────────────────────────────────

  setActivePet(id: string | null): void {
    this.state.companions.activePet = id
    this.clampVitals()
    this.commit(true)
  }

  setActiveMount(id: string | null): void {
    this.state.companions.activeMount = id
    this.clampVitals()
    this.commit(true)
  }

  upgradeCompanion(kind: 'pet' | 'mount', id: string): ActionResult {
    const list = kind === 'pet' ? this.state.companions.pets : this.state.companions.mounts
    const owned = list.find((c) => c.id === id)
    if (!owned) return { ok: false, message: 'Companion not owned.' }
    if (owned.level >= COMPANION_MAX_LEVEL) return { ok: false, message: 'Already at maximum level.' }
    const def = companionById(id)
    if (!def) return { ok: false, message: 'Unknown companion.' }
    const gold = companionUpgradeCost(owned.level)
    const essenceId: MaterialId = kind === 'pet' ? 'pet_essence' : 'mount_essence'
    const essence = 1 + Math.floor(owned.level / 4)
    if (this.state.player.gold < gold) return { ok: false, message: 'Not enough gold.' }
    if ((this.state.materials[essenceId] ?? 0) < essence) {
      return { ok: false, message: `Requires ${essence}× ${MATERIALS[essenceId].name}.` }
    }
    this.state.player.gold -= gold
    this.state.materials[essenceId] -= essence
    owned.level += 1
    addLog(this.state, `${def.name} reached level ${owned.level}.`, 'level')
    this.clampVitals()
    this.commit(true)
    return { ok: true, message: `${def.name} is now level ${owned.level}.` }
  }

  // ── Costumes ──────────────────────────────────────────────────────────────

  equipCostume(id: string): ActionResult {
    if (!this.state.costumes.owned.includes(id)) return { ok: false, message: 'Costume not owned.' }
    const def = costumeById(id)
    if (!def) return { ok: false, message: 'Unknown costume.' }
    this.state.costumes.equipped[def.slot] = id
    addLog(this.state, `${def.name} equipped.`, 'system')
    this.clampVitals()
    this.commit(true)
    return { ok: true }
  }

  unequipCostume(slot: 'armor' | 'weapon' | 'hair' | 'effect'): void {
    delete this.state.costumes.equipped[slot]
    this.clampVitals()
    this.commit(true)
  }

  // ── Dungeons ──────────────────────────────────────────────────────────────

  startDungeon(id: string): ActionResult {
    const result = engineStartDungeon(this.state, id, this.rng)
    this.commit(true)
    return result
  }

  leaveDungeon(): void {
    engineLeaveDungeon(this.state, this.rng)
    this.commit(true)
  }

  dismissDungeonResult(): void {
    this.state.lastDungeonResult = null
    this.commit()
  }

  dungeonRemaining(id: string): number {
    const def = DUNGEONS.find((d) => d.id === id)
    return def ? dungeonAttemptsRemaining(this.state, def) : 0
  }

  // ── Dailies ───────────────────────────────────────────────────────────────

  claimDaily(id: string): ActionResult {
    ensureDailyReset(this.state)
    const def = dailyById(id)
    if (!def) return { ok: false, message: 'Unknown challenge.' }
    if (this.state.dailies.claimed.includes(id)) return { ok: false, message: 'Already claimed today.' }
    if (this.state.dailies[def.metric] < def.target) return { ok: false, message: 'Challenge not complete.' }
    if (def.rewards.gold) grantGold(this.state, def.rewards.gold)
    if (def.rewards.materials) grantMaterials(this.state, def.rewards.materials)
    if (def.rewards.premiumCoins) this.state.player.premiumCoins += def.rewards.premiumCoins
    this.state.dailies.claimed.push(id)
    addLog(this.state, `Daily challenge complete: ${def.title}.`, 'level')
    this.commit(true)
    return { ok: true, message: `Claimed: ${def.title}.` }
  }

  // ── Premium shop ──────────────────────────────────────────────────────────

  buyOffer(offerId: string): ActionResult {
    const offer = SHOP_OFFERS.find((o) => o.id === offerId)
    if (!offer) return { ok: false, message: 'Unknown offer.' }
    if (this.state.player.premiumCoins < offer.cost) {
      return { ok: false, message: 'Not enough Premium Coins.' }
    }
    const grant = offer.grant
    if (grant.kind === 'cosmetic' && this.state.costumes.owned.includes(grant.costumeId)) {
      return { ok: false, message: 'You already own this costume.' }
    }
    if (grant.kind === 'pet' && this.state.companions.pets.some((p) => p.id === grant.petId)) {
      return { ok: false, message: 'You already own this pet.' }
    }
    if (grant.kind === 'mount' && this.state.companions.mounts.some((p) => p.id === grant.mountId)) {
      return { ok: false, message: 'You already own this mount.' }
    }

    this.state.player.premiumCoins -= offer.cost
    let message = `${offer.name} acquired.`
    if (grant.kind === 'cosmetic') {
      this.state.costumes.owned.push(grant.costumeId)
      const def = costumeById(grant.costumeId)
      if (def && !this.state.costumes.equipped[def.slot]) this.state.costumes.equipped[def.slot] = def.id
    } else if (grant.kind === 'pet') {
      this.state.companions.pets.push({ id: grant.petId, level: 1 })
      if (!this.state.companions.activePet) this.state.companions.activePet = grant.petId
    } else if (grant.kind === 'mount') {
      this.state.companions.mounts.push({ id: grant.mountId, level: 1 })
      if (!this.state.companions.activeMount) this.state.companions.activeMount = grant.mountId
    } else if (grant.kind === 'materials') {
      grantMaterials(this.state, grant.materials)
      if (grant.gold) grantGold(this.state, grant.gold)
    } else if (grant.kind === 'booster') {
      const now = Date.now()
      const until = Math.max(now, grant.booster === 'xp' ? this.state.shop.xpBoostUntil : this.state.shop.lootBoostUntil)
      const expiry = until + grant.hours * 3600 * 1000
      if (grant.booster === 'xp') this.state.shop.xpBoostUntil = expiry
      else this.state.shop.lootBoostUntil = expiry
      message = `${offer.name} active for ${grant.hours} hours.`
    } else if (grant.kind === 'membership') {
      const now = Date.now()
      const base = Math.max(now, this.state.shop.membershipUntil)
      this.state.shop.membershipUntil = base + grant.days * 86400 * 1000
      message = `Emberbound Membership active for ${grant.days} days.`
    }
    addLog(this.state, message, 'shop')
    this.clampVitals()
    this.commit(true)
    return { ok: true, message }
  }

  async purchaseCoins(productId: string): Promise<ActionResult> {
    const product = COIN_PACKAGES.find((p) => p.id === productId)
    if (!product) return { ok: false, message: 'Unknown coin package.' }
    if (this.isPurchasing) return { ok: false, message: 'A purchase is already in progress.' }
    if (!billingAvailable() && !isBillingConfigured()) {
      return {
        ok: false,
        message:
          'Purchases are available only in the Google Play build. This preview does not simulate payments.',
      }
    }
    this.isPurchasing = true
    try {
      const verified = await purchaseCoinPackage(product, (v) => this.creditVerifiedPurchase(v))
      this.saveNow()
      this.emit()
      return { ok: true, message: `${verified.coins.toLocaleString()} Premium Coins delivered.` }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'The purchase could not be completed.',
      }
    } finally {
      this.isPurchasing = false
    }
  }

  async restore(): Promise<ActionResult> {
    if (!billingAvailable()) {
      return { ok: false, message: 'Google Play billing is not available in this build.' }
    }
    try {
      const count = await restorePurchases((v) => this.creditVerifiedPurchase(v))
      this.saveNow()
      this.emit()
      return count > 0
        ? { ok: true, message: `${count} purchase${count === 1 ? '' : 's'} restored.` }
        : { ok: true, message: 'No pending purchases found.' }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Restore failed.' }
    }
  }

  private creditVerifiedPurchase(purchase: VerifiedPurchase): void {
    if (this.state.shop.verifiedPurchases.includes(purchase.transactionId)) return
    this.state.shop.verifiedPurchases.push(purchase.transactionId)
    this.state.player.premiumCoins += purchase.coins
    if (!this.state.shop.ownedProducts.includes(purchase.productId)) {
      this.state.shop.ownedProducts.push(purchase.productId)
    }
    addLog(this.state, `Verified purchase: +${purchase.coins.toLocaleString()} Premium Coins.`, 'shop')
  }

  localizedPrices(): Promise<Record<string, string>> {
    return loadLocalizedPrices(COIN_PACKAGES)
  }

  // ── Settings / save management ────────────────────────────────────────────

  toggleSetting(key: 'reducedMotion' | 'sound'): void {
    this.state.settings[key] = !this.state.settings[key]
    this.commit(true)
  }

  exportCode(): string {
    return exportSave(this.state)
  }

  importCode(code: string): ActionResult {
    const state = importSave(code)
    if (!state) return { ok: false, message: 'Invalid save code.' }
    this.state = state
    this.started = true
    this.rng = createRng(Date.now())
    spawnStageEnemy(this.state, this.rng)
    this.saveNow()
    this.emit()
    return { ok: true, message: 'Save imported.' }
  }

  resetGame(): void {
    clearSave()
    this.state = createNewGame('warrior', 'Wanderer')
    this.started = false
    this.offlineSummary = null
    this.emit()
  }
}


export const game = new GameStore()

/** Re-render the calling component whenever the game state advances. */
export function useGame(): GameState {
  const [, force] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    const unsubscribe = game.subscribe(() => force())
    return unsubscribe
  }, [])
  return game.state
}
