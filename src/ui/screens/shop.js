/* Premium market — verified Google Play coin packages and convenience goods. */

import { Engine } from '../../core/engine.js';
import { SHOP, BILLING, GAME } from '../../config.js';
import { billingStatus, initBilling, loadProductDetails, displayPrice, purchasePackage, billingSetupHelp } from '../../core/billing.js';
import { esc, fmt, pageHead, openModal, chip, emptyState } from '../components.js';
import { icon } from '../icons.js';

let detailsCache = {};
let billingAttempted = false;

function playerId() {
  const state = Engine.state;
  return `hero-${state?.createdAt || 0}`;
}

function chestState(now = Date.now()) {
  const last = Engine.state?.hero?.freeChestAt || 0;
  const left = Math.max(0, 20 * 3600 * 1000 - (now - last));
  return { ready: left <= 0, left };
}

function packageCard(pkg, status) {
  const coins = pkg.coins + (pkg.bonus || 0);
  const price = displayPrice(pkg, detailsCache);
  return `<article class="pack-card ${pkg.badge ? 'featured' : ''}">
    ${pkg.badge ? `<span class="pack-badge">${esc(pkg.badge)}</span>` : ''}
    <div class="eyebrow" style="position:relative">${esc(pkg.label)}</div>
    <div class="pack-coins">${icon('premium')} ${fmt(coins)}</div>
    <div class="pack-bonus">${pkg.bonus ? `Includes ${fmt(pkg.bonus)} bonus coins` : '&nbsp;'}</div>
    <div class="pack-price">${esc(price)}</div>
    <div class="pack-foot">
      <span class="gp">${icon('lock')} Google Play</span>
      <button class="btn tiny ${status.ready ? 'secondary' : 'ghost'}" data-shop-package="${pkg.id}" type="button" ${status.ready ? '' : 'disabled'} title="${status.ready ? 'Buy with Google Play' : esc(status.message)}">
        ${status.ready ? 'Purchase' : 'Unavailable'}
      </button>
    </div>
  </article>`;
}

function itemCard(item) {
  const hero = Engine.state.hero;
  const bought = hero.shopPurchases?.[item.id] || 0;
  const maxed = item.once && bought > 0;
  const affordable = hero.premiumCoins >= item.price;
  return `<article class="shop-item">
    <div class="si-icon">${icon(item.icon)}</div>
    <div class="si-info">
      <div class="si-name">${esc(item.name)}</div>
      <div class="si-desc">${esc(item.desc)}</div>
      <div class="si-foot">
        <span class="price-tag">${icon('premium')} ${fmt(item.price)}</span>
        <button class="btn tiny ${affordable && !maxed ? '' : 'ghost'}" data-shop-item="${item.id}" type="button" ${maxed || !affordable ? 'disabled' : ''}>${maxed ? 'Owned' : affordable ? 'Buy' : 'Need coins'}</button>
      </div>
    </div>
  </article>`;
}

