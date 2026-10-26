/* ===== Painel do responsável ===== */
(function () {
  const $ = s => document.querySelector(s), root = $('#root');
  const { QUESTIONS, byId, byDay, plans } = buildIndex(PACKS);
  const subj = 'mat', plan = plans[subj] || [];
  let D = { events: [], flags: [], cfg: Object.assign({}, DEFAULT_CFG), urls: {} };
  const fdt = ts => { const d = new Date(ts); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
  const mins = ms => Math.round(ms / 60000);
  const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; };

  function login(msg) {
    root.innerHTML = '<div class="card" style="max-width:380px;margin:40px auto"><h1>Painel do responsável</h1><p class="mut">Entre com a conta do responsável.</p><form id="lf" class="row" style="flex-direction:column;align-items:stretch"><input id="em" type="email" placeholder="E-mail" autocomplete="username" required><input id="pw" type="password" placeholder="Senha" autocomplete="current-password" required><button>Entrar</button><p class="bad" id="er">' + esc(msg || '') + '</p></form></div>';
    $('#lf').onsubmit = async e => { e.preventDefault(); const r = await Cloud.login($('#em').value, $('#pw').value); if (r.error) return login('E-mail ou senha incorretos.'); start(); };
  }
  async function load() {
    const [ev, fl, cf] = await Promise.all([Cloud.fetchEvents(), Cloud.fetchFlags(), Cloud.fetchConfig()]);
    if (!ev) throw new Error('Não consegui ler os dados. Confira se o SQL de configuração foi executado e se esta conta tem o papel de responsável.');
    D.events = ev; D.flags = fl || []; if (cf && cf.settings) D.cfg = Object.assign({}, DEFAULT_CFG, cf.settings);
    const paths = ev.filter(e => e.type === 'foto' && e.path).sort((a, b) => b.ts - a.ts).slice(0, 36).map(e => e.path);
    D.urls = await Cloud.signedUrls(paths);
  }
  async function start() {
    if (!Cloud.user()) return login();
    if (Cloud.role() !== 'parent') { root.innerHTML = '<div class="card"><h1>Sem permissão</h1><p>Esta conta não é de responsável. <button id="lo">Sair</button></p></div>'; $('#lo').onclick = () => Cloud.logout().then(() => login()); return; }
    root.innerHTML = '<p>Carregando…</p>';
    try { await load(); } catch (e) { root.innerHTML = '<div class="card"><p class="bad">' + esc(e.message) + '</p></div>'; return; }
    render();
  }

  function render() {
    const tries = D.events.filter(e => e.type === 'try' && !e.rev);
    const { P, xp, stars, streak } = computeProg(QUESTIONS, byId, D.events);
    const st = planState(byDay, subj, plan, P, D.cfg), cur = st.cur, di = cur >= 0 ? st.days[cur] : null, d = cur >= 0 ? plan[cur] : null;
    const last = D.events.reduce((m, e) => Math.max(m, e.ts), 0);
    const doneDays = st.days.filter(x => x.done).length;
    let h = '<div class="row"><h1>Painel do responsável</h1><span class="sp"></span><button class="ghost" id="rf">Atualizar</button><button class="ghost" id="lo">Sair</button></div>';
    /* hoje */
    h += '<section class="card"><h2>Hoje</h2><div class="kpis">' +
      kpi(last ? fdt(last) : 'nunca', 'última atividade') + kpi(doneDays + ' / ' + plan.length, 'dias concluídos') +
      kpi(d ? 'Dia ' + d.day : 'fim', d ? esc(d.title) : 'plano concluído') + kpi(di ? di.closed + ' / ' + di.total : '–', 'questões fechadas hoje') +
      kpi(di ? mins(di.ms) + ' min' : '–', 'tempo ativo no dia (mín. ' + D.cfg.minMin + ')') + kpi(xp + ' XP', stars + ' estrelas · sequência ' + streak) + '</div>';
    if (st.status === 'descanso') h += '<p class="small mut">O dia de hoje já foi concluído; o próximo abre amanhã. <button class="ghost" id="lib">Liberar o próximo dia hoje</button></p>';
    if (di && di.photoMiss) h += '<p class="small warn">Faltam ' + di.photoMiss + ' foto(s) do caderno neste dia.</p>';
    h += '</section>';
    /* esforço */
    const recent = tries.filter(e => e.ts > Date.now() - 7 * 864e5);
    const R = recent.length ? recent : tries;
    const fastWrong = R.filter(e => !e.ok && (e.ms || 0) < 5000).length, guess = R.filter(e => e.conf === 'chutei').length, sureWrong = R.filter(e => !e.ok && e.conf === 'certeza').length;
    const okc = R.filter(e => e.ok).length, ms = R.map(e => e.ms || 0).sort((a, b) => a - b), med = ms.length ? ms[Math.floor(ms.length / 2)] : 0;
    h += '<section class="card"><h2>Sinais de esforço ' + (recent.length ? '(últimos 7 dias)' : '') + '</h2><div class="kpis">' + kpi(R.length, 'respostas enviadas') + kpi(pct(okc, R.length) + '%', 'acertos') + kpi(Math.round(med / 1000) + ' s', 'tempo mediano por resposta') +
      kpi(fastWrong, 'erros em menos de 5 s') + kpi(guess, 'marcadas como chute') + kpi(sureWrong, 'erros com “certeza”') + kpi(D.events.filter(e => e.type === 'foto').length, 'fotos do caderno') + '</div>' +
      '<p class="small mut">Erros muito rápidos e muitos chutes sugerem que ele respondeu sem fazer a conta no caderno. As fotos mostram se fez. “Erros com certeza” indicam um conceito mal entendido, não descuido.</p></section>';
    /* atenção */
    const att = QUESTIONS.map(q => ({ q, p: P[q.id], f: D.flags.find(x => x.qid === q.id) })).filter(x => x.p.tries >= 3 || x.p.helped || (x.f && (x.f.help || x.f.doubt)) || x.p.wrongSure >= 2)
      .sort((a, b) => (b.p.helped - a.p.helped) + (b.p.tries - a.p.tries) / 10).slice(0, 15);
    h += '<section class="card"><h2>Onde dar atenção</h2>';
    if (!att.length) h += '<p class="mut">Nada em destaque por enquanto.</p>';
    else h += '<div class="wrap"><table><tr><th>Questão</th><th>Situação</th><th>Respostas erradas</th><th>Tipos de erro</th></tr>' + att.map(({ q, p, f }) =>
      '<tr><td><b>' + esc(q.id) + '</b><br>' + esc(trunc(q.text, 90)) + '</td><td>' + (p.helped ? '<span class="tag bad">pediu ajuda</span> ' : '') + (f && f.doubt ? '<span class="tag warn">dúvida</span> ' : '') + (p.solved ? '<span class="tag ok">resolveu</span> ' : '') + p.tries + ' tentativa(s)' + (f && f.note ? '<br><i>“' + esc(f.note) + '”</i>' : '') + '</td><td>' + esc(p.answers.slice(0, 5).join(' · ')) + '</td><td>' + esc([...new Set(p.kinds)].map(k => KIND_LABEL[k] || k).join(', ')) + '</td></tr>').join('') + '</table></div>';
    h += '</section>';
    /* erros por tipo */
    const byK = {};
    tries.filter(e => !e.ok && e.kind).forEach(e => { const k = e.ch + ':' + e.kind; byK[k] = (byK[k] || 0) + 1; });
    const ks = Object.entries(byK).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const CH = { 1: 'Soma/subtração', 2: 'Valor desconhecido', 3: 'Multiplicação', 4: 'Divisão' };
    h += '<section class="card"><h2>Tipos de erro mais comuns</h2>' + (ks.length ? '<div class="wrap"><table><tr><th>Assunto</th><th>Erro</th><th>Vezes</th><th>O que reforçar</th></tr>' + ks.map(([k, n]) => { const [c, kind] = k.split(':'); return '<tr><td>' + (CH[c] || c) + '</td><td>' + esc(KIND_LABEL[kind] || kind) + '</td><td>' + n + '</td><td>' + esc((KIND_TIP[c] || {})[kind] || '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="mut">Ainda sem erros registrados.</p>') + '</section>';
    /* histórico */
    const days = {};
    D.events.filter(e => e.type === 'try').forEach(e => { const k = ymd(e.ts), o = days[k] = days[k] || { ms: 0, n: 0, ok: 0, first: 0, photos: 0, qs: new Set(), dn: new Set() }; o.ms += Math.min(e.ms || 0, MAXMS); if (!e.rev) { o.n++; if (e.ok) o.ok++; } if (e.day) o.dn.add(e.day); });
    D.events.filter(e => e.type === 'foto').forEach(e => { const k = ymd(e.ts); (days[k] = days[k] || { ms: 0, n: 0, ok: 0, photos: 0, dn: new Set() }).photos++; });
    const dk = Object.keys(days).sort().reverse().slice(0, 21);
    h += '<section class="card"><h2>Histórico</h2>' + (dk.length ? '<div class="wrap"><table><tr><th>Data</th><th>Dia do plano</th><th>Tempo</th><th>Respostas</th><th>Acertos</th><th>Fotos</th></tr>' + dk.map(k => { const o = days[k]; return '<tr><td>' + k.split('-').reverse().join('/') + '</td><td>' + ([...o.dn].join(', ') || '–') + '</td><td>' + mins(o.ms) + ' min</td><td>' + o.n + '</td><td>' + pct(o.ok, o.n) + '%</td><td>' + (o.photos || 0) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="mut">Sem atividade ainda.</p>') + '</section>';
    /* fotos */
    const fotos = D.events.filter(e => e.type === 'foto' && e.path).sort((a, b) => b.ts - a.ts).slice(0, 36);
    h += '<section class="card"><h2>Caderno (fotos)</h2>' + (fotos.length ? '<div class="gal">' + fotos.map(e => { const q = byId[e.qid] || {}, p = P[e.qid]; return '<figure>' + (D.urls[e.path] ? '<img loading="lazy" src="' + D.urls[e.path] + '" data-z="' + D.urls[e.path] + '" alt="Foto do caderno">' : '<p class="mut">foto indisponível</p>') +
      '<figcaption><b>' + esc(q.id || e.qid) + '</b> · ' + fdt(e.ts) + '<br>' + esc(trunc(q.text, 80)) + (p ? '<br>' + (p.solved ? '<span class="ok">resolveu</span>' : '<span class="bad">não resolveu</span>') + ' · ' + p.tries + ' tent.' : '') + '</figcaption></figure>'; }).join('') + '</div>' : '<p class="mut">Nenhuma foto enviada ainda.</p>') + '</section>';
    /* configurações */
    h += '<section class="card"><h2>Configurações</h2><div class="row" style="flex-direction:column;align-items:flex-start;gap:12px">' +
      '<label class="chk"><input type="checkbox" id="c1"' + (D.cfg.confReq ? ' checked' : '') + '> Exigir que ele marque como se sente (certeza / dúvida / chutei) antes de conferir</label>' +
      '<label class="chk"><input type="checkbox" id="c2"' + (D.cfg.photoReq ? ' checked' : '') + '> Exigir foto do caderno nas questões marcadas</label>' +
      '<label class="chk">Tempo mínimo de treino por dia: <input type="number" id="c3" min="0" max="60" value="' + D.cfg.minMin + '" style="width:80px"> min</label>' +
      '<div class="row"><button id="sv">Salvar</button><span id="sm" class="small ok"></span></div></div>' +
      '<h3>Corrigir / testar</h3><div class="row"><input id="zq" placeholder="id da questão, ex.: d03-t4"><button class="ghost" id="zb">Zerar esta questão</button><button class="red" id="za">Zerar TODOS os resultados</button></div><p class="small mut" id="zm"></p></section>';
    root.innerHTML = h;
    $('#rf').onclick = start; $('#lo').onclick = () => Cloud.logout().then(() => login());
    $('#sv').onclick = async () => { const v = { confReq: $('#c1').checked, photoReq: $('#c2').checked, minMin: Math.max(0, +$('#c3').value || 0), freeDay: D.cfg.freeDay || 0 }; const r = await Cloud.saveConfig('settings', v); if (!r.error) D.cfg = v; $('#sm').textContent = r.error ? 'Erro: ' + r.error : 'Salvo. O app do aluno atualiza na próxima sincronização.'; };
    const lib = $('#lib'); if (lib) lib.onclick = async () => { const v = Object.assign({}, D.cfg, { freeDay: d.day }); const r = await Cloud.saveConfig('settings', v); if (!r.error) { D.cfg = v; render(); } };
    $('#zb').onclick = async () => { const id = $('#zq').value.trim(); if (!byId[id]) { $('#zm').textContent = 'Id não encontrado.'; return; } const r = await Cloud.deleteQuestion(id); $('#zm').textContent = r.error ? r.error : 'Questão ' + id + ' zerada.'; if (!r.error) { await load(); render(); } };
    let armed = false; $('#za').onclick = async e => { if (!armed) { armed = true; e.target.textContent = 'Toque de novo para confirmar'; setTimeout(() => { armed = false; e.target.textContent = 'Zerar TODOS os resultados'; }, 4000); return; } const r = await Cloud.deleteAll(); $('#zm').textContent = r.error ? r.error : 'Tudo zerado.'; await load(); render(); };
    document.querySelectorAll('[data-z]').forEach(i => i.onclick = () => { const z = $('#zoom'); z.hidden = false; z.innerHTML = '<img src="' + i.dataset.z + '" alt="">'; z.onclick = () => { z.hidden = true; }; });
  }
  const kpi = (b, s) => '<div class="kpi"><b>' + b + '</b><span>' + s + '</span></div>';

  (async function () {
    if (!Cloud.enabled) { root.innerHTML = '<div class="card"><h1>Painel do responsável</h1><p>O Supabase ainda não foi configurado (arquivo <code>config.js</code>).</p></div>'; return; }
    await Cloud.init(); start();
  })();
})();
