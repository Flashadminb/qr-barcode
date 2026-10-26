/* สร้าง QR & Barcode — ทำงานในเบราว์เซอร์ทั้งหมด */
(() => {
  'use strict';

  // ---------- รูปแบบโค้ดที่รองรับ ----------
  const FORMATS = [
    { id: 'qr', name: 'QR Code', group: '2d', engine: 'qr', rule: 'ใส่ได้ทุกอย่าง ภาษาไทย ลิงก์ อีโมจิ — สแกนด้วยมือถือได้ทันที' },
    { id: 'datamatrix', name: 'Data Matrix', group: '2d', engine: 'bwip', bcid: 'datamatrix', rule: 'สี่เหลี่ยมเล็กกระชับ ใช้ติดชิ้นส่วน อุปกรณ์การแพทย์ ยา' },
    { id: 'pdf417', name: 'PDF417', group: '2d', engine: 'bwip', bcid: 'pdf417', rule: 'แบบแถบยาว ใช้ในบัตรประชาชน ใบขับขี่ ตั๋ว' },
    { id: 'aztec', name: 'Aztec', group: '2d', engine: 'bwip', bcid: 'azteccode', rule: 'ใช้ในตั๋วรถไฟ บอร์ดดิ้งพาส' },
    { id: 'CODE128', name: 'Code 128', group: '1d', engine: 'jsb', rule: 'บาร์โค้ดทั่วไป ใส่ A–Z a–z 0–9 และสัญลักษณ์ (ภาษาอังกฤษเท่านั้น)' },
    { id: 'EAN13', name: 'EAN‑13', group: '1d', engine: 'jsb', rule: 'ตัวเลข 12–13 หลัก · สินค้าขายปลีกทั่วไป (ไทยขึ้นต้น 885)' },
    { id: 'EAN8', name: 'EAN‑8', group: '1d', engine: 'jsb', rule: 'ตัวเลข 7–8 หลัก · สินค้าขนาดเล็ก' },
    { id: 'UPC', name: 'UPC‑A', group: '1d', engine: 'jsb', rule: 'ตัวเลข 11–12 หลัก · สินค้าอเมริกา/แคนาดา' },
    { id: 'UPCE', name: 'UPC‑E', group: '1d', engine: 'jsb', rule: 'ตัวเลข 6–8 หลัก · UPC แบบย่อ' },
    { id: 'CODE39', name: 'Code 39', group: '1d', engine: 'jsb', rule: 'A–Z (ตัวใหญ่) 0–9 และ - . $ / + % ช่องว่าง · ใช้ในโรงงาน/ราชการ' },
    { id: 'CODE93', name: 'Code 93', group: '1d', engine: 'bwip', bcid: 'code93', rule: 'A–Z (ตัวใหญ่) 0–9 และ - . $ / + % ช่องว่าง · กระชับกว่า Code 39' },
    { id: 'ITF14', name: 'ITF‑14', group: '1d', engine: 'jsb', rule: 'ตัวเลข 13–14 หลัก · ลังสินค้า/กล่องขนส่ง' },
    { id: 'ITF', name: 'ITF', group: '1d', engine: 'jsb', rule: 'ตัวเลขจำนวนหลักเป็นเลขคู่ · คลังสินค้า' },
    { id: 'codabar', name: 'Codabar', group: '1d', engine: 'jsb', rule: 'ตัวเลข และ - $ : / . + · ห้องสมุด ธนาคารเลือด' },
    { id: 'MSI', name: 'MSI', group: '1d', engine: 'jsb', rule: 'ตัวเลขเท่านั้น · ป้ายชั้นวางสินค้า' },
    { id: 'pharmacode', name: 'Pharmacode', group: '1d', engine: 'jsb', rule: 'ตัวเลข 3–131070 · บรรจุภัณฑ์ยา' },
  ];
  // ใช้กับอะไร (แสดงใต้ชื่อแต่ละแบบ)
  const USE = {
    qr: 'ลิงก์ · ข้อความไทย · ทั่วไป', datamatrix: 'ชิ้นส่วน · ยา · อุปกรณ์', pdf417: 'บัตร · ใบขับขี่ · ตั๋ว',
    aztec: 'ตั๋วรถไฟ · บอร์ดดิ้งพาส', CODE128: 'ทั่วไป · อังกฤษ+ตัวเลข', EAN13: 'สินค้าขายปลีก 13 หลัก',
    EAN8: 'สินค้าชิ้นเล็ก 8 หลัก', UPC: 'สินค้าอเมริกา 12 หลัก', UPCE: 'UPC แบบย่อ 8 หลัก',
    CODE39: 'โรงงาน · ราชการ', CODE93: 'Code 39 แบบกระชับ', ITF14: 'ลังสินค้า 14 หลัก',
    ITF: 'คลังสินค้า · เลขคู่', codabar: 'ห้องสมุด · ธนาคารเลือด', MSI: 'ป้ายชั้นวางสินค้า', pharmacode: 'บรรจุภัณฑ์ยา',
  };
  FORMATS.forEach(f => { f.use = USE[f.id]; });
  const byId = Object.fromEntries(FORMATS.map(f => [f.id, f]));
  const isTouch = matchMedia('(hover: none)').matches;

  const SIZES = {
    s: { qr: 300, bar: 2, bw: 3 },
    m: { qr: 600, bar: 3, bw: 5 },
    l: { qr: 1200, bar: 5, bw: 9 },
  };

  const DEFAULTS = { fmt: 'qr', fg: '#1f1f1f', bg: '#ffffff', transparent: false, size: 'm', ec: 'M', showText: true, barH: 100 };
  const LS_SET = 'qrb.settings.v1', LS_HIST = 'qrb.history.v1';
  const HIST_MAX = 150;

  // ---------- localStorage (ปลอดภัยแม้โหมดไม่ระบุตัวตน) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  let S = { ...DEFAULTS, ...store.get(LS_SET, {}) };
  if (!byId[S.fmt]) S.fmt = 'qr';
  let history = store.get(LS_HIST, []);
  let logoImg = null;
  let current = null; // { canvas, svg(), fmt, text }

  const $ = id => document.getElementById(id);
  const el = {
    text: $('text'), topText: $('topText'), bottomText: $('bottomText'), count: $('count'), chips2d: $('chips2d'), chips1d: $('chips1d'), hint: $('fmtHint'),
    preview: $('preview'), stage: $('stage'), empty: $('emptyState'), err: $('errState'), tapHint: $('tapHint'),
    badge: $('fmtBadge'), dim: $('dimInfo'), gallery: $('gallery'), galleryCard: $('galleryCard'),
    history: $('history'), histSearch: $('histSearch'), histCount: $('histCount'), toast: $('toast'),
    actionBtns: ['copyImg', 'savePng', 'saveSvg', 'copyText', 'shareBtn', 'printBtn'].map($),
  };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

  // ---------- โหลด bwip-js (ไฟล์ใหญ่) เฉพาะตอนต้องใช้ ----------
  let bwipPromise = null;
  function loadBwip() {
    if (window.bwipjs) return Promise.resolve();
    if (!bwipPromise) {
      bwipPromise = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/bwip-js@4.5.1/dist/bwip-js-min.js';
        s.onload = () => res(); s.onerror = () => { bwipPromise = null; rej(new Error('load')); };
        document.head.appendChild(s);
      });
    }
    return bwipPromise;
  }

  // ---------- ตัวสร้างโค้ด ----------
  class CodeError extends Error { constructor(msg, hint) { super(msg); this.hint = hint; } }
  const isAscii = t => /^[\x20-\x7E]*$/.test(t);
  const toUtf8Bin = t => unescape(encodeURIComponent(t));

  function makeQR(text, thumb) {
    const ec = logoImg ? 'H' : S.ec;
    let qr;
    try { qr = qrcode(0, ec); qr.addData(text); qr.make(); }
    catch { throw new CodeError('ข้อความยาวเกินกว่าที่ QR จะรับได้'); }
    const n = qr.getModuleCount(), quiet = 3, total = n + quiet * 2;
    const target = thumb ? 180 : SIZES[S.size].qr;
    const scale = Math.max(2, Math.round(target / total));
    const dim = total * scale;
    const c = document.createElement('canvas');
    c.width = c.height = dim;
    const ctx = c.getContext('2d');
    if (!S.transparent) { ctx.fillStyle = S.bg; ctx.fillRect(0, 0, dim, dim); }
    ctx.fillStyle = S.fg;
    let path = '';
    for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) {
      if (qr.isDark(r, col)) {
        ctx.fillRect((col + quiet) * scale, (r + quiet) * scale, scale, scale);
        path += `M${col + quiet} ${r + quiet}h1v1h-1z`;
      }
    }
    let logoSvg = '';
    if (logoImg) {
      const box = Math.round(dim * 0.22), x = (dim - box) / 2, pad = Math.round(box * 0.1);
      ctx.fillStyle = S.transparent ? '#ffffff' : S.bg;
      roundRect(ctx, x - pad, x - pad, box + pad * 2, box + pad * 2, pad * 1.5); ctx.fill();
      const r = Math.min(box / logoImg.width, box / logoImg.height);
      const w = logoImg.width * r, h = logoImg.height * r;
      ctx.drawImage(logoImg, (dim - w) / 2, (dim - h) / 2, w, h);
      const lb = total * 0.22, lx = (total - lb) / 2, lp = lb * 0.1;
      logoSvg = `<rect x="${lx - lp}" y="${lx - lp}" width="${lb + lp * 2}" height="${lb + lp * 2}" rx="${lp * 1.5}" fill="${S.transparent ? '#ffffff' : S.bg}"/>` +
        `<image href="${logoImg.dataUrl}" x="${lx}" y="${lx}" width="${lb}" height="${lb}" preserveAspectRatio="xMidYMid meet"/>`;
    }
    const svg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${dim}" height="${dim}" shape-rendering="crispEdges">` +
      (S.transparent ? '' : `<rect width="100%" height="100%" fill="${S.bg}"/>`) +
      `<path fill="${S.fg}" d="${path}"/>${logoSvg}</svg>`;
    return { canvas: c, svg, pixel: true };
  }

  function makeJsb(f, text, thumb) {
    if (!isAscii(text)) throw new CodeError('บาร์โค้ดแบบเส้นใส่ภาษาไทยหรืออักขระพิเศษไม่ได้', 'ลองใช้ QR Code แทน');
    const opts = {
      format: f.id, width: thumb ? 2 : SIZES[S.size].bar, height: thumb ? 60 : S.barH * (SIZES[S.size].bar / 2),
      displayValue: S.showText, lineColor: S.fg, background: S.transparent ? 'rgba(0,0,0,0)' : S.bg,
      margin: thumb ? 8 : 14 * SIZES[S.size].bar / 2, font: 'monospace', fontSize: (thumb ? 16 : 14 * SIZES[S.size].bar / 2 + 4), textMargin: 4,
    };
    let ok = true; opts.valid = v => { ok = v; };
    const c = document.createElement('canvas');
    try { JsBarcode(c, text, opts); } catch { ok = false; }
    if (!ok) throw new CodeError(`ข้อความนี้ใช้กับ ${f.name} ไม่ได้`, f.rule);
    const svg = () => {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(s, text, { ...opts, valid: () => {} });
      s.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      return new XMLSerializer().serializeToString(s);
    };
    return { canvas: c, svg, pixel: false };
  }

  function makeBwip(f, text, thumb) {
    if (f.group === '1d' && !isAscii(text)) throw new CodeError('บาร์โค้ดแบบเส้นใส่ภาษาไทยหรืออักขระพิเศษไม่ได้', 'ลองใช้ QR Code แทน');
    if (!window.bwipjs) throw new CodeError('loading');
    const opts = {
      bcid: f.bcid, text: toUtf8Bin(text), scale: thumb ? 2 : SIZES[S.size].bw,
      padding: 6, barcolor: S.fg.slice(1),
    };
    if (!S.transparent) opts.backgroundcolor = S.bg.slice(1);
    if (f.group === '1d') Object.assign(opts, { height: (thumb ? 60 : S.barH) / 8, includetext: S.showText, textxalign: 'center', padding: 10 });
    if (f.bcid === 'pdf417') opts.columns = Math.min(10, Math.max(2, Math.ceil(text.length / 12)));
    const c = document.createElement('canvas');
    try { window.bwipjs.toCanvas(c, opts); }
    catch { throw new CodeError(`ข้อความนี้ใช้กับ ${f.name} ไม่ได้`, 'อาจยาวเกินไป ลองใช้ QR Code'); }
    return { canvas: c, svg: () => window.bwipjs.toSVG(opts), pixel: true };
  }

  function build(fmtId, text, thumb = false) {
    const f = byId[fmtId];
    if (f.engine === 'qr') return makeQR(text, thumb);
    if (f.engine === 'jsb') return makeJsb(f, text, thumb);
    return makeBwip(f, text, thumb);
  }

  // ---------- หัวข้อด้านบน / ชื่อด้านล่าง ----------
  const FONT = '"IBM Plex Sans Thai", Sarabun, system-ui, sans-serif';
  const segment = (t, g) => typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('th', { granularity: g }).segment(t)].map(s => s.segment)
    : (g === 'word' ? t.split(/(\s+)/) : [...t]);

  // ตัดบรรทัดตามคำ (รองรับภาษาไทย) ไม่เกิน maxLines บรรทัด
  function wrapLines(ctx, text, maxW, maxLines) {
    const fits = s => ctx.measureText(s).width <= maxW;
    const pieces = [];
    segment(text, 'word').forEach(w => (fits(w) ? pieces.push(w) : pieces.push(...segment(w, 'grapheme'))));
    const lines = [];
    let line = '';
    for (const p of pieces) {
      if (!line || fits(line + p)) line += p;
      else { lines.push(line.trim()); line = p.trimStart(); }
    }
    if (line.trim()) lines.push(line.trim());
    if (lines.length > maxLines) {
      lines.length = maxLines;
      let last = lines[maxLines - 1];
      while (last && !fits(last + '…')) last = [...last].slice(0, -1).join('');
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }

  function decorate(out) {
    const top = el.topText.value.trim(), bot = el.bottomText.value.trim();
    if (!top && !bot) return out;
    const src = out.canvas, W = src.width;
    const base = Math.max(15, Math.round(Math.min(W, 1000) * 0.06));
    const topSize = Math.round(base * 1.15), botSize = Math.round(base * 0.95);
    const lh = s => Math.round(s * 1.45);
    const pad = Math.round(base * 0.7), maxW = W - pad * 2;
    const m = document.createElement('canvas').getContext('2d');
    m.font = `600 ${topSize}px ${FONT}`;
    const topLines = top ? wrapLines(m, top, maxW, 3) : [];
    m.font = `400 ${botSize}px ${FONT}`;
    const botLines = bot ? wrapLines(m, bot, maxW, 3) : [];
    const topH = topLines.length ? pad + topLines.length * lh(topSize) : 0;
    const gap = botLines.length ? Math.round(base * 0.3) : 0;
    const botH = botLines.length ? gap + botLines.length * lh(botSize) + pad : 0;
    const H = topH + src.height + botH;

    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    if (!S.transparent) { ctx.fillStyle = S.bg; ctx.fillRect(0, 0, W, H); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, topH);
    ctx.fillStyle = S.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 ${topSize}px ${FONT}`;
    topLines.forEach((l, i) => ctx.fillText(l, W / 2, pad + i * lh(topSize) + lh(topSize) / 2));
    ctx.font = `400 ${botSize}px ${FONT}`;
    botLines.forEach((l, i) => ctx.fillText(l, W / 2, topH + src.height + gap + i * lh(botSize) + lh(botSize) / 2));

    const svgText = (lines, size, weight, y0) => lines.map((l, i) =>
      `<text x="${W / 2}" y="${y0 + i * lh(size) + lh(size) / 2}" font-size="${size}" font-weight="${weight}" text-anchor="middle" dominant-baseline="central" font-family='${FONT}' fill="${S.fg}">${esc(l)}</text>`).join('');
    const svg = () => {
      const inner = new DOMParser().parseFromString(out.svg(), 'image/svg+xml').documentElement;
      const iw = parseFloat(inner.getAttribute('width')), ih = parseFloat(inner.getAttribute('height'));
      if (!inner.getAttribute('viewBox') && iw && ih) inner.setAttribute('viewBox', `0 0 ${iw} ${ih}`);
      inner.setAttribute('x', 0); inner.setAttribute('y', topH);
      inner.setAttribute('width', W); inner.setAttribute('height', src.height);
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
        (S.transparent ? '' : `<rect width="100%" height="100%" fill="${S.bg}"/>`) +
        svgText(topLines, topSize, 600, pad) + new XMLSerializer().serializeToString(inner) +
        svgText(botLines, botSize, 400, topH + src.height + gap) + '</svg>';
    };
    return { canvas: c, svg, pixel: out.pixel };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---------- แนะนำรูปแบบที่เหมาะ ----------
  function recommend(t) {
    if (!t) return null;
    if (/^\d{12,13}$/.test(t)) return 'EAN13';
    if (/^\d{7,8}$/.test(t)) return 'EAN8';
    if (/^\d{14}$/.test(t)) return 'ITF14';
    if (isAscii(t) && t.length <= 24 && !/^https?:|^www\./i.test(t)) return 'CODE128';
    return 'qr';
  }

  // ---------- วาดหน้าจอ ----------
  function renderChips(text) {
    const rec = recommend(text);
    for (const [box, group] of [[el.chips2d, '2d'], [el.chips1d, '1d']]) {
      box.innerHTML = '';
      FORMATS.filter(f => f.group === group).forEach(f => {
        const b = document.createElement('button');
        b.className = 'chip' + (f.id === S.fmt ? ' active' : '');
        b.dataset.fmt = f.id;
        b.innerHTML = `<span class="c-name">${esc(f.name)}</span><span class="c-use">${esc(f.use)}</span>`;
        if (text && (f.engine === 'jsb' || (f.group === '1d' && !isAscii(text)))) {
          try { makeJsbCheck(f, text); } catch { b.classList.add('bad'); }
        }
        if (f.id === rec) { const r = document.createElement('span'); r.className = 'rec'; r.textContent = 'แนะนำ'; b.appendChild(r); }
        box.appendChild(b);
      });
    }
    el.hint.textContent = byId[S.fmt].rule;
  }

  // ตรวจเร็วๆ ว่าใช้กับบาร์โค้ดเส้นได้ไหม (ไม่ต้องวาดจริง)
  function makeJsbCheck(f, text) {
    if (!isAscii(text)) throw 0;
    if (f.engine !== 'jsb') return;
    let ok = true;
    JsBarcode(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), text, { format: f.id, valid: v => { ok = v; } });
    if (!ok) throw 0;
  }

  function setActionsEnabled(on) { el.actionBtns.forEach(b => { b.disabled = !on; }); }

  function renderMain() {
    const text = el.text.value;
    const f = byId[S.fmt];
    el.count.textContent = `${[...text].length.toLocaleString()} ตัวอักษร`;
    el.badge.textContent = f.name;
    document.body.classList.toggle('is-bar', f.group === '1d');
    document.body.classList.toggle('is-2d', f.group === '2d');
    el.preview.classList.toggle('checker', S.transparent);
    renderChips(text);

    current = null;
    el.stage.hidden = el.err.hidden = true; el.empty.hidden = true; el.tapHint.hidden = true;
    el.preview.classList.remove('ready'); el.dim.textContent = '';
    if (!text) { el.empty.hidden = false; setActionsEnabled(false); updateMbar(); return; }

    try {
      const out = decorate(build(S.fmt, text));
      // แสดงเป็นรูป <img> เพื่อให้มือถือกดค้างแล้ว "บันทึกรูป" ได้
      const img = new Image();
      img.src = out.canvas.toDataURL('image/png');
      img.alt = text;
      img.classList.toggle('pixel', out.pixel);
      el.stage.replaceChildren(img);
      el.stage.hidden = false; el.tapHint.hidden = false;
      el.preview.classList.add('ready');
      el.dim.textContent = `${out.canvas.width} × ${out.canvas.height} px`;
      current = { ...out, fmt: S.fmt, text, dataUrl: img.src };
      setActionsEnabled(true);
      updateMbar();
    } catch (e) {
      setActionsEnabled(false);
      updateMbar();
      el.actionBtns[3].disabled = false; // คัดลอกข้อความยังใช้ได้
      if (e.message === 'loading') {
        el.err.innerHTML = '<span style="color:var(--muted)">กำลังโหลดตัวสร้าง…</span>';
        loadBwip().then(renderAll).catch(() => toast('โหลดไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต', true));
      } else {
        el.err.innerHTML = esc(e.message) + (e.hint ? `<small>${esc(e.hint)}</small>` : '');
      }
      el.err.hidden = false;
    }
  }

  let galleryTimer;
  function renderGallery() {
    clearTimeout(galleryTimer);
    galleryTimer = setTimeout(() => {
      const text = el.text.value;
      el.galleryCard.hidden = !text;
      if (!text) return;
      const needBwip = !window.bwipjs;
      el.gallery.innerHTML = '';
      FORMATS.forEach(f => {
        const b = document.createElement('button');
        b.className = 'g-item' + (f.id === S.fmt ? ' active' : '');
        b.dataset.fmt = f.id;
        const img = document.createElement('div'); img.className = 'g-img';
        try { img.appendChild(build(f.id, text, true).canvas); }
        catch (e) {
          b.classList.add('bad');
          img.innerHTML = `<span class="no">${e.message === 'loading' ? 'กำลังโหลด…' : 'ใช้ไม่ได้กับข้อความนี้'}</span>`;
        }
        const name = document.createElement('div'); name.className = 'g-name'; name.textContent = f.name;
        const use = document.createElement('div'); use.className = 'g-use'; use.textContent = f.use;
        b.append(img, name, use);
        el.gallery.appendChild(b);
      });
      if (needBwip) loadBwip().then(renderGallery).catch(() => {});
    }, 250);
  }

  let mainTimer;
  function renderAll(immediate) {
    clearTimeout(mainTimer);
    if (immediate === true) renderMain(); else mainTimer = setTimeout(renderMain, 60);
    renderGallery();
  }

  // ---------- ประวัติ ----------
  let draftId = null, autoTimer;
  function saveHistory(manual) {
    const text = el.text.value.trim();
    if (!text) return;
    const now = Date.now();
    const extra = { fmt: S.fmt, top: el.topText.value.trim(), bot: el.bottomText.value.trim(), t: now };
    const same = history.findIndex(h => h.text === text);
    if (same >= 0) {
      const [h] = history.splice(same, 1);
      Object.assign(h, extra); history.unshift(h);
    } else {
      const top = history[0];
      if (!manual && top && top.id === draftId && !top.pin && (text.startsWith(top.text) || top.text.startsWith(text))) {
        Object.assign(top, extra, { text });
      } else {
        const id = now.toString(36) + Math.random().toString(36).slice(2, 6);
        history.unshift({ id, text, pin: false, ...extra });
        draftId = id;
      }
    }
    // จำกัดจำนวน (ไม่ลบรายการที่ปักหมุด)
    while (history.length > HIST_MAX) {
      const i = history.map(h => h.pin).lastIndexOf(false);
      if (i < 0) break; history.splice(i, 1);
    }
    store.set(LS_HIST, history);
    renderHistory();
  }

  function timeAgo(t) {
    const s = (Date.now() - t) / 1000;
    if (s < 60) return 'เมื่อสักครู่';
    if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
    if (s < 86400) return `${Math.floor(s / 3600)} ชม. ที่แล้ว`;
    if (s < 86400 * 7) return `${Math.floor(s / 86400)} วันที่แล้ว`;
    return new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  function renderHistory() {
    const q = el.histSearch.value.trim().toLowerCase();
    const list = [...history].sort((a, b) => (b.pin - a.pin) || (b.t - a.t))
      .filter(h => !q || [h.text, h.top, h.bot].some(s => s && s.toLowerCase().includes(q)));
    el.histCount.textContent = history.length ? `(${history.length})` : '';
    if (!list.length) {
      el.history.innerHTML = `<li class="h-empty">${history.length ? 'ไม่พบคำที่ค้นหา' : 'ยังไม่มีประวัติ — ข้อความที่สร้างจะถูกจำไว้ที่นี่อัตโนมัติ'}</li>`;
      return;
    }
    el.history.innerHTML = list.map(h => `
      <li class="h-item" data-id="${h.id}">
        <button class="h-main" data-act="load" title="${esc(h.text)}">
          ${h.top || h.bot ? `<span class="h-label">${esc([h.top, h.bot].filter(Boolean).join(' · '))}</span>` : ''}
          <span class="h-text">${esc(h.text.replace(/\s+/g, ' '))}</span>
          <span class="h-meta">${esc(byId[h.fmt]?.name || 'QR Code')} · ${timeAgo(h.t)}</span>
        </button>
        <button class="h-btn ${h.pin ? 'pinned' : ''}" data-act="pin" title="${h.pin ? 'เลิกปักหมุด' : 'ปักหมุด'}">${h.pin ? '★' : '☆'}</button>
        <button class="h-btn" data-act="copy" title="คัดลอกข้อความ">⧉</button>
        <button class="h-btn" data-act="del" title="ลบ">✕</button>
      </li>`).join('');
  }

  el.history.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.closest('.h-item').dataset.id;
    const h = history.find(x => x.id === id); if (!h) return;
    const act = btn.dataset.act;
    if (act === 'load') {
      setTemplate('text');
      el.text.value = h.text; draftId = null;
      el.topText.value = h.top || ''; el.bottomText.value = h.bot || '';
      if (byId[h.fmt]) setFmt(h.fmt, false);
      renderAll(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'pin') { h.pin = !h.pin; store.set(LS_HIST, history); renderHistory(); }
    else if (act === 'copy') { copyTextValue(h.text); }
    else if (act === 'del') { history = history.filter(x => x !== h); store.set(LS_HIST, history); renderHistory(); }
  });
  el.histSearch.addEventListener('input', renderHistory);
  $('histClear').addEventListener('click', () => {
    if (!history.some(h => !h.pin)) return toast('ไม่มีรายการให้ลบ');
    if (!confirm('ลบประวัติทั้งหมด? (รายการที่ปักหมุดจะยังอยู่)')) return;
    history = history.filter(h => h.pin); store.set(LS_HIST, history); renderHistory();
  });

  // ---------- ปุ่มต่างๆ ----------
  function fileName(ext) {
    const label = el.topText.value.trim() || el.bottomText.value.trim();
    const base = (label || current?.text || 'code').replace(/^https?:\/\//, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 32) || 'code';
    return `${current.fmt === 'qr' ? 'qr' : current.fmt.toLowerCase()}-${base}.${ext}`;
  }
  const canvasBlob = c => new Promise(r => c.toBlob(r, 'image/png'));

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function copyImage() {
    if (!current) return;
    el.preview.classList.remove('flash'); void el.preview.offsetWidth; el.preview.classList.add('flash');
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem) throw 0;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': canvasBlob(current.canvas) })]);
      toast(isTouch ? 'คัดลอกรูปแล้ว — กดค้างในแชทเพื่อวาง' : 'คัดลอกรูปแล้ว — วางได้เลย (Ctrl+V)');
    } catch {
      download(await canvasBlob(current.canvas), fileName('png'));
      toast('เบราว์เซอร์นี้คัดลอกรูปไม่ได้ จึงบันทึกเป็นไฟล์ให้แทน');
    }
    saveHistory(true);
  }
  async function savePng() {
    if (!current) return;
    download(await canvasBlob(current.canvas), fileName('png'));
    toast('บันทึก PNG แล้ว'); saveHistory(true);
  }
  function saveSvg() {
    if (!current) return;
    download(new Blob([current.svg()], { type: 'image/svg+xml' }), fileName('svg'));
    toast('บันทึก SVG แล้ว'); saveHistory(true);
  }
  async function copyTextValue(t) {
    try { await navigator.clipboard.writeText(t); toast('คัดลอกข้อความแล้ว'); }
    catch {
      const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove(); toast('คัดลอกข้อความแล้ว');
    }
  }
  async function share() {
    if (!current) return;
    const file = new File([await canvasBlob(current.canvas)], fileName('png'), { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] });
      else await navigator.share({ text: current.text });
      saveHistory(true);
    } catch { /* ผู้ใช้กดยกเลิก */ }
  }
  function printCode() {
    if (!current) return;
    const url = current.dataUrl;
    const w = window.open('', '_blank');
    if (!w) return toast('เบราว์เซอร์บล็อกหน้าต่างพิมพ์', true);
    w.document.write(`<!doctype html><title>${esc(current.text.slice(0, 40))}</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh}img{max-width:80vw;max-height:80vh;image-rendering:pixelated}</style><img src="${url}" onload="setTimeout(()=>{print()},100)">`);
    w.document.close();
    saveHistory(true);
  }

  $('copyImg').addEventListener('click', copyImage);
  el.preview.addEventListener('click', () => current && copyImage());
  $('savePng').addEventListener('click', savePng);
  $('saveSvg').addEventListener('click', saveSvg);
  $('copyText').addEventListener('click', () => { if (el.text.value) { copyTextValue(el.text.value); saveHistory(true); } });
  $('printBtn').addEventListener('click', printCode);
  if (navigator.share) { $('shareBtn').hidden = false; $('shareBtn').addEventListener('click', share); }

  // ---------- แถบปุ่มด้านล่าง (มือถือ) — โผล่เมื่อเลื่อนจนไม่เห็นตัวอย่าง ----------
  const mbar = $('mbar');
  let previewVisible = true;
  function updateMbar() {
    mbar.hidden = !current || previewVisible;
    if (current) $('mbarThumb').style.backgroundImage = `url("${current.dataUrl}")`;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { previewVisible = en.isIntersecting; updateMbar(); }, { threshold: 0.25 })
      .observe(el.preview);
  }
  $('mCopy').addEventListener('click', copyImage);
  // มือถือที่แชร์ไฟล์ได้: ใช้หน้าแชร์ (มีปุ่ม "บันทึกรูปภาพ") แทนการดาวน์โหลด
  $('mSave').addEventListener('click', async () => {
    if (isTouch && current && navigator.canShare) {
      const file = new File([await canvasBlob(current.canvas)], fileName('png'), { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); saveHistory(true); } catch { /* ยกเลิก */ }
        return;
      }
    }
    savePng();
  });
  $('mbarThumb').addEventListener('click', () => el.preview.scrollIntoView({ behavior: 'smooth', block: 'center' }));

  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); copyImage(); }
    else if (mod && !e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); savePng(); }
  });

  // ---------- ข้อความ ----------
  el.text.addEventListener('input', () => {
    renderAll();
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => saveHistory(false), 1500);
  });
  $('pasteBtn').addEventListener('click', async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (!t) return toast('คลิปบอร์ดว่างเปล่า');
      setTemplate('text');
      el.text.value = t; draftId = null; renderAll(true); saveHistory(true);
      toast('วางแล้ว');
    } catch { el.text.focus(); toast('กด Ctrl+V เพื่อวางในช่องข้อความ'); }
  });
  $('clearBtn').addEventListener('click', () => {
    el.text.value = el.topText.value = el.bottomText.value = ''; draftId = null; renderAll(true); el.text.focus();
  });
  [el.topText, el.bottomText].forEach(i => {
    i.addEventListener('input', () => {
      clearTimeout(mainTimer); mainTimer = setTimeout(renderMain, 60);
      clearTimeout(autoTimer); autoTimer = setTimeout(() => saveHistory(false), 1500);
    });
    i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); i === el.topText ? el.bottomText.focus() : i.blur(); } });
  });

  // ---------- เลือกรูปแบบ ----------
  function setFmt(id, render = true) {
    S.fmt = id; store.set(LS_SET, S);
    if (render) renderAll(true);
  }
  [el.chips2d, el.chips1d].forEach(box => box.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (b) setFmt(b.dataset.fmt);
  }));
  el.gallery.addEventListener('click', e => {
    const b = e.target.closest('.g-item'); if (!b) return;
    setFmt(b.dataset.fmt);
    if (window.innerWidth <= 860) $('preview').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ---------- ตั้งค่า ----------
  function syncSettingsUI() {
    $('fg').value = S.fg; $('bg').value = S.bg; $('transparent').checked = S.transparent;
    $('showText').checked = S.showText; $('barH').value = S.barH;
    document.querySelectorAll('#sizeSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === S.size));
    document.querySelectorAll('#ecSeg button').forEach(b => {
      b.classList.toggle('on', b.dataset.v === (logoImg ? 'H' : S.ec));
      b.disabled = !!logoImg && b.dataset.v !== 'H';
    });
  }
  function updateSetting(k, v) { S[k] = v; store.set(LS_SET, S); syncSettingsUI(); renderAll(); }
  $('fg').addEventListener('input', e => updateSetting('fg', e.target.value));
  $('bg').addEventListener('input', e => updateSetting('bg', e.target.value));
  $('transparent').addEventListener('change', e => updateSetting('transparent', e.target.checked));
  $('showText').addEventListener('change', e => updateSetting('showText', e.target.checked));
  $('barH').addEventListener('input', e => updateSetting('barH', +e.target.value));
  $('sizeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) updateSetting('size', b.dataset.v); });
  $('ecSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) updateSetting('ec', b.dataset.v); });
  $('resetSettings').addEventListener('click', () => {
    const fmt = S.fmt; S = { ...DEFAULTS, fmt }; store.set(LS_SET, S); clearLogo(); syncSettingsUI(); renderAll(true);
  });
  $('logoFile').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => { img.dataUrl = r.result; logoImg = img; $('logoClear').hidden = false; syncSettingsUI(); renderAll(true); toast('ใส่โลโก้แล้ว (ปรับกู้คืนข้อมูลเป็น H อัตโนมัติ)'); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
  function clearLogo() { logoImg = null; $('logoFile').value = ''; $('logoClear').hidden = true; syncSettingsUI(); }
  $('logoClear').addEventListener('click', e => { e.preventDefault(); clearLogo(); renderAll(true); });

  // ---------- แม่แบบ (Wi‑Fi, พร้อมเพย์ ฯลฯ) ----------
  let tpl = 'text';
  function setTemplate(name) {
    tpl = name;
    document.querySelectorAll('#templateTabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tpl === name));
    document.querySelectorAll('.tpl-form').forEach(f => { f.hidden = f.id !== `tpl-${name}`; });
    el.text.readOnly = false;
  }
  document.getElementById('templateTabs').addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (!t) return;
    setTemplate(t.dataset.tpl);
    if (t.dataset.tpl !== 'text') {
      if (byId[S.fmt].group === '1d') setFmt('qr', false);
      buildFromTemplate();
      document.querySelector(`#tpl-${t.dataset.tpl} input`)?.focus();
    } else el.text.focus();
  });
  document.querySelectorAll('.tpl-form').forEach(form => {
    form.addEventListener('input', buildFromTemplate);
    form.addEventListener('change', buildFromTemplate);
  });

  const val = (form, f) => { const i = form.querySelector(`[data-f="${f}"]`); return i.type === 'checkbox' ? i.checked : i.value.trim(); };
  const wifiEsc = s => s.replace(/([\\;,:"])/g, '\\$1');

  function buildFromTemplate() {
    const form = $(`tpl-${tpl}`); if (!form) return;
    let out = '';
    if (tpl === 'wifi') {
      const ssid = val(form, 'ssid'), enc = val(form, 'enc');
      if (ssid) out = `WIFI:T:${enc};S:${wifiEsc(ssid)};${enc !== 'nopass' ? `P:${wifiEsc(val(form, 'pass'))};` : ''}${val(form, 'hidden') ? 'H:true;' : ''};`;
    } else if (tpl === 'promptpay') {
      const id = val(form, 'id').replace(/\D/g, '');
      if (id.length >= 10) out = promptPay(id, val(form, 'amount'));
    } else if (tpl === 'phone') {
      const num = val(form, 'num').replace(/[^\d+]/g, ''), msg = val(form, 'msg');
      if (num) out = msg ? `SMSTO:${num}:${msg}` : `tel:${num}`;
    } else if (tpl === 'email') {
      const to = val(form, 'to'), sub = val(form, 'subject'), body = val(form, 'body');
      if (to) {
        const q = [sub && `subject=${encodeURIComponent(sub)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean).join('&');
        out = `mailto:${to}${q ? '?' + q : ''}`;
      }
    }
    el.text.value = out;
    renderAll();
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => saveHistory(false), 1500);
  }

  // PromptPay (EMVCo) — เบอร์โทร / เลขบัตร 13 หลัก / e‑Wallet 15 หลัก
  function promptPay(id, amount) {
    const f = (tag, v) => tag + String(v.length).padStart(2, '0') + v;
    let target;
    if (id.length === 15) target = f('03', id);
    else if (id.length === 13) target = f('02', id);
    else target = f('01', ('0000000000000' + id.replace(/^0/, '66')).slice(-13));
    const amt = parseFloat(amount);
    let p = f('00', '01') + f('01', amt > 0 ? '12' : '11') + f('29', f('00', 'A000000677010111') + target) +
      f('58', 'TH') + f('53', '764') + (amt > 0 ? f('54', amt.toFixed(2)) : '') + '6304';
    return p + crc16(p);
  }
  function crc16(s) {
    let crc = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  // ---------- เครื่องมือเล็กๆ ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  let toastTimer;
  function toast(msg, bad) {
    el.toast.textContent = msg; el.toast.classList.toggle('bad', !!bad); el.toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2200);
  }

  // ---------- เริ่มต้น ----------
  const params = new URLSearchParams(location.search);
  if (params.get('t')) el.text.value = params.get('t');
  if (params.get('top')) el.topText.value = params.get('top');
  if (params.get('bottom')) el.bottomText.value = params.get('bottom');
  syncSettingsUI();
  renderHistory();
  renderAll(true);
  if (byId[S.fmt].engine === 'bwip') loadBwip().then(() => renderAll(true)).catch(() => {});
  setInterval(renderHistory, 60000);
  if (!isTouch) el.text.focus(); // มือถือไม่เด้งคีย์บอร์ดเอง
  if (isTouch) el.tapHint.textContent = 'แตะเพื่อคัดลอก · กดค้างเพื่อบันทึกรูป';
  // วาดหัวข้อใหม่เมื่อฟอนต์ไทยโหลดเสร็จ
  document.fonts?.load(`600 20px "IBM Plex Sans Thai"`).then(() => renderMain()).catch(() => {});

  // ---------- ติดตั้งเป็นแอพ + ใช้งานออฟไลน์ ----------
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('installBtn').hidden = false; });
  $('installBtn').addEventListener('click', async () => {
    if (!installEvt) return;
    installEvt.prompt(); await installEvt.userChoice; installEvt = null; $('installBtn').hidden = true;
  });
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !standalone) $('iosInstall').hidden = false;
})();
