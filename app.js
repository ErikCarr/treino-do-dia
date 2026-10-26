/* ===== App do aluno: Treino do dia (celular) ===== */
(function () {
  const $ = s => document.querySelector(s);
  const { QUESTIONS, byId, byDay, plans } = buildIndex(PACKS);
  const SUBJECTS = PACKS.filter(p => p.plan);
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const JSONget = (k, d) => { try { return JSON.parse(LS.get(k)) || d; } catch (e) { return d; } };

  const I = (p, extra) => '<svg viewBox="0 0 24 24" aria-hidden="true"' + (extra || '') + '>' + p + '</svg>';
  const ICON = {
    star: I('<path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="currentColor"/>'),
    flame: I('<path d="M12 2c1.2 4.3 5.5 6.2 5.5 11.2a5.5 5.5 0 0 1-11 0c0-2.3 1-3.8 2.3-5 .1 2.2 1 3.3 2.2 3.6C10.2 8.8 10.5 5.5 12 2z" fill="currentColor"/>'),
    bolt: I('<path d="M13.5 2L4.5 13.5H10L9 22l9.5-12H13z" fill="currentColor"/>'),
    leaf: I('<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15 1-4 3-7 7-9-3 1-6 3-8 8z" fill="currentColor"/>'),
    back: I('<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
    next: I('<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'),
    help: I('<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.4 2.5c-.9.6-1.6 1-1.6 2.2M12 17.2v.1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
    check: I('<path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>'),
    lock: I('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/>'),
    bulb: I('<path d="M12 2.5a6.5 6.5 0 0 0-3.6 11.9c.7.5 1.1 1.2 1.1 2V17h5v-.6c0-.8.4-1.5 1.1-2A6.5 6.5 0 0 0 12 2.5zM9.5 19.5h5M10.5 22h3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    sure: I('<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 12.5l3.4 3.4L17.2 9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
    doubt: I('<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M9.3 9.4a2.8 2.8 0 1 1 4.3 2.3c-.9.6-1.6 1-1.6 2.1" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.5" fill="#fff"/>'),
    guess: I('<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6.5v7" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.7" fill="#fff"/>'),
    cam: I('<path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="13.2" r="3.6" fill="none" stroke="currentColor" stroke-width="2.2"/>'),
    list: I('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'),
    trophy: I('<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M12 14v4M8 21h8M9.5 18h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>')
  };

  const S = { attempts: [], flags: {}, cfg: Object.assign({}, DEFAULT_CFG), subject: (SUBJECTS[0] || {}).id, view: 'home', sess: null, prog: {}, xp: 0, stars: 0, streak: 0,
    conf: null, pick: null, fb: null, drafts: {}, hint: false, t0: Date.now(), acc: 0, vis: true, revDone: {}, user: null, syncing: false, syncErr: '', online: navigator.onLine,
    pendingPhoto: null, dirtyFlags: {}, curPlanState: null };

  /* ---------- armazenamento local ---------- */
  function saveLocal() {
    LS.set('dec2.ev', JSON.stringify(S.attempts.slice(-8000)));
    LS.set('dec2.fl', JSON.stringify(S.flags)); LS.set('dec2.cfg', JSON.stringify(S.cfg)); LS.set('dec2.dirty', JSON.stringify(S.dirtyFlags));
  }
  function loadLocal() {
    S.attempts = JSONget('dec2.ev', []); S.flags = JSONget('dec2.fl', {}); S.dirtyFlags = JSONget('dec2.dirty', {});
    S.cfg = Object.assign({}, DEFAULT_CFG, JSONget('dec2.cfg', {}));
    S.subject = LS.get('dec2.subj') || S.subject;
  }

  /* ---------- fotos guardadas no aparelho até subirem ---------- */
  const IDB = {
    db: null,
    open() { return new Promise(res => { if (this.db) return res(this.db); try { const r = indexedDB.open('decimais', 1); r.onupgradeneeded = () => r.result.createObjectStore('fotos', { keyPath: 'cid' }); r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => res(null); } catch (e) { res(null); } }); },
    async tx(mode, fn) { const db = await this.open(); if (!db) return null; return new Promise(res => { const t = db.transaction('fotos', mode); const st = t.objectStore('fotos'); const rq = fn(st); t.oncomplete = () => res(rq && rq.result !== undefined ? rq.result : true); t.onerror = () => res(null); }); },
    put(o) { return this.tx('readwrite', s => s.put(o)); }, all() { return this.tx('readonly', s => s.getAll()); }, del(k) { return this.tx('readwrite', s => s.delete(k)); }
  };

  /* ---------- eventos ---------- */
  function recompute() { const r = computeProg(QUESTIONS, byId, S.attempts); S.prog = r.P; S.xp = r.xp; S.stars = r.stars; S.streak = r.streak; }
  function mkEv(type, q, extra) { return Object.assign({ cid: newCid(), ts: Date.now(), type, qid: q.id, ch: q.ch, lv: q.lv, day: q.day || null, _p: 1 }, extra || {}); }
  function logEv(ev) { S.attempts.push(ev); recompute(); saveLocal(); updateHud(); sync(); return ev; }

  /* ---------- sincronização ---------- */
  async function syncPhotos() {
    const list = await IDB.all(); if (!list || !list.length || !Cloud.user()) return;
    const uid = Cloud.user().id;
    for (const f of list) {
      const path = uid + '/' + ymd(f.ts) + '/' + f.qid + '_' + f.cid + '.jpg';
      const r = await Cloud.upload(path, f.blob);
      if (r.error) { S.syncErr = r.error; break; }
      const ev = S.attempts.find(e => e.cid === f.cid); if (ev) { ev.path = path; ev._p = 1; }
      await IDB.del(f.cid);
    }
  }
  async function sync() {
    if (!Cloud.enabled || !Cloud.user() || S.syncing || !navigator.onLine) return;
    S.syncing = true; S.syncErr = '';
    try {
      await syncPhotos();
      const pend = S.attempts.filter(e => e._p && !(e.type === 'foto' && !e.path));
      for (let i = 0; i < pend.length; i += 50) {
        const chunk = pend.slice(i, i + 50), r = await Cloud.pushEvents(chunk);
        if (r.error) { S.syncErr = r.error; break; }
        chunk.forEach(e => { delete e._p; });
      }
      for (const qid of Object.keys(S.dirtyFlags)) { const r = await Cloud.pushFlag(S.flags[qid]); if (!r.error) delete S.dirtyFlags[qid]; else { S.syncErr = r.error; break; } }
      if (!S.syncErr) {
        const ev = await Cloud.fetchEvents();
        if (ev) { const cids = new Set(ev.map(e => e.cid)); const local = S.attempts.filter(e => e._p && !cids.has(e.cid)); S.attempts = ev.concat(local); }
        const fl = await Cloud.fetchFlags();
        if (fl) { const nf = {}; fl.forEach(r => nf[r.qid] = r); Object.keys(S.dirtyFlags).forEach(k => nf[k] = S.flags[k]); S.flags = nf; }
        const cf = await Cloud.fetchConfig();
        if (cf && cf.settings) S.cfg = Object.assign({}, DEFAULT_CFG, cf.settings);
      }
    } catch (e) { S.syncErr = String(e && e.message || e); }
    S.syncing = false; recompute(); saveLocal(); updateHud(); if (S.view === 'home') renderHome(); else if (S.view === 'q') refreshBar();
  }

  /* ---------- tempo ativo (só conta com o app na frente) ---------- */
  const resetTimer = () => { S.acc = 0; S.t0 = Date.now(); };
  const elapsed = () => Math.min(S.acc + (S.vis ? Date.now() - S.t0 : 0), 30 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { S.acc += Date.now() - S.t0; S.vis = false; } else { S.t0 = Date.now(); S.vis = true; sync(); } });
  window.addEventListener('online', () => { S.online = true; sync(); }); window.addEventListener('offline', () => { S.online = false; renderBanner(); });
  setInterval(sync, 45000);

  /* ---------- plano ---------- */
  const planOf = () => plans[S.subject] || [];
  function pstate() { const st = planState(byDay, S.subject, planOf(), S.prog, S.cfg); S.curPlanState = st; return st; }
  const dayQids = dn => { const d = planOf().find(x => x.day === dn); return d ? [].concat.apply([], d.blocks.map(b => b.qids)) : []; };
  const cur = () => byId[S.sess.qids[S.sess.i]];
  function closedNow(q) {
    const p = S.prog[q.id];
    if (S.sess.kind === 'rev') return !!S.revDone[q.id];
    if (S.sess.kind === 'dia') return isClosed(q, p, S.cfg);
    return p.solved || p.helped;
  }

  /* ---------- cabeçalho e avisos ---------- */
  function updateHud() { if (S.view === 'home') renderHud(); else if (S.view === 'q') { const e = $('#qxp'); if (e) e.textContent = S.xp + ' XP'; } }
  function renderHud() {
    const r = rankOf(S.xp), cur0 = RANKS[r][0], nxt = RANKS[r + 1] ? RANKS[r + 1][0] : null, p = nxt ? pct(S.xp - cur0, nxt - cur0) : 100;
    $('#hud').hidden = false;
    $('#hud').innerHTML = '<div class="hrow"><div class="brand">Treino do <b>Dia</b></div><div class="hstat st">' + ICON.star + '<b>' + S.stars + '</b></div><div class="hstat fl' + (S.streak >= 3 ? ' hot' : '') + '">' + ICON.flame + '<b>' + S.streak + '</b></div></div>' +
      '<div class="rank"><div class="rtop"><span class="rname">' + esc(RANKS[r][1]) + '</span><span class="xptxt">' + S.xp + (nxt ? ' / ' + nxt : '') + ' XP</span></div><div class="xpbar"><i style="width:' + p + '%"></i></div></div>';
  }
  function renderBanner() {
    const b = $('#banner'); let m = '';
    if (!Cloud.enabled) m = 'Modo sem internet configurada: os resultados ficam só neste celular.';
    else if (!S.online) m = 'Sem internet agora. Pode continuar: o app envia tudo quando a conexão voltar.';
    else if (S.syncErr) m = 'Não consegui enviar seus resultados agora. Avise o responsável se isso continuar.';
    b.hidden = !m; b.textContent = m;
  }

  /* ---------- tela inicial ---------- */
  function setView(v) { S.view = v; document.body.dataset.view = v; $('#hud').hidden = v !== 'home'; document.body.classList.remove('lock'); }
  function renderHome() {
    setView('home'); renderHud(); renderBanner(); document.body.removeAttribute('data-lv');
    const plan = planOf(), st = pstate();
    let h = '';
    if (SUBJECTS.length > 1) h += '<div class="subjects">' + SUBJECTS.map(s => '<button class="subj' + (s.id === S.subject ? ' on' : '') + '" data-subj="' + s.id + '">' + esc(s.nome) + '</button>').join('') + '</div>';
    if (st.status === 'fim') {
      h += '<section class="today done"><div class="trophy">' + ICON.trophy + '</div><h1>Plano concluído!</h1><p>Você terminou todos os dias do plano. Que orgulho!</p></section>';
    } else if (st.status === 'descanso') {
      const prev = plan[st.cur - 1], di = st.days[st.cur - 1], d = plan[st.cur];
      const xpToday = di.qs.reduce((t, q) => t + S.prog[q.id].xp, 0), stars = di.qs.reduce((t, q) => t + S.prog[q.id].stars, 0);
      h += '<section class="today rest"><div class="trophy">' + ICON.check + '</div><h1>Treino de hoje feito!</h1><p>' + esc(prev.title) + '. Você ganhou <b>' + xpToday + ' XP</b> e <b>' + stars + ' estrelas</b> em ' + Math.max(1, Math.round(di.ms / 60000)) + ' min.</p>' +
        '<div class="next">Amanhã: <b>Dia ' + d.day + ' · ' + esc(d.title) + '</b></div></section>';
    } else {
      const d = plan[st.cur], di = st.days[st.cur], started = di.closed > 0 || di.ms > 0;
      h += '<section class="today"><div class="dtag">Dia ' + d.day + ' de ' + plan.length + ' · semana ' + d.week + (d.sim ? ' · simulado' : '') + '</div><h1>' + esc(d.title) + '</h1><p class="focus">' + esc(d.focus) + '</p>' +
        '<div class="blocks">' + d.blocks.map(b => { const cl = b.qids.filter(id => isClosed(byId[id], S.prog[id], S.cfg)).length, c = (BLK[b.id] || {}).c || 2;
          return '<div class="bl lv' + c + '"><div class="blt"><span>' + esc(b.name) + '</span><b>' + cl + '/' + b.qids.length + '</b></div><div class="blbar"><i style="width:' + pct(cl, b.qids.length) + '%"></i></div></div>'; }).join('') + '</div>' +
        '<div class="meta">Cerca de ' + d.mins + ' minutos' + (di.photoMiss ? ' · ' + di.photoMiss + ' foto(s) do caderno para enviar' : '') + '</div>' +
        '<button class="gbtn go big" data-act="startday" type="button">' + (started ? 'Continuar o treino' : 'Começar o treino') + '</button></section>';
    }
    h += '<section class="weeks"><h2>Caminho do plano</h2>' + [1, 2, 3, 4].map(w => '<div class="wk"><span class="wkn">Semana ' + w + '</span><div class="wkd">' + plan.filter(d => d.week === w).map(d => {
      const i = plan.indexOf(d), di = st.days[i], isCur = i === st.cur, cls = di.done ? 'done' : isCur ? 'cur' : (di.closed ? 'part' : 'todo');
      return '<button class="dd ' + cls + (d.sim ? ' sim' : '') + '" data-day="' + d.day + '" aria-label="Dia ' + d.day + (di.done ? ', feito' : isCur ? ', de hoje' : '') + '">' + (di.done ? ICON.check : d.sim ? ICON.trophy : d.day) + '</button>'; }).join('') + '</div></div>').join('') + '<p class="small">Toque num dia já feito para treinar de novo, sem ganhar XP.</p></section>';
    h += '<section class="free"><button class="gbtn blue" data-act="livre" type="button">' + ICON.list + 'Treino livre por assunto</button></section>';
    h += '<footer class="who">' + (Cloud.user() ? esc(Cloud.user().email || '') + ' · <button class="link" data-act="logout">sair</button>' : '') + '</footer>';
    $('#view').innerHTML = h; window.scrollTo(0, 0);
  }

  function renderLivre() {
    setView('livre'); renderBanner();
    const olds = QUESTIONS.filter(q => !q.day && q.subject === S.subject);
    let h = '<div class="top2"><button class="ib" data-act="home" aria-label="Voltar">' + ICON.back + '</button><h1>Treino livre</h1></div><p class="small pad">Escolha o assunto e o nível. Aqui não há plano: é só prática.</p>';
    (CHAPS || []).slice(0, 4).forEach(c => {
      h += '<section class="mch"><h3>Cap. ' + c.num + ' · ' + esc(c.short) + '</h3>' + [1, 2, 3].map(lv => { const z = olds.filter(q => q.ch === c.num && q.lv === lv); if (!z.length) return ''; const d = z.filter(q => S.prog[q.id].solved).length;
        return '<button class="lvrow lv' + lv + '" data-livre="' + c.num + ':' + lv + '"><span class="lvn">' + LV[lv] + '</span><span class="lvbar"><i style="width:' + pct(d, z.length) + '%"></i></span><b>' + d + '/' + z.length + '</b></button>'; }).join('') + '</section>';
    });
    $('#view').innerHTML = h; window.scrollTo(0, 0);
  }

  /* ---------- sessões ---------- */
  function startSession(kind, qids, i, day) {
    S.sess = { kind, qids, i: Math.max(0, i || 0), day: day || null }; S.revDone = {}; S.fb = null; S.conf = null; S.pick = null; S.hint = false; resetTimer();
    LS.set('dec2.sess', JSON.stringify({ kind, day: day || null }));
    renderQuestion(); window.scrollTo(0, 0);
  }
  function startDay() {
    const st = pstate(); if (st.cur < 0 || st.status !== 'aberto') return;
    const d = planOf()[st.cur], qids = dayQids(d.day); let i = qids.findIndex(id => !isClosed(byId[id], S.prog[id], S.cfg)); if (i < 0) i = 0;
    startSession('dia', qids, i, d.day);
  }
  function startRevDay(dn) { startSession('rev', dayQids(dn), 0, dn); }
  function startReviewTime(dn) {
    const qs = (byDay[S.subject + ':' + dn] || []).slice().sort((a, b) => (S.prog[a.id].firstOk ? 1 : 0) - (S.prog[b.id].firstOk ? 1 : 0) || (S.prog[b.id].tries - S.prog[a.id].tries));
    const list = qs.filter(q => q.type !== 'self').slice(0, 6).map(q => q.id); startSession('rev', list, 0, dn); S.sess.forTime = true;
  }
  function startLivre(ch, lv) {
    const qids = QUESTIONS.filter(q => !q.day && q.subject === S.subject && q.ch === ch && q.lv === lv).sort((a, b) => a.i - b.i).map(q => q.id);
    let i = qids.findIndex(id => !S.prog[id].solved); startSession('livre', qids, i < 0 ? 0 : i, null);
  }

  /* ---------- tela da questão ---------- */
  function statementHtml(q) {
    const t = esc(q.text).replace(/\n/g, '<br>');
    if (q.kind === 's' && q.type === 'num' && !q.det && !q.concept && q.text.length < 40) return '<div class="expr">' + t + '</div>';
    return '<p class="stmt">' + (q.det ? '<span class="badge">Detetive do erro</span> ' : '') + t.replace('Detetive do erro: ', '') + '</p>';
  }
  function renderQuestion() {
    const sess = S.sess; if (!sess || !sess.qids.length) { renderHome(); return; }
    setView('q'); renderBanner();
    const q = cur(), p = S.prog[q.id], closed = closedNow(q), n = sess.qids.length, solved = p.solved || !!S.revDone[q.id];
    document.body.dataset.lv = q.lv;
    const blk = BLK[q.blk] || { n: sess.kind === 'livre' ? 'Treino livre' : 'Questão', c: q.lv };
    const ic = q.lv === 1 ? ICON.leaf : q.lv === 2 ? ICON.bolt : ICON.flame;
    const done = sess.qids.filter(id => sess.kind === 'rev' ? S.revDone[id] : sess.kind === 'dia' ? isClosed(byId[id], S.prog[id], S.cfg) : S.prog[id].solved).length;
    let h = '<div class="qtop"><button class="ib" data-act="home" aria-label="Sair do treino">' + ICON.x + '</button>' +
      '<button class="qtitle" data-act="map" aria-label="Ver as questões do dia"><span class="lvic">' + ic + '</span><span><b>' + esc(blk.n) + (sess.kind === 'rev' ? ' · revisão' : '') + '</b><small>Questão ' + (sess.i + 1) + ' de ' + n + '</small></span></button>' +
      '<div class="mini"><span id="qxp">' + S.xp + ' XP</span></div></div><div class="qprog"><i style="width:' + pct(done, n) + '%"></i></div>';
    h += '<article class="qcard' + (q.lv === 3 ? ' hard' : '') + '" id="qcard">' + (q.lv === 3 ? '<div class="hardtag">' + ICON.flame + 'Desafio · vá com calma</div>' : '') +
      statementHtml(q) + (q.tip ? '<div class="tip">' + ICON.bulb + '<div><b>Dica</b><span>' + esc(q.tip.replace(/^dica:\s*/i, '').replace(/^./, c => c.toUpperCase())) + '</span></div></div>' : '');
    h += '<form id="ansform" autocomplete="off">' + answerHtml(q, p, solved) + (solved ? '' : confHtml(q)) + '</form><div id="fb" aria-live="polite"></div></article>';
    h += '<div class="bar" id="bar"></div>';
    $('#view').innerHTML = h; refreshBar(); renderFeedback();
    if (!S.fb && p.tries && !solved && sess.kind !== 'rev') $('#fb').innerHTML = '<p class="prior">Você já tentou ' + p.tries + (p.tries === 1 ? ' vez' : ' vezes') + '. Tente de novo.</p>';
    if (solved && !S.fb) { S.fb = { qid: q.id, kind: 'ok', title: 'Missão cumprida', body: solText(q), stars: p.stars, xp: p.xp, quiet: true }; renderFeedback(); }
  }
  const solText = q => (q.type === 'mc' || q.type === 'txt' ? 'Resposta: ' : 'Como se resolve: ') + (q.sol || '');
  function answerHtml(q, p, solved) {
    if (q.type === 'mc') {
      return '<div class="opts" role="radiogroup">' + q.opts.map((o, i) => '<button type="button" class="opt' + (S.pick === i ? ' on' : '') + (solved && o.ok ? ' right' : '') + '" data-pick="' + i + '" role="radio" aria-checked="' + (S.pick === i) + '"' + (solved ? ' disabled' : '') + '><span class="ol">' + 'ABCD'[i] + '</span><span>' + esc(o.t) + '</span></button>').join('') + '</div>';
    }
    if (q.type === 'self') return '<label class="sr" for="ans">Sua resposta</label><textarea id="ans" rows="5" maxlength="900" placeholder="Escreva com suas palavras" ' + (solved ? 'disabled' : '') + '>' + esc(S.drafts[q.id] || '') + '</textarea>';
    const isNum = q.type === 'num';
    const val = solved && isNum ? (q.vtxt || '') : (S.drafts[q.id] || '');
    return '<label class="sr" for="ans">Sua resposta</label><p class="how">' + (solved ? 'Missão cumprida.' : isNum ? 'Faça a conta no caderno e escreva só o resultado.' : 'Escreva sua resposta.') + '</p>' +
      '<div class="ansrow">' + (q.pre ? '<span class="unit">' + q.pre + '</span>' : '') + '<input id="ans" ' + (isNum ? 'inputmode="decimal" enterkeyhint="done"' : 'type="text" enterkeyhint="done"') + ' placeholder="Sua resposta" value="' + esc(val) + '"' + (solved ? ' disabled' : '') + '>' + (q.post ? '<span class="unit">' + esc(q.post) + '</span>' : '') + '</div>';
  }
  function confHtml(q) {
    if (q.type === 'self') return '';
    const cs = [['certeza', 'Tenho certeza', ICON.sure], ['duvida', 'Estou em dúvida', ICON.doubt], ['chutei', 'Chutei', ICON.guess]];
    return '<div class="conf" id="confp" role="group" aria-label="Como você se sente sobre sua resposta"><span class="conflbl">Como você se sente com essa resposta?' + (S.cfg.confReq ? ' <small>(escolha uma)</small>' : '') + '</span><div class="chips">' +
      cs.map(x => '<button type="button" class="chip c-' + x[0] + '" data-conf="' + x[0] + '" aria-pressed="' + (S.conf === x[0]) + '">' + x[2] + '<span>' + x[1] + '</span></button>').join('') + '</div></div>';
  }
  function refreshBar() {
    const bar = $('#bar'); if (!bar || S.view !== 'q') return; const q = cur(), p = S.prog[q.id], closed = closedNow(q), last = S.sess.i === S.sess.qids.length - 1;
    const needPhoto = S.sess.kind === 'dia' && q.photo && S.cfg.photoReq && p.solved && !p.photo && !p.photoSkip;
    let main;
    if (needPhoto) main = '<button class="gbtn go big" data-act="photo" type="button">' + ICON.cam + 'Enviar foto da conta</button>';
    else if (closed) main = '<button class="gbtn go big pulse" data-act="next" type="button">' + (last ? 'Terminar' : 'Próxima') + ICON.next + '</button>';
    else main = '<button class="gbtn go big' + (S.cfg.confReq && !S.conf && q.type !== 'self' ? ' wait' : '') + '" data-act="check" type="button" id="check">' + (q.type === 'self' ? 'Enviar resposta' : 'Conferir resposta') + '</button>';
    bar.innerHTML = '<button class="gbtn grey sq" data-act="prev" type="button" aria-label="Questão anterior"' + (S.sess.i === 0 ? ' disabled' : '') + '>' + ICON.back + '</button>' + main + '<button class="gbtn grey sq" data-act="help" type="button" aria-label="Ajuda">' + ICON.help + '</button>';
  }
  function starsHtml(n, animate) { let h = ''; for (let i = 1; i <= 3; i++) h += '<span class="star ' + (i <= n ? 'on' : 'off') + (animate ? ' pop' : '') + '" style="--d:' + (i * 0.18) + 's">' + ICON.star + '</span>'; return '<div class="stars" aria-label="' + n + ' de 3 estrelas">' + h + '</div>'; }
  function renderFeedback() {
    const el = $('#fb'); if (!el) return; const f = S.fb; if (!f || f.qid !== cur().id) { el.innerHTML = ''; return; }
    const ex = (f.extra || []).map(x => '<p class="ex">' + esc(x) + '</p>').join('');
    if (f.kind === 'ok') { el.innerHTML = '<div class="fb ok"><div class="fbhead">' + (f.stars ? starsHtml(f.stars, !f.quiet) : '') + '<div><p class="fbt">' + esc(f.title) + '</p>' + (f.xp ? '<p class="xpgain">+' + f.xp + ' XP</p>' : '') + '</div></div><p>' + esc(f.body) + '</p>' + ex + '</div>'; return; }
    el.innerHTML = '<div class="fb ' + f.kind + '"><p class="fbt">' + esc(f.title) + '</p><p>' + esc(f.body) + '</p>' + ex + (f.actions || '') + '</div>';
  }

  /* ---------- conferir ---------- */
  const normTxt = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function warn(q, title, body) { S.fb = { qid: q.id, kind: 'warn', title, body }; renderFeedback(); }
  function flash(sel) { const e = $(sel); if (e) { e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); e.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } }
  function submit() {
    const q = cur(), p = S.prog[q.id], sess = S.sess, rev = sess.kind === 'rev';
    if (closedNow(q)) return;
    const input = $('#ans'); const raw = input ? input.value : '';
    let ok = false, ansTxt = '', val = null, kind = null, diag = null, msg = '', whyOpt = '';
    if (q.type === 'num') {
      const r = parseAns(raw);
      if (r.err) return warn(q, r.err === 'empty' ? 'Escreva sua resposta' : 'Digite só o número', 'Use vírgula para os decimais, por exemplo 12,75.');
      ansTxt = r.txt.slice(0, 40); val = r.val;
    } else if (q.type === 'mc') {
      if (S.pick == null) return warn(q, 'Escolha uma alternativa', 'Toque na resposta que você acha certa.');
      ansTxt = q.opts[S.pick].t.slice(0, 60);
    } else if (q.type === 'txt') {
      if (!raw.trim()) return warn(q, 'Escreva sua resposta', 'Digite a resposta antes de conferir.');
      ansTxt = raw.trim().slice(0, 120);
    } else if (q.type === 'self') {
      if (raw.trim().length < 8) return warn(q, 'Escreva um pouco mais', 'Explique com suas palavras. Pode ser curto, mas conte o que você pensou.');
      ansTxt = raw.trim().slice(0, 900);
    }
    if (S.cfg.confReq && !S.conf && q.type !== 'self') { warn(q, 'Falta um passo', 'Antes de conferir, escolha como você se sente com essa resposta: tenho certeza, estou em dúvida ou chutei.'); flash('#confp'); return; }
    const ms = Math.round(elapsed()), conf = S.conf, n = (rev ? 0 : p.tries) + 1, rankBefore = rankOf(S.xp);
    S.drafts[q.id] = raw;
    if (q.type === 'num') { ok = same(val, q.val); if (!ok) { diag = q.hint ? { kind: 'conceito', msg: q.hint } : diagnose(q, val); kind = diag.kind; } }
    else if (q.type === 'mc') { ok = !!q.opts[S.pick].ok; if (!ok) { kind = 'escolha'; whyOpt = q.opts[S.pick].why; } }
    else if (q.type === 'txt') {
      const a = normTxt(raw); ok = (q.acc || []).some(x => normTxt(x) === a) || ((q.must || []).length > 0 && q.must.every(w => a.indexOf(normTxt(w)) > -1)); if (!ok) kind = 'texto';
    } else ok = true;
    const ev = mkEv('try', q, { ans: ansTxt, val, ok, kind: ok ? (q.type === 'self' ? 'autoavaliacao' : 'ok') : kind, conf: conf || null, ms }); if (rev) ev.rev = true;
    if (q.type === 'self') ev.note = ansTxt;
    S.conf = null; resetTimer(); logEv(ev);
    if (ok) {
      const ex = [];
      if (conf === 'chutei') ex.push('Você marcou que chutou. Que tal explicar para o responsável como chegou nesse resultado?');
      if (conf === 'duvida') ex.push('Você estava em dúvida e acertou. Isso mostra que está no caminho.');
      const praise = q.type === 'self' ? 'Resposta enviada!' : n === 1 ? ['Mandou bem!', 'Na mosca!', 'Perfeito!', 'Isso aí!'][Math.floor(Math.random() * 4)] : n === 2 ? 'Boa! Você não desistiu.' : 'Conseguiu! Persistência vale ouro.';
      const pr = S.prog[q.id]; if (rev) S.revDone[q.id] = true;
      S.fb = { qid: q.id, kind: 'ok', title: rev ? 'Certo!' : praise, body: q.type === 'self' ? 'Compare com a resposta esperada: ' + (q.sol || '') : solText(q), extra: ex, stars: rev ? 0 : pr.stars, xp: rev ? 0 : pr.xp };
      delete S.drafts[q.id]; renderQuestion(); if (!rev) celebrate(q, n, rankBefore); else if (!reduced()) confetti(30);
      const need = sess.kind === 'dia' && q.photo && S.cfg.photoReq && !S.prog[q.id].photo && !S.prog[q.id].photoSkip;
      if (need) setTimeout(() => { if (S.view === 'q' && cur().id === q.id && $('#sheet').hidden) openPhoto(); }, 900);
      return;
    }
    const near = diag && (diag.kind === 'um_algarismo' || diag.kind === 'perto' || diag.kind === 'varios');
    const extra = [];
    if (q.type === 'num') { if (n >= 2) { const pr = proofText(q, val); if (pr) extra.push(pr); } }
    if (n >= 3 && q.type === 'num') extra.push('Revise o passo a passo antes de tentar de novo.');
    if (conf === 'certeza') extra.push('Você marcou que tinha certeza. Às vezes um passo parece certo e escapa um detalhe: refaça devagar.');
    let actions = '';
    if (n >= 2 && q.type === 'num' && !rev && !S.prog[q.id].photo) actions += '<button class="gbtn sm blue" data-act="photo" type="button">' + ICON.cam + 'Mostrar como fiz</button> ';
    if (n >= 3) actions += '<button class="gbtn sm blue" data-tool="explain" type="button">Rever a explicação</button> ';
    if (n >= 4 && !rev) { extra.push('Esta questão está difícil. Peça ajuda e siga em frente: o responsável vai ver e explicar depois.'); actions += '<button class="gbtn sm grey" data-act="helpskip" type="button">Pedir ajuda e seguir</button>'; }
    let title = near ? 'Quase! Está perto' : 'Ainda não é essa', body;
    if (q.type === 'mc') { body = whyOpt || 'Essa alternativa não é a certa. Releia a pergunta e tente outra.'; title = 'Não foi essa'; }
    else if (q.type === 'txt') { body = (q.hint || 'Releia o material e tente de novo.') + (n >= 3 && q.sol ? ' Dica forte: ' + q.sol : ''); }
    else body = diag.msg + ' Refaça a conta no caderno e tente de novo.';
    S.fb = { qid: q.id, kind: 'err', title, body, extra, actions: actions ? '<div class="fbact">' + actions + '</div>' : '' };
    S.pick = null; renderQuestion();
    const card = $('#qcard'); if (card && !reduced()) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 500); }
    const i = $('#ans'); if (i && q.type !== 'mc') { i.focus(); i.select && i.select(); }
  }

  /* ---------- comemorações ---------- */
  let fxRun = 0;
  function confetti(n) {
    if (reduced()) return; const c = $('#fx'); if (!c) return; const dpr = Math.min(window.devicePixelRatio || 1, 2); c.width = innerWidth * dpr; c.height = innerHeight * dpr; const g = c.getContext('2d');
    const cols = ['#ffd23f', '#3ddc84', '#4cc9f0', '#ff4d6d', '#ffffff', '#ff9f1c'], P = [];
    for (let i = 0; i < n; i++) P.push({ x: innerWidth / 2 + (Math.random() - .5) * 160, y: innerHeight * .45, vx: (Math.random() - .5) * 15, vy: -Math.random() * 15 - 4, w: 6 + Math.random() * 7, h: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length] });
    const run = ++fxRun, t0 = performance.now();
    (function frame(t) { if (run !== fxRun) return; const k = t - t0; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
      P.forEach(p => { p.vy += .42; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.max(0, 1 - k / 2200); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore(); });
      if (k < 2200) requestAnimationFrame(frame); else g.clearRect(0, 0, innerWidth, innerHeight); })(t0);
  }
  function toast(msg, kind) { const t = $('#toast'); t.className = 'toast show ' + (kind || ''); t.textContent = msg; clearTimeout(toast.h); toast.h = setTimeout(() => { t.className = 'toast'; }, 3200); }
  function celebrate(q, n, rankBefore) {
    const card = $('#qcard'); if (card && !reduced()) { card.classList.add('win'); setTimeout(() => card.classList.remove('win'), 900); }
    const rankAfter = rankOf(S.xp); let big = false, msg = '', kind = '';
    if (rankAfter > rankBefore) { msg = 'Novo título: ' + RANKS[rankAfter][1] + '!'; big = true; kind = 'gold'; }
    else if (S.streak >= 3 && n === 1) msg = S.streak + ' acertos seguidos!';
    confetti(big ? 190 : (n === 1 ? 90 : 55)); if (msg) toast(msg, kind);
  }

  /* ---------- navegação ---------- */
  function go(i) { S.sess.i = Math.max(0, Math.min(S.sess.qids.length - 1, i)); S.fb = null; S.conf = null; S.pick = null; S.hint = false; resetTimer(); closeSheet(); renderQuestion(); window.scrollTo(0, 0); }
  function next() {
    const s = S.sess; if (s.i < s.qids.length - 1) { go(s.i + 1); return; } finishSession();
  }
  function finishSession() {
    const s = S.sess;
    if (s.kind === 'dia') {
      const di = dayInfo(byDay, S.subject, s.day, S.prog, S.cfg);
      if (!di.allClosed) { const i = s.qids.findIndex(id => !isClosed(byId[id], S.prog[id], S.cfg)); toast('Ainda falta resolver ' + (di.total - di.closed) + ' questão(ões) do dia.'); go(i < 0 ? 0 : i); return; }
      if (!di.timeOk) { dayOverlay('tempo', di); return; }
      dayOverlay('fim', di); return;
    }
    if (s.kind === 'rev' && s.forTime) {
      const di = dayInfo(byDay, S.subject, s.day, S.prog, S.cfg);
      if (di.done) { dayOverlay('fim', di); return; }
      dayOverlay('tempo', di); return;
    }
    renderHome(); toast(s.kind === 'rev' ? 'Revisão concluída!' : 'Boa sessão!');
  }
  function dayOverlay(kind, di) {
    const el = $('#lvup'); el.hidden = false; el.dataset.k = kind; const d = planOf().find(x => x.day === S.sess.day) || {};
    if (kind === 'tempo') {
      const falta = Math.max(1, Math.ceil((di.needMs - di.ms) / 60000));
      el.innerHTML = '<div class="lvupbox"><div class="trophy">' + ICON.bolt + '</div><h2>Quase lá!</h2><p>Você resolveu tudo, mas o treino de hoje pede um pouco mais de prática. Faltam cerca de <b>' + falta + ' min</b>. Vamos refazer algumas questões, começando pelas que deram mais trabalho.</p><button class="gbtn go big" data-act="revtime" type="button">Refazer e revisar</button></div>';
      return;
    }
    const xp = di.qs.reduce((t, q) => t + S.prog[q.id].xp, 0), stars = di.qs.reduce((t, q) => t + S.prog[q.id].stars, 0), max = di.qs.length * 3;
    el.innerHTML = '<div class="lvupbox"><div class="trophy">' + ICON.star + '</div><h2>Treino de hoje concluído!</h2><p>' + esc(d.title || '') + '</p><div class="sum"><div><b>' + di.first + '</b><span>acertos de primeira</span></div><div><b>' + stars + '/' + max + '</b><span>estrelas</span></div><div><b>' + Math.max(1, Math.round(di.ms / 60000)) + ' min</b><span>de treino</span></div></div><p class="small">Você ganhou ' + xp + ' XP. Amanhã tem mais.</p><button class="gbtn go big" data-act="closeup" type="button">Voltar ao início</button></div>';
    confetti(190);
  }

  /* ---------- folhas (ajuda, mapa, foto, explicação) ---------- */
  function openSheet(html, cls) { const s = $('#sheet'); s.className = cls || ''; s.innerHTML = '<div class="shbg" data-act="closesheet"></div><div class="shbox">' + html + '</div>'; s.hidden = false; document.body.classList.add('lock'); }
  function closeSheet() { const s = $('#sheet'); s.hidden = true; s.innerHTML = ''; document.body.classList.remove('lock'); }
  function openHelp() {
    const q = cur(), f = S.flags[q.id] || {}, p = S.prog[q.id];
    openSheet('<h2>Precisa de ajuda?</h2><div class="hlist"><button class="hopt" data-tool="doubt" aria-pressed="' + !!f.doubt + '">' + ICON.doubt + '<span>' + (f.doubt ? 'Dúvida marcada' : 'Marcar dúvida') + '</span></button>' +
      '<button class="hopt" data-tool="help" aria-pressed="' + !!f.help + '">' + ICON.guess + '<span>' + (f.help ? 'Pedi ajuda ao responsável' : 'Chamar o responsável') + '</span></button>' +
      (f.help ? '<label class="note" for="note">Escreva o que você não entendeu (opcional)<textarea id="note" rows="2" maxlength="300">' + esc(f.note || '') + '</textarea></label>' : '') +
      '<button class="hopt" data-tool="hint">' + ICON.bulb + '<span>Dica para começar</span></button>' +
      '<button class="hopt" data-tool="explain">' + ICON.list + '<span>Rever a explicação</span></button>' +
      (q.kind === 'p' ? '<button class="hopt" data-tool="roteiro">' + ICON.check + '<span>Roteiro para resolver problemas</span></button>' : '') +
      (p.tries >= 3 && !closedNow(q) && S.sess.kind !== 'rev' ? '<button class="hopt" data-act="helpskip">' + ICON.x + '<span>Pedir ajuda e seguir</span></button>' : '') + '</div>' +
      (S.hint ? '<div class="hintbox"><b>Por onde começar</b><ol>' + (CHAPS[(q.kind === 'p' ? 4 : q.ch - 1)] || CHAPS[0]).steps.map(s => '<li>' + s + '</li>').join('') + '</ol></div>' : '') +
      '<button class="gbtn sm ghost" data-act="closesheet" type="button">Fechar</button>');
  }
  function openMap() {
    const s = S.sess; if (!s) return; const p = S.prog;
    const dot = (id, i) => { const q = byId[id], cl = s.kind === 'rev' ? !!S.revDone[id] : s.kind === 'dia' ? isClosed(q, p[id], S.cfg) : p[id].solved; const st = cl ? 'ok' : p[id].tries ? 'err' : 'todo';
      return '<button class="dot ' + st + (i === s.i ? ' cur' : '') + '" data-goi="' + i + '"><span>' + (cl ? ICON.check : i + 1) + '</span></button>'; };
    let h = '<h2>Questões de hoje</h2>';
    if (s.kind === 'dia') { const d = planOf().find(x => x.day === s.day); let k = 0; d.blocks.forEach(b => { h += '<h3>' + esc(b.name) + '</h3><div class="dots">' + b.qids.map(id => dot(id, k++)).join('') + '</div>'; }); }
    else h += '<div class="dots">' + s.qids.map((id, i) => dot(id, i)).join('') + '</div>';
    openSheet(h + '<button class="gbtn sm ghost" data-act="closesheet" type="button">Fechar</button>');
  }
  function openDrawer(idx) {
    const q = cur(), c = CHAPS[idx != null ? idx : q.ch - 1] || CHAPS[0];
    openSheet('<div class="drh"><h2>' + (c.num <= 4 ? 'Cap. ' + c.num + ' · ' : '') + esc(c.title) + '</h2></div><p class="small">' + esc(c.book || '') + '</p><h3>Passo a passo</h3><ol class="steps">' + c.steps.map(s => '<li>' + s + '</li>').join('') + '</ol><p class="why">' + c.why + '</p>' +
      (c.examples || []).map(e => '<div class="exm"><p><b>' + esc(e.t) + '</b></p><pre>' + esc(e.lines.join('\n')) + '</pre><p class="small">' + esc(e.note) + '</p></div>').join('') + '<h3>Cuidado com estes erros</h3><ul class="steps">' + c.errors.map(s => '<li>' + s + '</li>').join('') + '</ul><button class="gbtn sm ghost" data-act="closesheet" type="button">Fechar</button>', 'full');
    logEv(mkEv('hint', cur(), { kind: 'explicacao' }));
  }

  /* ---------- foto do caderno ---------- */
  function openPhoto() {
    const q = cur();
    S.pendingPhoto = null; S.photoSeq = (S.photoSeq || 0) + 1;
    openSheet('<h2>Mostre como você fez</h2><p>Tire uma foto da conta no caderno. Pegue a conta inteira, com a letra bem legível e boa luz.</p><div id="phprev" class="phprev" hidden></div>' +
      '<div class="phbtns"><button class="gbtn go big" data-act="cam" type="button" id="phcam">' + ICON.cam + 'Abrir a câmera</button><button class="gbtn go big" data-act="phsend" type="button" id="phsend" hidden>Enviar foto</button>' +
      '<button class="gbtn sm ghost" data-act="nofoto" type="button">' + (S.sess.kind === 'dia' && q.photo ? 'Não consegui agora' : 'Fechar') + '</button></div>');
  }
  async function shrink(file) {
    let bmp; try { bmp = await createImageBitmap(file); } catch (e) { bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }); }
    const w = bmp.width, h = bmp.height, sc = Math.min(1, 1280 / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(h * sc);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(r, 'image/jpeg', 0.72));
  }
  async function onCam(file) {
    if (!file) return; let blob = null;
    try { blob = await shrink(file); } catch (e) { window.__photoErr = String(e); }
    if (!blob) { toast('Não consegui ler a foto. Tente de novo.'); return; }
    S.pendingPhoto = blob; const pv = $('#phprev'); if (pv) { pv.hidden = false; pv.innerHTML = '<img alt="Prévia da foto" src="' + URL.createObjectURL(blob) + '">'; }
    const s = $('#phsend'); if (s) s.hidden = false; const c = $('#phcam'); if (c) c.innerHTML = ICON.cam + 'Tirar outra';
  }
  async function sendPhoto() {
    const q = cur(); if (!S.pendingPhoto) return; const ev = mkEv('foto', q, { path: null });
    await IDB.put({ cid: ev.cid, qid: q.id, ts: ev.ts, blob: S.pendingPhoto }); S.pendingPhoto = null;
    S.attempts.push(ev); recompute(); saveLocal(); closeSheet(); toast('Foto guardada! +' + PHOTO_XP + ' XP', 'gold'); if (!reduced()) confetti(40);
    updateHud(); renderQuestion(); sync();
  }

  /* ---------- marcações ---------- */
  function setFlag(qid, patch) {
    const c = S.flags[qid] || { qid, doubt: false, help: false, note: '' };
    S.flags[qid] = Object.assign({}, c, patch, { qid, ts: Date.now() }); S.dirtyFlags[qid] = 1; saveLocal(); sync();
  }

  /* ---------- login ---------- */
  function renderLogin(msg) {
    setView('login'); $('#view').innerHTML = '<section class="login"><div class="trophy">' + ICON.star + '</div><h1>Treino do <b>Dia</b></h1><p>Entre com a conta do aluno para começar.</p><form id="loginform"><label class="sr" for="em">E-mail</label><input id="em" type="email" autocomplete="username" placeholder="E-mail" required><label class="sr" for="pw">Senha</label><input id="pw" type="password" autocomplete="current-password" placeholder="Senha" required>' +
      '<p class="loginerr" id="lerr"' + (msg ? '' : ' hidden') + '>' + esc(msg || '') + '</p><button class="gbtn go big" type="submit">Entrar</button></form></section>';
  }

  /* ---------- eventos da interface ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button, [data-day], [data-goi]'); if (!t) return;
    if (t.dataset.subj) { S.subject = t.dataset.subj; LS.set('dec2.subj', S.subject); renderHome(); return; }
    if (t.dataset.day) { const dn = +t.dataset.day, di = dayInfo(byDay, S.subject, dn, S.prog, S.cfg); if (di.done) startRevDay(dn); else toast('Esse dia ainda não chegou ou ainda não foi concluído.'); return; }
    if (t.dataset.livre) { const [c, l] = t.dataset.livre.split(':').map(Number); startLivre(c, l); return; }
    if (t.dataset.goi !== undefined) { closeSheet(); go(+t.dataset.goi); return; }
    if (t.dataset.pick !== undefined) { S.pick = +t.dataset.pick; document.querySelectorAll('.opt').forEach((b, i) => { b.classList.toggle('on', i === S.pick); b.setAttribute('aria-checked', i === S.pick); }); return; }
    if (t.dataset.conf) { S.conf = S.conf === t.dataset.conf ? null : t.dataset.conf; document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.conf === S.conf)); const ck = $('#check'); if (ck) ck.classList.toggle('wait', S.cfg.confReq && !S.conf);
      if (S.conf && S.fb && S.fb.title === 'Falta um passo') { S.fb = null; renderFeedback(); } return; }
    const a = t.dataset.act;
    if (a === 'startday') return startDay();
    if (a === 'livre') return renderLivre();
    if (a === 'home') { closeSheet(); $('#lvup').hidden = true; S.sess = null; renderHome(); return; }
    if (a === 'check') return submit();
    if (a === 'next') return next();
    if (a === 'prev') return go(S.sess.i - 1);
    if (a === 'help') return openHelp();
    if (a === 'map') return openMap();
    if (a === 'closesheet') return closeSheet();
    if (a === 'closeup') { $('#lvup').hidden = true; S.sess = null; renderHome(); return; }
    if (a === 'revtime') { $('#lvup').hidden = true; startReviewTime(S.sess.day); return; }
    if (a === 'photo') return openPhoto();
    if (a === 'cam') { $('#cam').value = ''; $('#cam').click(); return; }
    if (a === 'phsend') return sendPhoto();
    if (a === 'nofoto') { const q = cur(); if (S.sess.kind === 'dia' && q.photo && S.prog[q.id].solved && !S.prog[q.id].photo) { logEv(mkEv('foto_skip', q)); toast('Tudo bem. O responsável vai ser avisado.'); } closeSheet(); renderQuestion(); return; }
    if (a === 'helpskip') { const q = cur(); closeSheet(); setFlag(q.id, { help: true }); logEv(mkEv('help', q)); S.fb = null; toast('Pedido de ajuda enviado. Siga em frente!'); renderQuestion(); next(); return; }
    if (a === 'logout') { Cloud.logout().then(() => renderLogin()); return; }
    if (t.dataset.tool === 'doubt') { const f = S.flags[cur().id] || {}; setFlag(cur().id, { doubt: !f.doubt }); openHelp(); return; }
    if (t.dataset.tool === 'help') { const f = S.flags[cur().id] || {}; setFlag(cur().id, { help: !f.help }); openHelp(); return; }
    if (t.dataset.tool === 'hint') { S.hint = !S.hint; if (S.hint) logEv(mkEv('hint', cur(), { kind: 'dica' })); openHelp(); return; }
    if (t.dataset.tool === 'explain') { openDrawer(); return; }
    if (t.dataset.tool === 'roteiro') { openDrawer(4); return; }
  });
  document.addEventListener('submit', async e => {
    if (e.target.id === 'ansform') { e.preventDefault(); const q = S.sess && cur(); if (q && !closedNow(q)) submit(); }
    if (e.target.id === 'loginform') {
      e.preventDefault(); const r = await Cloud.login($('#em').value, $('#pw').value);
      if (r.error) { const m = $('#lerr'); m.hidden = false; m.textContent = /invalid/i.test(r.error) ? 'E-mail ou senha incorretos.' : 'Não consegui entrar: ' + r.error; return; }
      boot2();
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'ans') S.drafts[cur().id] = e.target.value;
    if (e.target.id === 'note') { clearTimeout(S.nt); const v = e.target.value, id = cur().id; S.nt = setTimeout(() => setFlag(id, { note: v }), 700); }
  });
  $('#cam').addEventListener('change', e => onCam(e.target.files && e.target.files[0]));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  /* ---------- início ---------- */
  async function boot2() {
    const u = Cloud.user();
    if (u && Cloud.role() === 'parent') { setView('login'); $('#view').innerHTML = '<section class="login"><h1>Conta do responsável</h1><p>Esta conta é para acompanhar o aluno. Abra o painel.</p><a class="gbtn go big" href="painel.html">Abrir o painel</a><button class="gbtn sm ghost" data-act="logout" type="button">Sair</button></section>'; return; }
    renderHome(); sync();
    const saved = JSONget('dec2.sess', null);
  }
  async function boot() {
    loadLocal(); recompute();
    try { await Cloud.init(); } catch (e) { }
    if (Cloud.enabled && !Cloud.user()) { renderLogin(); return; }
    boot2();
  }
  window.__app = { S, startSession, renderHome, byId, sync };
  boot();
})();