export function render(ctx) {
  const { state } = ctx;
  const hero = state.hero;
  const status = billingStatus();
  const chest = chestState();

  return `
  ${pageHead('Premium Shop', 'Cosmetics and convenience only · every coin can also be earned in play',
    `<button class="btn ghost" data-shop-action="setup" type="button">${icon('info')} Billing setup</button>`, 'The market')}

  <section class="shop-hero">
    <div class="shop-content">
      <div>
        <span class="eyebrow">Riftbound market</span>
        <h1>Power is earned. Style is chosen.</h1>
        <p>Premium coins buy cosmetics, boosts and quality-of-life. No item sold here is required to clear the vale — free players can forge Divine relics, max their bonds and walk the whole road.</p>
        <div class="flex wrap mt-2" style="gap:5px">
          ${chip('Six coin packages', 'violet', 'premium')}
          ${chip('Server-verified purchases', '', 'shield')}
          ${chip('No pay-to-win exclusives', '', 'check')}
        </div>
      </div>
      <div class="shop-balance">
        <span class="eyebrow">Your balance</span>
        <div class="coins">${icon('premium')} ${fmt(hero.premiumCoins)}</div>
        <span class="pill">${fmt(hero.gold)} gold</span>
      </div>
    </div>
  </section>

  <div class="billing-note">
    ${icon(status.ready ? 'check' : 'info')}
    <div><b>${status.ready ? 'Google Play billing connected.' : 'Purchases are disabled in this build.'}</b> ${esc(status.message)}${!status.ready ? ' The game never simulates a real payment. All coin packages below stay locked until billing is configured and verified.' : ''}</div>
  </div>

  <div class="section-title"><h2>Coin packages</h2><span class="count">${BILLING.packageName}</span></div>
  <div class="pack-grid">
    ${SHOP.packages.map(pkg => packageCard(pkg, status)).join('')}
  </div>

  <div class="section-title mt-3"><h2>Market goods</h2><span class="count">Paid with premium coins</span></div>
  <div class="shop-item-grid">
    ${SHOP.items.map(itemCard).join('')}
  </div>

  <div class="grid-2 mt-3" style="align-items:start">
    <section class="panel pad">
      <div class="flex between wrap" style="margin-bottom:7px">
        <div><span class="eyebrow">Daily</span><h3 style="font-size:15px">Free rift cache</h3></div>
        <span class="pill ${chest.ready ? 'gold' : ''}">${chest.ready ? 'Ready' : 'Recharging'}</span>
      </div>
      ${chest.ready
        ? `<div class="free-chest" style="margin-bottom:8px"><div class="chest-icon">${icon('chest')}</div><div class="fc-info"><b>Rift-touched supplies</b><span>Gold, Stone Dust, runestones and a chance at gear.</span></div><button class="btn" data-shop-action="freechest" type="button">Claim</button></div>`
        : `<div class="free-chest" style="margin-bottom:8px"><div class="chest-icon" style="opacity:.5">${icon('chest')}</div><div class="fc-info"><b>Rift-touched supplies</b><span>Returns in ${Math.ceil(chest.left / 3600000)}h ${Math.ceil((chest.left % 3600000) / 60000)}m</span></div><span class="pill">${icon('clock')} Cooldown</span></div>`}
      <p class="muted" style="font-size:9px;line-height:1.5">The free cache is the market's apology for the vale's hospitality. It resets every 20 hours.</p>
    </section>

    <section class="panel pad">
      <span class="eyebrow">Earn premium coins free</span>
      <h3 style="font-size:15px;margin-bottom:6px">No wallet required</h3>
      <div class="mini-set">
        <div class="ms-row">${icon('scroll')}<span>Daily contracts</span><span class="spacer"></span><span class="dim">gold, stones, materials</span></div>
        <div class="ms-row">${icon('crown')}<span>Chronicle milestones</span><span class="spacer"></span><span class="dim">up to 330 coins</span></div>
        <div class="ms-row">${icon('gate')}<span>Dungeon clears</span><span class="spacer"></span><span class="dim">gear, stones, gold</span></div>
        <div class="ms-row">${icon('chest')}<span>Rift cache</span><span class="spacer"></span><span class="dim">every 20 hours</span></div>
        <div class="ms-row">${icon('gem')}<span>Stone monsters</span><span class="spacer"></span><span class="dim">rare runestones</span></div>
      </div>
      <div class="flex wrap mt-2" style="gap:5px">
        ${chip(`${fmt(hero.premiumCoins)} coins held`, 'violet', 'premium')}
        ${chip('Only cosmetics & conveniences', '', 'check')}
      </div>
    </section>
  </div>

  <section class="panel pad mt-3">
    <div class="flex between wrap">
      <div>
        <span class="eyebrow">Android app</span>
        <h3 style="font-size:14px">Google Play billing</h3>
        <p class="muted" style="font-size:9.5px;line-height:1.5;max-width:680px;margin-top:3px">The Android build uses the Digital Goods API and a server-side verifier. A purchase is delivered only after the Play Developer API confirms the purchase token. This browser preview deliberately has no checkout path.</p>
      </div>
      <button class="btn ghost" data-shop-action="setup" type="button">${icon('key')} Read setup</button>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  if (!billingAttempted) {
    billingAttempted = true;
    initBilling().then(async status => {
      if (!status.ready) return;
      detailsCache = await loadProductDetails();
      // Prices can arrive after the first paint; update them in place.
      for (const pkg of SHOP.packages) {
        const el = root.querySelector(`[data-shop-package="${pkg.id}"]`)?.closest('.pack-card')?.querySelector('.pack-price');
        if (el) el.textContent = displayPrice(pkg, detailsCache);
      }
      ctx.refresh();
    }).catch(() => {});
  }

  root.querySelectorAll('[data-shop-action="freechest"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = Engine.claimFreeChest();
      if (!res.ok) return ctx.toast?.('The cache is still recharging.', 'info');
      ctx.refresh();
    });
  });

  root.querySelectorAll('[data-shop-action="setup"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = billingStatus();
      openModal({
        title: 'Google Play billing setup',
        eyebrow: 'Production checklist',
        body: `<div class="save-info">
          <p><b>Current status:</b> ${esc(status.message)}</p>
          <p class="muted" style="font-size:9.5px">This preview has no simulated checkout. Real purchases require all of the following:</p>
          <ol style="font-size:10px;line-height:1.75;padding-left:18px;color:var(--text)">
            ${billingSetupHelp().map(step => `<li>${esc(step)}</li>`).join('')}
          </ol>
          <div class="panel" style="padding:9px;margin-top:8px;background:rgba(0,0,0,.22)">
            <div class="eyebrow" style="font-size:8px">Configured package</div>
            <div style="font-family:var(--serif);font-size:12px;margin-top:2px">${esc(BILLING.packageName)}</div>
            <div class="muted" style="font-size:9px;margin-top:3px">Verification endpoint: ${BILLING.verificationUrl ? esc(BILLING.verificationUrl) : '<b style="color:var(--blood)">not configured</b>'}</div>
          </div>
          <p class="muted" style="font-size:9px;margin-top:8px">Product IDs: ${SHOP.packages.map(p => `<code>${esc(p.productId)}</code>`).join(', ')}</p>
        </div>`,
        footer: `<button class="btn ghost" data-modal-close type="button">Close</button>`,
      });
    });
  });

  root.querySelectorAll('[data-shop-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = Engine.buyShopItem(btn.dataset.shopItem);
      if (!res.ok) return ctx.toast?.(res.message || 'The merchant shakes his head.', 'danger');
      ctx.refresh();
    });
  });

  root.querySelectorAll('[data-shop-package]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pkg = SHOP.packages.find(p => p.id === btn.dataset.shopPackage);
      if (!pkg) return;
      const status = billingStatus();
      if (!status.ready) return ctx.toast?.(status.message, 'info');
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = 'Verifying…';
      try {
        const verified = await purchasePackage(pkg, playerId());
        Engine.awardCoins(verified.coins, {
          transactionId: verified.transactionId || verified.purchaseToken || verified.orderId,
          productId: pkg.productId,
          source: 'google-play',
        });
        ctx.toast?.(`${fmt(verified.coins)} premium coins delivered. Thank you.`, 'success');
      } catch (err) {
        ctx.toast?.(`Purchase not completed: ${String(err.message || err).replace(/-/g, ' ')}.`, 'danger');
      } finally {
        btn.disabled = billingStatus().ready === false;
        btn.textContent = old;
        ctx.refresh();
      }
    });
  });
}
