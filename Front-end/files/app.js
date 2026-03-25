/* ================================================
   CAMM — app.js
   Lógica frontend + integração com API
   ================================================ */

// ── Configuração da API ──────────────────────────
// Usa proxy do Nginx (/api/) quando servido via Docker (porta 80)
// Aponta direto para o backend quando em dev local (Live Server, porta != 80)
const API_BASE_URL = window.location.port === '' || window.location.port === '80'
  ? '/api/v1'
  : 'http://localhost:3000/api/v1';

// ── Autenticação ─────────────────────────────────
const Auth = {
  getToken:        () => localStorage.getItem('camm_token'),
  setToken:        (t) => localStorage.setItem('camm_token', t),
  getRefreshToken: () => localStorage.getItem('camm_refresh'),
  setRefreshToken: (t) => localStorage.setItem('camm_refresh', t),
  getUser:  () => {
    const u = localStorage.getItem('camm_user');
    return u ? JSON.parse(u) : null;
  },
  setUser:  (u) => localStorage.setItem('camm_user', JSON.stringify(u)),
  logout: async () => {
    const rt = localStorage.getItem('camm_refresh');
    // Tenta invalidar o refresh token no backend
    if (rt) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('camm_token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
      } catch (_) { /* ignora erro de rede no logout */ }
    }
    localStorage.removeItem('camm_token');
    localStorage.removeItem('camm_refresh');
    localStorage.removeItem('camm_user');
    window.location.href = 'index.html';
  },
  isLoggedIn: () => !!localStorage.getItem('camm_token'),
  requireAuth: () => {
    if (!Auth.isLoggedIn() && !Auth.getRefreshToken()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  // Tenta renovar o access_token usando o refresh_token
  _refreshing: null,
  async tryRefresh() {
    // Evita múltiplas renovações simultâneas
    if (Auth._refreshing) return Auth._refreshing;

    const rt = Auth.getRefreshToken();
    if (!rt) return false;

    Auth._refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        Auth.setToken(data.access_token);
        Auth.setRefreshToken(data.refresh_token);
        if (data.usuario) Auth.setUser(data.usuario);
        return true;
      } catch (_) {
        return false;
      } finally {
        Auth._refreshing = null;
      }
    })();

    return Auth._refreshing;
  }
};

// ── Fetch com renovação automática de token ──────
async function _fetchWithRefresh(url, options) {
  let res = await fetch(url, options);

  // Se 401, tenta renovar o token e refazer a requisição
  if (res.status === 401) {
    const refreshed = await Auth.tryRefresh();
    if (refreshed) {
      // Atualiza o header com o novo token
      const newToken = Auth.getToken();
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.set('Authorization', `Bearer ${newToken}`);
        } else {
          options.headers['Authorization'] = `Bearer ${newToken}`;
        }
      }
      res = await fetch(url, options);
    }
  }

  // Se ainda 401 após refresh, redireciona para login
  if (res.status === 401) {
    localStorage.removeItem('camm_token');
    localStorage.removeItem('camm_refresh');
    localStorage.removeItem('camm_user');
    window.location.href = 'index.html';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return res;
}

function _check(res, label) {
  if (!res.ok) throw new Error(`${label} → ${res.status}`);
  return res;
}

