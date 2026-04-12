/* ================================================
   CAMM — app.js
   Lógica frontend + integração com API
   ================================================ */

// ── Configuração da API ──────────────────────────
// Produção (Vercel): aponta para o Render
// Docker local (porta 80): usa proxy Nginx
// Dev local (Live Server): aponta direto para localhost:3000
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? (window.location.port === '' || window.location.port === '80'
      ? '/api/v1'
      : 'http://localhost:3000/api/v1')
  : 'https://ongcamm4-api.onrender.com/api/v1';

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
    // Só redireciona se não tem NENHUM token salvo
    if (!Auth.isLoggedIn() && !Auth.getRefreshToken()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  // Tenta renovar o access_token usando o refresh_token
  _refreshing: null,
  async tryRefresh() {
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
        if (!res.ok) {
          // Servidor respondeu mas token invalido/expirado — sessao acabou
          return 'expired';
        }
        const data = await res.json();
        Auth.setToken(data.access_token);
        Auth.setRefreshToken(data.refresh_token);
        if (data.usuario) Auth.setUser(data.usuario);
        return true;
      } catch (_) {
        // Erro de rede (Render dormindo) — NÃO é sessao expirada
        return 'network_error';
      } finally {
        Auth._refreshing = null;
      }
    })();

    return Auth._refreshing;
  }
};

// ── Fetch com renovação automática de token ──────
async function _fetchWithRefresh(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    // Erro de rede (Render dormindo) — propaga sem redirecionar
    throw e;
  }

  // Se 401, tenta renovar o token e refazer a requisição
  if (res.status === 401) {
    const refreshResult = await Auth.tryRefresh();

    if (refreshResult === true) {
      // Refresh funcionou — refaz a requisição com novo token
      const newToken = Auth.getToken();
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.set('Authorization', `Bearer ${newToken}`);
        } else {
          options.headers['Authorization'] = `Bearer ${newToken}`;
        }
      }
      try {
        res = await fetch(url, options);
      } catch (e) { throw e; }
    } else if (refreshResult === 'expired') {
      // Token de refresh expirado — sessão acabou de verdade
      localStorage.removeItem('camm_token');
      localStorage.removeItem('camm_refresh');
      localStorage.removeItem('camm_user');
      window.location.href = 'index.html';
      throw new Error('Sessão expirada');
    }
    // Se 'network_error' — não redireciona, só propaga o erro
    // O usuário pode tentar novamente quando o servidor acordar
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
    btn.innerHTML = '<i data-lucide="log-out" style="width:14px;height:14px;flex-shrink:0"></i> <span>Sair</span>';
    btn.style.cssText = 'margin-top:4px;width:100%;font-size:12px;font-weight:600;padding:8px 12px;background:#FFF;color:#64748B;border:1px solid #E8ECF4;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;cursor:pointer';
    btn.onmouseenter = () => { btn.style.background = '#FEF3CD'; btn.style.color = '#3D2800'; btn.style.borderColor = '#FFA726'; };
    btn.onmouseleave = () => { btn.style.background = '#FFF'; btn.style.color = '#64748B'; btn.style.borderColor = '#E8ECF4'; };
    btn.addEventListener('click', Auth.logout);
    footer.appendChild(btn);
    refreshIcons();
  }

  // Esconder menu Administrativo para voluntários (nivel 1)
  if (user.nivel_acesso < 2) {
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.page === 'admin') el.style.display = 'none';
    });
  }
}

// ── Renderizar ícones Lucide ──────────────────────
function refreshIcons() { if (window.lucide) lucide.createIcons(); }

