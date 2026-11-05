/* ============ AETHERIA — procedural 2.5D pixel-art sprites ============ */
"use strict";
const Sprites = (() => {
  const cache = {};
  // fast pixel helpers -------------------------------------------------
  function mk(w, h){ const c = document.createElement("canvas"); c.width=w; c.height=h; return c; }
  function px(g, x, y, w, h, col){ g.fillStyle=col; g.fillRect(x|0, y|0, w|0, h|0); }
  function ellipse(g, cx, cy, rx, ry, col){ g.fillStyle=col; g.beginPath(); g.ellipse(cx,cy,rx,ry,0,0,7); g.fill(); }
  function shade(col, f){ const n=parseInt(col.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    r=Math.min(255,r*f|0); g=Math.min(255,g*f|0); b=Math.min(255,b*f|0);
    return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }

  /* ---------------- ground tiles (64x32 iso diamonds) ---------------- */
  const TILE_THEMES = {
    grass:   { base:"#4f8a46", alt:"#54994b", dark:"#3c6f38", spec:"#7fb069", dot:"#e8d878", dot2:"#e87f7f" },
    iron:    { base:"#8a6f52", alt:"#94795a", dark:"#6e563e", spec:"#b09868", dot:"#a8a090", dot2:"#7f8f6f" },
    swamp:   { base:"#456e46", alt:"#4f7a4b", dark:"#344f36", spec:"#6f9459", dot:"#a8c86f", dot2:"#5a8f8f" },
    mist:    { base:"#5f6a72", alt:"#67737b", dark:"#48505a", spec:"#8a97a0", dot:"#a8b8c8", dot2:"#7f9aa8" },
    snow:    { base:"#d8e4ee", alt:"#e6eff6", dark:"#b8c8da", spec:"#ffffff", dot:"#a8d8e8", dot2:"#c8d8e8" },
    desert:  { base:"#d8b878", alt:"#e0c284", dark:"#b89858", spec:"#e8d8a0", dot:"#c8a86f", dot2:"#b0906f" },
    ash:     { base:"#4a3a3a", alt:"#544038", dark:"#332828", spec:"#6f5450", dot:"#c85a2a", dot2:"#8a4a4a" },
    tower:   { base:"#4a4462", alt:"#544e70", dark:"#332f47", spec:"#6f6890", dot:"#8a5aff", dot2:"#5a8aff" },
    cave:    { base:"#4a4552", alt:"#524d5c", dark:"#332f3a", spec:"#6f6880", dot:"#8f8898", dot2:"#5a5570" },
    swampcave:{ base:"#3d5644", alt:"#435f4b", dark:"#2b3f33", spec:"#5a7f60", dot:"#7fb08f", dot2:"#4f7a6f" },
    lava:    { base:"#4a3038", alt:"#553540", dark:"#30202a", spec:"#6f4a4a", dot:"#ff7a2a", dot2:"#c8502a" },
    sandcave:{ base:"#8a7855", alt:"#947f5e", dark:"#6a5a40", spec:"#a89870", dot:"#c8b878", dot2:"#8a7a55" },
    icecave: { base:"#7fa8c8", alt:"#8ab5d4", dark:"#5f86a8", spec:"#b8e0f0", dot:"#d8f0ff", dot2:"#9ad0e8" },
    mistcave:{ base:"#464456", alt:"#4e4c60", dark:"#302e3e", spec:"#686680", dot:"#9a90c8", dot2:"#6f6a8f" },
    towerfloor:{ base:"#444058", alt:"#4c4864", dark:"#2e2b42", spec:"#676288", dot:"#8a7aff", dot2:"#6a8aff" },
  };
  function tile(theme, v){
    const key = "t_" + theme + v;
    if(cache[key]) return cache[key];
    const c = mk(64, 32), g = c.getContext("2d");
    const th = TILE_THEMES[theme] || TILE_THEMES.grass;
    // iso diamond
    g.fillStyle = v % 2 ? th.alt : th.base;
    g.beginPath(); g.moveTo(32,0); g.lineTo(64,16); g.lineTo(32,32); g.lineTo(0,16); g.closePath(); g.fill();
    // speckle texture
    const r = Data.rngOf(theme + v);
    for(let i=0;i<26;i++){
      const x = 4 + (r()*56|0), y = 2 + (r()*28|0);
      if(Math.abs((x/2 + y) - 16) > 15) continue;
      px(g, x, y, 2, 1, r()<0.5 ? th.dark : th.spec);
    }
    if(th.dot && v > 3){ // occasional details on later variants
      for(let i=0;i<4;i++){
        const x=8+(r()*48|0), y=4+(r()*22|0);
        px(g, x, y, 2, 2, th.dot);
      }
    }
    cache[key] = c; return c;
  }
  function road(theme){
    const key = "r_" + theme;
    if(cache[key]) return cache[key];
    const c = mk(64, 32), g = c.getContext("2d");
    g.fillStyle = "#8a7f66"; g.beginPath(); g.moveTo(32,1); g.lineTo(62,16); g.lineTo(32,31); g.lineTo(2,16); g.closePath(); g.fill();
    const r = Data.rngOf("road" + theme);
    for(let i=0;i<14;i++){ const x=8+(r()*44|0), y=4+(r()*22|0); px(g,x,y,2,1, r()<.5?"#7a6f58":"#9a8f76"); }
    cache[key] = c; return c;
  }

  /* ---------------- decorations (cached canvases) ---------------- */
  function deco(theme, kind){
    const key = "d_" + theme + kind;
    if(cache[key]) return cache[key];
    const c = mk(64, 80), g = c.getContext("2d");
    const TH = TILE_THEMES[theme] || TILE_THEMES.grass;
    const leaf = { grass:"#2f6e2f", iron:"#5f6f3f", swamp:"#2f5f3a", mist:"#4a5a5f", snow:"#7fa8b8",
      desert:"#6f8f4a", ash:"#5f3f3a", tower:"#3f3a5f", cave:"#4a4552" }[theme] || "#2f6e2f";
    const trunk = { snow:"#6a5040", ash:"#4a3028" }[theme] || "#7a5a3a";
    const rnd = Data.rngOf("deco"+theme+kind);
    if(kind === "tree"){
      for(let i=0;i<3;i++){ ellipse(g, 32+(rnd()*8-4), 34-i*10, 16-i*3, 11-i*2, shade(leaf, 1 - i*0.13)); }
      px(g, 29, 46, 6, 12, trunk); px(g, 30, 44, 4, 3, shade(trunk,1.3));
    } else if(kind === "pine"){
      for(let i=0;i<3;i++){ triangle(g, 32, 40 - i*14, 20-i*5, shade(leaf, 0.9+i*0.1)); px(g,28,52,8,8,trunk); px(g,29,50,6,2,trunk); }
    } else if(kind === "deadtree"){
      px(g, 30, 38, 6, 20, "#5a4a42");
      px(g, 22, 34, 10, 4, "#5a4a42"); px(g, 40, 30, 10, 4, "#4a3a34");
      px(g, 18, 28, 4, 8, "#4a3a34"); px(g, 46, 24, 4, 8, "#4a3a34");
    } else if(kind === "cactus"){
      ellipse(g, 32, 60, 12, 4, "#8a8a6a");
      px(g, 28, 30, 8, 32, "#4f8f4f"); px(g, 20, 38, 6, 6, "#4f8f4f"); px(g, 38, 34, 6, 6, "#4f8f4f");
      px(g, 20, 26, 6, 14, "#4f8f4f"); px(g, 38, 24, 6, 12, "#4f8f4f");
      px(g, 26, 28, 4, 4, "#2f6f2f");
    } else if(kind === "rock"){
      ellipse(g, 32, 58, 14, 5, "#44484f");
      ellipse(g, 30, 50, 12, 9, "#6f7480"); ellipse(g, 26, 46, 6, 5, "#8a909c"); ellipse(g, 37, 52, 5, 4, "#5a5f6a");
    } else if(kind === "crystal"){
      ellipse(g, 32, 60, 10, 4, "#3a3a55");
      tri(g, 32, 20, 8, 42, "#8a6fe8"); tri(g, 38, 34, 6, 28, "#6f5ad0");
      px(g, 29, 22, 3, 28, "#c8b8ff");
    } else if(kind === "bush"){ // herb gather node
      ellipse(g, 32, 54, 14, 8, "#2f6e3f"); ellipse(g, 26, 48, 8, 6, "#4f9e5f"); ellipse(g, 36, 50, 7, 5, "#5fb86f");
      px(g, 30, 42, 2, 6, "#e878c8"); px(g, 38, 46, 2, 6, "#e8d878"); px(g, 25, 46, 2, 5, "#e8d878");
    } else if(kind === "ore"){ // ore gather node
      ellipse(g, 32, 58, 12, 5, "#44484f");
      ellipse(g, 30, 50, 11, 8, "#5f6a75");
      px(g, 26, 46, 4, 3, "#d8b858"); px(g, 33, 48, 4, 4, "#d8b858"); px(g, 29, 52, 3, 3, "#e8d878"); px(g, 35, 44, 3, 3, "#b8a86f");
    } else if(kind === "pillar"){
      ellipse(g, 32, 60, 12, 5, "#332f3f");
      px(g, 24, 20, 16, 40, "#5a5470"); px(g, 25, 20, 5, 40, "#6f688c");
      px(g, 20, 16, 24, 6, "#7a7394"); px(g, 30, 8, 4, 10, "#ffd75a");
    } else if(kind === "flame"){
      ellipse(g, 32, 60, 12, 5, "#33201f");
      for(let i=0;i<3;i++){ ellipse(g, 32+(rnd()*6-3), 52-(rnd()*16), 4-rnd()*2, 8-rnd()*5, i%2?"#ff7a2a":"#ffd75a"); }
    } else if(kind === "flag"){ // faction banner
      ellipse(g, 32, 58, 8, 4, "#33272f");
      px(g, 30, 22, 3, 36, "#7a6a5a");
      px(g, 33, 22, 12, 14, theme==="snow"?"#4a86d8":"#3f7a5f");
      px(g, 36, 26, 6, 6, "#e8e8f0");
    }
    cache[key] = c; return c;
    function triangle(g, cx, bottomY, h, col){ g.fillStyle=col; g.beginPath(); g.moveTo(cx, bottomY-h); g.lineTo(cx+h*0.9, bottomY); g.lineTo(cx-h*0.9, bottomY); g.closePath(); g.fill(); }
  }
  function tri(g, x, top, w, h, col){ g.fillStyle=col; g.beginPath(); g.moveTo(x, top); g.lineTo(x-w/2, top+h); g.lineTo(x+w/2, top+h); g.closePath(); g.fill(); }

  /* ---------------- buildings ---------------- */
  function house(kind){
    const key = "h_" + kind;
    if(cache[key]) return cache[key];
    const c = mk(96, 92), g = c.getContext("2d");
    const wall = { bs:"#8a7a5f", forge:"#6a5f52", shop:"#7a6f6a", storage:"#6a655f", tele:"#5a5f8a", tent:"#5f6f52" }[kind] || "#8a7a5f";
    const roof = { bs:"#a8402f", forge:"#3f3f4a", shop:"#2f6f8a", storage:"#8a6f3f", tele:"#4a4a9a", tent:"#4a5f45" }[kind] || "#a8402f";
    if(kind === "tele"){ // waystone
      ellipse(g, 48, 84, 26, 10, "#2e2c44");
      ellipse(g, 48, 76, 34, 14, "#3a3855"); ellipse(g, 48, 72, 30, 12, "#4a4870");
      px(g, 26, 26, 44, 46, "#5a5a9a"); px(g, 30, 30, 36, 40, "#6a6ab8"); px(g, 34, 34, 28, 30, "#8a8ad8");
      ellipse(g, 48, 20, 10, 12, "#9a9aff"); ellipse(g, 48, 20, 5, 7, "#e8f4ff");
    } else if(kind === "tent"){
      g.fillStyle = roof; g.beginPath(); g.moveTo(48, 14); g.lineTo(84, 76); g.lineTo(12, 76); g.closePath(); g.fill();
      px(g, 44, 48, 8, 28, "#2a2a30");
      px(g, 46, 30, 4, 10, wall);
    } else {
      // stone base
      px(g, 34, 78, 28, 8, "#5a544a");
      px(g, 12, 40, 72, 40, wall); px(g, 12, 40, 72, 4, shade(wall,1.25));
      px(g, 12, 40, 6, 40, shade(wall,1.15));
      const r = Data.rngOf("hs"+kind);
      for(let i=0;i<10;i++) px(g, 16+(r()*62|0), 48+(r()*28|0), 6, 3, shade(wall,0.85));
      // door
      px(g, 40, 56, 14, 24, kind==="bs"?"#3a2f26":"#4a3a2f");
      px(g, 50, 66, 2, 3, "#d8b858");
      // windows
      px(g, 20, 50, 10, 10, "#2a3040"); px(g, 66, 50, 10, 10, "#2a3040");
      px(g, 21, 51, 8, 4, "#d8a83a");
      // roof
      g.fillStyle = roof; g.beginPath(); g.moveTo(48, 10); g.lineTo(88, 44); g.lineTo(8, 44); g.closePath(); g.fill();
      px(g, 44, 12, 8, 6, "#5a544a");
      ellipse(g, 48, 86, 40, 6, "rgba(0,0,0,.35)");
      if(kind === "forge"){ // anvil + smoke stack
        px(g, 70, 16, 8, 26, "#4a4552");
        ellipse(g, 74, 12, 5, 3, "rgba(150,150,160,.5)");
        px(g, 10, 70, 12, 8, "#3a3a42"); px(g, 12, 66, 8, 5, "#2f2f36");
      }
    }
    cache[key] = c; return c;
  }

  /* ---------------- wings ---------------- */
  function wingShape(g, fx, fy, s, colr, col2, flap, big){
    // draws ONE wing; mirrored by caller. fx anchor at back center.
    const lift = Math.sin(flap) * 4 * s;
    g.fillStyle = colr;
    g.beginPath();
    g.moveTo(fx, fy);
    g.quadraticCurveTo(fx - 14*s, fy - 10*s - lift, fx - 26*s, fy - 4*s - lift*1.6);
    g.quadraticCurveTo(fx - 18*s, fy + 1*s, fx, fy);
    g.fill();
    g.fillStyle = col2;
    for(let i=1;i<=3;i++){ const x2 = fx - i*7*s, y2 = fy - (7-i*2)*s - lift*i*0.5; px(g, x2-1, y2, 2, Math.max(2,5*s-i), big?col2:shade(col2,1.1)); }
    if(big){ g.fillStyle = col2; g.beginPath(); g.moveTo(fx, fy-2*s); g.quadraticCurveTo(fx-30*s, fy-14*s-lift, fx-40*s, fy+2*s-lift);
      g.quadraticCurveTo(fx-24*s, fy+6*s, fx, fy); g.fill(); }
  }
  function drawWings(g, sx, sy, wingId, t, scale){
    const w = Data.WINGS[wingId]; if(!w) return;
    const s = (w.big ? 1.25 : 1) * scale;
    const flap = t * 3.2;
    wingShape(g, sx+1*s, sy-10*s, s, w.col, w.col2, flap, w.big);
    g.save(); g.translate(sx*2, 0); g.scale(-1, 1); wingShape(g, sx+1*s, sy-10*s, s, w.col, w.col2, flap, w.big); g.restore();
  }

  /* ---------------- player character ---------------- */
  // look: {cls, gender, hs, hc, ec, outfit, cust, faction, wings, mount, pet, wfx}
  function skinT(look){ return look.gender === "female" ? "#f0c4a0" : "#e8b088"; }
  function outfitPal(look){
    if(look.cust){ const c = Data.COSTUMES.find(c=>c.id===look.cust); if(c) return c.pal; }
    return (Data.OUTFITS[look.cls] || Data.OUTFITS.warrior)[look.outfit] || Data.OUTFITS.warrior[0];
  }
  // draw at feet (sx, sy). dir: 'S'|'N'. flip: mirrored when moving west.
  function charDraw(g, sx, sy, look, dir, t, o){
    o = o || {};
    const u = 2 * (o.scale || 1);              // art pixel
    const walking = o.moving, atk = o.atk || 0, cast = o.cast || 0;
    const bob = walking ? Math.abs(Math.sin(t*9))*1.2 : Math.sin(t*2)*0.4;
    const flip = g.getTransform ? false : false;
    const skin = o.flash ? "#ffffff" : skinT(look);
    const pal = outfitPal(look);
    const hairC = Data.HAIRCOLORS[look.hc] ? Data.HAIRCOLORS[look.hc].c : "#2a2630";
    const X = (ax) => sx + ax; const Y = (ay) => sy + ay;

    if(o.flash) // colors handled below via bodyCol override
    const bodyCol = o.flash ? "#ffffff" : pal.a;
    const trimCol = o.flash ? "#ffffff" : pal.b;
    const pantsC  = o.flash ? "#ffffff" : shade(pal.b, 0.8);

    // mount under character
    if(look.mount){ mobDraw(g, sx, sy+2, "mountC" === look.mount? "wolf":"horse", look.mount, t, 1.15, o); }

    // legs (walk cycle)
    const lw = walking ? Math.sin(t*9)*3 : 0;
    px(g, X(-5*u), Y(-10*u), 4*u, 10*u - lw, pantsC);
    px(g, X(1*u), Y(-10*u), 4*u, 10*u + lw, pantsC);
    // boots
    px(g, X(-5*u), Y(-(2*u)+ -lw*0), 4*u, 2.5*u, trimCol); px(g, X(1*u), Y(-2.5*u), 4*u, 2.5*u, trimCol);

    // torso
    const torsoY = Y(-19*u - bob);
    px(g, X(-6*u), torsoY, 12*u, 9.5*u, bodyCol);
    if(look.cls === "warrior"){ px(g, X(-6*u), torsoY+2*u, 12*u, 2.5*u, trimCol); px(g, X(-1*u), torsoY, 2*u, 9.5*u, trimCol); }
    if(look.cls === "mage"){   px(g, X(-8*u), torsoY+3*u, 16*u, 6.5*u, bodyCol); px(g, X(-2*u), torsoY, 4*u, 9.5*u, trimCol); }
    if(look.cls === "assassin"){ px(g, X(-6*u), torsoY+5.5*u, 12*u, 2*u, trimCol); px(g, X(2*u), torsoY, 5*u, 9.5*u, shade(pal.a,0.7)); }
    if(look.gender === "female" && look.cls !== "warrior"){ px(g, X(-7*u), torsoY+7*u, 14*u, 3*u, bodyCol); }

    // arms (attack swing)
    const armUp = atk > 0 ? -4 : cast > 0 ? -3 : walking ? Math.sin(t*9)*1 : 0;
    px(g, X(-9*u), torsoY + 1*u + armUp, 3*u, 7*u - armUp, bodyCol);
    px(g, X(6*u),  torsoY + 1*u - 0, 3*u, 7*u + (atk>0?-armUp:0), bodyCol);
    px(g, X(-9*u), torsoY + 6.5*u + armUp, 3*u, 2.5*u, skin);
    px(g, X(6*u),  torsoY + 6.5*u + (atk>0?armUp:0), 3*u, 2.5*u, skin);

    // weapon (visible when attacking or always small hint)
    drawWeapon(g, look, X(8*u), torsoY + (atk>0? -8*u : 6*u), atk, u, o);

    // head
    const headY = torsoY - 5*u;
    px(g, X(-4*u), headY, 8*u, 5*u, skin);
    // eyes
    if(dir !== "N" && !o.flash){
      const ec = Data.EYECOLORS[look.ec]?.c || "#7a4a26";
      px(g, X(-2.5*u), headY + 2.2*u, 1.4*u, 1.4*u, "#14100f");
      px(g, X(1*u), headY + 2.2*u, 1.4*u, 1.4*u, "#14100f");
      px(g, X(-2.3*u), headY + 2.3*u, 1.1*u, 1.1*u, ec);
      px(g, X(1.3*u), headY + 2.3*u, 1.1*u, 1.1*u, ec);
      if(look.cls==="assassin"){ px(g, X(-4*u), headY+1.4*u, 8*u, 1.2*u, "rgba(20,10,20,.35)"); } // mask shadow
    }
    // hair
    drawHair(g, X, headY, u, look.hs, hairC, dir);
    // headgear hint if class
    if(look.cls === "warrior"){ px(g, X(-4.5*u), headY-1.5*u, 9*u, 2.5*u, "#8a8fa0"); }
    if(look.cls === "assassin"){ px(g, X(-4.5*u), headY-1*u, 9*u, 2*u, shade(pal.a,0.8)); }
    if(look.cls === "mage"){ px(g, X(-3*u), headY-3*u, 6*u, 2*u, trimCol); px(g, X(-5*u), headY-2.2*u, 10*u, 1.6*u, trimCol); }

    // faction glow
    if(look.faction === "demon"){ px(g, X(-5*u), headY-0.5*u, 2*u, 2*u, "#c04848"); px(g, X(3*u), headY-0.5*u, 2*u, 2*u, "#c04848"); }
    if(look.faction === "angel"){ px(g, X(-4*u), headY-3.5*u, 8*u, 1*u, "#ffe8a0"); }
  }
  function drawWeapon(g, look, hx, hy, atk, u, o){
    const wfx = o.wfxCol;
    g.save(); g.translate(hx, hy);
    const swing = atk > 0 ? Math.sin(atk * 12) : 0;
    g.rotate(swing * 0.9 - 0.5);
    if(look.cls === "warrior"){
      px(g, -1.5*u, -16*u, 3*u, 17*u, "#c8ccd8"); px(g, -1.5*u, -16*u, 1.4*u, 17*u, "#eef2ff");
      px(g, -3*u, 0, 6*u, 1.6*u, "#8a6a3a"); px(g, -1*u, 1.6*u, 2*u, 3*u, "#5a3f26");
    } else if(look.cls === "mage"){
      px(g, -1*u, -16*u, 2*u, 18*u, "#7a5a3a"); ellipse(g, 0, -17*u, 3*u, 3.4*u, "#5ad8e8"); ellipse(g, -0.5*u, -17.5*u, 1.4*u, 1.6*u, "#e8f8ff");
      if(wfx) { ellipse(g, 0, -17*u, 5*u, 5*u, wfx+"33"); }
    } else {
      px(g, 0, -12*u, 2.4*u, 12*u, "#d8dce8"); px(g, -3*u, -8*u, 2.4*u, 9*u, "#d8dce8");
      px(g, -0.5*u, 0, 3.4*u, 2*u, "#3a2a2a");
    }
    g.restore();
  }
  function drawHair(g, X, headY, u, hs, hc, dir){
    // hs 0..4
    if(hs === 0){ px(g, X(-4.6*u), headY-0.8*u, 9.2*u, 1.6*u, hc); px(g, X(-4.6*u), headY-0.8*u, 1.2*u, 2.6*u, hc); px(g, X(3.4*u), headY-0.8*u, 1.2*u, 2.6*u, hc); }
    if(hs === 1){ px(g, X(-4.8*u), headY-1*u, 9.6*u, 2*u, hc); px(g, X(-4.8*u), headY-0.5*u, 1.6*u, 4.6*u, hc); px(g, X(3.2*u), headY-0.5*u, 1.6*u, 4.6*u, hc); }
    if(hs === 2){ px(g, X(-4.8*u), headY-1.2*u, 9.6*u, 2*u, hc); px(g, X(-5*u), headY-0.5*u, 1.8*u, 9*u, hc); px(g, X(3.2*u), headY-0.5*u, 1.8*u, 9*u, hc); px(g, X(-3.6*u), headY-1.4*u, 7.2*u, 1.4*u, hc); }
    if(hs === 3){ px(g, X(-4.6*u), headY-0.9*u, 9.2*u, 1.7*u, hc); px(g, X(-4.6*u), headY-0.4*u, 1.3*u, 3*u, hc); px(g, X(3.3*u), headY-0.4*u, 1.3*u, 3*u, hc);
      ellipse(g, 0 + X(-6*u), headY+1*u, 2*u, 6*u, hc); } // ponytail behind
    if(hs === 4){ px(g, X(-1.2*u), headY-2.2*u, 2.6*u, 3*u, hc); }
  }

  /* ---------------- monsters ---------------- */
  const MPAL = 0;
  function mobDraw(g, sx, sy, kind, mobId, t, scale, o){
    o = o || {};
    const s = scale || 1, flash = o.flash;
    const F = c => flash ? "#ffffff" : c;
    const X = x => sx + x*s, Y = y => sy + y*s;
    const pal = (Data.MONS[mobId] && Data.MONS[mobId].pal) || 0;
    const egg = (cx,cy,rx,ry,c)=>ellipse(g,X(cx),Y(cy),rx*s,ry*s,F(c));
    const boss = o.boss;
    switch(kind){
      case "slime": {
        const wob = Math.sin(t*6)*2.5;
        egg(0, -9, 15+wob*0.4, 12-wob, boss?"#c04a9f":"#4fae5f");
        egg(0, -12, 10, 8, boss?"#e06abf":"#6fd86f");
        px(g, X(-6*s), Y(-13*s), 4*s, 4*s, "#141814"); px(g, X(2*s), Y(-13*s), 4*s, 4*s, "#141814");
        ellipse(g, X(-2*s), Y(-4*s), 3*s, 2*s, "rgba(255,255,255,.55)");
        break; }
      case "boar": {
        const legw = Math.sin(t*10)*2;
        const shades = boss?"#7a4a3f":"#8a6f52";
        px(g, X(-10*s), Y(-8*s), 4*s, 6*s+legw, F(shade(shades,0.7))); px(g, X(6*s), Y(-8*s), 4*s, 6*s-legw, F(shade(shades,0.7)));
        egg(0, -9, 13, 8, F(shades));
        egg(10, -10, 7, 6, F(shade(shades,1.1)));
        px(g, X(14*s), Y(-10*s), 4*s, 4*s, F("#e8b0a0"));
        px(g, X(16*s), Y(-9*s), 2*s, 2*s, "#e8e8e0");
        px(g, X(9*s), Y(-15*s), 2*s, 3*s, F(shade(shades,1.2))); px(g, X(12*s), Y(-15*s), 2*s, 3*s, F(shade(shades,1.2)));
        ellipse(g, X(3*s), Y(-12*s), 2*s, 1.5*s, "#1a1410");
        break; }
      case "wolf": case "mount": case "horse": { // quadruped; horse palette by mount id
        const legw = Math.sin(t*10)*3;
        const isHorse = kind === "horse" || mobId === "mnt_horse";
        const isWolfM = mobId === "mnt_wolf";
        const shades = isHorse ? "#8a6a4a" : isWolfM ? "#3a3a4a" : pal ? "#b0c8e8" : "#7a7f8a";
        px(g, X(-11*s), Y(-9*s), 4*s, 7*s+legw, F(shade(shades,0.75))); px(g, X(7*s), Y(-9*s), 4*s, 7*s-legw, F(shade(shades,0.75)));
        egg(0, -10, 14, 7, F(shades));
        egg(12, -12, 6, 5, F(shade(shades,1.12)));
        ellipse(g, X(9*s), Y(-16*s), 3.4*s, 3.6*s, F(shades));
        px(g, X(6*s), Y(-20*s), 3*s, 3*s, F(shades)); px(g, X(11*s), Y(-20*s), 3*s, 3*s, F(shades));
        ellipse(g, X(8.4*s), Y(-16.4*s), 1.4*s, 1.4*s, "#e8d875"); // eye
        egg(-14, -13, 4, 6, F(shade(shades,0.9)));                  // tail
        ellipse(g, X(12*s), Y(-11*s), 2.5*s, 1.8*s, "#2a2020");
        break; }
      case "bandit": {
        const u = 1.9*s, walking = true;
        px(g, X(-4*u), Y(-9*u), 3.2*u, 8.4*u, F("#3a3f4a"));
        px(g, X(0.8*u), Y(-9*u), 3.2*u, 8.4*u, F("#33383f"));
        px(g, X(-5*u), Y(-17*u), 9*u, 8.4*u, F("#5a3f3f"));
        px(g, X(-5*u), Y(-13*u), 9*u, 1.8*u, F("#8a5a2a"));
        px(g, X(-3.6*u), Y(-22*u), 7.2*u, 5*u, F(skinT({gender:"male"})));
        px(g, X(-4.2*u), Y(-23*u), 8.4*u, 2*u, F("#2a2630"));
        px(g, X(-2.4*u), Y(-20.4*u), 1.3*u, 1.3*u, "#c04848"); px(g, X(1*u), Y(-20.4*u), 1.3*u, 1.3*u, "#c04848");
        g.save(); g.translate(X(4.4*u), Y(-15*u)); g.rotate(Math.sin(t*9)*0.5-0.4);
        px(g, 0, -12*u, 2*u, 12*u, F("#c8ccd8")); g.restore();
        break; }
      case "golem": {
        px(g, X(-12*s), Y(-18*s), 24*s, 16*s, F(pal? "#8a4a2f" : "#6f7480"));
        px(g, X(-10*s), Y(-16*s), 9*s, 6*s, F(pal? "#c86a2a" : "#8a909c"));
        px(g, X(-14*s), Y(-6*s), 6*s, 6*s, F(shade(pal?"#8a4a2f":"#6f7480",0.85)));
        px(g, X(8*s), Y(-6*s), 6*s, 6*s, F(shade(pal?"#8a4a2f":"#6f7480",0.85)));
        px(g, X(-13*s), Y(-26*s), 12*s, 8*s, F(shade(pal? "#8a4a2f" : "#6f7480", 1.1)));
        px(g, X(-9*s), Y(-23*s), 4*s, 3*s, pal? "#ffd75a" : "#5ad8ff");
        px(g, X(-8*s), Y(-26*s), 3*s, 4*s, F(shade(pal?"#8a4a2f":"#6f7480",1.2)));
        px(g, X(5*s), Y(-26*s), 3*s, 4*s, F(shade(pal?"#8a4a2f":"#6f7480",1.2)));
        break; }
      case "spider": {
        for(let i=0;i<4;i++){ const a = t*9 + i*1.7, lo = Math.sin(a)*3;
          px(g, X(-14*s-i*6*s), Y(-14*s-lo), 6*s, 2.4*s, F("#2f2a2a"));        // upper leg
          px(g, X(-14*s-i*6*s), Y(-14*s-lo), 2*s, 5*s, F("#26201f")); }       // leg tip down
        for(let i=0;i<4;i++) px(g, X(-4*s+i*2.6*s), Y(-8*s), 2*s, 7*s, F("#26201f"));
        egg(-6, -14, 11, 8, F(pal? "#fff" : "#2f6f3f"));
        egg(8, -13, 8, 6, F(pal? "#fff" : "#3f8f4f"));
        ellipse(g, X(6*s), Y(-16*s), 2.6*s, 2.6*s, "#141414");
        ellipse(g, X(5*s), Y(-16.6*s), 1.2*s, 1.2*s, "#d84a4a"); ellipse(g, X(7.4*s), Y(-16.6*s), 1.2*s, 1.2*s, "#d84a4a");
        if(boss){ ellipse(g, X(-6*s), Y(-14*s), 4*s, 3*s, "#a04a8f"); }
        break; }
      case "serpent": {
        for(let i=0;i<5;i++){ const wob = Math.sin(t*5 + i*0.9)*2.2;
          egg(-12 + i*6, -6 - i*2.4 + wob, 6 - i*0.5, 5 - i*0.55, i%2? F(pal? "#e8e8e8" : "#3f9e5f") : F(pal? "#c8c8d8" : "#2f7a4a")); }
        egg(20, -18, 6, 5, F(pal? "#f0f0f0" : "#4fae6f"));
        ellipse(g, X(24*s), Y(-20*s), 2.6*s, 2*s, "#d8c84a");
        px(g, X(26*s), Y(-21*s), 3*s, 1.4*s, "#e84a4a");
        px(g, X(22*s), Y(-21.4*s), 1.6*s, 1.6*s, "#d8981a");
        break; }
      case "ghoul": {
        const wob = Math.sin(t*7)*1.6;
        px(g, X(-4*s), Y(-8*s+wob), 3.4*s, 8*s, F(skinT({gender:"male"})));
        px(g, X(1*s), Y(-8*s-wob), 3.4*s, 8*s, F("#9a7f6f"));
        egg(0, -14, 6, 2, F("#8a7f6f"));
        px(g, X(-6*s), Y(-22*s+wob), 4*s, 6*s, F(skinT({gender:"male"})));
        px(g, X(3*s), Y(-22*s-wob), 4*s, 6*s, F(skinT({gender:"male"})));
        egg(0, -26, 7, 6, F("#cfc4a8"));
        px(g, X(-4*s), Y(-27.4*s), 3.4*s, 2.4*s, "#141414"); px(g, X(1.6*s), Y(-27.4*s), 3.4*s, 2.4*s, "#141414");
        ellipse(g, X(-2.4*s), Y(-26.6*s), 1.1*s, 1.1*s, "#5aff5a"); ellipse(g, X(3*s), Y(-26.6*s), 1.1*s, 1.1*s, "#5aff5a");
        px(g, X(-2.6*s), Y(-24.6*s), 5.4*s, 1.6*s, "#141414");
        px(g, X(5*s), Y(-20*s), 2.4*s, 7*s, F("#8a909c"));
        break; }
      case "wraith": {
        const flo = Math.sin(t*3)*3;
        const shadeC = pal? "#a89878" : "#4a4a6f";
        g.globalAlpha = 0.85;
        egg(-4+Math.sin(t*4), -20+flo, 12, 15, F(shadeC)); egg(-2, -8+flo, 9, 8, F(shade(shadeC, 0.7)));
        ellipse(g, X(0*s), Y(-28*s+flo), 5.5*s, 5*s, "#181828");
        ellipse(g, X(-2*s), Y(-29*s+flo), 1.4*s, 1.6*s, "#7affe8"); ellipse(g, X(2.4*s), Y(-29*s+flo), 1.4*s, 1.6*s, "#7affe8");
        px(g, X(-7*s), Y(-32*s+flo), 6*s, 2.4*s, F(shade(shadeC,1.2))); px(g, X(2*s), Y(-32*s+flo), 6*s, 2.4*s, F(shade(shadeC,1.2)));
        g.globalAlpha = 1;
        break; }
      case "yeti": {
        const wob = Math.sin(t*6)*1.5;
        egg(0, -13, 15, 12, F(pal? "#8fa8d8" : "#e8e8f0"));
        egg(0, -18, 12, 8, F(pal? "#9fb8e8" : "#f4f4f8"));
        egg(0, -26, 8, 6.4, F(pal? "#9fb8e8" : "#f4f4f8"));
        px(g, X(-3*s), Y(-23*s), 2.4*s, 2.4*s, "#3a4a6f"); px(g, X(1.6*s), Y(-23*s), 2.4*s, 2.4*s, "#3a4a6f");
        px(g, X(-2.4*s), Y(-20*s), 5.4*s, 2.6*s, "#7a5f5f");
        px(g, X(-15*s), Y(-18*s+wob), 6*s, 7*s, F(pal? "#8fa8d8" : "#e8e8f0"));
        px(g, X(9*s), Y(-18*s-wob), 6*s, 7*s, F(pal? "#8fa8d8" : "#e8e8f0"));
        px(g, X(-17*s), Y(-14*s+wob), 7*s, 4*s, "#4a5a7f"); px(g, X(10*s), Y(-14*s-wob), 7*s, 4*s, "#4a5a7f");
        if(boss) ellipse(g, X(0*s), Y(-13*s), 10*s, 6*s, "rgba(120,180,255,.3)");
        break; }
      case "scorpion": {
        // tail
        for(let i=0;i<4;i++){ egg(9 - i*3.5, -22 + i*3 - Math.sin(t*5), 4-i*0.5, 4-i*0.5, F("#c86a1a")); }
        egg(-12, -20, 10, 7, F("#6f7a2a")); egg(-12, -28, 10, 4, F("#8a903a"));
        egg(12, -14, 6, 6, F("#8a903a"));
        px(g, X(10*s), Y(-22*s), 6*s, 2.4*s, F("#8a903a"));
        ellipse(g, X(14.4*s), Y(-15.4*s), 1.2*s, 1.2*s, "#ff5a2a");
        egg(16, -25, 3, 3, F("#6f7a2a"));
        break; }
      case "imp": {
        const flo = Math.sin(t*8)*1.4;
        egg(0, -10, 7, 6, F("#b04a38"));
        egg(0, -16, 5.4, 4.6, F("#c8583f"));
        egg(0, -21, 5, 4.6, F("#e8a880"));
        px(g, X(-4.4*s), Y(-26*s), 2*s, 4*s, "#c8b8a0"); px(g, X(2.6*s), Y(-26*s), 2*s, 4*s, "#c8b8a0");
        ellipse(g, X(-2.6*s), Y(-21*s), 1.2*s, 1.2*s, "#ffd75a"); ellipse(g, X(2.4*s), Y(-21*s), 1.2*s, 1.2*s, "#ffd75a");
        px(g, X(-8*s), Y(-16*s+flo), 3*s, 6*s, "#b04a38"); px(g, X(5*s), Y(-16*s-flo), 3*s, 6*s, "#b04a38");
        egg(0, -4, 7, 2, "#8a3a2a");
        break; }
      case "sentinel": {
        px(g, X(-8*s), Y(-8*s), 16*s, 4*s, F("#4a4560"));
        px(g, X(-6*s), Y(-24*s), 12*s, 17*s, F("#5a5478"));
        ellipse(g, X(0*s), Y(-16*s), 4*s, 4*s, pal? "#ff8a3a" : "#8a6fff");
        px(g, X(-4*s), Y(-30*s), 8*s, 7*s, F(shade("#5a5478",1.15)));
        px(g, X(-3*s), Y(-27.4*s), 2.4*s, 2.4*s, "#7affe8"); px(g, X(1.4*s), Y(-27.4*s), 2.4*s, 2.4*s, "#7affe8");
        px(g, X(-11*s), Y(-26*s), 5*s, 12*s, F("#4a4560"));
        px(g, X(6*s), Y(-26*s), 5*s, 12*s, F("#4a4560"));
        ellipse(g, X(11*s), Y(-20*s), 2.6*s, 2.6*s, pal? "#ffb03a" : "#a68aff");
        px(g, X(-2*s), Y(-34*s), 4*s, 4*s, F("#6f6890"));
        break; }
      case "dragonet": {
        const flo = Math.sin(t*5)*2.6;
        egg(0, -16, 12, 7, F(pal? "#6a4a8a" : "#8a3a4a"));
        egg(10, -20, 6, 5, F(pal? "#7a5aa0" : "#a84a5f"));
        egg(14, -22, 3, 2.6, F(pal? "#8a6ab0" : "#c85a6f"));
        px(g, X(15*s), Y(-23.4*s), 2*s, 2*s, "#d0e85a");
        px(g, X(-2*s), Y(-26*s), 3*s, 4*s, F(pal? "#6a4a8a" : "#8a3a4a"));
        px(g, X(-11*s), Y(-24*s+flo), 12*s, 3*s, F(pal? "#9a7abf" : "#c8748a"));
        px(g, X(7*s), Y(-24*s-flo), 10*s, 3*s, F(pal? "#9a7abf" : "#c8748a"));
        egg(-10, -14, 8, 2.4, F(pal? "#6a4a8a" : "#8a3a4a"));
        ellipse(g, X(0*s), Y(-15*s), 3*s, 2*s, "#5ab0d8");
        break; }
    }
  }

  /* ---------------- item icons ---------------- */
  const icache = {};
  function icon(slot, cls, qcol){
    const key = "i_" + slot + cls + qcol;
    if(icache[key]) return icache[key];
    const c = mk(48,48), g = c.getContext("2d");
    g.fillStyle = "#10121c"; g.fillRect(0,0,48,48);
    const m = "#c8ccd8", d = "#8a8fa0", gold = "#d8b858";
    if(slot === "weapon"){
      if(cls === "mage"){ px(g, 22, 10, 4, 30, "#7a5a3a"); ellipse(g, 24, 9, 6, 7, "#5ad8e8"); ellipse(g, 24, 9, 3, 3.4, "#e8f8ff"); }
      else if(cls === "assassin"){ px(g, 12, 8, 5, 26, m); px(g, 11, 8, 2.4, 26, "#eef2ff"); px(g, 25, 14, 5, 22, m); px(g, 21, 38, 8, 3, "#3a2a2a"); }
      else { px(g, 15, 12, 5, 28, m); px(g, 15, 12, 2.4, 28, "#eef2ff"); px(g, 9, 10, 17, 5, gold); px(g, 16, 40, 5, 6, "#5a3f26"); }
    } else if(slot === "offhand"){
      if(cls === "mage"){ rectBook(g); } else if(cls === "assassin"){ px(g, 16, 10, 16, 28, "#4f8f4a"); px(g, 20, 14, 8, 6, "#e8e8e8"); px(g, 19, 36, 10, 6, "#3a2a2a"); }
      else { g.fillStyle = d; g.beginPath(); g.roundRect(12, 8, 24, 30, 12); g.fill(); px(g, 13, 9, 22, 26, "#7a7f92"); px(g, 22, 12, 4, 20, gold); }
    } else if(slot === "head"){
      if(cls === "mage"){ tri3(g, "#7a6a9a"); } else if(cls === "assassin"){ px(g, 10, 18, 28, 10, "#2f2a3a"); px(g, 10, 12, 28, 8, "#3f3548"); px(g, 16, 20, 6, 8, "#101018"); px(g, 26, 20, 6, 8, "#101018"); }
      else { px(g, 10, 16, 28, 14, d); px(g, 10, 12, 28, 6, m); px(g, 20, 26, 8, 6, "#10141c"); }
    } else if(slot === "chest"){
      px(g, 10, 8, 28, 32, cls==="warrior" ? d : cls==="mage" ? "#3f3f8a" : "#2f2a3a");
      px(g, 10, 8, 5, 32, shade(cls==="warrior" ? "#8a8fa0" : cls==="mage" ? "#5a5ab8" : "#4a4460", 1.2));
      px(g, 21, 10, 5, 28, gold);
    } else if(slot === "legs"){ px(g, 12, 8, 10, 30, cls==="warrior" ? d : cls==="mage" ? "#4a4a8a" : "#33303f"); px(g, 26, 8, 10, 30, shade(cls==="warrior" ? "#8a8fa0" : "#4a4a8a", 0.85)); px(g, 12, 38, 24, 5, "#5a4a3a"); }
    else if(slot === "boots"){ px(g, 10, 18, 12, 18, "#4a3a2f"); px(g, 26, 18, 12, 18, "#5a483a"); px(g, 8, 32, 16, 6, "#2f2418"); px(g, 24, 32, 16, 6, "#392c1c"); }
    else if(slot === "gloves"){ px(g, 10, 10, 12, 26, cls==="warrior" ? d : "#5a3f3f"); px(g, 27, 10, 12, 26, shade(cls==="warrior" ? "#8a8fa0" : "#7a4a4a", 0.9)); px(g, 12, 6, 8, 6, "#3a3028"); px(g, 29, 6, 8, 6, "#3a3028"); }
    else if(slot === "amulet"){ ellipse(g, 24, 20, 9, 9, m); ellipse(g, 24, 20, 6, 6, qcol||"#8a5aff"); px(g, 8, 6, 32, 4, gold); px(g, 12, 4, 24, 6, "#7a6a4a"); }
    else if(slot === "ring"){ ellipse(g, 24, 26, 11, 11, gold); px(g, 20, 12, 8, 8, qcol||"#4fa8ff"); ellipse(g, 24, 16, 3, 3, "#fff"); }
    // border by rarity
    g.strokeStyle = qcol || "#5a5f78"; g.lineWidth = 2; g.strokeRect(1, 1, 46, 46);
    icache[key] = c; return c;
    function rectBook(gg){ px(gg, 12, 10, 24, 28, "#5a3f8a"); px(gg, 12, 10, 4, 28, "#3f2f5f"); px(gg, 17, 13, 17, 22, "#e8e0d0"); px(gg, 24, 16, 2, 4, "#8a5aff"); }
    function tri3(gg){ px(gg, 12, 22, 24, 10, "#3f3f6f"); px(gg, 18, 16, 12, 8, "#4f4f8f"); px(gg, 21, 10, 6, 8, "#5fd8e8"); }
  }
  function iconMat(id){
    const key = "m_" + id; if(icache[key]) return icache[key];
    const c = mk(48,48), g = c.getContext("2d");
    g.fillStyle = "#10121c"; g.fillRect(0,0,48,48);
    const m = Data.MATS[id] || Data.USES[id] || {};
    if(m.kind === "use"){
      px(g, 16, 16, 16, 26, roundRectCol(g, 16, 16, 16, 26, 7, m.col || "#c84a4a"));
      px(g, 19, 8, 10, 8, "#8a8f9a");
      ellipse(g, 22, 24, 3, 5, "rgba(255,255,255,.45)");
    } else {
      const cols = { herb:"#4fae5f", wood:"#8a6a3a", ore:"#a8a09a", slimeGel:"#5fd86f", boarTusk:"#e8e0c8", wolfPelt:"#7a7f8a",
        ironScrap:"#6f7480", spiderSilk:"#e8e8e8", venomFang:"#4fae4a", ghostWisp:"#9a8fe8", frostHide:"#8ab8d8",
        duneAmber:"#d8a83a", emberCore:"#ff6a2a", voidShard:"#8a5aff", sigil:"#ffb02e" };
      const cols2 = cols[id] || "#8a8f9a";
      ellipse(g, 24, 26, 12, 9, shade(cols2, 0.6));
      tri(g, 24+6, 16, 12, 14, cols2);
      tri(g, 24+10, 22, 8, 10, shade(cols2, 1.25));
      if(id==="herb"){ ellipse(g, 20, 20, 6, 4, "#4fae5f"); ellipse(g, 30, 24, 5, 3, "#66c878"); }
      if(id==="sigil"){ px(g, 20, 12, 8, 22, "#ffcf5a"); px(g, 14, 18, 20, 6, "#ffb02e"); px(g, 22, 8, 4, 30, "#ffe08a"); }
    }
    g.strokeStyle = "#3a3f55"; g.lineWidth=2; g.strokeRect(1,1,46,46);
    icache[key] = c; return c;
    function roundRectCol(gg,x,y,w,h,r,col){ gg.fillStyle=col; gg.beginPath(); gg.roundRect(x,y,w,h,r); gg.fill(); return "rgba(0,0,0,0.001)"; }
  }

  /* ---------------- fx / projectile ---------------- */
  function projDraw(g, sx, sy, kind, col, t){
    if(kind === "bolt"){ ellipse(g, sx, sy, 5, 4, col||"#6fd8ff"); ellipse(g, sx-3, sy-2, 2.4, 2, "#fff"); }
    else if(kind === "meteor"){ ellipse(g, sx, sy, 8, 7, "#ff7a2a"); ellipse(g, sx-2, sy-2, 4, 3.4, "#ffd75a");
      ellipse(g, sx+7, sy-9, 3, 2, "rgba(255,140,60,.5)"); }
    else if(kind === "slashArc"){ g.strokeStyle = col||"#ffe8b0"; g.lineWidth=3; g.beginPath(); g.arc(sx, sy, 26, t*8, t*8+1.8); g.stroke(); }
    else if(kind === "shadow"){ ellipse(g, sx, sy, 10, 5, "rgba(120,70,220,.4)"); }
  }
  function npcDraw(g, sx, sy, look, t){
    charDraw(g, sx, sy, look, "S", t*0.4, { scale:0.95 });
  }

  return { tile, road, deco, house, charDraw, drawWings, mobDraw, icon, iconMat, projDraw, npcDraw, shade, ellipse, px };
})();