const api = {
  async get(endpoint) {
    const token = Auth.getToken();
    const res = await _fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    return _check(res, `GET ${endpoint}`).json();
  },
  async post(endpoint, body) {
    const token = Auth.getToken();
    const res = await _fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return _check(res, `POST ${endpoint}`).json();
  },
  async put(endpoint, body) {
    const token = Auth.getToken();
    const res = await _fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return _check(res, `PUT ${endpoint}`).json();
  },
  async patch(endpoint, body) {
    const token = Auth.getToken();
    const res = await _fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return _check(res, `PATCH ${endpoint}`).json();
  },
  async delete(endpoint) {
    const token = Auth.getToken();
    const res = await _fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    _check(res, `DELETE ${endpoint}`);
    return res.status !== 204 ? res.json() : null;
  },
  async postForm(endpoint, formData) {
    const token = Auth.getToken();
    const res = await _fetchWithRefresh(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return _check(res, `POST form ${endpoint}`).json();
  }
};

// ── Toast Notifications ───────────────────────────
const Toast = {
  show(msg, type = 'default', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 280);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
};

// ── Sidebar Mobile ────────────────────────────────
function initSidebar() {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  if (!hamburger) return;
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

// ── Marcar item ativo na sidebar ──────────────────
function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// ── Preencher usuário logado na sidebar ───────────
function fillSidebarUser() {
  const user = Auth.getUser();
  if (!user) return;
  const nameEl   = document.getElementById('sidebar-username');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.nome || 'Usuário';
  if (avatarEl) avatarEl.textContent = (user.nome || 'U').charAt(0).toUpperCase();

  // Adicionar botão de logout na sidebar footer (se ainda não existir)
  const footer = document.querySelector('.sidebar-footer');
  if (footer && !document.getElementById('btn-logout')) {
    const btn = document.createElement('button');
    btn.id = 'btn-logout';
    btn.className = 'btn btn-sm';
    btn.innerHTML = '<i data-lucide="log-out" style="width:14px;height:14px"></i> Sair';
    btn.style.cssText = 'margin-top:8px;width:100%;font-size:12px;padding:8px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.12);border-radius:8px;display:flex;align-items:center;justify-content:center;gap:6px';
    btn.addEventListener('click', Auth.logout);
    footer.appendChild(btn);
  }
}

// ── Renderizar ícones Lucide ──────────────────────
function refreshIcons() { if (window.lucide) lucide.createIcons(); }

// ── Conversão de datas ────────────────────────────
// DD/MM/AAAA → YYYY-MM-DD (formato ISO para a API)
function toISO(dataBR) {
  if (!dataBR) return undefined;
  const [d, m, y] = dataBR.split('/');
  if (!d || !m || !y) return undefined;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}
// YYYY-MM-DD ou ISO string → DD/MM/AAAA (para exibição)
function toBR(dateISO) {
  if (!dateISO) return '—';
  const d = new Date(dateISO);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// ── Validações de formulário ──────────────────────
const Validate = {
  required: (val, label) => {
    if (!val || !val.toString().trim()) { Toast.error(`${label} é obrigatório.`); return false; }
    return true;
  },
  cpf: (val) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val),
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  password: (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(val),
};

// ── Máscara de inputs ─────────────────────────────
function applyMasks() {
  document.querySelectorAll('[data-mask]').forEach(input => {
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g, '');
      switch (input.dataset.mask) {
        case 'cpf':
          v = v.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
            d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
          break;
        case 'rg':
          v = v.slice(0, 9).replace(/(\d{2})(\d{3})(\d{3})(\d{0,1})/, (_, a, b, c, d) =>
            d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
          break;
        case 'phone':
          v = v.slice(0, 11).replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) =>
            c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a ? `(${a}` : '');
          break;
        case 'date':
          v = v.slice(0, 8).replace(/(\d{2})(\d{2})(\d{0,4})/, (_, a, b, c) =>
            c ? `${a}/${b}/${c}` : b ? `${a}/${b}` : a);
          break;
      }
      input.value = v;
    });
  });
}

// ── Toggle senha visível ──────────────────────────
function initPasswordToggle() {
  document.querySelectorAll('.input-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      const iconName = input.type === 'password' ? 'eye' : 'eye-off';
      btn.innerHTML = `<i data-lucide="${iconName}" style="width:16px;height:16px"></i>`;
      if (window.lucide) lucide.createIcons();
    });
  });
}

// ── Modal helpers ─────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function initModals() {
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}

// ── Paginação genérica ────────────────────────────
function renderPagination(containerId, total, perPage, current, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const pages = Math.ceil(total / perPage);
  container.innerHTML = '';
  const prev = document.createElement('button');
  prev.className = 'page-btn'; prev.textContent = '‹';
  prev.disabled = current <= 1;
  prev.onclick = () => onPageChange(current - 1);
  container.appendChild(prev);
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.className = `page-btn${i === current ? ' active' : ''}`;
    btn.textContent = i;
    btn.onclick = () => onPageChange(i);
    container.appendChild(btn);
  }
  const next = document.createElement('button');
  next.className = 'page-btn'; next.textContent = '›';
  next.disabled = current >= pages;
  next.onclick = () => onPageChange(current + 1);
  container.appendChild(next);
}

// ── Frequência: toggle botões ─────────────────────
function initFreqButtons() {
  document.querySelectorAll('.freq-btn-group').forEach(group => {
    group.querySelectorAll('.freq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const row = btn.closest('tr');
        const matricula = row?.dataset.matricula;
        const status = btn.classList.contains('presente') ? 'presente' : 'ausente';
        if (matricula) {
          // Salva localmente para envio posterior
          row.dataset.status = status;
        }
      });
    });
  });
}