// ── Escapar HTML para prevenir XSS ───────────────
function esc(text) {
  if (!text) return '';
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ── Conversão de datas ────────────────────────────
// DD/MM/AAAA ou YYYY-MM-DD → YYYY-MM-DD (formato ISO para a API)
function toISO(dateStr) {
  if (!dateStr) return undefined;
  // Se já está em ISO (YYYY-MM-DD), retorna direto
  if (dateStr.includes('-') && dateStr.length === 10) return dateStr;
  // Senão converte DD/MM/AAAA
  const [d, m, y] = dateStr.split('/');
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
        const status = btn.classList.contains('presente') ? 'presente' : 'ausente';
        if (row) {
          row.dataset.status = status;
          // Mostra campo de justificativa apenas se ausente
          const obsInput = row.querySelector('.obs-falta');
          if (obsInput) obsInput.style.display = status === 'ausente' ? 'block' : 'none';
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
    const turno = document.getElementById('freq-turno')?.value || 'Integral';
    const promises = Array.from(rows).map(row => {
      const statusRaw = row.dataset.status || 'ausente';
      const status = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
      const obsInput = row.querySelector('.obs-falta');
      const observacao = (status === 'Ausente' && obsInput) ? obsInput.value.trim() || undefined : undefined;
      return api.post('/frequencia', {
        id_matricula: Number(row.dataset.matricula),
        status,
        data_registro: toISO(date),
        turno,
        observacao,
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
    // Capturar token do Cloudflare Turnstile (se presente)
    const turnstileInput = document.querySelector('[name="cf-turnstile-response"]');
    const turnstile_token = turnstileInput?.value || undefined;
    const data = await api.post('/auth/login', { email, senha, turnstile_token });
    Auth.setToken(data.access_token);
    Auth.setRefreshToken(data.refresh_token);
    Auth.setUser(data.usuario);
    Toast.success('Login realizado!');
    setTimeout(() => window.location.href = 'home.html', 800);
  } catch (err) {
    Toast.error('Email ou senha incorretos.');
    console.error(err);
    if (btn) { btn.textContent = 'Entrar'; btn.disabled = false; }
    if (typeof turnstile !== 'undefined') turnstile.reset();
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

  if (!Validate.required(data_nascimento, 'Data de nascimento')) return;
  const _hoje = new Date(); _hoje.setHours(0, 0, 0, 0);
  if (new Date(data_nascimento + 'T00:00:00') >= _hoje) {
    Toast.error('Data de nascimento deve ser anterior a hoje');
    return;
  }
  if (!Validate.required(cpf, 'CPF da criança')) return;

  const resp_nome = document.getElementById('r-nome')?.value.trim();
  const resp_cpf  = document.getElementById('r-cpf')?.value;
  const resp_tel  = document.getElementById('r-tel')?.value;
  const resp_end  = document.getElementById('r-end')?.value.trim();

  if (!Validate.required(resp_nome, 'Nome do responsável')) return;
  if (!Validate.required(resp_cpf,  'CPF do responsável'))  return;
  if (!Validate.required(resp_tel,  'Telefone do responsável')) return;

  try {
    // 1. Cadastrar responsável
    const responsavel = await api.post('/responsaveis', {
      nome:     resp_nome,
      cpf:      resp_cpf,
      contato:  resp_tel || '',
      endereco: resp_end || '',
    });

    // 2. Cadastrar criança vinculando ao responsável
    const genero = document.getElementById('c-genero')?.value || undefined;
    const criancaBody = {
      nome,
      data_nascimento: toISO(data_nascimento),
      cpf: cpf || '',
      id_responsavel: responsavel.id_responsavel,
    };
    if (genero) criancaBody.genero = genero;
    const criancaData = await api.post('/criancas', criancaBody);

    // 3. Upload da foto (se houver)
    if (foto) {
      const formData = new FormData();
      formData.append('file', foto);
      await api.postForm(`/documentos/upload/foto/${criancaData.id_matricula}`, formData);
    }

    // 4. Declaração de responsabilidade (se ativada)
    const declAtivo = document.getElementById('decl-ativar')?.checked;
    if (declAtivo) {
      const declNome = document.getElementById('decl-nome-cadastro')?.value.trim();
      const declParentesco = document.getElementById('decl-parentesco-cadastro')?.value;
      if (declNome && declParentesco) {
        try {
          const user = Auth.getUser();
          const decl = await api.post('/declaracoes', {
            id_matricula: criancaData.id_matricula,
            id_usuario_autorizador: user?.id ?? user?.id_usuario,
            nome_parente: declNome,
            parentesco: declParentesco,
          });
          // Baixar PDF da declaração
          const token = Auth.getToken();
          const res = await _fetchWithRefresh(`${API_BASE_URL}/declaracoes/${decl.id_declaracao}/pdf`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `declaracao-responsabilidade-${criancaData.id_matricula}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          }
          Toast.success('Declaracao de responsabilidade gerada!');
        } catch (declErr) {
          console.error('Erro ao gerar declaracao:', declErr);
          Toast.error('Crianca cadastrada, mas erro ao gerar declaracao.');
        }
      }
    }

    Toast.success('Crianca cadastrada com sucesso!');
    setTimeout(() => window.location.href = 'cadastros.html', 1500);
  } catch (err) {
    Toast.error('Erro ao cadastrar crianca. Verifique os dados e tente novamente.');
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
    document.getElementById('modal-voluntario')?.classList.remove('open');
    document.getElementById('form-voluntario')?.reset();
    renderUsuariosTable();
  } catch (err) {
    Toast.error('Erro ao cadastrar voluntário.');
    console.error(err);
  }
}

// ── PERMISSÕES — alterar nivel_acesso ─────────────
async function handleNivelChange(selectEl) {
  const userId = selectEl.dataset.userid;
  const novoNivel = parseInt(selectEl.value);
  try {
    await api.patch(`/usuarios/${userId}`, { nivel_acesso: novoNivel });
    Toast.success('Nível de acesso atualizado!');
  } catch (err) {
    Toast.error('Erro ao atualizar nível.');
    console.error(err);
  }
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

  const valorRaw = (document.getElementById('d-quantidade')?.value || document.getElementById('d-valor')?.value || '').trim();
  const valorParsed = parseFloat(String(valorRaw).replace(',', '.'));
  const valor = isNaN(valorParsed) ? undefined : valorParsed;

  const body = {
    doador,
    tipo,
    ...(valor !== undefined && { valor }),
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

// ── GERAR RELATÓRIO PDF DE FREQUÊNCIA ──────────────
// ── GERAR E BAIXAR PDF ────────────────────────────
async function _baixarPdf(endpoint, filename, btnId) {
  const btn = btnId ? document.getElementById(btnId) : null;
  if (btn) { btn.disabled = true; btn.textContent = 'Gerando...'; }
  try {
    const token = Auth.getToken();
    const res = await _fetchWithRefresh(`${API_BASE_URL}/relatorios/${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0,10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('Relatório gerado com sucesso!');
  } catch (err) {
    Toast.error('Erro ao gerar relatório.');
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="file-text" style="width:14px;height:14px"></i> Gerar PDF'; lucide.createIcons(); }
  }
}

async function gerarRelatorioFrequencia() {
  const date = document.getElementById('freq-date')?.value;
  const turno = document.getElementById('freq-turno')?.value || '';
  if (!date) { Toast.error('Selecione uma data para gerar o PDF.'); return; }
  const params = `?data=${date}${turno ? '&turno=' + encodeURIComponent(turno) : ''}`;
  return _baixarPdf('frequencia' + params, 'relatorio-frequencia', 'btn-relatorio-freq');
}
async function gerarRelatorioCriancas() { return _baixarPdf('criancas', 'relatorio-criancas', 'btn-relatorio'); }

// ── DECLARAÇÃO DE RESPONSABILIDADE ───────────────
function abrirDeclaracao(matricula, nome) {
  document.getElementById('decl-matricula').value = matricula;
  document.getElementById('decl-crianca-nome').textContent = nome;
  document.getElementById('decl-nome').value = '';
  document.getElementById('decl-parentesco').value = '';
  openModal('modal-declaracao');
}

async function handleDeclaracao(e) {
  e.preventDefault();
  const matricula = parseInt(document.getElementById('decl-matricula').value);
  const nome_parente = document.getElementById('decl-nome').value.trim();
  const parentesco = document.getElementById('decl-parentesco').value;

  if (!nome_parente) { Toast.error('Informe o nome do responsavel.'); return; }
  if (!parentesco) { Toast.error('Selecione o parentesco.'); return; }

  const user = Auth.getUser();
  const id_usuario_autorizador = user?.id ?? user?.id_usuario;

  try {
    // 1. Criar declaracao no banco
    const decl = await api.post('/declaracoes', {
      id_matricula: matricula,
      id_usuario_autorizador,
      nome_parente,
      parentesco,
    });

    // 2. Baixar PDF
    const token = Auth.getToken();
    const res = await _fetchWithRefresh(`${API_BASE_URL}/declaracoes/${decl.id_declaracao}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `declaracao-responsabilidade-${matricula}.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    closeModal('modal-declaracao');
    Toast.success('Declaracao gerada com sucesso!');
  } catch (err) {
    Toast.error('Erro ao gerar declaracao.');
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

// ── DASHBOARD ────────────────────────────────────
async function renderDashboard() {
  try {
    const data = await api.get('/dashboard/metrics');
    const user = Auth.getUser();
    const nivel = user?.nivel_acesso ?? 1;

    // Remove skeleton loading dos cards e graficos
    document.querySelectorAll('.dash-card.loading, .dash-chart-card.loading').forEach(el => el.classList.remove('loading'));

    // Cards de resumo com animação de contagem
    animateCounter('dash-criancas', data.criancas_ativas);
    animateCounter('dash-frequencia', data.frequencia_hoje.percentual, '%');
    animateCounter('dash-doacoes', data.doacoes_mes.quantidade);
    animateCounter('dash-voluntarios', data.voluntarios_ativos);

    // Gráfico de frequência semanal
    renderChartFrequencia(data.frequencia_semanal);

    // Gráfico de doações mensais
    renderChartDoacoes(data.doacoes_mensais);

    // Logs recentes (nivel >= 2 vê logs, nivel 1 vê mensagem)
    const logsContainer = document.getElementById('dash-logs');
    if (logsContainer) {
      if (nivel >= 2 && data.logs_recentes && data.logs_recentes.length > 0) {
        logsContainer.innerHTML = data.logs_recentes.map(log => {
          const inicial = (log.usuario_nome || 'U').charAt(0).toUpperCase();
          const tempo = _tempoRelativo(log.data_hora);
          const acao = _formatarAcao(log.acao, log.entidade);
          return `
            <div class="dash-log-item">
              <div class="dash-log-avatar">${inicial}</div>
              <div class="dash-log-text"><strong>${esc(log.usuario_nome)}</strong> ${acao}</div>
              <span class="dash-log-time">${tempo}</span>
            </div>`;
        }).join('');
      } else if (nivel < 2) {
        logsContainer.innerHTML = '<p class="dash-alert-empty">Disponivel para gestores e diretores.</p>';
      } else {
        logsContainer.innerHTML = '<p class="dash-alert-empty">Nenhuma atividade recente.</p>';
      }
    }

    // Aniversariantes da semana
    const anivContainer = document.getElementById('dash-aniversarios');
    if (anivContainer) {
      if (data.aniversariantes_semana && data.aniversariantes_semana.length > 0) {
        anivContainer.innerHTML = data.aniversariantes_semana.map(a => {
          const dia = new Date(a.data_nascimento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
          return `
            <div class="dash-alert-item dash-alert-birthday">
              <div class="dash-alert-icon">🎂</div>
              <span><span class="dash-alert-name">${esc(a.nome)}</span> — ${dia}</span>
            </div>`;
        }).join('');
      } else {
        anivContainer.innerHTML = '<p class="dash-alert-empty">Nenhum aniversariante esta semana.</p>';
      }
    }

    // Crianças sem frequência
    const semFreqContainer = document.getElementById('dash-sem-freq');
    if (semFreqContainer) {
      if (data.criancas_sem_frequencia && data.criancas_sem_frequencia.length > 0) {
        semFreqContainer.innerHTML = data.criancas_sem_frequencia.slice(0, 5).map(c => {
          const ultimo = c.ultimo_registro ? toBR(c.ultimo_registro) : 'Nunca';
          return `
            <div class="dash-alert-item dash-alert-warning">
              <div class="dash-alert-icon">⚠</div>
              <span><span class="dash-alert-name">${esc(c.nome)}</span> — ultimo: ${ultimo}</span>
            </div>`;
        }).join('');
      } else {
        semFreqContainer.innerHTML = '<p class="dash-alert-empty">Todas as criancas com frequencia em dia!</p>';
      }
    }

  } catch (err) {
    // Remove skeleton mesmo em caso de erro
    document.querySelectorAll('.dash-card.loading, .dash-chart-card.loading').forEach(el => el.classList.remove('loading'));
    console.error('Erro ao carregar dashboard:', err);
    Toast.error('Erro ao carregar dashboard. O servidor pode estar iniciando.');
  }
}

// Animação de contagem nos cards
function animateCounter(elementId, targetValue, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  const target = Math.round(targetValue || 0);
  if (isNaN(target)) { el.textContent = '0' + suffix; return; }
  const duration = 800;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(target * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Instâncias dos gráficos (para destruir antes de recriar)
let _chartFreq = null;
let _chartDoac = null;

// Gráfico de frequência semanal (barras)
function renderChartFrequencia(dados) {
  const canvas = document.getElementById('chart-frequencia');
  if (!canvas || !window.Chart) return;
  if (_chartFreq) { _chartFreq.destroy(); _chartFreq = null; }
  const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  const labels = dados.map(d => {
    const date = new Date(d.dia + 'T00:00:00');
    return diasSemana[date.getDay()] + ' ' + String(date.getDate()).padStart(2,'0');
  });
  _chartFreq = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Presentes', data: dados.map(d => d.presentes), backgroundColor: 'rgba(102,187,106,0.7)', borderRadius: 6, borderSkipped: false },
        { label: 'Ausentes', data: dados.map(d => d.ausentes), backgroundColor: 'rgba(224,82,82,0.5)', borderRadius: 6, borderSkipped: false },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { family: "'Nunito', sans-serif", weight: '600', size: 12 } } } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: "'Nunito Sans', sans-serif", size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: { ticks: { font: { family: "'Nunito Sans', sans-serif", size: 11 } }, grid: { display: false } }
      }
    }
  });
}

// Gráfico de doações mensais (linha)
function renderChartDoacoes(dados) {
  const canvas = document.getElementById('chart-doacoes');
  if (!canvas || !window.Chart) return;
  if (_chartDoac) { _chartDoac.destroy(); _chartDoac = null; }
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const labels = dados.map(d => {
    const [y, m] = d.mes.split('-');
    return meses[parseInt(m) - 1] + '/' + y.slice(2);
  });
  _chartDoac = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Valor (R$)',
        data: dados.map(d => d.valor),
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66,165,245,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#42A5F5',
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { family: "'Nunito', sans-serif", weight: '600', size: 12 } } } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => 'R$' + v, font: { family: "'Nunito Sans', sans-serif", size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: { ticks: { font: { family: "'Nunito Sans', sans-serif", size: 11 } }, grid: { display: false } }
      }
    }
  });
}

// Tempo relativo (ex: "há 2h", "há 3 dias")
function _tempoRelativo(dataISO) {
  const agora = new Date();
  const data = new Date(dataISO);
  const diffMs = agora - data;
  const minutos = Math.floor(diffMs / 60000);

  // Horário real formatado
  const h = String(data.getHours()).padStart(2, '0');
  const m = String(data.getMinutes()).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');

  if (minutos < 1) return 'agora';
  if (minutos < 60) return `ha ${minutos}min`;
  const horas = Math.floor(minutos / 60);
  const minRestantes = minutos % 60;
  if (horas < 24) {
    const txt = minRestantes > 0 ? `${horas}h${minRestantes}min` : `${horas}h`;
    return `${txt} (${h}:${m})`;
  }
  const dias = Math.floor(horas / 24);
  return `${dia}/${mes} ${h}:${m}`;
}

// Formatar ação do log para texto legível
function _formatarAcao(acao, entidade) {
  const metodo = (acao || '').split(' ')[0];
  const entidadeLabel = esc(entidade || 'registro');
  const acoes = {
    'POST': 'cadastrou',
    'PATCH': 'atualizou',
    'PUT': 'atualizou',
    'DELETE': 'excluiu',
  };
  return `${acoes[metodo] || 'alterou'} ${entidadeLabel}`;
}

// ── Renderização de tabelas com dados da API ─────
async function renderCadastrTable(includeInactive = false) {
  const tbody = document.getElementById('cadastros-tbody');
  if (!tbody) return;
  try {
    const endpoint = includeInactive ? '/criancas?includeInactive=true' : '/criancas';
    const criancas = await api.get(endpoint);
    tbody.innerHTML = criancas.map(c => {
      const nascimento = toBR(c.data_nascimento);
      const isInativo = c.ativo === false;
      return `
        <tr style="${isInativo ? 'opacity:0.5' : ''}">
          <td data-label="Foto">${c.foto_path
            ? `<img src="${API_BASE_URL.replace('/api/v1','')}/${c.foto_path}" class="table-avatar" style="object-fit:cover" onerror="this.outerHTML='<div class=table-avatar>${esc(c.nome).charAt(0)}</div>'">`
            : `<div class="table-avatar">${esc(c.nome).charAt(0)}</div>`}</td>
          <td data-label="Matrícula">${c.id_matricula}</td>
          <td data-label="Nome">${esc(c.nome)}</td>
          <td data-label="Nascimento">${nascimento}</td>
          <td data-label="Status"><span class="badge ${isInativo ? 'badge-inativo' : 'badge-ativo'}">${isInativo ? 'Inativo' : 'Ativo'}</span></td>
          <td data-label="Ações">
            <div class="action-btns">
              ${isInativo ? '<span style="color:var(--paragrafo);font-size:12px">Excluido</span>' : `
              <button class="action-btn" title="Editar" onclick="window.location.href='cadastrar-crianca.html?id=${c.id_matricula}'"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>
              <button class="action-btn" title="Declaracao" onclick="abrirDeclaracao(${c.id_matricula},'${esc(c.nome)}')"><i data-lucide="file-signature" style="width:14px;height:14px"></i></button>
              <button class="action-btn delete" title="Excluir" onclick="confirmarExclusao(${c.id_matricula},'${esc(c.nome)}','criança')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>`}
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
    if (ativosEl) ativosEl.textContent = criancas.filter(c => c.ativo !== false).length;
    if (mesEl) mesEl.textContent = criancas.length;
    const countEl = document.getElementById('cadastros-count');
    if (countEl) countEl.textContent = `${criancas.length} criança(s) encontrada(s)`;
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
    // Buscar ultima frequencia de cada crianca
    const freqPromises = criancas.map(c =>
      api.get(`/frequencia/crianca/${c.id_matricula}`).catch(() => [])
    );
    const freqResults = await Promise.all(freqPromises);

    tbody.innerHTML = criancas.map((c, i) => {
      const registros = freqResults[i] || [];
      // Ultimo registro presente
      const ultimoPresente = registros.find(r => r.status?.toLowerCase() === 'presente');
      const ultimaData = ultimoPresente?.data_registro ? toBR(ultimoPresente.data_registro) : '—';
      return `
      <tr data-matricula="${c.id_matricula}" data-status="">
        <td data-label="Matrícula">${c.id_matricula}</td>
        <td data-label="Nome">${esc(c.nome)}</td>
        <td data-label="Última Presença">${ultimaData}</td>
        <td data-label="Status">
          <div class="freq-btn-group">
            <button class="freq-btn presente">Presente</button>
            <button class="freq-btn ausente">Ausente</button>
          </div>
          <input class="obs-falta form-input" type="text" placeholder="Motivo da falta (ex: consulta medica)" style="display:none;margin-top:8px;font-size:13px;padding:8px 12px;border:2px solid #FFA726;border-radius:8px;width:100%;max-width:300px">
        </td>
        <td data-label="Visualizar">
          <button class="btn btn-outline btn-sm" onclick="window.location.href='historico-presenca.html?id=${c.id_matricula}'">Ver histórico</button>
        </td>
      </tr>`;
    }).join('');
    initFreqButtons();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--paragrafo)">Erro ao carregar dados.</td></tr>';
    console.error(err);
  }
}

async function renderUsuariosTable(includeInactive = false) {
  const tbody = document.getElementById('usuarios-tbody');
  if (!tbody) return;
  const nivelLabel = { 1: 'Voluntário', 2: 'Gestor', 3: 'Diretor' };
  const currentUser = Auth.getUser();
  const myNivel = currentUser?.nivel_acesso ?? 1;
  const myId = currentUser?.id ?? currentUser?.id_usuario;
  try {
    const endpoint = includeInactive ? '/usuarios?includeInactive=true' : '/usuarios';
    const usuarios = await api.get(endpoint);
    tbody.innerHTML = usuarios.map(u => {
      const isMe = u.id_usuario === myId;
      let actions = '';

      if (myNivel >= 2) {
        // Gestor+Diretor: editar e excluir usuarios (menos a si mesmo)
        actions += `<button class="action-btn" title="Editar" onclick="abrirEditarUsuario(${u.id_usuario},'${esc(u.nome)}','${esc(u.email)}',${u.nivel_acesso})"><i data-lucide="pencil" style="width:14px;height:14px"></i></button>`;
        if (myNivel === 3) {
          // Somente Diretor: redefinir senha
          actions += `<button class="action-btn" title="Redefinir senha" onclick="abrirResetSenha(${u.id_usuario},'${esc(u.nome)}')"><i data-lucide="key-round" style="width:14px;height:14px"></i></button>`;
        }
        if (!isMe) {
          actions += `<button class="action-btn delete" title="Excluir" onclick="confirmarExclusao(${u.id_usuario},'${esc(u.nome)}','usuario')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>`;
        }
      }

      const isInativo = u.ativo === false;
      return `
      <tr style="${isInativo ? 'opacity:0.5' : ''}">
        <td data-label="Nome">${esc(u.nome)}${isMe ? ' <span style="font-size:11px;color:var(--paragrafo)">(você)</span>' : ''}</td>
        <td data-label="Função">${nivelLabel[u.nivel_acesso] ?? 'Voluntário'}</td>
        <td data-label="Email"><a href="mailto:${esc(u.email)}" style="color:var(--paragrafo)">${esc(u.email)}</a></td>
        <td data-label="Status"><span class="badge ${isInativo ? 'badge-inativo' : 'badge-ativo'}">${isInativo ? 'Inativo' : 'Ativo'}</span></td>
        <td data-label="Ações">
          <div class="action-btns">${isInativo ? '<span style="color:var(--paragrafo);font-size:12px">Excluido</span>' : (actions || '<span style="color:var(--paragrafo);font-size:12px">—</span>')}</div>
        </td>
      </tr>`;
    }).join('');
    lucide.createIcons();
    const countEl = document.getElementById('usuarios-count');
    if (countEl) countEl.textContent = `${usuarios.length} usuário(s)`;
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--paragrafo)">Erro ao carregar dados.</td></tr>';
    console.error(err);
  }
}

async function renderPermissoesTable() {
  const tbody = document.getElementById('perm-tbody');
  if (!tbody) return;
  try {
    const usuarios = await api.get('/usuarios');
    tbody.innerHTML = usuarios.map(u => `
      <tr>
        <td data-label="Usuário"><strong>${esc(u.nome)}</strong></td>
        <td data-label="Email" style="color:var(--paragrafo)">${esc(u.email)}</td>
        <td data-label="Nível">
          <select class="form-select" data-userid="${u.id_usuario}" onchange="handleNivelChange(this)" style="max-width:200px">
            <option value="1" ${u.nivel_acesso === 1 ? 'selected' : ''}>Voluntário (1)</option>
            <option value="2" ${u.nivel_acesso === 2 ? 'selected' : ''}>Gestor (2)</option>
            <option value="3" ${u.nivel_acesso === 3 ? 'selected' : ''}>Diretor (3)</option>
          </select>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--paragrafo)">Erro ao carregar usuários.</td></tr>';
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
            <div style="font-weight:700;color:var(--titulo)">${esc(a.titulo)}</div>
          </td>
          <td data-label="Responsável">${esc(a.responsavel?.nome ?? '—')}</td>
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
              ${esc(d.doador)}
            </div>
          </td>
          <td data-label="Tipo"><span class="donation-type-badge tipo-${esc(d.tipo).toLowerCase()}">${esc(d.tipo).charAt(0).toUpperCase()+esc(d.tipo).slice(1)}</span></td>
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
      select.innerHTML += `<option value="${u.id_usuario}">${esc(u.nome)}</option>`;
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
      turno:  r.turno || '',
      observacao: r.observacao || '',
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
            <div class="log-obs${!isPres && r.observacao ? ' alert' : ''}">${r.observacao || '—'}${r.turno ? ` <span style="font-size:11px;color:#94a3b8">(${r.turno})</span>` : ''}</div>
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
      break;

    case 'home':
      if (!Auth.requireAuth()) break;
      setActiveNav('home');
      break;

    case 'dashboard':
      if (!Auth.requireAuth()) break;
      setActiveNav('dashboard');
      renderDashboard();
      break;

    case 'cadastros':
      if (!Auth.requireAuth()) break;
      setActiveNav('cadastros');
      renderCadastrTable();
      initSearch('search-criancas', 'cadastros-tbody', [1, 2]);
      document.getElementById('form-declaracao')?.addEventListener('submit', handleDeclaracao);
      break;

    case 'frequencia':
      if (!Auth.requireAuth()) break;
      setActiveNav('frequencia');
      renderFreqTable();
      initSearch('search-freq', 'freq-tbody', [0, 1]);
      document.getElementById('btn-salvar-chamada')?.addEventListener('click', salvarChamada);
      // Definir data de hoje no input (YYYY-MM-DD para type="date")
      const freqDate = document.getElementById('freq-date');
      if (freqDate) freqDate.value = new Date().toISOString().slice(0, 10);
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
      document.getElementById('form-voluntario')?.addEventListener('submit', handleCadastrarVoluntario);
      break;

    case 'admin-permissoes':
      if (!Auth.requireAuth()) break;
      setActiveNav('admin');
      renderPermissoesTable();
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
      setActiveNav('cadastros');
      initPhotoUpload();
      // Bloqueia data de nascimento >= hoje
      const _nascInput = document.getElementById('c-nascimento');
      if (_nascInput) {
        const _ontem = new Date();
        _ontem.setDate(_ontem.getDate() - 1);
        _nascInput.max = _ontem.toISOString().slice(0, 10);
      }
      document.getElementById('form-crianca')?.addEventListener('submit', handleCadastrarCrianca);
      // Se tem ?id=X, preenche o formulario com dados do BD (edicao)
      const editId = new URLSearchParams(window.location.search).get('id');
      if (editId) {
        (async () => {
          try {
            const c = await api.get(`/criancas/${editId}`);
            document.getElementById('c-nome').value = c.nome || '';
            document.getElementById('c-nascimento').value = c.data_nascimento ? c.data_nascimento.slice(0, 10) : '';
            document.getElementById('c-entrada').value = c.data_entrada ? c.data_entrada.slice(0, 10) : '';
            document.getElementById('c-cpf').value = c.cpf || '';
            const generoSelect = document.getElementById('c-genero');
            if (generoSelect && c.genero) generoSelect.value = c.genero;
            // Preencher foto (se existir)
            if (c.foto_path) {
              const photoUpload = document.querySelector('.photo-upload');
              if (photoUpload) {
                const img = document.createElement('img');
                img.className = 'preview';
                img.src = `${API_BASE_URL.replace('/api/v1', '')}/${c.foto_path}`;
                img.onerror = () => img.remove(); // Se arquivo nao existe no servidor
                photoUpload.appendChild(img);
                const icon = photoUpload.querySelector('.photo-upload-icon');
                const text = photoUpload.querySelector('.photo-upload-text');
                if (icon) icon.style.display = 'none';
                if (text) text.style.display = 'none';
              }
            }
            // Mostrar documentos ja importados
            const docsContainer = document.getElementById('c-docs')?.closest('.form-group');
            if (docsContainer && (c.certidao_nasc || c.cartao_vacina)) {
              const baseUrl = API_BASE_URL.replace('/api/v1', '');
              let docsHtml = '<div style="margin-top:8px;font-size:12px">';
              docsHtml += '<strong style="color:var(--titulo)">Documentos importados:</strong><ul style="margin:4px 0;padding-left:16px">';
              if (c.certidao_nasc) docsHtml += `<li><a href="${baseUrl}/${c.certidao_nasc}" target="_blank" style="color:#FFA726">Certidao de nascimento</a></li>`;
              if (c.cartao_vacina) docsHtml += `<li><a href="${baseUrl}/${c.cartao_vacina}" target="_blank" style="color:#FFA726">Cartao de vacina</a></li>`;
              docsHtml += '</ul></div>';
              docsContainer.insertAdjacentHTML('beforeend', docsHtml);
            }
            // Preencher dados do responsavel
            if (c.responsavel) {
              document.getElementById('r-nome').value = c.responsavel.nome || '';
              document.getElementById('r-cpf').value = c.responsavel.cpf || '';
              document.getElementById('r-tel').value = c.responsavel.contato || '';
              document.getElementById('r-end').value = c.responsavel.endereco || '';
            }
          } catch (err) {
            console.error('Erro ao carregar dados da criança:', err);
          }
        })();
      }
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
