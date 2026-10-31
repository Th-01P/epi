/* ===== Dados ===== */
var KEY = 'epi-control-bs-v1';
var TABS = [['dash','Painel'],['emp','Empréstimos'],['eq','Equipamentos'],['col','Colaboradores'],['usr','Usuários']];
var CATS = ['Cabeça','Visual e facial','Auditiva','Respiratória','Mãos','Pés','Corpo','Quedas'];
var tab = 'dash', q = '', db = load();

function seed() {
  var y = new Date().getFullYear();
  return { n: 20,
    eq: [
      {id:1, nome:'Capacete de segurança', cat:'Cabeça', ca:'31469', val:(y+2)+'-06-30', qtd:25},
      {id:2, nome:'Óculos de proteção incolor', cat:'Visual e facial', ca:'42157', val:(y+1)+'-03-15', qtd:40},
      {id:3, nome:'Protetor auricular tipo concha', cat:'Auditiva', ca:'14235', val:(y+3)+'-01-20', qtd:15},
      {id:4, nome:'Luva de vaqueta', cat:'Mãos', ca:'9817', val:(y-1)+'-11-10', qtd:30},
      {id:5, nome:'Cinto de segurança tipo paraquedista', cat:'Quedas', ca:'38410', val:(y+2)+'-09-01', qtd:10}],
    col: [
      {id:6, nome:'Carlos Eduardo Lima', mat:'1001', fun:'Pedreiro', set:'Obra A'},
      {id:7, nome:'Marta Souza', mat:'1002', fun:'Eletricista', set:'Obra A'},
      {id:8, nome:'João Pedro Alves', mat:'1003', fun:'Servente', set:'Obra B'}],
    usr: [
      {id:9, nome:'Administrador', login:'admin', perfil:'Administrador'},
      {id:10, nome:'Almoxarifado', login:'almox', perfil:'Almoxarife'}],
    emp: [] };
}
function load() { try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {} return seed(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

/* ===== Utilitários ===== */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function nid() { return ++db.n; }
function by(l, id) { return db[l].filter(function (x) { return x.id == id; })[0]; }
function hoje() { return new Date().toISOString().slice(0, 10); }
function fmt(d) { return d ? d.split('-').reverse().join('/') : '—'; }
function emUso(eqId) { return db.emp.filter(function (e) { return e.status === 'Em uso' && (eqId == null || e.eq == eqId); }).reduce(function (s, e) { return s + e.qtd; }, 0); }
function disp(eq) { return eq.qtd - emUso(eq.id); }
function caVencido(eq) { return eq.val < hoje(); }
function match(o) { return !q || JSON.stringify(o).toLowerCase().indexOf(q.toLowerCase()) > -1; }
function badge(cls, txt) { return '<span class="badge text-bg-' + cls + '">' + txt + '</span>'; }
function toast(m) {
  document.getElementById('toastMsg').textContent = m;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('toast'), { delay: 2200 }).show();
}

/* ===== Componentes ===== */
function drawNav() {
  document.getElementById('nav').innerHTML = TABS.map(function (t) {
    return '<li class="nav-item"><button class="nav-link' + (t[0] === tab ? ' active' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button></li>';
  }).join('');
  var me = document.getElementById('me'), cur = me.value;
  me.innerHTML = db.usr.map(function (u) { return '<option value="' + u.id + '">' + esc(u.nome) + '</option>'; }).join('');
  if (cur) me.value = cur;
}
function table(cols, rows, vazio) {
  if (!rows.length) return '<div class="card"><div class="card-body text-center text-secondary py-5">' + vazio + '</div></div>';
  return '<div class="card"><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="table-light"><tr>' +
    cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div></div>';
}
function head(titulo, btn) {
  return '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h2 class="h3 mb-0">' + titulo + '</h2><div class="d-flex gap-2">' +
    (tab !== 'dash' ? '<input type="search" id="q" class="form-control" style="width:200px" placeholder="Buscar" aria-label="Buscar" value="' + esc(q) + '">' : '') +
    (btn ? '<button class="btn btn-warning" data-new="' + tab + '">' + btn + '</button>' : '') + '</div></div>';
}
function acoes(l, id) {
  return '<td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-secondary" data-edit="' + l + ':' + id + '">Editar</button> ' +
    '<button class="btn btn-sm btn-outline-danger" data-del="' + l + ':' + id + '">Excluir</button></td>';
}
function stat(n, txt, alerta) {
  return '<div class="col-6 col-md"><div class="card stat-card' + (alerta ? ' alert-stat' : '') + ' h-100"><div class="card-body"><div class="num">' + n + '</div><div class="small text-secondary">' + txt + '</div></div></div></div>';
}

/* ===== Telas ===== */
function render() {
  drawNav();
  var m = document.getElementById('main'), h = '';

  if (tab === 'dash') {
    var abertos = db.emp.filter(function (e) { return e.status === 'Em uso'; });
    var venc = db.eq.filter(caVencido).length;
    var baixo = db.eq.filter(function (e) { return disp(e) <= 3 && !caVencido(e); }).length;
    h = head('Painel') + '<div class="row g-3 mb-4">' +
      stat(db.eq.length, 'Tipos de equipamento') + stat(db.col.length, 'Colaboradores') +
      stat(emUso(), 'Itens emprestados agora') + stat(venc, 'CA vencido', venc) + stat(baixo, 'Estoque baixo (3 ou menos)', baixo) + '</div>' +
      '<h3 class="h5">Empréstimos em aberto</h3>' +
      table(['Colaborador','Equipamento','Qtd','Retirada','Devolução prevista'], abertos.map(function (e) {
        var c = by('col', e.col), x = by('eq', e.eq), atr = e.prev && e.prev < hoje();
        return '<tr><td>' + esc(c && c.nome) + '</td><td>' + esc(x && x.nome) + '</td><td>' + e.qtd + '</td><td>' + fmt(e.data) + '</td><td>' + fmt(e.prev) + (atr ? ' ' + badge('danger', 'Atrasado') : '') + '</td></tr>';
      }), 'Nenhum empréstimo em aberto.');
  }

  if (tab === 'eq') {
    h = head('Equipamentos', 'Novo equipamento') +
      table(['Equipamento','Categoria','CA','Validade do CA','Total','Disponível',''], db.eq.filter(match).map(function (e) {
        var d = disp(e);
        return '<tr><td>' + esc(e.nome) + '</td><td>' + esc(e.cat) + '</td><td>' + esc(e.ca) + '</td><td>' + fmt(e.val) + (caVencido(e) ? ' ' + badge('danger', 'Vencido') : '') + '</td><td>' + e.qtd + '</td><td>' + badge(d <= 0 ? 'danger' : d <= 3 ? 'warning' : 'success', d) + '</td>' + acoes('eq', e.id) + '</tr>';
      }), 'Nenhum equipamento cadastrado. Use “Novo equipamento” para começar.');
  }

  if (tab === 'col') {
    h = head('Colaboradores', 'Novo colaborador') +
      table(['Nome','Matrícula','Função','Setor',''], db.col.filter(match).map(function (c) {
        return '<tr><td>' + esc(c.nome) + '</td><td>' + esc(c.mat) + '</td><td>' + esc(c.fun) + '</td><td>' + esc(c.set) + '</td>' + acoes('col', c.id) + '</tr>';
      }), 'Nenhum colaborador cadastrado.');
  }

  if (tab === 'usr') {
    h = head('Usuários do sistema', 'Novo usuário') +
      table(['Nome','Login','Perfil',''], db.usr.filter(match).map(function (u) {
        return '<tr><td>' + esc(u.nome) + '</td><td>' + esc(u.login) + '</td><td>' + esc(u.perfil) + '</td>' + acoes('usr', u.id) + '</tr>';
      }), 'Nenhum usuário cadastrado.');
  }

  if (tab === 'emp') {
    h = head('Empréstimos', 'Novo empréstimo') +
      table(['Colaborador','Equipamento','Qtd','Retirada','Prevista','Situação','Registrado por',''], db.emp.slice().reverse().filter(match).map(function (e) {
        var c = by('col', e.col), x = by('eq', e.eq), u = by('usr', e.por), aberto = e.status === 'Em uso';
        return '<tr><td>' + esc(c && c.nome) + '</td><td>' + esc(x && x.nome) + '</td><td>' + e.qtd + '</td><td>' + fmt(e.data) + '</td><td>' + fmt(e.prev) + '</td><td>' +
          (aberto ? badge('warning', 'Em uso') : badge('success', 'Devolvido em ' + fmt(e.dev))) + '</td><td>' + esc(u ? u.nome : '—') + '</td><td class="text-end">' +
          (aberto ? '<button class="btn btn-sm btn-warning" data-ret="' + e.id + '">Registrar devolução</button>' : '') + '</td></tr>';
      }), 'Nenhum empréstimo registrado.');
  }

  m.innerHTML = h;
  var qi = document.getElementById('q');
  if (qi) qi.oninput = function () { q = qi.value; var p = qi.selectionStart; render(); var n = document.getElementById('q'); n.focus(); n.setSelectionRange(p, p); };
}

/* ===== Formulários (modal Bootstrap) ===== */
var F = {
  eq:  { t:'equipamento', f:[['nome','Nome do equipamento','text'],['cat','Categoria','sel',CATS],['ca','Nº do CA (Certificado de Aprovação)','text'],['val','Validade do CA','date'],['qtd','Quantidade em estoque','number']] },
  col: { t:'colaborador', f:[['nome','Nome completo','text'],['mat','Matrícula','text'],['fun','Função','text'],['set','Obra ou setor','text']] },
  usr: { t:'usuário',     f:[['nome','Nome','text'],['login','Login','text'],['perfil','Perfil','sel',['Administrador','Almoxarife']]] }
};
function campo(f, v) {
  var id = 'f_' + f[0], val = v == null ? '' : v, x = '<div class="mb-3"><label class="form-label" for="' + id + '">' + f[1] + '</label>';
  if (f[2] === 'sel') return x + '<select class="form-select" id="' + id + '">' + f[3].map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>';
  return x + '<input class="form-control" id="' + id + '" type="' + f[2] + '"' + (f[2] === 'number' ? ' min="0"' : '') + ' value="' + esc(val) + '"></div>';
}
function abrirModal(titulo, corpo, aoSalvar) {
  var el = document.getElementById('modal'), modal = bootstrap.Modal.getOrCreateInstance(el);
  document.getElementById('modalTitle').textContent = titulo;
  document.getElementById('modalBody').innerHTML = corpo;
  document.getElementById('err').textContent = '';
  document.getElementById('ok').onclick = function () {
    var r = aoSalvar();
    if (r) document.getElementById('err').textContent = r; else modal.hide();
  };
  modal.show();
}
function crud(l, id) {
  var cfg = F[l], cur = id ? by(l, id) : {};
  abrirModal((id ? 'Editar ' : 'Novo ') + cfg.t, cfg.f.map(function (f) { return campo(f, cur[f[0]]); }).join(''), function () {
    var o = {};
    for (var i = 0; i < cfg.f.length; i++) {
      var f = cfg.f[i], v = document.getElementById('f_' + f[0]).value.trim();
      if (!v) return 'Preencha o campo “' + f[1] + '”.';
      o[f[0]] = f[2] === 'number' ? parseInt(v, 10) : v;
    }
    if (l === 'eq' && o.qtd < emUso(id || -1)) return 'A quantidade não pode ser menor que os itens já emprestados (' + emUso(id) + ').';
    if (l === 'col' && db.col.some(function (c) { return c.mat === o.mat && c.id != id; })) return 'Já existe um colaborador com esta matrícula.';
    if (l === 'usr' && db.usr.some(function (c) { return c.login === o.login && c.id != id; })) return 'Este login já está em uso.';
    if (id) Object.assign(cur, o); else { o.id = nid(); db[l].push(o); }
    save(); render(); toast('Registro salvo'); return '';
  });
}
function novoEmp() {
  var es = db.eq.filter(function (e) { return !caVencido(e) && disp(e) > 0; });
  if (!db.col.length) return toast('Cadastre um colaborador primeiro.');
  if (!es.length) return toast('Nenhum equipamento disponível com CA válido.');
  var corpo =
    '<div class="mb-3"><label class="form-label" for="e_c">Colaborador</label><select class="form-select" id="e_c">' +
      db.col.map(function (c) { return '<option value="' + c.id + '">' + esc(c.nome) + ' (' + esc(c.mat) + ')</option>'; }).join('') + '</select></div>' +
    '<div class="mb-3"><label class="form-label" for="e_e">Equipamento</label><select class="form-select" id="e_e">' +
      es.map(function (e) { return '<option value="' + e.id + '">' + esc(e.nome) + ' – ' + disp(e) + ' disponíveis</option>'; }).join('') + '</select></div>' +
    '<div class="mb-3"><label class="form-label" for="e_q">Quantidade</label><input class="form-control" id="e_q" type="number" min="1" value="1"></div>' +
    '<div class="mb-3"><label class="form-label" for="e_p">Devolução prevista (opcional)</label><input class="form-control" id="e_p" type="date" min="' + hoje() + '"></div>';
  abrirModal('Novo empréstimo', corpo, function () {
    var eq = by('eq', document.getElementById('e_e').value), n = parseInt(document.getElementById('e_q').value, 10);
    if (!n || n < 1) return 'Informe uma quantidade válida.';
    if (n > disp(eq)) return 'Só há ' + disp(eq) + ' unidade(s) disponível(is) deste equipamento.';
    db.emp.push({ id: nid(), col: +document.getElementById('e_c').value, eq: eq.id, qtd: n, data: hoje(), prev: document.getElementById('e_p').value, status: 'Em uso', por: +document.getElementById('me').value });
    save(); render(); toast('Empréstimo registrado'); return '';
  });
}

/* ===== Eventos ===== */
document.addEventListener('click', function (ev) {
  var t = ev.target.closest('button'); if (!t) return;
  if (t.dataset.t) { tab = t.dataset.t; q = ''; render(); }
  else if (t.dataset.new) { tab === 'emp' ? novoEmp() : crud(tab); }
  else if (t.dataset.edit) { var p = t.dataset.edit.split(':'); crud(p[0], +p[1]); }
  else if (t.dataset.del) {
    var d = t.dataset.del.split(':'), l = d[0], id = +d[1];
    if (l === 'eq' && db.emp.some(function (e) { return e.eq === id && e.status === 'Em uso'; })) return toast('Há empréstimos em aberto deste equipamento.');
    if (l === 'col' && db.emp.some(function (e) { return e.col === id && e.status === 'Em uso'; })) return toast('Este colaborador tem itens não devolvidos.');
    if (l === 'usr' && db.usr.length <= 1) return toast('Mantenha ao menos um usuário.');
    if (confirm('Excluir este registro?')) { db[l] = db[l].filter(function (x) { return x.id !== id; }); save(); render(); toast('Registro excluído'); }
  }
  else if (t.dataset.ret) { var e = by('emp', t.dataset.ret); e.status = 'Devolvido'; e.dev = hoje(); save(); render(); toast('Devolução registrada'); }
});

/* Tema claro/escuro automático (Bootstrap 5.3) */
document.documentElement.setAttribute('data-bs-theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

render();