// ── Salvar chamada (frequência) ───────────────────
async function salvarChamada() {
  const date = document.getElementById('freq-date')?.value;
  if (!date) { Toast.error('Selecione uma data.'); return; }
  const rows = document.querySelectorAll('#freq-tbody tr[data-matricula]');
  if (!rows.length) { Toast.error('Nenhuma criança na lista.'); return; }

  const btn = document.getElementById('btn-salvar-chamada');
  if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; }

  try {
    const promises = Array.from(rows).map(row => {
      const statusRaw = row.dataset.status || 'ausente';
      const status = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1); // 'presente' → 'Presente'
      return api.post('/frequencia', {
        id_matricula: Number(row.dataset.matricula),
        status,
        data_registro: toISO(date),
      });
    });
    await Promise.all(promises);
    Toast.success('Chamada salva com sucesso!');
  } catch (e) {
    Toast.error('Erro ao salvar chamada.');
    console.error(e);
  } finally {
    if (btn) { btn.innerHTML = '<i data-lucide="save" style="width:14px;height:14px"></i> Salvar Chamada'; btn.disabled = false; if(window.lucide) lucide.createIcons(); }
  }
}

// ── Upload de foto: preview ───────────────────────
function initPhotoUpload() {
  document.querySelectorAll('.photo-upload').forEach(area => {
    const input = area.querySelector('input[type=file]');
    if (!input) return;
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        let img = area.querySelector('img.preview');
        if (!img) { img = document.createElement('img'); img.className = 'preview'; area.appendChild(img); }
        img.src = e.target.result;
        area.querySelector('.photo-upload-icon')?.remove();
        area.querySelector('.photo-upload-text')?.remove();
      };
      reader.readAsDataURL(file);
    });
  });
}

// ── LOGIN ─────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value.trim();
  const senha = document.getElementById('login-senha')?.value;
  if (!email || !senha) { Toast.error('Preencha email e senha.'); return; }

  const btn = document.getElementById('btn-login');
  if (btn) { btn.textContent = 'Entrando...'; btn.disabled = true; }

  try {
    /* ── Endpoint: POST /auth/login ──
       Body: { email, senha }
       Response: { token, user: { id, nome, email, cargo, nivel } }
    */
    const data = await api.post('/auth/login', { email, senha });
    Auth.setToken(data.access_token);
    Auth.setRefreshToken(data.refresh_token);
    Auth.setUser(data.usuario);
    Toast.success('Login realizado!');
    setTimeout(() => window.location.href = 'cadastros.html', 800);
  } catch (err) {
    Toast.error('Email ou senha incorretos.');
    console.error(err);
    if (btn) { btn.textContent = 'Entrar'; btn.disabled = false; }
  }
}

// ── CADASTRAR CRIANÇA ─────────────────────────────
async function handleCadastrarCrianca(e) {
  e.preventDefault();
  const nome = document.getElementById('c-nome')?.value.trim();
  if (!Validate.required(nome, 'Nome completo')) return;

  const cpf             = document.getElementById('c-cpf')?.value;
  const data_nascimento = document.getElementById('c-nascimento')?.value;
  const foto            = document.getElementById('c-foto')?.files[0];

  const resp_nome = document.getElementById('r-nome')?.value.trim();
  const resp_cpf  = document.getElementById('r-cpf')?.value;
  const resp_tel  = document.getElementById('r-tel')?.value;
  const resp_end  = document.getElementById('r-end')?.value.trim();

  if (!Validate.required(resp_nome, 'Nome do responsável')) return;
  if (!Validate.required(resp_cpf,  'CPF do responsável'))  return;

  try {
    // 1. Cadastrar responsável
    const responsavel = await api.post('/responsaveis', {
      nome:     resp_nome,
      cpf:      resp_cpf,
      contato:  resp_tel || '',
      endereco: resp_end || '',
    });

    // 2. Cadastrar criança vinculando ao responsável
    const criancaData = await api.post('/criancas', {
      nome,
      data_nascimento: toISO(data_nascimento),
      cpf: cpf || '',
      id_responsavel: responsavel.id_responsavel,
    });

    // 3. Upload da foto (se houver)
    if (foto) {
      const formData = new FormData();
      formData.append('file', foto);
      await api.postForm(`/documentos/upload/foto/${criancaData.id_matricula}`, formData);
    }

    Toast.success('Criança cadastrada com sucesso!');
    setTimeout(() => window.location.href = 'cadastros.html', 1000);
  } catch (err) {
    Toast.error('Erro ao cadastrar criança. Verifique os dados e tente novamente.');
    console.error(err);
  }
}

// ── CADASTRAR VOLUNTÁRIO ──────────────────────────
async function handleCadastrarVoluntario(e) {
  e.preventDefault();
  const nome  = document.getElementById('v-nome')?.value.trim();
  const email = document.getElementById('v-email')?.value.trim();
  const senha = document.getElementById('v-senha')?.value;
  const conf  = document.getElementById('v-conf')?.value;
  const cargo = document.getElementById('v-cargo')?.value;

  if (!Validate.required(nome, 'Nome')) return;
  if (!Validate.email(email)) { Toast.error('Email inválido.'); return; }
  if (!Validate.password(senha)) {
    Toast.error('Senha deve ter 8+ caracteres, maiúscula, minúscula, número e caractere especial.');
    return;
  }
  if (senha !== conf) { Toast.error('Senhas não coincidem.'); return; }
  if (!cargo) { Toast.error('Selecione a função.'); return; }

  const nivelMap = { 'voluntario': 1, 'Voluntário': 1, 'gestor': 2, 'Gestor': 2, 'diretor': 3, 'Diretor': 3 };
  const nivel_acesso = nivelMap[cargo] ?? 1;

  const body = { nome, email, senha, nivel_acesso };

  try {
    await api.post('/usuarios', body);
    Toast.success('Voluntário cadastrado!');
    setTimeout(() => window.location.href = 'admin.html', 1000);
  } catch (err) {
    Toast.error('Erro ao cadastrar voluntário.');
    console.error(err);
  }
}

// ── SALVAR PERMISSÕES ─────────────────────────────
// Permissões são gerenciadas pelo campo nivel_acesso no backend
async function salvarPermissoes() {
  Toast.show('Permissões são definidas pelo nível de acesso de cada usuário.');
}

// ── SALVAR ATIVIDADE ──────────────────────────────
async function handleSalvarAtividade(e) {
  e.preventDefault();
  const titulo = document.getElementById('a-titulo')?.value.trim();
  if (!Validate.required(titulo, 'Título')) return;

  const data_realizacao = document.getElementById('a-data')?.value;
  if (!Validate.required(data_realizacao, 'Data')) return;

  const usuario = Auth.getUser();
  const body = {
    titulo,
    data_realizacao: toISO(data_realizacao),
    id_usuario_resp: usuario?.id,
  };

  try {
    await api.post('/atividades', body);
    Toast.success('Atividade registrada!');
    document.getElementById('form-atividade')?.reset();
    renderAtividadesRecentes();
  } catch (err) {
    Toast.error('Erro ao registrar atividade.');
    console.error(err);
  }
}

// ── SALVAR DOAÇÃO ─────────────────────────────────
async function handleSalvarDoacao(e) {
  e.preventDefault();
  const doador = document.getElementById('d-doador')?.value.trim();
  if (!Validate.required(doador, 'Nome do doador')) return;

  const tipo = document.getElementById('d-tipo')?.value;
  if (!Validate.required(tipo, 'Tipo')) return;

  const valorRaw = document.getElementById('d-quantidade')?.value || document.getElementById('d-valor')?.value;
  const valor = parseFloat(String(valorRaw).replace(',', '.')) || 0;

  const body = {
    doador,
    tipo,
    valor,
    data_doacao: toISO(document.getElementById('d-data')?.value) || undefined,
  };

  try {
    await api.post('/doacoes', body);
    Toast.success('Doação registrada!');
    document.getElementById('form-doacao')?.reset();
    renderDoacoes();
  } catch (err) {
    Toast.error('Erro ao registrar doação.');
    console.error(err);
  }
}

// ── EXCLUIR CRIANÇA ───────────────────────────────
function confirmarExclusao(id, nome, tipo = 'criança') {
  const modal = document.getElementById('modal-confirmar');
  if (!modal) return;
  document.getElementById('modal-delete-nome').textContent = nome;
  modal.classList.add('open');
  modal.dataset.deleteId   = id;
  modal.dataset.deleteTipo = tipo;
}

async function executarExclusao() {
  const modal = document.getElementById('modal-confirmar');
  const id   = modal?.dataset.deleteId;
  const tipo = modal?.dataset.deleteTipo;
  if (!id) return;

  const endpointMap = { 'criança': '/criancas', 'usuario': '/usuarios', 'doacao': '/doacoes', 'atividade': '/atividades' };
  const endpoint = endpointMap[tipo] || '/criancas';

  try {
    await api.delete(`${endpoint}/${id}`);
    Toast.success(`${tipo} excluído com sucesso.`);
    closeModal('modal-confirmar');
    setTimeout(() => location.reload(), 800);
  } catch (err) {
    Toast.error('Erro ao excluir. Verifique seu nível de acesso.');
    console.error(err);
  }
}

// ── BUSCA genérica ────────────────────────────────
function initSearch(inputId, tableBodyId, colIndices = [0, 1, 2]) {
  const input = document.getElementById(inputId);
  const tbody = document.getElementById(tableBodyId);
  if (!input || !tbody) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    tbody.querySelectorAll('tr').forEach(row => {
      const text = colIndices.map(i => row.cells[i]?.textContent || '').join(' ').toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

// ── Calendário presença ───────────────────────────
const CalendarioPresenca = {
  currentDate: new Date(),
  presencas: {}, // { 'YYYY-MM-DD': 'presente' | 'ausente' }

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const year  = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const weekdays = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    let html = `
      <div class="calendar-nav">
        <div>
          <p style="font-size:12px;color:var(--paragrafo);font-weight:700;text-transform:uppercase">Visão<br>Geral</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="cal-nav-btn" onclick="CalendarioPresenca.prev('${containerId}')">‹</button>
          <span style="font-family:var(--font-main);font-weight:800;font-size:15px">${monthNames[month]} ${year}</span>
          <button class="cal-nav-btn" onclick="CalendarioPresenca.next('${containerId}')">›</button>
        </div>
      </div>
      <div class="calendar-grid">
        ${weekdays.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
    `;

    for (let i = 0; i < firstDay; i++) html += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const status  = this.presencas[dateStr];
      const isToday = today.getDate()===d && today.getMonth()===month && today.getFullYear()===year;
      const isWknd  = [0,6].includes(new Date(year,month,d).getDay());
      let cls = 'cal-day';
      if (status === 'presente') cls += ' presente';
      else if (status === 'ausente') cls += ' ausente';
      else if (isToday) cls += ' today';
      else if (isWknd)  cls += ' weekend';
      html += `<div class="${cls}">${d}</div>`;
    }

    html += `</div>
      <div class="cal-legend">
        <div class="legend-item"><div class="legend-dot verde"></div> Presente (${Object.values(this.presencas).filter(v=>v==='presente').length} dias)</div>
        <div class="legend-item"><div class="legend-dot vermelho"></div> Ausente (${Object.values(this.presencas).filter(v=>v==='ausente').length} dia)</div>
        <div class="legend-item"><div class="legend-dot cinza"></div> Sem Atividade</div>
      </div>`;

    container.innerHTML = html;
  },

  prev(id) { this.currentDate.setMonth(this.currentDate.getMonth() - 1); this.render(id); },
  next(id) { this.currentDate.setMonth(this.currentDate.getMonth() + 1); this.render(id); },

  // Popula com dados do backend
  // Formato: [{ data: 'YYYY-MM-DD', status: 'presente' | 'ausente' }]
  setData(registros) {
    this.presencas = {};
    registros.forEach(r => { this.presencas[r.data] = r.status; });
  }
};

// ── Dados MOCK removidos — tudo vem da API agora ─

// ── Renderização de tabelas com dados da API ─────
async function renderCadastrTable() {
  const tbody = document.getElementById('cadastros-tbody');
  if (!tbody) return;
  try {
    const criancas = await api.get('/criancas');
    tbody.innerHTML = criancas.map(c => {
      const nascimento = toBR(c.data_nascimento);
      return `
        <tr>
          <td data-label="Foto"><div class="table-avatar">${c.nome.charAt(0)}</div></td>
          <td data-label="Matrícula">${c.id_matricula}</td>
          <td data-label="Nome">${c.nome}</td>
          <td data-label="Nascimento">${nascimento}</td>
          <td data-label="Status"><span class="badge badge-ativo">Ativo</span></td>
          <td data-label="Ações">
            <div class="action-btns">
              <button class="action-btn" title="Editar" onclick="window.location.href='cadastrar-crianca.html?id=${c.id_matricula}'"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
              <button class="action-btn delete" title="Excluir" onclick="confirmarExclusao(${c.id_matricula},'${c.nome}','criança')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('');
    refreshIcons();
    // Preencher stats
    const totalEl = document.getElementById('stat-total');
    const ativosEl = document.getElementById('stat-ativos');
    const mesEl = document.getElementById('stat-mes');
    if (totalEl) totalEl.textContent = criancas.length;
    if (ativosEl) ativosEl.textContent = criancas.length;
    if (mesEl) mesEl.textContent = criancas.length;
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--paragrafo)">Erro ao carregar dados.</td></tr>';
    console.error(err);
  }
}

async function renderFreqTable() {
  const tbody = document.getElementById('freq-tbody');
  if (!tbody) return;
  try {
    const criancas = await api.get('/criancas');
    tbody.innerHTML = criancas.map(c => `
      <tr data-matricula="${c.id_matricula}" data-status="">
        <td data-label="Matrícula">${c.id_matricula}</td>
        <td data-label="Nome">${c.nome}</td>
        <td data-label="Última Presença">—</td>
        <td data-label="Status">
          <div class="freq-btn-group">
            <button class="freq-btn presente">Presente</button>
            <button class="freq-btn ausente">Ausente</button>
          </div>
        </td>
        <td data-label="Visualizar">
          <button class="btn btn-outline btn-sm" onclick="window.location.href='historico-presenca.html?id=${c.id_matricula}'">Ver histórico</button>
        </td>
      </tr>`).join('');
    initFreqButtons();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--paragrafo)">Erro ao carregar dados.</td></tr>';
    console.error(err);
  }
}

async function renderUsuariosTable() {
  const tbody = document.getElementById('usuarios-tbody');
  if (!tbody) return;
  const nivelLabel = { 1: 'Voluntário', 2: 'Gestor', 3: 'Diretor' };
  try {
    const usuarios = await api.get('/usuarios');
    tbody.innerHTML = usuarios.map(u => `
      <tr>
        <td data-label="Nome">${u.nome}</td>
        <td data-label="Função">${nivelLabel[u.nivel_acesso] ?? 'Voluntário'}</td>
        <td data-label="Email"><a href="mailto:${u.email}" style="color:var(--paragrafo)">${u.email}</a></td>
        <td data-label="Status"><span class="badge badge-ativo">Ativo</span></td>
        <td data-label="Ações">
          <div class="action-btns">
            <button class="action-btn" title="Editar"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
            <button class="action-btn delete" title="Excluir" onclick="confirmarExclusao(${u.id_usuario},'${u.nome}','usuario')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--paragrafo)">Erro ao carregar dados.</td></tr>';
    console.error(err);
  }
}

async function renderPermissoesTable() {
  const tbody = document.getElementById('perm-tbody');
  if (!tbody) return;
  const perms = ['criar_usuarios','editar_usuarios','excluir_usuarios','gerar_declaracoes','cadastrar_crianca','visualizar_frequencia','registrar_frequencia'];
  const labels = ['Criar Usuários','Editar Usuários','Excluir Usuários','Gerar Declarações','Cadastrar Criança','Visualizar Frequência','Registrar Frequência'];
  // Nível 3 (Diretor) = tudo, Nível 2 (Gestor) = cadastrar+frequência, Nível 1 (Voluntário) = visualizar freq
  const permsByLevel = {
    3: [true, true, true, true, true, true, true],
    2: [false, false, false, true, true, true, true],
    1: [false, false, false, false, false, true, false],
  };
  try {
    const usuarios = await api.get('/usuarios');
    tbody.innerHTML = usuarios.map(u => {
      const checks = permsByLevel[u.nivel_acesso] || permsByLevel[1];
      return `
      <tr data-userid="${u.id_usuario}">
        <td data-label="Usuário">
          <div class="user-cell">
            <div class="user-name">${u.nome}</div>
            <div class="user-email">${u.email}</div>
          </div>
        </td>
        ${perms.map((p, pi) => `
          <td data-label="${labels[pi]}">
            <label class="toggle">
              <input type="checkbox" data-perm="${p}" ${checks[pi] ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </td>`).join('')}
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--paragrafo)">Erro ao carregar usuários.</td></tr>';
    console.error(err);
  }
}

async function renderAtividadesRecentes() {
  const tbody = document.getElementById('atividades-tbody');
  if (!tbody) return;
  try {
    const atividades = await api.get('/atividades');
    tbody.innerHTML = atividades.map(a => {
      const data = toBR(a.data_realizacao);
      return `
        <tr>
          <td data-label="Atividade">
            <div style="font-weight:700;color:var(--titulo)">${a.titulo}</div>
          </td>
          <td data-label="Responsável">${a.responsavel?.nome ?? '—'}</td>
          <td data-label="Data">${data}</td>
          <td data-label="Participantes" style="color:var(--paragrafo)">—</td>
          <td data-label="Status">
            <span class="badge badge-concluida">CONCLUÍDA</span>
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--paragrafo)">Erro ao carregar dados.</td></tr>';
    console.error(err);
  }
}

async function renderDoacoes() {
  const tbody = document.getElementById('doacoes-tbody');
  if (!tbody) return;
  try {
    const doacoes = await api.get('/doacoes');
    tbody.innerHTML = doacoes.map(d => {
      const initials = d.doador.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
      const data = toBR(d.data_doacao);
      const valor = d.valor != null ? `R$ ${Number(d.valor).toFixed(2).replace('.',',')}` : '—';
      return `
        <tr>
          <td data-label="Data">${data}</td>
          <td data-label="Doador">
            <div class="donor-cell">
              <div class="donor-avatar">${initials}</div>
              ${d.doador}
            </div>
          </td>
          <td data-label="Tipo"><span class="donation-type-badge tipo-${d.tipo.toLowerCase()}">${d.tipo.charAt(0).toUpperCase()+d.tipo.slice(1)}</span></td>
          <td data-label="Valor/Qtd">${valor}</td>
          <td data-label="Ações">
            <div class="action-btns">
              <button class="action-btn" title="Ver"><i data-lucide="eye" style="width:14px;height:14px"></i></button>
              <button class="action-btn delete" title="Excluir" onclick="confirmarExclusao(${d.id_doacao},'doação','doacao')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--paragrafo)">Erro ao carregar dados.</td></tr>';
    console.error(err);
  }
}

// ── Carregar voluntários no select de responsável ─
async function carregarSelectResponsaveis() {
  const select = document.getElementById('a-responsavel');
  if (!select) return;
  try {
    const usuarios = await api.get('/usuarios');
    select.innerHTML = '<option value="">Selecione um voluntário/colaborador</option>';
    usuarios.forEach(u => {
      select.innerHTML += `<option value="${u.id_usuario}">${u.nome}</option>`;
    });
  } catch (err) { console.error(err); }
}

// ── Preencher nome do responsável na doação ──────
function preencherResponsavelDoacao() {
  const user = Auth.getUser();
  const input = document.getElementById('d-responsavel');
  if (input && user) input.value = user.nome || '';
}

// ── Histórico de presença individual ─────────────
async function carregarHistoricoPresenca() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { CalendarioPresenca.render('calendario-container'); return; }

  // Carregar nome da criança
  try {
    const crianca = await api.get(`/criancas/${id}`);
    const nomeEl = document.getElementById('hist-nome');
    const regEl  = document.getElementById('hist-registro');
    if (nomeEl) nomeEl.textContent = crianca.nome || '';
    if (regEl) regEl.textContent = `REGISTRO: #${id}`;
  } catch (err) { console.error(err); }

  // Carregar registros de frequência
  try {
    const registros = await api.get(`/frequencia/crianca/${id}`);
    const mapped = registros.map(r => ({
      data:   r.data_registro ? r.data_registro.split('T')[0] : '',
      status: r.status.toLowerCase(),
    }));
    CalendarioPresenca.setData(mapped);

    // Atualizar stats
    const presencas = mapped.filter(r => r.status === 'presente').length;
    const faltas    = mapped.filter(r => r.status === 'ausente').length;
    const total     = presencas + faltas;
    const pct       = total > 0 ? Math.round((presencas / total) * 100) : 0;
    const statEls = document.querySelectorAll('.stat-value');
    if (statEls[0]) statEls[0].textContent = `${pct}%`;
    if (statEls[1]) statEls[1].textContent = String(presencas).padStart(2, '0');
    if (statEls[2]) statEls[2].textContent = String(faltas).padStart(2, '0');

    // Preencher logs
    const logsCard = document.querySelector('.logs-card');
    if (logsCard) {
      const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const now = new Date();
      logsCard.querySelector('h3').textContent = `Logs de Presença — ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      const logRows = mapped.slice(0, 10).map(r => {
        const d = new Date(r.data + 'T00:00:00');
        const dia = String(d.getDate()).padStart(2,'0');
        const mesAbrev = monthNames[d.getMonth()].slice(0,3);
        const ano = d.getFullYear();
        const isPres = r.status === 'presente';
        return `
          <div class="log-row">
            <div class="log-date">${dia} ${mesAbrev}<br>${ano}</div>
            <div><span class="badge" style="background:${isPres ? 'var(--ativo-badge)' : '#FEE2E2'};color:${isPres ? '#1a6b0a' : 'var(--ausente)'}">${isPres ? 'Presente' : 'Ausente'}</span></div>
            <div class="log-obs">—</div>
          </div>`;
      }).join('');
      // Manter h3 e substituir log-rows
      const h3 = logsCard.querySelector('h3').outerHTML;
      logsCard.innerHTML = h3 + logRows;
    }
  } catch (err) { console.error(err); }

  CalendarioPresenca.render('calendario-container');
}

// ── Inicialização da página ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  // Funcionalidades comuns
  initSidebar();
  fillSidebarUser();
  applyMasks();
  initPasswordToggle();
  initModals();

  // Por página
  switch (page) {
    case 'login':
      document.getElementById('form-login')?.addEventListener('submit', handleLogin);
      document.getElementById('show-register')?.addEventListener('click', () => {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('register-section').style.display = 'block';
      });
      document.getElementById('show-login')?.addEventListener('click', () => {
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
      });
      break;

    case 'cadastros':
      if (!Auth.requireAuth()) break;
      setActiveNav('cadastros');
      renderCadastrTable();
      initSearch('search-criancas', 'cadastros-tbody', [1, 2]);
      break;

    case 'frequencia':
      if (!Auth.requireAuth()) break;
      setActiveNav('frequencia');
      renderFreqTable();
      initSearch('search-freq', 'freq-tbody', [0, 1]);
      document.getElementById('btn-salvar-chamada')?.addEventListener('click', salvarChamada);
      // Definir data de hoje no input (DD/MM/AAAA)
      const freqDate = document.getElementById('freq-date');
      if (freqDate) freqDate.value = new Date().toLocaleDateString('pt-BR');
      break;

    case 'admin':
      if (!Auth.requireAuth()) break;
      setActiveNav('admin');
      break;

    case 'admin-voluntarios':
      if (!Auth.requireAuth()) break;
      setActiveNav('admin');
      renderUsuariosTable();
      initSearch('search-usuarios', 'usuarios-tbody', [0, 1, 2]);
      break;

    case 'admin-permissoes':
      if (!Auth.requireAuth()) break;
      setActiveNav('admin');
      renderPermissoesTable();
      initSearch('search-perm', 'perm-tbody', [0]);
      document.getElementById('btn-salvar-perm')?.addEventListener('click', salvarPermissoes);
      break;

    case 'admin-atividades':
      if (!Auth.requireAuth()) break;
      setActiveNav('admin');
      renderAtividadesRecentes();
      carregarSelectResponsaveis();
      document.getElementById('form-atividade')?.addEventListener('submit', handleSalvarAtividade);
      break;

    case 'admin-doacoes':
      if (!Auth.requireAuth()) break;
      setActiveNav('admin');
      renderDoacoes();
      preencherResponsavelDoacao();
      document.getElementById('form-doacao')?.addEventListener('submit', handleSalvarDoacao);
      break;

    case 'cadastrar-crianca':
      if (!Auth.requireAuth()) break;
      setActiveNav('admin');
      initPhotoUpload();
      document.getElementById('form-crianca')?.addEventListener('submit', handleCadastrarCrianca);
      break;

    case 'cadastrar-voluntario':
      if (!Auth.requireAuth()) break;
      setActiveNav('admin');
      document.getElementById('form-voluntario')?.addEventListener('submit', handleCadastrarVoluntario);
      break;

    case 'historico-presenca':
      if (!Auth.requireAuth()) break;
      setActiveNav('frequencia');
      carregarHistoricoPresenca();
      break;
  }
});
