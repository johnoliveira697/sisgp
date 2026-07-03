// ==========================================================================
// SISTEMA DE GESTÃO DE PESSOAL - LÓGICA DO FRONTEND (SPA)
// ==========================================================================

const API_BASE = '/api';

// Estado da aplicação
const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  soldos: [], // Tabela de soldos carregada do backend
  usuarios: [], // Lista de todos os usuários (apenas para admin)
  userResumo: null, // Dados de missões, férias, dispensas do usuário logado
  missoesPagamento: [], // Lista de missões para controle na aba de Pagamentos
  saquesEtapaAdmin: [] // Lista de saques etapa para o administrador
};

// Elementos do DOM
const DOM = {
  toast: document.getElementById('toast'),
  themeToggle: document.getElementById('theme-toggle'),
  sunIcon: document.querySelector('.sun-icon'),
  moonIcon: document.querySelector('.moon-icon'),
  
  // Containers Principais
  loginContainer: document.getElementById('login-container'),
  appContainer: document.getElementById('app-container'),
  
  // Formulário Login e Cadastro (Ring Layout)
  loginFormWrapper: document.getElementById('login-form-wrapper'),
  signupFormWrapper: document.getElementById('signup-form-wrapper'),
  linkAbrirCadastro: document.getElementById('link-abrir-cadastro'),
  linkVoltarLogin: document.getElementById('link-voltar-login'),
  loginForm: document.getElementById('login-form'),
  loginMatricula: document.getElementById('login-matricula'),
  loginSenha: document.getElementById('login-senha'),
  signupForm: document.getElementById('signup-form'),
  signupNome: document.getElementById('signup-nome'),
  signupMatricula: document.getElementById('signup-matricula'),
  signupSenha: document.getElementById('signup-senha'),
  signupPosto: document.getElementById('signup-posto'),
  
  // Cabeçalho Usuário
  userDisplayName: document.getElementById('user-display-name'),
  userDisplayPosto: document.getElementById('user-display-posto'),
  userDisplayRole: document.getElementById('user-display-role'),
  btnLogout: document.getElementById('btn-logout'),
  
  // Navegação
  navItems: document.querySelectorAll('.nav-item'),
  navAdminTab: document.getElementById('nav-admin-tab'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  
  // Meu Painel (Stats & Balance)
  statDiasMissao: document.getElementById('stat-dias-missao'),
  statGratificacao: document.getElementById('stat-gratificacao'),
  statSaqueAlimentacao: document.getElementById('stat-saque-alimentacao'),
  gaugeRemaining: document.getElementById('gauge-remaining'),
  gaugeFillCircle: document.getElementById('gauge-fill-circle'),
  lblDispensasAcumuladas: document.getElementById('lbl-dispensas-acumuladas'),
  lblDispensasUtilizadas: document.getElementById('lbl-dispensas-utilizadas'),
  formSolicitarDispensa: document.getElementById('form-solicitar-dispensa'),
  dispensaInicio: document.getElementById('dispensa-inicio'),
  dispensaTermino: document.getElementById('dispensa-termino'),
  dispensaObs: document.getElementById('dispensa-obs'),
  
  // Tabelas Membro
  tableUserMissoes: document.getElementById('table-user-missoes'),
  tableUserFerias: document.getElementById('table-user-ferias'),
  tableUserDispensas: document.getElementById('table-user-dispensas'),
  
  // Administração
  adminNavButtons: document.querySelectorAll('.admin-nav .btn-tab'),
  subtabPanels: document.querySelectorAll('.subtab-panel'),
  countPendentes: document.getElementById('count-pendentes'),
  
  // Admin Pessoal
  btnOpenUserModal: document.getElementById('btn-open-user-modal'),
  tableAdminPessoal: document.getElementById('table-admin-pessoal'),
  
  // Admin Lançamentos
  formAdminMissao: document.getElementById('form-admin-missao'),
  adminMissaoMilitar: document.getElementById('admin-missao-militar'),
  adminMissaoNome: document.getElementById('admin-missao-nome'),
  adminMissaoTipo: document.getElementById('admin-missao-tipo'),
  adminMissaoDesc: document.getElementById('admin-missao-desc'),
  adminMissaoInicio: document.getElementById('admin-missao-inicio'),
  adminMissaoTermino: document.getElementById('admin-missao-termino'),
  adminMissaoDispensas: document.getElementById('admin-missao-dispensas'),
  adminMissaoLocalidade: document.getElementById('admin-missao-localidade'),
  adminPainelCursos: document.getElementById('admin-painel-cursos'),
  adminMissaoGratificacao: document.getElementById('admin-missao-gratificacao'),
  adminMissaoAjudaCusto: document.getElementById('admin-missao-ajudacusto'),
  adminMissaoDiasGrat: document.getElementById('admin-missao-dias-grat'),
  // Multi-select mission
  adminMissaoModoIndividual: document.getElementById('admin-missao-modo-individual'),
  adminMissaoModoMultiplo: document.getElementById('admin-missao-modo-multiplo'),
  adminMissaoPainelIndividual: document.getElementById('admin-missao-painel-individual'),
  adminMissaoPainelMultiplo: document.getElementById('admin-missao-painel-multiplo'),
  adminMissaoListaMilitares: document.getElementById('admin-missao-lista-militares'),
  btnSelecionarTodos: document.getElementById('btn-selecionar-todos'),
  btnLimparSelecao: document.getElementById('btn-limpar-selecao'),
  btnAdminMissaoSubmit: document.getElementById('btn-admin-missao-submit'),
  
  // Preview Painel Missão
  previewDias: document.getElementById('preview-dias'),
  previewGratificacao: document.getElementById('preview-gratificacao'),
  previewLocalidade: document.getElementById('preview-localidade'),
  previewAjudaCusto: document.getElementById('preview-ajudacusto'),
  previewSaque: document.getElementById('preview-saque'),
  previewDispensas: document.getElementById('preview-dispensas'),
  
  // Admin Férias & Dispensa Direta
  formAdminFerias: document.getElementById('form-admin-ferias'),
  adminFeriasMilitar: document.getElementById('admin-ferias-militar'),
  adminFeriasInicio: document.getElementById('admin-ferias-inicio'),
  adminFeriasTermino: document.getElementById('admin-ferias-termino'),
  
  formAdminDispensaDireta: document.getElementById('form-admin-dispensa-direta'),
  adminDispMilitar: document.getElementById('admin-disp-militar'),
  adminDispInicio: document.getElementById('admin-disp-inicio'),
  adminDispTermino: document.getElementById('admin-disp-termino'),
  adminDispObs: document.getElementById('admin-disp-obs'),
  
  // Admin Aprovação
  tableAdminDispensas: document.getElementById('table-admin-dispensas'),
  
  // Modal Usuário
  userModal: document.getElementById('user-modal'),
  btnCloseUserModal: document.getElementById('btn-close-user-modal'),
  btnCancelUserModal: document.getElementById('btn-cancel-user-modal'),
  formUserSave: document.getElementById('form-user-save'),
  modalUserTitle: document.getElementById('modal-user-title'),
  userIdEdit: document.getElementById('user-id-edit'),
  userNome: document.getElementById('user-nome'),
  userMatricula: document.getElementById('user-matricula'),
  userSenha: document.getElementById('user-senha'),
  userSenhaHelp: document.getElementById('user-senha-help'),
  userPosto: document.getElementById('user-posto'),
  userSoldo: document.getElementById('user-soldo'),
  userRole: document.getElementById('user-role'),
  userDispensasIniciais: document.getElementById('user-dispensas-iniciais'),

  // Novas referências (Fase 2)
  formMembroMissao: document.getElementById('form-membro-missao'),
  membroMissaoNome: document.getElementById('membro-missao-nome'),
  membroMissaoTipo: document.getElementById('membro-missao-tipo'),
  membroMissaoDesc: document.getElementById('membro-missao-desc'),
  membroMissaoInicio: document.getElementById('membro-missao-inicio'),
  membroMissaoTermino: document.getElementById('membro-missao-termino'),
  membroMissaoLocalidade: document.getElementById('membro-missao-localidade'),
  membroPainelCursos: document.getElementById('membro-painel-cursos'),
  membroMissaoGratificacao: document.getElementById('membro-missao-gratificacao'),
  membroMissaoAjudaCusto: document.getElementById('membro-missao-ajudacusto'),
  membroMissaoDiasGrat: document.getElementById('membro-missao-dias-grat'),
  membroPreviewDias: document.getElementById('membro-preview-dias'),
  membroPreviewGratificacao: document.getElementById('membro-preview-gratificacao'),
  membroPreviewLocalidade: document.getElementById('membro-preview-localidade'),
  membroPreviewAjudaCusto: document.getElementById('membro-preview-ajudacusto'),
  membroPreviewSaque: document.getElementById('membro-preview-saque'),
  membroPreviewDispensas: document.getElementById('membro-preview-dispensas'),

  dispensaTipo: document.getElementById('dispensa-tipo'),
  adminDispTipo: document.getElementById('admin-disp-tipo'),
  tablePagamentosBody: document.getElementById('table-pagamentos-body'),
  adminActionsHeader: document.querySelector('#tab-pagamentos .admin-actions-header'),

  // Modal de BIs
  biModal: document.getElementById('bi-modal'),
  btnCloseBiModal: document.getElementById('btn-close-bi-modal'),
  btnCancelBiModal: document.getElementById('btn-cancel-bi-modal'),
  formBiSave: document.getElementById('form-bi-save'),
  biMissaoId: document.getElementById('bi-missao-id'),
  biDeslocamento: document.getElementById('bi-deslocamento'),
  biRetorno: document.getElementById('bi-retorno'),
  biSolicitacaoGratificacao: document.getElementById('bi-solicitacao-gratificacao'),
  biAutorizacaoPagamento: document.getElementById('bi-autorizacao-pagamento'),
  biPagamento: document.getElementById('bi-pagamento'),
  biSolicitacaoSaqueAlimentacao: document.getElementById('bi-solicitacao-saque-alimentacao'),
  biPagamentoSaqueEtapa: document.getElementById('bi-pagamento-saque-etapa'),
  biObservacaoPagamento: document.getElementById('bi-observacao-pagamento'),

  // Container de impressão
  reportPrintContainer: document.getElementById('report-print-container'),

  // Novas referências de Saque Etapa e Destino Diário (Revisão Fase 2)
  formSolicitarSaqueEtapa: document.getElementById('form-solicitar-saque-etapa'),
  saqueInicio: document.getElementById('saque-inicio'),
  saqueTermino: document.getElementById('saque-termino'),
  saqueEtapas: document.getElementById('saque-etapas'),
  lblSaqueValorPreview: document.getElementById('lbl-saque-valor-preview'),
  saqueObs: document.getElementById('saque-obs'),
  tableUserSaquesEtapa: document.getElementById('table-user-saques-etapa'),

  filtroDataDestino: document.getElementById('filtro-data-destino'),
  btnBuscarDestino: document.getElementById('btn-buscar-destino'),
  tituloDestinoDiario: document.getElementById('titulo-destino-diario'),
  btnImprimirDestino: document.getElementById('btn-imprimir-destino'),
  tableDestinoDiarioBody: document.getElementById('table-destino-diario-body'),

  countSaquesPendentes: document.getElementById('count-saques-pendentes'),
  tableAdminSaquesEtapa: document.getElementById('table-admin-saques-etapa'),

  saqueBiModal: document.getElementById('saque-bi-modal'),
  btnCloseSaqueBiModal: document.getElementById('btn-close-saque-bi-modal'),
  btnCancelSaqueBiModal: document.getElementById('btn-cancel-saque-bi-modal'),
  formSaqueBiSave: document.getElementById('form-saque-bi-save'),
  saqueBiId: document.getElementById('saque-bi-id'),
  saqueBiSolicitacao: document.getElementById('saque-bi-solicitacao'),
  saqueBiPagamento: document.getElementById('saque-bi-pagamento'),
  saqueBiObservacao: document.getElementById('saque-bi-observacao'),

  // Elementos do Modal de Edição de Missão
  editMissaoModal: document.getElementById('edit-missao-modal'),
  closeEditMissaoModal: document.getElementById('close-edit-missao-modal'),
  formEditMissao: document.getElementById('form-edit-missao'),
  editMissaoId: document.getElementById('edit-missao-id'),
  editMissaoNome: document.getElementById('edit-missao-nome'),
  editMissaoTipo: document.getElementById('edit-missao-tipo'),
  editMissaoDescricao: document.getElementById('edit-missao-descricao'),
  editMissaoInicio: document.getElementById('edit-missao-inicio'),
  editMissaoTermino: document.getElementById('edit-missao-termino'),
  editMissaoLocalidade: document.getElementById('edit-missao-localidade'),
  editPainelCursos: document.getElementById('edit-painel-cursos'),
  editMissaoGratificacao: document.getElementById('edit-missao-gratificacao'),
  editMissaoAjudacusto: document.getElementById('edit-missao-ajudacusto'),
  editMissaoDiasGrat: document.getElementById('edit-missao-dias-grat'),
  editMissaoReceberSaque: document.getElementById('edit-missao-receber-saque'),
  editPainelSaque: document.getElementById('edit-painel-saque'),
  editMissaoDiasSaque: document.getElementById('edit-missao-dias-saque'),
  editMissaoQtdSaque: document.getElementById('edit-missao-qtd-saque'),

  // Checkboxes Saque Lançamento
  adminMissaoReceberSaque: document.getElementById('admin-missao-receber-saque'),
  adminPainelSaque: document.getElementById('admin-painel-saque'),
  adminMissaoDiasSaque: document.getElementById('admin-missao-dias-saque'),
  adminMissaoQtdSaque: document.getElementById('admin-missao-qtd-saque'),

  membroMissaoReceberSaque: document.getElementById('membro-missao-receber-saque'),
  membroPainelSaque: document.getElementById('membro-painel-saque'),
  membroMissaoDiasSaque: document.getElementById('membro-missao-dias-saque'),
  membroMissaoQtdSaque: document.getElementById('membro-missao-qtd-saque'),

  // Novo campo observacao no modal de usuario
  userObservacao: document.getElementById('user-observacao'),

  // Filtros e paginação - Histórico de Missões
  filtroMissaoAno: document.getElementById('filtro-missao-ano'),
  filtroMissaoMes: document.getElementById('filtro-missao-mes'),
  btnLimparFiltroMissao: document.getElementById('btn-limpar-filtro-missao'),
  lblTotalMissoes: document.getElementById('lbl-total-missoes'),
  paginacaoMissoes: document.getElementById('paginacao-missoes'),

  // Filtros e paginação - Pagamentos
  filtroPagamentoAno: document.getElementById('filtro-pagamento-ano'),
  lblTotalPagamentos: document.getElementById('lbl-total-pagamentos'),
  paginacaoPagamentos: document.getElementById('paginacao-pagamentos'),

  // Modal de confirmação customizado
  modalConfirmacao: document.getElementById('modal-confirmacao'),
  modalConfirmacaoTitulo: document.getElementById('modal-confirmacao-titulo'),
  modalConfirmacaoMsg: document.getElementById('modal-confirmacao-msg'),
  modalConfirmacaoCancelar: document.getElementById('modal-confirmacao-cancelar'),
  modalConfirmacaoConfirmar: document.getElementById('modal-confirmacao-confirmar')
};

// ----------------------------------------------------
// SISTEMA DE NOTIFICAÇÃO (TOAST)
// ----------------------------------------------------
function showToast(message, type = 'success') {
  DOM.toast.textContent = message;
  DOM.toast.className = `toast ${type}`;
  DOM.toast.classList.remove('hidden');
  
  setTimeout(() => {
    DOM.toast.classList.add('hidden');
  }, 4000);
}

// ----------------------------------------------------
// TEMA CLARO / ESCURO
// ----------------------------------------------------
function initTheme() {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  if (currentTheme === 'light') {
    DOM.sunIcon.classList.remove('hidden');
    DOM.moonIcon.classList.add('hidden');
  } else {
    DOM.sunIcon.classList.add('hidden');
    DOM.moonIcon.classList.remove('hidden');
  }
}

DOM.themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  DOM.sunIcon.classList.toggle('hidden');
  DOM.moonIcon.classList.toggle('hidden');
});

// ----------------------------------------------------
// AUTENTICAÇÃO E INICIALIZAÇÃO
// ----------------------------------------------------
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {})
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  
  const data = await response.json();
  
  // Interceptar sessão expirada (401/403) e fazer logout automático
  if (response.status === 401 || response.status === 403) {
    const isLoginRoute = endpoint === '/login';
    if (!isLoginRoute && state.token) {
      showToast('Sua sessão expirou. Faça login novamente.', 'error');
      state.token = null;
      state.user = null;
      setTimeout(() => renderAuthView(), 1500);
      throw new Error('Sessão expirada.');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição.');
  }
  
  return data;
}

// ----------------------------------------------------
// MODAL DE CONFIRMAÇÃO CUSTOMIZADO
// ----------------------------------------------------
function confirmar(titulo, mensagem) {
  return new Promise((resolve) => {
    DOM.modalConfirmacaoTitulo.textContent = titulo;
    DOM.modalConfirmacaoMsg.textContent = mensagem;
    DOM.modalConfirmacao.classList.remove('hidden');

    function onConfirmar() {
      DOM.modalConfirmacao.classList.add('hidden');
      cleanup();
      resolve(true);
    }
    function onCancelar() {
      DOM.modalConfirmacao.classList.add('hidden');
      cleanup();
      resolve(false);
    }
    function cleanup() {
      DOM.modalConfirmacaoConfirmar.removeEventListener('click', onConfirmar);
      DOM.modalConfirmacaoCancelar.removeEventListener('click', onCancelar);
    }

    DOM.modalConfirmacaoConfirmar.addEventListener('click', onConfirmar);
    DOM.modalConfirmacaoCancelar.addEventListener('click', onCancelar);
  });
}

// Inicializar tela do app com base no estado de login
function renderAuthView() {
  if (state.token && state.user) {
    DOM.loginContainer.classList.add('hidden');
    DOM.appContainer.classList.remove('hidden');
    
    // Atualizar cabeçalho
    DOM.userDisplayName.textContent = state.user.nome;
    DOM.userDisplayPosto.textContent = state.user.posto_graduacao;
    DOM.userDisplayRole.textContent = state.user.role === 'admin' ? 'Administrador' : 'Membro';
    DOM.userDisplayRole.className = `badge badge-role ${state.user.role === 'admin' ? 'badge-admin' : ''}`;
    
    if (state.user.role === 'admin') {
      DOM.navAdminTab.classList.remove('hidden');
    } else {
      DOM.navAdminTab.classList.add('hidden');
    }
    
    // Carregar dados principais
    loadUserData();
    loadSoldosTable();
  } else {
    DOM.loginContainer.classList.remove('hidden');
    DOM.appContainer.classList.add('hidden');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// Login Form Submit
DOM.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const matricula = DOM.loginMatricula.value.trim();
  const senha = DOM.loginSenha.value;
  
  try {
    const data = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ matricula, senha })
    });
    
    state.token = data.token;
    state.user = data.user;
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    showToast(`Bem-vindo, ${data.user.nome}!`);
    renderAuthView();
    
    // Reset formulário
    DOM.loginMatricula.value = '';
    DOM.loginSenha.value = '';
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Alternar para tela de cadastro
if (DOM.linkAbrirCadastro) {
  DOM.linkAbrirCadastro.addEventListener('click', (e) => {
    e.preventDefault();
    DOM.loginFormWrapper.classList.add('hidden');
    DOM.signupFormWrapper.classList.remove('hidden');
  });
}

// Alternar para tela de login
if (DOM.linkVoltarLogin) {
  DOM.linkVoltarLogin.addEventListener('click', (e) => {
    e.preventDefault();
    DOM.loginFormWrapper.classList.remove('hidden');
    DOM.signupFormWrapper.classList.add('hidden');
  });
}

// Link Esqueci Senha
const linkEsqueci = document.getElementById('link-esqueci-senha');
if (linkEsqueci) {
  linkEsqueci.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Entre em contato com o Administrador para redefinir sua senha.', 'error');
  });
}

// Submit do formulário de cadastro público (Signup)
if (DOM.signupForm) {
  DOM.signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = DOM.signupNome.value.trim();
    const matricula = DOM.signupMatricula.value.trim();
    const senha = DOM.signupSenha.value;
    const posto_graduacao = DOM.signupPosto.value;
    
    if (!posto_graduacao) {
      showToast('Por favor, selecione seu Posto ou Graduação.', 'error');
      return;
    }
    
    try {
      const response = await apiFetch('/signup', {
        method: 'POST',
        body: JSON.stringify({ nome, matricula, senha, posto_graduacao })
      });
      
      showToast(response.message);
      
      // Resetar formulário de cadastro
      DOM.signupForm.reset();
      
      // Voltar para login
      DOM.loginFormWrapper.classList.remove('hidden');
      DOM.signupFormWrapper.classList.add('hidden');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Logout
DOM.btnLogout.addEventListener('click', () => {
  state.token = null;
  state.user = null;
  renderAuthView();
  showToast('Sessão encerrada.');
});

// ----------------------------------------------------
// CARREGAMENTO DE DADOS E RENDERIZAÇÃO
// ----------------------------------------------------

async function loadSoldosTable() {
  try {
    state.soldos = await apiFetch('/soldos');
    
    // Popular select de postos no modal de cadastro (admin)
    if (DOM.userPosto) {
      DOM.userPosto.innerHTML = '<option value="">Selecione...</option>';
    }
    // Popular select de postos no cadastro público (signup)
    if (DOM.signupPosto) {
      DOM.signupPosto.innerHTML = '<option value="" disabled selected>Posto ou Graduação</option>';
    }
    
    state.soldos.forEach(s => {
      // Para o modal de admin
      if (DOM.userPosto) {
        const opt = document.createElement('option');
        opt.value = s.posto_graduacao;
        opt.textContent = `${s.posto_graduacao} - R$ ${formatarMoeda(s.soldo)}`;
        DOM.userPosto.appendChild(opt);
      }
      
      // Para o cadastro público
      if (DOM.signupPosto) {
        const opt = document.createElement('option');
        opt.value = s.posto_graduacao;
        opt.textContent = s.posto_graduacao;
        DOM.signupPosto.appendChild(opt);
      }
    });
  } catch (error) {
    console.error('Erro ao carregar soldos:', error);
  }
}

async function loadUserData() {
  try {
    const data = await apiFetch('/membro/resumo');
    state.userResumo = data;
    
    renderMembroDashboard(data);
    loadAndRenderPagamentos(); // Carrega aba Pagamentos
    
    if (state.user.role === 'admin') {
      loadAdminData();
    }
  } catch (error) {
    showToast('Erro ao carregar dados do usuário.', 'error');
  }
}

// Renderizar painéis do membro comum
function renderMembroDashboard(data) {
  const { resumo, missoes, ferias, dispensas } = data;
  
  // Atualizar Stats Cards
  DOM.statDiasMissao.textContent = `${resumo.totalDiasMissao} dias`;
  DOM.statGratificacao.textContent = `R$ ${formatarMoeda(resumo.totalGratificacao)}`;
  DOM.statSaqueAlimentacao.textContent = `R$ ${formatarMoeda(resumo.totalSaqueAlimentacao)}`;
  
  // Atualizar Medidor Circular (Gauge)
  DOM.gaugeRemaining.textContent = resumo.dispensasRestantes;
  
  const total = resumo.dispensasAcumuladas;
  const restantes = resumo.dispensasRestantes;
  const pct = total > 0 ? (restantes / total) : 0;
  
  // 251.2 é o perímetro do círculo (r=40, 2*PI*40 = 251.2)
  const offset = 251.2 - (251.2 * pct);
  DOM.gaugeFillCircle.style.strokeDashoffset = offset;
  
  // Cor dinâmica do Gauge com base no saldo
  if (restantes <= 0) {
    DOM.gaugeFillCircle.style.stroke = 'var(--danger)';
  } else if (restantes <= 3) {
    DOM.gaugeFillCircle.style.stroke = 'var(--warning)';
  } else {
    DOM.gaugeFillCircle.style.stroke = 'var(--primary)';
  }
  
  DOM.lblDispensasAcumuladas.textContent = `${total} dias`;
  DOM.lblDispensasUtilizadas.textContent = `${resumo.dispensasUtilizadas} dias`;
  
  // Renderizar Tabela de Missões do Usuário
  state._todasMissoes = missoes; // Guardar para filtro/paginação
  renderMissoesComFiltro();
  popularFiltroMissaoAnos(missoes);
  
  // Renderizar Tabela de Férias do Usuário
  state._feriasUser = ferias;
  DOM.tableUserFerias.innerHTML = '';
  if (ferias.length === 0) {
    DOM.tableUserFerias.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhuma férias cadastrada.</td></tr>';
  } else {
    ferias.forEach(f => {
      const actions = state.user && state.user.role === 'admin'
        ? `<td data-label="Ações">
            <div style="display: flex; gap: 6px;">
             <button class="btn btn-secondary btn-icon" onclick="abrirModalEditFerias(${f.id})" title="Editar Férias">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
             </button>
             <button class="btn btn-danger btn-icon" onclick="excluirFerias(${f.id})" title="Excluir Férias">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
             </button>
            </div>
           </td>`
        : `<td data-label="Ações"></td>`;
      DOM.tableUserFerias.innerHTML += `
        <tr>
          <td data-label="Data de Início">${formatarData(f.data_inicio)}</td>
          <td data-label="Data de Término">${formatarData(f.data_termino)}</td>
          <td data-label="Total Dias"><strong>${f.dias_ferias} dias</strong></td>
          ${actions}
        </tr>
      `;
    });
  }
  
  // Renderizar Tabela de Dispensas do Usuário
  state._dispensasUser = dispensas;
  DOM.tableUserDispensas.innerHTML = '';
  if (dispensas.length === 0) {
    DOM.tableUserDispensas.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma solicitação de dispensa.</td></tr>';
  } else {
    dispensas.forEach(d => {
      const statusClass = d.status.toLowerCase();
      const tipoLabel = d.tipo_dispensa === 'comum' ? '<br><small style="color: var(--warning); font-weight: 500;">Dispensa Comum</small>' : '<br><small style="color: var(--text-muted);">Decorrente de Missão</small>';
      
      const actions = state.user && state.user.role === 'admin'
        ? `<td data-label="Ações">
            <div style="display: flex; gap: 6px;">
             <button class="btn btn-secondary btn-icon" onclick="abrirModalEditDispensa(${d.id})" title="Editar Dispensa">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
             </button>
             <button class="btn btn-danger btn-icon" onclick="excluirDispensa(${d.id})" title="Excluir Dispensa">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
             </button>
            </div>
           </td>`
        : `<td data-label="Ações"></td>`;

      DOM.tableUserDispensas.innerHTML += `
        <tr>
          <td data-label="Início">${formatarData(d.data_inicio)}</td>
          <td data-label="Término">${formatarData(d.data_termino)}</td>
          <td data-label="Dias"><strong>${d.dias_dispensa} dias</strong>${tipoLabel}</td>
          <td data-label="Motivo">${d.observacao || '<span class="text-muted">-</span>'}</td>
          <td data-label="Status"><span class="badge badge-status ${statusClass}">${d.status}</span></td>
          ${actions}
        </tr>
      `;
    });
  }

  // Renderizar Tabela de Saques Etapa do Usuário
  DOM.tableUserSaquesEtapa.innerHTML = '';
  const saques_etapa = data.saques_etapa || [];
  if (saques_etapa.length === 0) {
    DOM.tableUserSaquesEtapa.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum saque etapa solicitado.</td></tr>';
  } else {
    saques_etapa.forEach(s => {
      const statusClass = s.status.toLowerCase();
      DOM.tableUserSaquesEtapa.innerHTML += `
        <tr>
          <td data-label="Período">${formatarData(s.data_inicio)}<br>até<br>${formatarData(s.data_termino)}</td>
          <td data-label="Etapas"><strong>${s.quantidade_etapas}</strong></td>
          <td data-label="Valor">R$ ${formatarMoeda(s.valor)}</td>
          <td data-label="Status"><span class="badge badge-status ${statusClass}">${s.status}</span></td>
        </tr>
      `;
    });
  }
}

// ----------------------------------------------------
// FILTRO E PAGINAÇÃO - HISTÓRICO DE MISSÕES
// ----------------------------------------------------
const MISSOES_POR_PAG = 10;
let _missoesPagAtual = 1;

function popularFiltroMissaoAnos(missoes) {
  if (!DOM.filtroMissaoAno) return;
  const anos = [...new Set(missoes.map(m => new Date(m.data_inicio).getFullYear()))].sort((a, b) => b - a);
  DOM.filtroMissaoAno.innerHTML = '<option value="">Todos os anos</option>';
  anos.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    DOM.filtroMissaoAno.appendChild(opt);
  });
}

function renderMissoesComFiltro() {
  const missoes = state._todasMissoes || [];
  const ano = DOM.filtroMissaoAno ? DOM.filtroMissaoAno.value : '';
  const mes = DOM.filtroMissaoMes ? DOM.filtroMissaoMes.value : '';

  const filtradas = missoes.filter(m => {
    const d = new Date(m.data_inicio);
    const anoOk = !ano || d.getFullYear() === parseInt(ano);
    const mesOk = !mes || (d.getMonth() + 1) === parseInt(mes);
    return anoOk && mesOk;
  });

  // Ordenar cronologicamente pela data de início (do mais antigo para o mais novo)
  filtradas.sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));

  const total = filtradas.length;
  const totalPags = Math.max(1, Math.ceil(total / MISSOES_POR_PAG));
  if (_missoesPagAtual > totalPags) _missoesPagAtual = totalPags;

  const inicio = (_missoesPagAtual - 1) * MISSOES_POR_PAG;
  const pagina = filtradas.slice(inicio, inicio + MISSOES_POR_PAG);

  if (DOM.lblTotalMissoes) DOM.lblTotalMissoes.textContent = `${total} missão(ões) encontrada(s)`;

  DOM.tableUserMissoes.innerHTML = '';
  if (filtradas.length === 0) {
    DOM.tableUserMissoes.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhuma missão encontrada para este filtro.</td></tr>';
  } else {
    pagina.forEach(m => {
      let gratificacaoHTML = `R$ ${formatarMoeda(m.gratificacao_representacao)}`;
      if (m.ajuda_de_custo > 0) {
        gratificacaoHTML += `<br><small style="color: var(--success); font-weight: 500;">+ R$ ${formatarMoeda(m.ajuda_de_custo)} (Ajuda de Custo)</small>`;
      }
      DOM.tableUserMissoes.innerHTML += `
        <tr>
          <td data-label="Nome da Missão"><strong>${m.nome_deslocamento || m.descricao}</strong></td>
          <td data-label="Início">${formatarDataHora(m.data_inicio)}</td>
          <td data-label="Término">${formatarDataHora(m.data_termino)}</td>
          <td data-label="Duração">${m.dias_missao} dias</td>
          <td data-label="Gratificação">${gratificacaoHTML}</td>
          <td data-label="Saque Alimentação">R$ ${formatarMoeda(m.saque_alimentacao)}</td>
          <td data-label="Dispensas Geradas"><span class="badge badge-role">${m.dispensas_concedidas} dias</span></td>
          <td data-label="Ações">
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-icon" onclick='abrirEditMissaoModal(${JSON.stringify(m)}, false)' title="Editar Deslocamento">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-danger btn-icon" onclick="excluirMembroMissao(${m.id})" title="Excluir Deslocamento">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  // Renderizar paginação
  if (DOM.paginacaoMissoes) {
    DOM.paginacaoMissoes.innerHTML = '';
    if (totalPags > 1) {
      for (let p = 1; p <= totalPags; p++) {
        const btn = document.createElement('button');
        btn.className = `btn ${p === _missoesPagAtual ? 'btn-primary' : 'btn-secondary'}`;
        btn.style.cssText = 'padding:4px 12px; font-size:0.82rem; min-width:36px;';
        btn.textContent = p;
        btn.onclick = () => { _missoesPagAtual = p; renderMissoesComFiltro(); };
        DOM.paginacaoMissoes.appendChild(btn);
      }
    }
  }
}

if (DOM.filtroMissaoAno) DOM.filtroMissaoAno.addEventListener('change', () => { _missoesPagAtual = 1; renderMissoesComFiltro(); });
if (DOM.filtroMissaoMes) DOM.filtroMissaoMes.addEventListener('change', () => { _missoesPagAtual = 1; renderMissoesComFiltro(); });
if (DOM.btnLimparFiltroMissao) DOM.btnLimparFiltroMissao.addEventListener('click', () => {
  if (DOM.filtroMissaoAno) DOM.filtroMissaoAno.value = '';
  if (DOM.filtroMissaoMes) DOM.filtroMissaoMes.value = '';
  _missoesPagAtual = 1;
  renderMissoesComFiltro();
});

// Solicitar dispensa (Membro)
DOM.formSolicitarDispensa.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data_inicio = DOM.dispensaInicio.value;
  const data_termino = DOM.dispensaTermino.value;
  const observacao = DOM.dispensaObs.value.trim();
  const tipo_dispensa = DOM.dispensaTipo.value;
  
  if (new Date(data_inicio) > new Date(data_termino)) {
    showToast('A data de término deve ser igual ou posterior à data de início.', 'error');
    return;
  }
  
  try {
    const response = await apiFetch('/membro/dispensas', {
      method: 'POST',
      body: JSON.stringify({ data_inicio, data_termino, observacao, tipo_dispensa })
    });
    
    showToast(response.message);
    DOM.dispensaInicio.value = '';
    DOM.dispensaTermino.value = '';
    DOM.dispensaObs.value = '';
    DOM.dispensaTipo.value = 'missao';
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Preview do valor de Saque Etapa ao alterar a quantidade de etapas
if (DOM.saqueEtapas) {
  DOM.saqueEtapas.addEventListener('input', () => {
    const etapas = parseFloat(DOM.saqueEtapas.value) || 0;
    const valor = etapas * 13.50;
    DOM.lblSaqueValorPreview.textContent = `R$ ${formatarMoeda(valor)}`;
  });
}

// Solicitar Saque Etapa (Membro)
if (DOM.formSolicitarSaqueEtapa) {
  DOM.formSolicitarSaqueEtapa.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data_inicio = DOM.saqueInicio.value;
    const data_termino = DOM.saqueTermino.value;
    const quantidade_etapas = parseInt(DOM.saqueEtapas.value);
    const observacao = DOM.saqueObs.value.trim();
    
    if (new Date(data_inicio) > new Date(data_termino)) {
      showToast('A data de término deve ser igual ou posterior à data de início.', 'error');
      return;
    }
    
    try {
      const response = await apiFetch('/membro/saques-etapa', {
        method: 'POST',
        body: JSON.stringify({ data_inicio, data_termino, quantidade_etapas, observacao })
      });
      
      showToast(response.message);
      DOM.saqueInicio.value = '';
      DOM.saqueTermino.value = '';
      DOM.saqueEtapas.value = '';
      DOM.lblSaqueValorPreview.textContent = 'R$ 0,00';
      DOM.saqueObs.value = '';
      loadUserData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// ----------------------------------------------------
// DADOS E FUNÇÕES DO ADMINISTRADOR (ADMIN ONLY)
// ----------------------------------------------------

async function loadAdminData() {
  try {
    // Carregar usuários
    state.usuarios = await apiFetch('/admin/usuarios');
    renderAdminPessoalTable();
    populateMilitarDropdowns();
    
    // Carregar solicitações de dispensas para aprovação
    const dispensasAdmin = await apiFetch('/admin/dispensas');
    renderAdminDispensasTable(dispensasAdmin);

    // Carregar solicitações de saques etapa para aprovação
    const saquesAdmin = await apiFetch('/admin/saques-etapa');
    state.saquesEtapaAdmin = saquesAdmin;
    renderAdminSaquesTable(saquesAdmin);
  } catch (error) {
    console.error('Erro ao carregar dados do administrador:', error);
  }
}

// Renderizar Tabela de Solicitações de Saque Etapa para o Admin
function renderAdminSaquesTable(saques) {
  DOM.tableAdminSaquesEtapa.innerHTML = '';
  const pendentes = saques.filter(s => s.status === 'Pendente');
  DOM.countSaquesPendentes.textContent = pendentes.length;
  
  if (saques.length === 0) {
    DOM.tableAdminSaquesEtapa.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Nenhuma solicitação de saque etapa.</td></tr>';
    return;
  }
  
  saques.forEach(s => {
    const statusClass = s.status.toLowerCase();
    const isPendente = s.status === 'Pendente';
    
    let acoes = '';
    if (isPendente) {
      acoes = `
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-success btn-icon" onclick="decidirSaqueEtapa(${s.id}, 'Aprovada')" title="Aprovar Saque">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
          <button class="btn btn-danger btn-icon" onclick="decidirSaqueEtapa(${s.id}, 'Rejeitada')" title="Rejeitar Saque">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;
    } else {
      acoes = `
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-icon" onclick="abrirSaqueBiModal(${s.id})" title="Editar BIs de Saque">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn btn-danger btn-icon" onclick="removerSaqueEtapa(${s.id})" title="Remover Saque">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;
    }
    
    const biDetails = s.status === 'Aprovada'
      ? `<br><small style="color: var(--text-muted); font-weight: 500;">Sol: ${s.bi_solicitacao || '-'} | Pag: ${s.bi_pagamento || '-'}</small>`
      : '';
      
    DOM.tableAdminSaquesEtapa.innerHTML += `
      <tr>
        <td data-label="Militar"><strong>${s.nome}</strong></td>
        <td data-label="Posto / Grad">${s.posto_graduacao}</td>
        <td data-label="Início">${formatarData(s.data_inicio)}</td>
        <td data-label="Término">${formatarData(s.data_termino)}</td>
        <td data-label="Etapas"><strong>${s.quantidade_etapas}</strong></td>
        <td data-label="Valor">R$ ${formatarMoeda(s.valor)}</td>
        <td data-label="Obs / Detalhes">${s.observacao || '<span class="text-muted">-</span>'}${biDetails}</td>
        <td data-label="Status"><span class="badge badge-status ${statusClass}">${s.status}</span></td>
        <td data-label="Ações">${acoes}</td>
      </tr>
    `;
  });
}

// Popular dropdowns com a lista de militares
function populateMilitarDropdowns() {
  const dropdowns = [DOM.adminMissaoMilitar, DOM.adminFeriasMilitar, DOM.adminDispMilitar];
  
  dropdowns.forEach(dd => {
    dd.innerHTML = '<option value="">Selecione o militar...</option>';
    state.usuarios.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `${u.posto_graduacao} ${u.nome} (${u.matricula})`;
      dd.appendChild(opt);
    });
  });

  // Popular também a lista de checkboxes para lançamento múltiplo
  popularListaMilitares(state.usuarios);
}

// Renderizar Tabela de Pessoal
function renderAdminPessoalTable() {
  DOM.tableAdminPessoal.innerHTML = '';
  state.usuarios.forEach(u => {
    const isAdmin = u.role === 'admin';
    const roleBadge = isAdmin ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-role">Membro</span>';
    const balanceBadgeClass = isAdmin ? 'badge-admin' : 'badge-role';
    
    DOM.tableAdminPessoal.innerHTML += `
      <tr>
        <td data-label="Identidade"><code>${u.matricula}</code></td>
        <td data-label="Nome"><strong>${u.nome}</strong></td>
        <td data-label="Posto / Graduação">${u.posto_graduacao}</td>
        <td data-label="Soldo Base">R$ ${formatarMoeda(u.soldo)}</td>
        <td data-label="Tipo Acesso">${roleBadge}</td>
        <td data-label="Saldo Dispensas">
          <span class="badge ${balanceBadgeClass}" title="Restantes / Acumuladas">${u.dispensas_restantes} / ${u.dispensas_acumuladas} dias</span>
        </td>
        <td data-label="Ações">
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-icon" onclick="editarMilitar(${u.id})" title="Editar Cadastro">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn btn-primary btn-icon" onclick="imprimirRelatorioMilitar(${u.id})" title="Imprimir Relatório (Ficha)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            </button>
            <button class="btn btn-secondary btn-icon" onclick="verDeslocamentosMilitar(${u.id}, '${u.nome}')" title="Ver Deslocamentos">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </button>
            <button class="btn btn-danger btn-icon" onclick="excluirMilitar(${u.id})" title="Excluir Militar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

// Ver deslocamentos de um militar específico (Admin)
window.verDeslocamentosMilitar = async function(userId, nomeUsuario) {
  try {
    const data = await apiFetch(`/admin/usuarios/${userId}/resumo`);
    const missoes = data.missoes || [];

    const modal = document.getElementById('modal-deslocamentos-usuario');
    const titulo = document.getElementById('modal-deslocamentos-titulo');
    const tbody = document.getElementById('modal-deslocamentos-tbody');

    titulo.textContent = `Deslocamentos — ${nomeUsuario}`;

    if (missoes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum deslocamento registrado.</td></tr>';
    } else {
      tbody.innerHTML = missoes.map(m => {
        const tipo = m.tipo_deslocamento || 'Missão';
        const tipoBadge = {
          'Missão': 'badge-admin',
          'Reconhecimento': 'badge-role',
          'Adestramento': 'badge-role',
          'Cursos/Estágio': ''
        }[tipo] || 'badge-role';
        const inicio = m.data_inicio ? m.data_inicio.replace('T', ' às ').slice(0, 19) : '—';
        const termino = m.data_termino ? m.data_termino.replace('T', ' às ').slice(0, 19) : '—';
        const grat = m.gratificacao_representacao > 0 ? `R$ ${formatarMoeda(m.gratificacao_representacao)}` : '—';
        const statusGrat = m.pagar_gratificacao
          ? (m.gratificacao_paga
              ? '<span style="color:var(--success); font-size:0.75rem;">● Pago</span>'
              : '<span style="color:var(--warning); font-size:0.75rem;">○ Pendente</span>')
          : '<span style="color:var(--text-muted); font-size:0.75rem;">—</span>';
        return `
          <tr>
            <td data-label="Deslocamento"><strong>${m.nome_deslocamento || m.descricao || '—'}</strong></td>
            <td data-label="Tipo"><span class="badge ${tipoBadge}" style="font-size:0.7rem;">${tipo}</span></td>
            <td data-label="Início" style="font-size:0.8rem;">${inicio}</td>
            <td data-label="Término" style="font-size:0.8rem;">${termino}</td>
            <td data-label="Duração" style="font-size:0.82rem;">${m.dias_missao} dias</td>
            <td data-label="Repr. / Status">
              <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-size:0.82rem;font-weight:600;">${grat}</span>
                ${statusGrat}
              </div>
            </td>
          </tr>`;
      }).join('');
    }

    modal.classList.remove('hidden');
  } catch (error) {
    showToast('Erro ao carregar deslocamentos do militar.', 'error');
  }
};

// Renderizar Tabela de Solicitações de Dispensa para o Admin
function renderAdminDispensasTable(dispensas) {
  DOM.tableAdminDispensas.innerHTML = '';
  const pendentes = dispensas.filter(d => d.status === 'Pendente');
  DOM.countPendentes.textContent = pendentes.length;
  
  if (dispensas.length === 0) {
    DOM.tableAdminDispensas.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum registro de dispensa localizado.</td></tr>';
    return;
  }
  
  dispensas.forEach(d => {
    const statusClass = d.status.toLowerCase();
    const isPendente = d.status === 'Pendente';
    
    // Ações de aprovação/rejeição apenas se estiver Pendente
    let acoes = '';
    if (isPendente) {
      acoes = `
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-success btn-icon" onclick="decidirDispensa(${d.id}, 'Aprovada')" title="Aprovar Dispensa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
          <button class="btn btn-danger btn-icon" onclick="decidirDispensa(${d.id}, 'Rejeitada')" title="Rejeitar Dispensa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;
    } else {
      acoes = `
        <button class="btn btn-danger btn-icon" onclick="removerDispensa(${d.id})" title="Remover Histórico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;
    }
    
    DOM.tableAdminDispensas.innerHTML += `
      <tr>
        <td data-label="Militar"><strong>${d.nome}</strong></td>
        <td data-label="Posto / Graduação">${d.posto_graduacao}</td>
        <td data-label="Início">${formatarData(d.data_inicio)}</td>
        <td data-label="Término">${formatarData(d.data_termino)}</td>
        <td data-label="Dias Solicitados"><strong>${d.dias_dispensa} dias</strong></td>
        <td data-label="Motivo / Observação">${d.observacao || '<span class="text-muted">-</span>'}</td>
        <td data-label="Status"><span class="badge badge-status ${statusClass}">${d.status}</span></td>
        <td data-label="Ações">${acoes}</td>
      </tr>
    `;
  });
}

// ----------------------------------------------------
// PROCESSAMENTO DE FORMULÁRIOS DE ADMIN
// ----------------------------------------------------

// Atualizar Soldo base dinamicamente no Modal de Cadastro
DOM.userPosto.addEventListener('change', () => {
  const posto = DOM.userPosto.value;
  const soldoItem = state.soldos.find(s => s.posto_graduacao === posto);
  if (soldoItem) {
    DOM.userSoldo.value = soldoItem.soldo;
  } else {
    DOM.userSoldo.value = '';
  }
});

// Preview de cálculos automáticos ao digitar dados de missão
function atualizarPreviewMissao() {
  const militarId = DOM.adminMissaoMilitar.value;
  const data_inicio = DOM.adminMissaoInicio.value;
  const data_termino = DOM.adminMissaoTermino.value;
  
  if (!militarId || !data_inicio || !data_termino) {
    DOM.previewDias.textContent = '0 dias';
    DOM.previewGratificacao.textContent = 'R$ 0,00';
    if (DOM.previewAjudaCusto) DOM.previewAjudaCusto.textContent = 'R$ 0,00';
    if (DOM.previewSaque) DOM.previewSaque.textContent = 'R$ 0,00';
    DOM.previewDispensas.textContent = '0 dias';
    return;
  }
  
  const militar = state.usuarios.find(u => u.id == militarId);
  const dias = Math.max(0, calcularDiasFração(data_inicio, data_termino));
  
  if (dias <= 0) {
    DOM.previewDias.textContent = '0 dias';
    DOM.previewGratificacao.textContent = 'R$ 0,00';
    if (DOM.previewAjudaCusto) DOM.previewAjudaCusto.textContent = 'R$ 0,00';
    if (DOM.previewSaque) DOM.previewSaque.textContent = 'R$ 0,00';
    DOM.previewDispensas.textContent = '0 dias';
    return;
  }
  
  const tipo = DOM.adminMissaoTipo ? DOM.adminMissaoTipo.value : 'Missão';
  
  if (tipo === 'Cursos/Estágio') {
    if (DOM.adminPainelCursos) DOM.adminPainelCursos.classList.remove('hidden');
  } else {
    if (DOM.adminPainelCursos) DOM.adminPainelCursos.classList.add('hidden');
  }
  
  let isPagarGratificacao = false;
  let isPagarAjudaCusto = false;
  let diasRep = dias;
  
  if (['Missão', 'Reconhecimento', 'Adestramento'].includes(tipo)) {
    isPagarGratificacao = true;
  } else if (tipo === 'Cursos/Estágio') {
    isPagarGratificacao = DOM.adminMissaoGratificacao && DOM.adminMissaoGratificacao.checked;
    isPagarAjudaCusto = DOM.adminMissaoAjudaCusto && DOM.adminMissaoAjudaCusto.checked;
    if (DOM.adminMissaoDiasGrat && DOM.adminMissaoDiasGrat.value) {
      diasRep = parseInt(DOM.adminMissaoDiasGrat.value);
    }
  }

  const gratificacao = (militar && isPagarGratificacao) ? (militar.soldo * 0.02 * diasRep) : 0;
  const ajudaCusto = (militar && isPagarAjudaCusto) ? militar.soldo : 0;
  
  const isReceberSaque = DOM.adminMissaoReceberSaque && DOM.adminMissaoReceberSaque.checked;
  const diasSaque = isReceberSaque && DOM.adminMissaoDiasSaque.value ? parseInt(DOM.adminMissaoDiasSaque.value) : dias;
  const qtdSaque = isReceberSaque && DOM.adminMissaoQtdSaque.value ? parseInt(DOM.adminMissaoQtdSaque.value) : 1;
  const saque = isReceberSaque ? (13.50 * diasSaque * qtdSaque) : 0;
  
  const pctLocalidade = DOM.adminMissaoLocalidade ? parseInt(DOM.adminMissaoLocalidade.value) : 0;
  const localidadeValor = militar ? (militar.soldo * (pctLocalidade / 100) / 30) * dias : 0;
  
  // Padrão de dispensas concedidas (1 dia por segunda-a-sexta e 1 dia por sábado-e-domingo)
  const dispensas = calcularDispensasPadrao(data_inicio, data_termino);
  
  DOM.previewDias.textContent = `${dias} dias`;
  DOM.previewGratificacao.textContent = `R$ ${formatarMoeda(gratificacao)}`;
  if (DOM.previewLocalidade) DOM.previewLocalidade.textContent = `R$ ${formatarMoeda(localidadeValor)}`;
  if (DOM.previewAjudaCusto) DOM.previewAjudaCusto.textContent = `R$ ${formatarMoeda(ajudaCusto)}`;
  if (DOM.previewSaque) DOM.previewSaque.textContent = `R$ ${formatarMoeda(saque)}`;
  DOM.previewDispensas.textContent = `${dispensas} dias`;
}

DOM.adminMissaoMilitar.addEventListener('change', atualizarPreviewMissao);
DOM.adminMissaoInicio.addEventListener('change', atualizarPreviewMissao);
DOM.adminMissaoTermino.addEventListener('change', atualizarPreviewMissao);
if (DOM.adminMissaoTipo) {
  DOM.adminMissaoTipo.addEventListener('change', () => {
    atualizarPreviewMissao();
  });
}
if (DOM.adminMissaoLocalidade) DOM.adminMissaoLocalidade.addEventListener('change', atualizarPreviewMissao);
if (DOM.adminMissaoGratificacao) DOM.adminMissaoGratificacao.addEventListener('change', atualizarPreviewMissao);
if (DOM.adminMissaoAjudaCusto) DOM.adminMissaoAjudaCusto.addEventListener('change', atualizarPreviewMissao);
if (DOM.adminMissaoDiasGrat) DOM.adminMissaoDiasGrat.addEventListener('input', atualizarPreviewMissao);

if (DOM.adminMissaoReceberSaque) {
  DOM.adminMissaoReceberSaque.addEventListener('change', () => {
    if (DOM.adminMissaoReceberSaque.checked) {
      DOM.adminPainelSaque.classList.remove('hidden');
    } else {
      DOM.adminPainelSaque.classList.add('hidden');
    }
    atualizarPreviewMissao();
  });
}
if (DOM.adminMissaoDiasSaque) DOM.adminMissaoDiasSaque.addEventListener('input', atualizarPreviewMissao);
if (DOM.adminMissaoQtdSaque) DOM.adminMissaoQtdSaque.addEventListener('input', atualizarPreviewMissao);

// ----------------------------------------------------
// EDIÇÃO DE MISSÃO (MODAL)
// ----------------------------------------------------
let isEditAdmin = false;

window.abrirEditMissaoModal = function(missao, isAdmin) {
  isEditAdmin = isAdmin;
  DOM.editMissaoId.value = missao.id;
  DOM.editMissaoNome.value = missao.nome_deslocamento || '';
  DOM.editMissaoTipo.value = missao.tipo_deslocamento || 'Missão';
  DOM.editMissaoDescricao.value = missao.descricao || '';
  DOM.editMissaoInicio.value = missao.data_inicio || '';
  DOM.editMissaoTermino.value = missao.data_termino || '';
  DOM.editMissaoLocalidade.value = missao.gratificacao_localidade_pct || '0';
  
  if (missao.tipo_deslocamento === 'Cursos/Estágio') {
    DOM.editPainelCursos.classList.remove('hidden');
  } else {
    DOM.editPainelCursos.classList.add('hidden');
  }
  
  DOM.editMissaoGratificacao.checked = missao.pagar_gratificacao === 1;
  DOM.editMissaoAjudacusto.checked = missao.pagar_ajuda_custo === 1;
  DOM.editMissaoDiasGrat.value = missao.dias_gratificacao || '';
  
  DOM.editMissaoReceberSaque.checked = missao.receber_saque_alimentacao === 1;
  if (missao.receber_saque_alimentacao === 1) {
    DOM.editPainelSaque.classList.remove('hidden');
    DOM.editMissaoDiasSaque.value = missao.dias_saque_alimentacao || '';
    DOM.editMissaoQtdSaque.value = missao.qtd_saque_alimentacao || '';
  } else {
    DOM.editPainelSaque.classList.add('hidden');
    DOM.editMissaoDiasSaque.value = '';
    DOM.editMissaoQtdSaque.value = '';
  }
  
  DOM.editMissaoModal.classList.remove('hidden');
};

function fecharEditMissaoModal() {
  DOM.editMissaoModal.classList.add('hidden');
  DOM.formEditMissao.reset();
}

if (DOM.closeEditMissaoModal) DOM.closeEditMissaoModal.addEventListener('click', fecharEditMissaoModal);

if (DOM.editMissaoTipo) {
  DOM.editMissaoTipo.addEventListener('change', () => {
    if (DOM.editMissaoTipo.value === 'Cursos/Estágio') {
      DOM.editPainelCursos.classList.remove('hidden');
    } else {
      DOM.editPainelCursos.classList.add('hidden');
    }
  });
}

if (DOM.editMissaoReceberSaque) {
  DOM.editMissaoReceberSaque.addEventListener('change', () => {
    if (DOM.editMissaoReceberSaque.checked) {
      DOM.editPainelSaque.classList.remove('hidden');
    } else {
      DOM.editPainelSaque.classList.add('hidden');
    }
  });
}

if (DOM.formEditMissao) {
  DOM.formEditMissao.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = DOM.editMissaoId.value;
    
    const body = {
      nome_deslocamento: DOM.editMissaoNome.value.trim(),
      tipo_deslocamento: DOM.editMissaoTipo.value,
      descricao: DOM.editMissaoDescricao.value.trim(),
      data_inicio: DOM.editMissaoInicio.value,
      data_termino: DOM.editMissaoTermino.value,
      gratificacao_localidade_pct: DOM.editMissaoLocalidade.value,
      pagar_gratificacao: DOM.editMissaoGratificacao.checked,
      pagar_ajuda_custo: DOM.editMissaoAjudacusto.checked,
      dias_gratificacao: DOM.editMissaoDiasGrat.value,
      receber_saque_alimentacao: DOM.editMissaoReceberSaque.checked,
      dias_saque_alimentacao: DOM.editMissaoDiasSaque.value,
      qtd_saque_alimentacao: DOM.editMissaoQtdSaque.value
    };
    
    try {
      const endpoint = isEditAdmin ? `/admin/missoes/${id}` : `/membro/missoes/${id}`;
      const data = await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      showToast(data.message);
      fecharEditMissaoModal();
      loadUserData(); // Recarrega as tabelas atualizadas
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Excluir Missão do Membro
window.excluirMembroMissao = async function(id) {
  if (confirm('Tem certeza que deseja excluir este deslocamento? Esta ação não pode ser desfeita.')) {
    try {
      const data = await apiFetch(`/membro/missoes/${id}`, {
        method: 'DELETE'
      });
      showToast(data.message);
      loadUserData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
};

// Submit Missão (Admin)
// --- Lógica de modo múltiplo (Admin Missão) ---
function getAdminMissaoModo() {
  return DOM.adminMissaoModoMultiplo && DOM.adminMissaoModoMultiplo.checked ? 'multiplo' : 'individual';
}

function popularListaMilitares(usuarios) {
  if (!DOM.adminMissaoListaMilitares) return;
  DOM.adminMissaoListaMilitares.innerHTML = '';
  if (!usuarios || usuarios.length === 0) {
    DOM.adminMissaoListaMilitares.innerHTML = '<span class="text-muted" style="font-size:0.85rem;">Nenhum militar encontrado.</span>';
    return;
  }
  usuarios.forEach(u => {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex; align-items:center; gap:8px; cursor:pointer; padding:4px 6px; border-radius:6px; transition:background 0.15s;';
    label.addEventListener('mouseenter', () => label.style.background = 'var(--bg-card)');
    label.addEventListener('mouseleave', () => label.style.background = 'transparent');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = u.id;
    cb.dataset.nome = u.nome;
    cb.style.cssText = 'width:auto; margin:0; cursor:pointer;';
    cb.className = 'admin-missao-militar-check';
    label.appendChild(cb);
    const span = document.createElement('span');
    span.style.fontSize = '0.88rem';
    span.textContent = `${u.posto_graduacao} ${u.nome}`;
    label.appendChild(span);
    DOM.adminMissaoListaMilitares.appendChild(label);
  });
}

if (DOM.adminMissaoModoIndividual) {
  DOM.adminMissaoModoIndividual.addEventListener('change', () => {
    DOM.adminMissaoPainelIndividual.classList.remove('hidden');
    DOM.adminMissaoPainelMultiplo.classList.add('hidden');
    if (DOM.btnAdminMissaoSubmit) DOM.btnAdminMissaoSubmit.textContent = 'Registrar Missão';
  });
}

if (DOM.adminMissaoModoMultiplo) {
  DOM.adminMissaoModoMultiplo.addEventListener('change', () => {
    DOM.adminMissaoPainelIndividual.classList.add('hidden');
    DOM.adminMissaoPainelMultiplo.classList.remove('hidden');
    if (DOM.btnAdminMissaoSubmit) DOM.btnAdminMissaoSubmit.textContent = 'Registrar Missão para Selecionados';
  });
}

if (DOM.btnSelecionarTodos) {
  DOM.btnSelecionarTodos.addEventListener('click', () => {
    document.querySelectorAll('.admin-missao-militar-check').forEach(cb => cb.checked = true);
  });
}

if (DOM.btnLimparSelecao) {
  DOM.btnLimparSelecao.addEventListener('click', () => {
    document.querySelectorAll('.admin-missao-militar-check').forEach(cb => cb.checked = false);
  });
}

DOM.formAdminMissao.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome_deslocamento = DOM.adminMissaoNome ? DOM.adminMissaoNome.value.trim() : '';
  const tipo_deslocamento = DOM.adminMissaoTipo ? DOM.adminMissaoTipo.value : 'Missão';
  const descricao = DOM.adminMissaoDesc.value.trim();
  const data_inicio = DOM.adminMissaoInicio.value;
  const data_termino = DOM.adminMissaoTermino.value;
  const gratificacao_localidade_pct = DOM.adminMissaoLocalidade ? DOM.adminMissaoLocalidade.value : '0';
  const pagar_gratificacao = DOM.adminMissaoGratificacao ? DOM.adminMissaoGratificacao.checked : true;
  const pagar_ajuda_custo = DOM.adminMissaoAjudaCusto ? DOM.adminMissaoAjudaCusto.checked : false;
  const dias_gratificacao = DOM.adminMissaoDiasGrat ? DOM.adminMissaoDiasGrat.value : '';
  let dispensas_concedidas = DOM.adminMissaoDispensas.value;

  if (new Date(data_inicio) > new Date(data_termino)) {
    showToast('A data de término deve ser igual ou posterior à data de início.', 'error');
    return;
  }

  const modo = getAdminMissaoModo();

  // Montar lista de IDs de usuários
  let usuarioIds = [];
  if (modo === 'multiplo') {
    const checks = document.querySelectorAll('.admin-missao-militar-check:checked');
    usuarioIds = Array.from(checks).map(cb => cb.value);
    if (usuarioIds.length === 0) {
      showToast('Selecione ao menos um militar para o lançamento múltiplo.', 'error');
      return;
    }
  } else {
    const uid = DOM.adminMissaoMilitar.value;
    if (!uid) {
      showToast('Selecione o militar.', 'error');
      return;
    }
    usuarioIds = [uid];
  }

  const baseBody = {
    nome_deslocamento,
    descricao,
    tipo_deslocamento,
    data_inicio,
    data_termino,
    gratificacao_localidade_pct,
    pagar_gratificacao,
    pagar_ajuda_custo,
    dias_gratificacao,
    receber_saque_alimentacao: DOM.adminMissaoReceberSaque && DOM.adminMissaoReceberSaque.checked,
    dias_saque_alimentacao: DOM.adminMissaoDiasSaque ? DOM.adminMissaoDiasSaque.value : '',
    qtd_saque_alimentacao: DOM.adminMissaoQtdSaque ? DOM.adminMissaoQtdSaque.value : ''
  };
  if (dispensas_concedidas !== '') baseBody.dispensas_concedidas = dispensas_concedidas;

  if (DOM.btnAdminMissaoSubmit) {
    DOM.btnAdminMissaoSubmit.disabled = true;
    DOM.btnAdminMissaoSubmit.textContent = 'Registrando...';
  }

  try {
    const promises = usuarioIds.map(uid =>
      apiFetch('/admin/missoes', {
        method: 'POST',
        body: JSON.stringify({ ...baseBody, usuario_id: uid })
      }).then(r => ({ ok: true, uid, message: r.message }))
        .catch(err => ({ ok: false, uid, message: err.message }))
    );

    const results = await Promise.allSettled(promises);
    const flatResults = results.map(r => r.value || r.reason);
    const sucesso = flatResults.filter(r => r.ok).length;
    const falha = flatResults.filter(r => !r.ok);

    if (falha.length === 0) {
      showToast(`Missão registrada com sucesso para ${sucesso} militar(es)!`);
    } else {
      showToast(`${sucesso} registrado(s) com sucesso. ${falha.length} falhou: ${falha.map(f => f.message).join(', ')}`, 'error');
    }

    DOM.formAdminMissao.reset();
    // Restore modo individual
    if (DOM.adminMissaoModoIndividual) DOM.adminMissaoModoIndividual.checked = true;
    DOM.adminMissaoPainelIndividual.classList.remove('hidden');
    DOM.adminMissaoPainelMultiplo.classList.add('hidden');
    atualizarPreviewMissao();
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    if (DOM.btnAdminMissaoSubmit) {
      DOM.btnAdminMissaoSubmit.disabled = false;
      DOM.btnAdminMissaoSubmit.textContent = 'Registrar Missão';
    }
  }
});

// Submit Férias (Admin)
DOM.formAdminFerias.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const usuario_id = DOM.adminFeriasMilitar.value;
  const data_inicio = DOM.adminFeriasInicio.value;
  const data_termino = DOM.adminFeriasTermino.value;
  
  if (new Date(data_inicio) > new Date(data_termino)) {
    showToast('A data de término deve ser igual ou posterior à data de início.', 'error');
    return;
  }
  
  try {
    const data = await apiFetch('/admin/ferias', {
      method: 'POST',
      body: JSON.stringify({ usuario_id, data_inicio, data_termino })
    });
    
    showToast(data.message);
    DOM.formAdminFerias.reset();
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Submit Dispensa Direta (Admin)
DOM.formAdminDispensaDireta.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const usuario_id = DOM.adminDispMilitar.value;
  const data_inicio = DOM.adminDispInicio.value;
  const data_termino = DOM.adminDispTermino.value;
  const observacao = DOM.adminDispObs.value.trim();
  const tipo_dispensa = DOM.adminDispTipo.value;
  
  if (new Date(data_inicio) > new Date(data_termino)) {
    showToast('A data de término deve ser igual ou posterior à data de início.', 'error');
    return;
  }
  
  try {
    const data = await apiFetch('/admin/dispensas', {
      method: 'POST',
      body: JSON.stringify({ usuario_id, data_inicio, data_termino, observacao, tipo_dispensa })
    });
    
    showToast(data.message);
    DOM.formAdminDispensaDireta.reset();
    DOM.adminDispTipo.value = 'missao';
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Aprovar / Rejeitar solicitação (Admin)
window.decidirDispensa = async function(id, status) {
  if (!confirm(`Deseja realmente definir esta solicitação de dispensa como ${status.toUpperCase()}?`)) {
    return;
  }
  
  try {
    const data = await apiFetch(`/admin/dispensas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(data.message);
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// Remover registro de dispensa (Admin)
window.removerDispensa = async function(id) {
  if (!confirm('Deseja realmente remover permanentemente este registro de dispensa?')) {
    return;
  }
  
  try {
    const data = await apiFetch(`/admin/dispensas/${id}`, {
      method: 'DELETE'
    });
    showToast(data.message);
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// Aprovar / Rejeitar saque etapa (Admin)
window.decidirSaqueEtapa = async function(id, status) {
  if (!confirm(`Deseja realmente definir esta solicitação de saque etapa como ${status.toUpperCase()}?`)) {
    return;
  }
  
  try {
    const data = await apiFetch(`/admin/saques-etapa/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(data.message);
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// Remover registro de saque etapa (Admin)
window.removerSaqueEtapa = async function(id) {
  if (!confirm('Deseja realmente remover permanentemente este registro de saque etapa?')) {
    return;
  }
  
  try {
    const data = await apiFetch(`/admin/saques-etapa/${id}`, {
      method: 'DELETE'
    });
    showToast(data.message);
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// Abrir modal de edição de BIs de Saque Etapa
window.abrirSaqueBiModal = function(id) {
  const saque = state.saquesEtapaAdmin.find(s => s.id === id);
  if (!saque) return;
  
  DOM.saqueBiId.value = saque.id;
  DOM.saqueBiSolicitacao.value = saque.bi_solicitacao || '';
  DOM.saqueBiPagamento.value = saque.bi_pagamento || '';
  DOM.saqueBiObservacao.value = saque.observacao || '';
  
  DOM.saqueBiModal.classList.remove('hidden');
};

// ----------------------------------------------------
// GERENCIAR CADASTRO DE MILITAR (MODAL ADMIN)
// ----------------------------------------------------

// Abrir Modal - Novo Cadastro
DOM.btnOpenUserModal.addEventListener('click', () => {
  DOM.modalUserTitle.textContent = 'Cadastrar Novo Militar';
  DOM.userIdEdit.value = '';
  DOM.formUserSave.reset();
  DOM.userSenha.required = true;
  DOM.userSenhaHelp.textContent = 'Senha padrão de acesso.';
  DOM.userModal.classList.remove('hidden');
});

// Fechar Modal
function fecharUserModal() {
  DOM.userModal.classList.add('hidden');
}

DOM.btnCloseUserModal.addEventListener('click', fecharUserModal);
DOM.btnCancelUserModal.addEventListener('click', fecharUserModal);

// Editar Militar (carregar dados no modal)
window.editarMilitar = async function(id) {
  const user = state.usuarios.find(u => u.id === id);
  if (!user) return;
  
  DOM.modalUserTitle.textContent = 'Editar Militar';
  DOM.userIdEdit.value = user.id;
  DOM.userNome.value = user.nome;
  DOM.userMatricula.value = user.matricula;
  DOM.userSenha.value = ''; // Senha em branco (se não for alterar)
  DOM.userSenha.required = false;
  DOM.userSenhaHelp.textContent = 'Deixe em branco para manter a senha atual.';
  
  DOM.userPosto.value = user.posto_graduacao;
  DOM.userSoldo.value = user.soldo;
  DOM.userRole.value = user.role;
  DOM.userDispensasIniciais.value = user.saldo_inicial_dispensas;
  if (DOM.userObservacao) DOM.userObservacao.value = user.observacao || '';
  
  DOM.userModal.classList.remove('hidden');
};

// Salvar / Atualizar Cadastro
DOM.formUserSave.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = DOM.userIdEdit.value;
  const nome = DOM.userNome.value.trim();
  const matricula = DOM.userMatricula.value.trim();
  const senha = DOM.userSenha.value;
  const posto_graduacao = DOM.userPosto.value;
  const soldo = parseFloat(DOM.userSoldo.value);
  const role = DOM.userRole.value;
  const saldo_inicial_dispensas = parseInt(DOM.userDispensasIniciais.value) || 0;
  const observacao = DOM.userObservacao ? DOM.userObservacao.value.trim() : '';
  
  const body = {
    nome,
    matricula,
    posto_graduacao,
    soldo,
    role,
    saldo_inicial_dispensas,
    observacao
  };
  
  if (senha && senha.trim() !== '') {
    body.senha = senha;
  }
  
  try {
    let response;
    if (id) {
      // Editar
      response = await apiFetch(`/admin/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    } else {
      // Cadastrar
      if (!senha) {
        showToast('Senha é obrigatória para novos cadastros.', 'error');
        return;
      }
      body.senha = senha;
      response = await apiFetch('/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }
    
    showToast(response.message);
    fecharUserModal();
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Excluir Militar
window.excluirMilitar = async function(id) {
  if (id === state.user.id) {
    showToast('Não é possível excluir o próprio usuário em execução.', 'error');
    return;
  }
  
  const ok = await confirmar('Excluir Militar', 'Deseja REALMENTE excluir este militar? Todos os registros de missões, férias e dispensas serão excluídos permanentemente.');
  if (!ok) return;
  
  try {
    const response = await apiFetch(`/admin/usuarios/${id}`, {
      method: 'DELETE'
    });
    showToast(response.message);
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// ----------------------------------------------------
// COMPONENTES DE ABAS E NAVEGAÇÃO
// ----------------------------------------------------

// Navegação entre abas principais
DOM.navItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetTab = item.getAttribute('data-tab');
    
    DOM.navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    DOM.tabPanels.forEach(p => {
      if (p.id === targetTab) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  });
});

// Navegação interna da aba do Administrador
DOM.adminNavButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetSubtab = btn.getAttribute('data-subtab');
    
    DOM.adminNavButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    DOM.subtabPanels.forEach(p => {
      if (p.id === `subtab-${targetSubtab}`) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  });
});

// ----------------------------------------------------
// UTILITÁRIOS MATEMÁTICOS E DE FORMATAÇÃO
// ----------------------------------------------------

function formatarMoeda(valor) {
  return parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarData(dataString) {
  if (!dataString) return '';
  const [ano, mes, dia] = dataString.split('-');
  return `${dia}/${mes}/${ano}`;
}

function calcularDiasEntre(inicio, termino) {
  const d1 = new Date(inicio + 'T00:00:00');
  const d2 = new Date(termino + 'T00:00:00');
  const diffTime = d2 - d1;
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Cálculo de dias com base em fração de horas (missões)
function calcularDiasFração(inicio, termino) {
  const date1 = new Date(inicio);
  const date2 = new Date(termino);
  const diffTime = date2 - date1;
  if (diffTime <= 0) return 0;
  
  const totalHours = diffTime / (1000 * 60 * 60);
  const diasCompletos = Math.floor(totalHours / 24);
  const horasRestantes = totalHours % 24;
  
  return horasRestantes >= 8 ? diasCompletos + 1 : diasCompletos;
}

// Calcular padrão de dispensas (1 dia para Mon-Fri, 1 dia para Sat-Sun por semana ISO)
function calcularDispensasPadrao(inicioStr, terminoStr) {
  const start = new Date(inicioStr);
  const end = new Date(terminoStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }
  
  const semanasWeekday = new Set();
  const Saturdays = new Set();
  const Sundays = new Set();
  
  const current = new Date(start);
  const tempEnd = new Date(end);
  
  current.setHours(0, 0, 0, 0);
  tempEnd.setHours(0, 0, 0, 0);
  
  while (current <= tempEnd) {
    const dayOfWeek = current.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    
    const diffToMonday = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const mondayOfWeek = new Date(current);
    mondayOfWeek.setDate(diffToMonday);
    mondayOfWeek.setHours(0, 0, 0, 0);
    const weekKey = mondayOfWeek.toISOString().slice(0, 10);
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      semanasWeekday.add(weekKey);
    } else if (dayOfWeek === 6) {
      Saturdays.add(weekKey);
    } else if (dayOfWeek === 0) {
      Sundays.add(weekKey);
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  let weekendDispensas = 0;
  for (const weekKey of Saturdays) {
    if (Sundays.has(weekKey)) {
      weekendDispensas++;
    }
  }
  
  return semanasWeekday.size + weekendDispensas;
}

// Formatar data/hora datetime-local para exibição legível
function formatarDataHora(dateTimeString) {
  if (!dateTimeString) return '';
  // Se for apenas data YYYY-MM-DD
  if (dateTimeString.length === 10) return formatarData(dateTimeString);
  
  try {
    const dt = new Date(dateTimeString);
    if (isNaN(dt.getTime())) return dateTimeString;
    const dia = String(dt.getDate()).padStart(2, '0');
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const ano = dt.getFullYear();
    const hora = String(dt.getHours()).padStart(2, '0');
    const minuto = String(dt.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;
  } catch (e) {
    return dateTimeString;
  }
}

async function loadAndRenderPagamentos() {
  try {
    let missoes = [];
    if (state.user && state.user.role === 'admin') {
      missoes = await apiFetch('/admin/missoes');
      state.missoesPagamento = missoes;
      // Mostra coluna Ações (BIs) para o admin
      if (DOM.adminActionsHeader) DOM.adminActionsHeader.classList.remove('hidden');
    } else {
      missoes = state.userResumo ? state.userResumo.missoes : [];
      state.missoesPagamento = missoes;
      // Oculta coluna Ações (BIs) para o membro
      if (DOM.adminActionsHeader) DOM.adminActionsHeader.classList.add('hidden');
    }
    renderPagamentosTable(missoes);
  } catch (error) {
    console.error('Erro ao carregar pagamentos:', error);
  }
}

// Renderizar a tabela de pagamentos
function renderPagamentosTable(missoes) {
  const isAdmin = state.user && state.user.role === 'admin';

  const adminView  = document.getElementById('pagamentos-admin-view');
  const membroView = document.getElementById('pagamentos-membro-view');

  if (isAdmin) {
    if (adminView)  { adminView.classList.remove('hidden'); }
    if (membroView) { membroView.classList.add('hidden'); }
    renderAdminPagamentosAccordion(missoes);
  } else {
    if (adminView)  { adminView.classList.add('hidden'); }
    if (membroView) { membroView.classList.remove('hidden'); }
    renderMembroPagamentosTable(missoes);
  }
}

// ── ADMIN: Accordion agrupado por militar ─────────────────────────────────
function renderAdminPagamentosAccordion(missoes) {
  const accordion = document.getElementById('pagamentos-accordion');
  if (!accordion) return;

  // Calcular total de pendentes (para o badge)
  let totalPendentes = 0;
  missoes.forEach(m => {
    if (m.pagar_gratificacao && !m.gratificacao_paga) totalPendentes++;
    if (m.pagar_ajuda_custo  && !m.ajuda_custo_paga)  totalPendentes++;
    if (m.gratificacao_localidade_pct > 0 && !m.localidade_paga) totalPendentes++;
    if (m.receber_saque_alimentacao   && !m.alimentacao_paga)    totalPendentes++;
  });
  const badge = document.getElementById('pagamentos-pendentes-badge');
  if (badge) badge.textContent = `${totalPendentes} pendente${totalPendentes !== 1 ? 's' : ''}`;

  if (!missoes || missoes.length === 0) {
    accordion.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:40px;">Nenhum registro de pagamento.</div>';
    return;
  }

  // Agrupar por usuario_id → ordenar por nome
  const grupos = {};
  missoes.forEach(m => {
    const uid = m.usuario_id;
    if (!grupos[uid]) grupos[uid] = { nome: m.nome, posto: m.posto_graduacao, missoes: [] };
    grupos[uid].missoes.push(m);
  });
  const gruposOrdenados = Object.values(grupos).sort((a, b) => a.nome.localeCompare(b.nome));

  accordion.innerHTML = gruposOrdenados.map((g, gi) => {
    // Resumo de pendências deste militar
    let pendM = 0, totalM = 0;
    g.missoes.forEach(m => {
      if (m.pagar_gratificacao)            { totalM++; if (!m.gratificacao_paga) pendM++; }
      if (m.pagar_ajuda_custo)             { totalM++; if (!m.ajuda_custo_paga)  pendM++; }
      if (m.gratificacao_localidade_pct>0) { totalM++; if (!m.localidade_paga)   pendM++; }
      if (m.receber_saque_alimentacao)     { totalM++; if (!m.alimentacao_paga)   pendM++; }
    });
    const pagoCount = totalM - pendM;
    const iniciais = g.nome.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase();

    const chipPend = pendM > 0
      ? `<span class="pag-summary-chip chip-pendente">${pendM} pendente${pendM!==1?'s':''}</span>`
      : '';
    const chipPago = pagoCount > 0
      ? `<span class="pag-summary-chip chip-pago">${pagoCount} pago${pagoCount!==1?'s':''}</span>`
      : '';
    const chipTotal = `<span class="pag-summary-chip">${g.missoes.length} deslocamento${g.missoes.length!==1?'s':''}</span>`;

    // Linhas dos deslocamentos deste militar
    const linhas = g.missoes.map(m => {
      function cellAdmin(deveExibir, valor, isPago, id, campo, titulo) {
        if (!deveExibir) return '<span style="color:var(--text-muted)">—</span>';
        const vf = `R$ ${formatarMoeda(valor || 0)}`;
        
        if (isPago) {
          return `<div class="pag-check-admin">
            <span class="pag-valor">${vf}</span>
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;" title="Desfazer (Marcar como Pendente)">
              <input type="checkbox" checked onchange="togglePagamentoIndividual(${id},'${campo}',this.checked)" style="display:none;">
              <span class="badge badge-status aprovada" style="margin-top:2px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="margin-right:2px; vertical-align:middle;"><polyline points="20 6 9 17 4 12"></polyline></svg> Pago
              </span>
            </label>
          </div>`;
        }

        return `<div class="pag-check-admin">
          <span class="pag-valor">${vf}</span>
          <label style="display:flex;align-items:center;gap:4px;cursor:pointer;" title="${titulo}">
            <input type="checkbox" onchange="togglePagamentoIndividual(${id},'${campo}',this.checked)" style="accent-color:var(--primary);">
            <span class="pag-icon-pendente">○ Pendente</span>
          </label>
        </div>`;
      }
      const gratCell  = cellAdmin(m.pagar_gratificacao==1, m.gratificacao_representacao, m.gratificacao_paga,       m.id,'gratificacao_paga', 'Marcar Repr. como Paga');
      const ajudaCell = cellAdmin(m.pagar_ajuda_custo==1,  m.ajuda_de_custo,             m.ajuda_custo_paga,        m.id,'ajuda_custo_paga',   'Marcar Aj. Custo como Paga');
      const locCell   = cellAdmin(m.gratificacao_localidade_pct>0, m.gratificacao_localidade_valor, m.localidade_paga, m.id,'localidade_paga', `Localidade ${m.gratificacao_localidade_pct}%`);
      const alimentCell = cellAdmin(m.receber_saque_alimentacao==1, m.saque_alimentacao, m.alimentacao_paga,         m.id,'alimentacao_paga',  'Marcar Alimentação como Paga');
      return `
        <tr>
          <td data-label="Deslocamento">${m.nome_deslocamento || m.descricao || '—'}</td>
          <td data-label="Repr. (R$)" class="text-center">${gratCell}</td>
          <td data-label="Aj. Custo (R$)" class="text-center">${ajudaCell}</td>
          <td data-label="Localidade" class="text-center">${locCell}</td>
          <td data-label="Alimentação (R$)" class="text-center">${alimentCell}</td>
          <td data-label="BIs" class="text-center">
            <div style="display: flex; gap: 6px; justify-content: center;">
              <button class="btn-icon" onclick="abrirBiModal(${m.id})" title="Editar BIs" style="color:var(--text-muted);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-secondary btn-icon" onclick='abrirEditMissaoModal(${JSON.stringify(m).replace(/'/g, "&#39;")}, true)' title="Editar Deslocamento" style="padding:4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-danger btn-icon" onclick="excluirMissaoAdmin(${m.id})" title="Excluir Deslocamento" style="padding:4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="pag-accordion-item" id="pag-acc-${gi}">
        <div class="pag-accordion-header" onclick="togglePagAccordion('pag-acc-${gi}')">
          <div class="pag-accordion-header-left">
            <div class="pag-accordion-avatar">${iniciais}</div>
            <div class="pag-accordion-info">
              <span class="pag-accordion-nome">${g.nome}</span>
              <span class="pag-accordion-posto">${g.posto || '—'}</span>
            </div>
          </div>
          <div class="pag-accordion-header-right">
            <div class="pag-accordion-summary">
              ${chipTotal}${chipPago}${chipPend}
            </div>
            <svg class="pag-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        <div class="pag-accordion-body">
          <table class="table table-pagamentos" style="margin:0;">
            <thead>
              <tr>
                <th>Deslocamento</th>
                <th class="text-center">Repr. (R$)</th>
                <th class="text-center">Aj. Custo (R$)</th>
                <th class="text-center">Localidade</th>
                <th class="text-center">Alimentação (R$)</th>
                <th class="text-center">BIs</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');
}

window.togglePagAccordion = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
};

// ── MEMBRO: Tabela simples dos próprios deslocamentos ─────────────────────
function renderMembroPagamentosTable(missoes) {
  const tbody = document.getElementById('table-pagamentos-body');
  if (!tbody) return;
  if (!missoes || missoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum registro de pagamento.</td></tr>';
    return;
  }
  tbody.innerHTML = missoes.map(m => {
    function cellMembro(deveExibir, valor, isPago) {
      if (!deveExibir) return '<span style="color:var(--text-muted)">—</span>';
      const vf = `R$ ${formatarMoeda(valor || 0)}`;
      const cls = isPago ? 'pag-icon-pago' : 'pag-icon-pendente';
      const txt = isPago ? '✓ Pago' : '⏳ Pendente';
      return `<div class="pag-status-cell"><span class="pag-valor">${vf}</span><span class="${cls}">${txt}</span></div>`;
    }
    return `<tr>
      <td data-label="Deslocamento"><strong>${m.nome_deslocamento || m.descricao || '—'}</strong></td>
      <td data-label="Repr. (R$)" class="text-center">${cellMembro(m.pagar_gratificacao==1, m.gratificacao_representacao, m.gratificacao_paga)}</td>
      <td data-label="Aj. Custo (R$)" class="text-center">${cellMembro(m.pagar_ajuda_custo==1,  m.ajuda_de_custo,             m.ajuda_custo_paga)}</td>
      <td data-label="Localidade" class="text-center">${cellMembro(m.gratificacao_localidade_pct>0, m.gratificacao_localidade_valor, m.localidade_paga)}</td>
      <td data-label="Alimentação (R$)" class="text-center">${cellMembro(m.receber_saque_alimentacao==1, m.saque_alimentacao, m.alimentacao_paga)}</td>
    </tr>`;
  }).join('');
}

// Excluir deslocamento de QUALQUER militar (Admin) — usa a rota /admin/missoes/:id,
// que não exige que o deslocamento pertença ao usuário logado.
window.excluirMissaoAdmin = async function(id) {
  if (confirm('Tem certeza que deseja excluir este deslocamento? Esta ação não pode ser desfeita.')) {
    try {
      const data = await apiFetch(`/admin/missoes/${id}`, {
        method: 'DELETE'
      });
      showToast(data.message);
      loadAndRenderPagamentos();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
};

window.togglePagamentoIndividual = async function(id, campo, valor) {
  try {
    const data = await apiFetch(`/admin/missoes/${id}/toggle_pagamento`, {
      method: 'PUT',
      body: JSON.stringify({ campo, valor })
    });
    showToast(data.message);
  } catch (error) {
    showToast(error.message, 'error');
    loadUserData(); // revert checkbox visual state
  }
};

// Alternar status de pagamento da gratificação (Admin)
window.toggleGratificacaoPaga = async function(id, checked) {
  try {
    const data = await apiFetch(`/admin/missoes/${id}/pago`, {
      method: 'PUT',
      body: JSON.stringify({ gratificacao_paga: checked })
    });
    showToast(data.message);
    loadUserData();
  } catch (error) {
    showToast(error.message, 'error');
    loadUserData(); // Recarregar para restaurar o estado visual do checkbox
  }
};

// Abrir modal de edição de BIs
window.abrirBiModal = function(id) {
  const missao = state.missoesPagamento.find(m => m.id === id);
  if (!missao) return;
  
  DOM.biMissaoId.value = missao.id;
  DOM.biDeslocamento.value = missao.bi_deslocamento || '';
  DOM.biRetorno.value = missao.bi_retorno || '';
  DOM.biSolicitacaoGratificacao.value = missao.bi_solicitacao_gratificacao || '';
  DOM.biObservacaoPagamento.value = missao.observacao_pagamento || '';
  
  DOM.biModal.classList.remove('hidden');
};

// Fechar modal de BIs
function fecharBiModal() {
  DOM.biModal.classList.add('hidden');
}
if (DOM.btnCloseBiModal) DOM.btnCloseBiModal.addEventListener('click', fecharBiModal);
if (DOM.btnCancelBiModal) DOM.btnCancelBiModal.addEventListener('click', fecharBiModal);

// Salvar BIs
if (DOM.formBiSave) {
  DOM.formBiSave.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = DOM.biMissaoId.value;
    const body = {
      bi_deslocamento: DOM.biDeslocamento.value.trim(),
      bi_retorno: DOM.biRetorno.value.trim(),
      bi_solicitacao_gratificacao: DOM.biSolicitacaoGratificacao.value.trim(),
      observacao_pagamento: DOM.biObservacaoPagamento.value.trim()
    };
    
    try {
      const data = await apiFetch(`/admin/missoes/${id}/pagamento`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      
      showToast(data.message);
      fecharBiModal();
      loadUserData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Eventos do Auto-registro de Missão pelo Membro
function atualizarMembroPreviewMissao() {
  const data_inicio = DOM.membroMissaoInicio.value;
  const data_termino = DOM.membroMissaoTermino.value;
  
  if (!data_inicio || !data_termino) {
    DOM.membroPreviewDias.textContent = '0 dias';
    DOM.membroPreviewGratificacao.textContent = 'R$ 0,00';
    if (DOM.membroPreviewAjudaCusto) DOM.membroPreviewAjudaCusto.textContent = 'R$ 0,00';
    if (DOM.membroPreviewSaque) DOM.membroPreviewSaque.textContent = 'R$ 0,00';
    DOM.membroPreviewDispensas.textContent = '0 dias';
    return;
  }
  
  const dias = Math.max(0, calcularDiasFração(data_inicio, data_termino));
  
  if (dias <= 0) {
    DOM.membroPreviewDias.textContent = '0 dias';
    DOM.membroPreviewGratificacao.textContent = 'R$ 0,00';
    if (DOM.membroPreviewAjudaCusto) DOM.membroPreviewAjudaCusto.textContent = 'R$ 0,00';
    if (DOM.membroPreviewSaque) DOM.membroPreviewSaque.textContent = 'R$ 0,00';
    DOM.membroPreviewDispensas.textContent = '0 dias';
    return;
  }
  
  const soldo = state.user ? state.user.soldo : 0;
  const tipo = DOM.membroMissaoTipo ? DOM.membroMissaoTipo.value : 'Missão';
  
  if (tipo === 'Cursos/Estágio') {
    if (DOM.membroPainelCursos) DOM.membroPainelCursos.classList.remove('hidden');
  } else {
    if (DOM.membroPainelCursos) DOM.membroPainelCursos.classList.add('hidden');
  }

  const isPagarGratificacao = tipo === 'Cursos/Estágio' 
    ? (DOM.membroMissaoGratificacao ? DOM.membroMissaoGratificacao.checked : true)
    : ['Missão', 'Reconhecimento', 'Adestramento'].includes(tipo);
    
  const isPagarAjudaCusto = tipo === 'Cursos/Estágio'
    ? (DOM.membroMissaoAjudaCusto ? DOM.membroMissaoAjudaCusto.checked : false)
    : false;

  let diasRep = dias;
  if (tipo === 'Cursos/Estágio' && DOM.membroMissaoDiasGrat && DOM.membroMissaoDiasGrat.value) {
    const diasEspecificos = parseInt(DOM.membroMissaoDiasGrat.value);
    if (diasEspecificos > 0) diasRep = diasEspecificos;
  }

  const gratificacao = isPagarGratificacao ? (soldo * 0.02 * diasRep) : 0;
  const ajudaCusto = isPagarAjudaCusto ? soldo : 0;
  const pctLocalidade = DOM.membroMissaoLocalidade ? parseInt(DOM.membroMissaoLocalidade.value) : 0;
  const localidadeValor = (soldo * (pctLocalidade / 100) / 30) * dias;

  const isReceberSaque = DOM.membroMissaoReceberSaque && DOM.membroMissaoReceberSaque.checked;
  const diasSaque = isReceberSaque && DOM.membroMissaoDiasSaque.value ? parseInt(DOM.membroMissaoDiasSaque.value) : dias;
  const qtdSaque = isReceberSaque && DOM.membroMissaoQtdSaque.value ? parseInt(DOM.membroMissaoQtdSaque.value) : 1;
  const saque = isReceberSaque ? (13.50 * diasSaque * qtdSaque) : 0;

  const dispensas = calcularDispensasPadrao(data_inicio, data_termino);
  
  DOM.membroPreviewDias.textContent = `${dias} dias`;
  DOM.membroPreviewGratificacao.textContent = `R$ ${formatarMoeda(gratificacao)}`;
  if (DOM.membroPreviewLocalidade) DOM.membroPreviewLocalidade.textContent = `R$ ${formatarMoeda(localidadeValor)}`;
  if (DOM.membroPreviewAjudaCusto) DOM.membroPreviewAjudaCusto.textContent = `R$ ${formatarMoeda(ajudaCusto)}`;
  if (DOM.membroPreviewSaque) DOM.membroPreviewSaque.textContent = `R$ ${formatarMoeda(saque)}`;
  DOM.membroPreviewDispensas.textContent = `${dispensas} dias`;
}

if (DOM.membroMissaoInicio) {
  DOM.membroMissaoInicio.addEventListener('change', atualizarMembroPreviewMissao);
}
if (DOM.membroMissaoTermino) {
  DOM.membroMissaoTermino.addEventListener('change', atualizarMembroPreviewMissao);
}
if (DOM.membroMissaoTipo) {
  DOM.membroMissaoTipo.addEventListener('change', atualizarMembroPreviewMissao);
}
if (DOM.membroMissaoLocalidade) {
  DOM.membroMissaoLocalidade.addEventListener('change', atualizarMembroPreviewMissao);
}
if (DOM.membroMissaoGratificacao) DOM.membroMissaoGratificacao.addEventListener('change', atualizarMembroPreviewMissao);
if (DOM.membroMissaoAjudaCusto) DOM.membroMissaoAjudaCusto.addEventListener('change', atualizarMembroPreviewMissao);
if (DOM.membroMissaoDiasGrat) DOM.membroMissaoDiasGrat.addEventListener('input', atualizarMembroPreviewMissao);

if (DOM.formMembroMissao) {
  DOM.formMembroMissao.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome_deslocamento = DOM.membroMissaoNome ? DOM.membroMissaoNome.value.trim() : '';
    const tipo_deslocamento = DOM.membroMissaoTipo ? DOM.membroMissaoTipo.value : 'Missão';
    const descricao = DOM.membroMissaoDesc.value.trim();
    const data_inicio = DOM.membroMissaoInicio.value;
    const data_termino = DOM.membroMissaoTermino.value;
    const gratificacao_localidade_pct = DOM.membroMissaoLocalidade ? DOM.membroMissaoLocalidade.value : '0';
    const pagar_gratificacao = DOM.membroMissaoGratificacao ? DOM.membroMissaoGratificacao.checked : true;
    const pagar_ajuda_custo = DOM.membroMissaoAjudaCusto ? DOM.membroMissaoAjudaCusto.checked : false;
    const dias_gratificacao = DOM.membroMissaoDiasGrat ? DOM.membroMissaoDiasGrat.value : '';
    
    if (new Date(data_inicio) > new Date(data_termino)) {
      showToast('A data e hora de término devem ser posteriores à data e hora de início.', 'error');
      return;
    }
    
    try {
      const data = await apiFetch('/membro/missoes', {
        method: 'POST',
        body: JSON.stringify({ 
          nome_deslocamento,
          tipo_deslocamento,
          descricao, 
          data_inicio, 
          data_termino, 
          gratificacao_localidade_pct, 
          pagar_gratificacao, 
          pagar_ajuda_custo, 
          dias_gratificacao,
          receber_saque_alimentacao: DOM.membroMissaoReceberSaque && DOM.membroMissaoReceberSaque.checked,
          dias_saque_alimentacao: DOM.membroMissaoDiasSaque ? DOM.membroMissaoDiasSaque.value : '',
          qtd_saque_alimentacao: DOM.membroMissaoQtdSaque ? DOM.membroMissaoQtdSaque.value : ''
        })
      });
      
      showToast(data.message);
      DOM.formMembroMissao.reset();
      atualizarMembroPreviewMissao();
      loadUserData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Imprimir relatório de ficha completa de um militar específico
window.imprimirRelatorioMilitar = async function(id) {
  try {
    const data = await apiFetch(`/admin/usuarios/${id}/resumo`);
    const { user, resumo, missoes, ferias, dispensas, saques_etapa } = data;
    
    let missoesRows = '';
    if (missoes.length === 0) {
      missoesRows = '<tr><td colspan="6" style="text-align: center;">Nenhuma missão registrada</td></tr>';
    } else {
      missoes.forEach(m => {
        missoesRows += `
          <tr>
            <td>${m.descricao}</td>
            <td>${formatarDataHora(m.data_inicio)}</td>
            <td>${formatarDataHora(m.data_termino)}</td>
            <td>${m.dias_missao} dias</td>
            <td>R$ ${formatarMoeda(m.gratificacao_representacao)}</td>
            <td>${m.gratificacao_paga ? 'Pago' : 'Pendente'}</td>
          </tr>
        `;
      });
    }
    
    let feriasRows = '';
    if (ferias.length === 0) {
      feriasRows = '<tr><td colspan="3" style="text-align: center;">Nenhum período de férias registrado</td></tr>';
    } else {
      ferias.forEach(f => {
        feriasRows += `
          <tr>
            <td>${formatarData(f.data_inicio)}</td>
            <td>${formatarData(f.data_termino)}</td>
            <td>${f.dias_ferias} dias</td>
          </tr>
        `;
      });
    }
    
    let dispensasRows = '';
    if (dispensas.length === 0) {
      dispensasRows = '<tr><td colspan="5" style="text-align: center;">Nenhuma dispensa registrada</td></tr>';
    } else {
      dispensas.forEach(d => {
        const tipoText = d.tipo_dispensa === 'comum' ? 'Comum' : 'Decorrente de Missão';
        dispensasRows += `
          <tr>
            <td>${formatarData(d.data_inicio)}</td>
            <td>${formatarData(d.data_termino)}</td>
            <td>${d.dias_dispensa} dias</td>
            <td>${tipoText}</td>
            <td>${d.status}</td>
          </tr>
        `;
      });
    }

    let saquesRows = '';
    if (!saques_etapa || saques_etapa.length === 0) {
      saquesRows = '<tr><td colspan="5" style="text-align: center;">Nenhum saque etapa registrado</td></tr>';
    } else {
      saques_etapa.forEach(s => {
        saquesRows += `
          <tr>
            <td>${formatarData(s.data_inicio)} a ${formatarData(s.data_termino)}</td>
            <td>${s.quantidade_etapas}</td>
            <td>R$ ${formatarMoeda(s.valor)}</td>
            <td>${s.status}</td>
            <td>${s.bi_pagamento || '-'}</td>
          </tr>
        `;
      });
    }
    
    DOM.reportPrintContainer.innerHTML = `
      <div class="report-header">
        <h1>Ficha de Controle de Pessoal</h1>
        <h2>Gestão Operacional e Financeira de Pessoal</h2>
      </div>
      
      <div class="report-section">
        <h3>Identificação do Militar</h3>
        <div class="report-grid">
          <div><strong>Nome Completo:</strong> ${user.nome}</div>
          <div><strong>Matrícula:</strong> ${user.matricula}</div>
          <div><strong>Posto / Graduação:</strong> ${user.posto_graduacao}</div>
          <div><strong>Soldo Base:</strong> R$ ${formatarMoeda(user.soldo)}</div>
          <div><strong>Tipo de Acesso:</strong> ${user.role === 'admin' ? 'Administrador' : 'Membro'}</div>
          <div><strong>Saldo Inicial de Dispensas:</strong> ${user.saldo_inicial_dispensas} dias</div>
        </div>
      </div>
      
      <div class="report-section">
        <h3>Resumo de Saldos e Acumulados</h3>
        <div class="report-grid">
          <div><strong>Dias Acumulados em Missão:</strong> ${resumo.totalDiasMissao} dias</div>
          <div><strong>Total de Gratificação de Representação:</strong> R$ ${formatarMoeda(resumo.totalGratificacao)}</div>
          <div><strong>Total de Saque Etapa Alimentação:</strong> R$ ${formatarMoeda(resumo.totalSaqueAlimentacao)}</div>
          <div><strong>Dispensas Acumuladas (Missões + Inicial):</strong> ${resumo.dispensasAcumuladas} dias</div>
          <div><strong>Dispensas Utilizadas:</strong> ${resumo.dispensasUtilizadas} dias</div>
          <div><strong>Saldo de Dispensas Restante:</strong> ${resumo.dispensasRestantes} dias</div>
        </div>
      </div>
      
      <div class="report-section">
        <h3>Histórico de Missões</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Início (Saída)</th>
              <th>Término (Retorno)</th>
              <th>Duração</th>
              <th>Gratificação (R$)</th>
              <th>Status Pagamento</th>
            </tr>
          </thead>
          <tbody>
            ${missoesRows}
          </tbody>
        </table>
      </div>
      
      <div class="report-section">
        <h3>Histórico de Férias</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Data de Início</th>
              <th>Data de Término</th>
              <th>Total de Dias</th>
            </tr>
          </thead>
          <tbody>
            ${feriasRows}
          </tbody>
        </table>
      </div>
      
      <div class="report-section">
        <h3>Histórico de Dispensas (Folgas)</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Início</th>
              <th>Término</th>
              <th>Dias</th>
              <th>Tipo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${dispensasRows}
          </tbody>
        </table>
      </div>

      <div class="report-section">
        <h3>Histórico de Saque Etapa</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Quantidade de Etapas</th>
              <th>Valor (R$)</th>
              <th>Status</th>
              <th>BI Pagamento</th>
            </tr>
          </thead>
          <tbody>
            ${saquesRows}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid;">
        <div style="text-align: center; width: 45%;">
          <div style="border-top: 1px solid #000; padding-top: 5px;">${user.nome}</div>
          <div style="font-size: 0.8rem; color: #555;">Assinatura do Militar</div>
        </div>
        <div style="text-align: center; width: 45%;">
          <div style="border-top: 1px solid #000; padding-top: 5px;">${state.user.nome}</div>
          <div style="font-size: 0.8rem; color: #555;">Assinatura do Administrador</div>
        </div>
      </div>
    `;
    
    // Disparar impressão
    window.print();
  } catch (error) {
    showToast('Erro ao gerar relatório do militar: ' + error.message, 'error');
  }
};

// Fechar modal de Saque BIs
function fecharSaqueBiModal() {
  DOM.saqueBiModal.classList.add('hidden');
}
if (DOM.btnCloseSaqueBiModal) DOM.btnCloseSaqueBiModal.addEventListener('click', fecharSaqueBiModal);
if (DOM.btnCancelSaqueBiModal) DOM.btnCancelSaqueBiModal.addEventListener('click', fecharSaqueBiModal);

// Fechar modal de deslocamentos do militar
const modalDeslocamentos = document.getElementById('modal-deslocamentos-usuario');
const btnCloseDeslocamentos = document.getElementById('btn-close-deslocamentos-modal');
function fecharDeslocamentosModal() {
  if (modalDeslocamentos) modalDeslocamentos.classList.add('hidden');
}
if (btnCloseDeslocamentos) btnCloseDeslocamentos.addEventListener('click', fecharDeslocamentosModal);

// Salvar BIs de Saque Etapa
if (DOM.formSaqueBiSave) {
  DOM.formSaqueBiSave.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = DOM.saqueBiId.value;
    const body = {
      bi_solicitacao: DOM.saqueBiSolicitacao.value.trim(),
      bi_pagamento: DOM.saqueBiPagamento.value.trim(),
      observacao: DOM.saqueBiObservacao.value.trim()
    };
    
    try {
      const data = await apiFetch(`/admin/saques-etapa/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      
      showToast(data.message);
      fecharSaqueBiModal();
      loadUserData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Destino Diário Search and Render
let stateDestinos = []; // Cache do resultado atual para impressão

if (DOM.btnBuscarDestino) {
  DOM.btnBuscarDestino.addEventListener('click', async () => {
    const dataConsulta = DOM.filtroDataDestino.value;
    if (!dataConsulta) {
      showToast('Por favor, selecione uma data para consulta.', 'error');
      return;
    }
    
    try {
      const data = await apiFetch(`/destino-diario?data=${dataConsulta}`);
      stateDestinos = data;
      
      // Formatar a data para exibição no título
      DOM.tituloDestinoDiario.textContent = `Destino do Efetivo em: ${formatarData(dataConsulta)}`;
      
      DOM.tableDestinoDiarioBody.innerHTML = '';
      if (data.length === 0) {
        DOM.tableDestinoDiarioBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum militar cadastrado no sistema.</td></tr>';
        return;
      }
      
      data.forEach(d => {
        let detailsHtml = '<span class="text-muted">-</span>';
        if (d.detalhes) {
          if (d.detalhes.tipo === 'ferias') {
            detailsHtml = `Férias de ${formatarData(d.detalhes.inicio)} a ${formatarData(d.detalhes.termino)}`;
          } else if (d.detalhes.tipo === 'dispensa') {
            detailsHtml = `Dispensa de ${formatarData(d.detalhes.inicio)} a ${formatarData(d.detalhes.termino)}${d.detalhes.obs ? ` - Obs: ${d.detalhes.obs}` : ''}`;
          } else if (d.detalhes.tipo === 'missao') {
            detailsHtml = `Missão: <strong>${d.detalhes.descricao}</strong> (Saída: ${formatarDataHora(d.detalhes.inicio)}, Retorno: ${formatarDataHora(d.detalhes.termino)})`;
          }
        }
        
        DOM.tableDestinoDiarioBody.innerHTML += `
          <tr>
            <td data-label="Posto/Grad">${d.posto_graduacao}</td>
            <td data-label="Nome Militar"><strong>${d.nome}</strong></td>
            <td data-label="Identidade"><code>${d.matricula}</code></td>
            <td data-label="Destino / Status"><span class="badge badge-status ${d.statusClass}">${d.status}</span></td>
            <td data-label="Detalhes">${detailsHtml}</td>
          </tr>
        `;
      });
      
    } catch (error) {
      showToast('Erro ao buscar destinos diários: ' + error.message, 'error');
    }
  });
}

// Impressão da Ficha de Destino Diário
if (DOM.btnImprimirDestino) {
  DOM.btnImprimirDestino.addEventListener('click', () => {
    const dataConsulta = DOM.filtroDataDestino.value;
    if (stateDestinos.length === 0 || !dataConsulta) {
      showToast('Por favor, faça uma busca antes de imprimir.', 'error');
      return;
    }
    
    let rowsHtml = '';
    stateDestinos.forEach(d => {
      let detailsText = '-';
      if (d.detalhes) {
        if (d.detalhes.tipo === 'ferias') {
          detailsText = `Férias de ${formatarData(d.detalhes.inicio)} a ${formatarData(d.detalhes.termino)}`;
        } else if (d.detalhes.tipo === 'dispensa') {
          detailsText = `Dispensa de ${formatarData(d.detalhes.inicio)} a ${formatarData(d.detalhes.termino)}${d.detalhes.obs ? ` - Obs: ${d.detalhes.obs}` : ''}`;
        } else if (d.detalhes.tipo === 'missao') {
          detailsText = `Missão: ${d.detalhes.descricao} (${formatarDataHora(d.detalhes.inicio)} a ${formatarDataHora(d.detalhes.termino)})`;
        }
      }
      
      rowsHtml += `
        <tr>
          <td>${d.posto_graduacao}</td>
          <td><strong>${d.nome}</strong></td>
          <td>${d.matricula}</td>
          <td>${d.status}</td>
          <td>${detailsText}</td>
        </tr>
      `;
    });
    
    DOM.reportPrintContainer.innerHTML = `
      <div class="report-header">
        <h1>Relatório de Destino Diário do Efetivo</h1>
        <h2>Data da Consulta: ${formatarData(dataConsulta)}</h2>
      </div>
      
      <div class="report-section">
        <table class="report-table">
          <thead>
            <tr>
              <th>Posto/Grad</th>
              <th>Nome Militar</th>
              <th>Matrícula</th>
              <th>Status / Situação</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 50px; display: flex; justify-content: center; page-break-inside: avoid;">
        <div style="text-align: center; width: 50%;">
          <div style="border-top: 1px solid #000; padding-top: 5px;">${state.user.nome}</div>
          <div style="font-size: 0.8rem; color: #555;">Assinatura do Administrador / Responsável</div>
        </div>
      </div>
    `;
    
    window.print();
  });
}

// Fechar modal ao clicar fora da área de conteúdo do modal
window.addEventListener('click', (e) => {
  if (e.target === DOM.userModal) {
    fecharUserModal();
  }
  if (e.target === DOM.biModal) {
    fecharBiModal();
  }
  if (e.target === DOM.saqueBiModal) {
    fecharSaqueBiModal();
  }
  if (e.target === DOM.editMissaoModal) {
    fecharEditMissaoModal();
  }
  if (modalDeslocamentos && e.target === modalDeslocamentos) {
    fecharDeslocamentosModal();
  }
});

// Inicialização do APP
initTheme();
loadSoldosTable();
renderAuthView();

// ==========================================
// EDIÇÃO E EXCLUSÃO DE FÉRIAS E DISPENSAS 
// ==========================================

const modalEditFerias = document.getElementById('modal-edit-ferias');
const modalEditDispensa = document.getElementById('modal-edit-dispensa');

// --- FÉRIAS ---
window.abrirModalEditFerias = function(id) {
  const f = state._feriasUser.find(x => x.id === id);
  if (!f) return;
  document.getElementById('edit-ferias-id').value = f.id;
  document.getElementById('edit-ferias-inicio').value = f.data_inicio.split('T')[0];
  document.getElementById('edit-ferias-termino').value = f.data_termino.split('T')[0];
  modalEditFerias.classList.remove('hidden');
};

const fecharModalEditFerias = () => {
  modalEditFerias.classList.add('hidden');
  document.getElementById('form-edit-ferias').reset();
};
if(document.getElementById('btn-close-edit-ferias')) document.getElementById('btn-close-edit-ferias').addEventListener('click', fecharModalEditFerias);
if(document.getElementById('btn-cancel-edit-ferias')) document.getElementById('btn-cancel-edit-ferias').addEventListener('click', fecharModalEditFerias);

window.excluirFerias = async function(id) {
  if (!confirm('Deseja realmente remover permanentemente este registro de férias?')) return;
  try {
    const data = await apiFetch(`/admin/ferias/${id}`, { method: 'DELETE' });
    showToast(data.message);
    loadDashboardData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

document.getElementById('form-edit-ferias').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-ferias-id').value;
  try {
    const data = await apiFetch(`/admin/ferias/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        data_inicio: document.getElementById('edit-ferias-inicio').value,
        data_termino: document.getElementById('edit-ferias-termino').value
      })
    });
    showToast(data.message);
    fecharModalEditFerias();
    loadDashboardData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// --- DISPENSAS ---
window.abrirModalEditDispensa = function(id) {
  const d = state._dispensasUser.find(x => x.id === id);
  if (!d) return;
  document.getElementById('edit-dispensa-id').value = d.id;
  document.getElementById('edit-dispensa-inicio').value = d.data_inicio.split('T')[0];
  document.getElementById('edit-dispensa-termino').value = d.data_termino.split('T')[0];
  document.getElementById('edit-dispensa-tipo').value = d.tipo_dispensa === 'comum' ? 'comum' : 'missao';
  document.getElementById('edit-dispensa-observacao').value = d.observacao || '';
  modalEditDispensa.classList.remove('hidden');
};

const fecharModalEditDispensa = () => {
  modalEditDispensa.classList.add('hidden');
  document.getElementById('form-edit-dispensa').reset();
};
if(document.getElementById('btn-close-edit-dispensa')) document.getElementById('btn-close-edit-dispensa').addEventListener('click', fecharModalEditDispensa);
if(document.getElementById('btn-cancel-edit-dispensa')) document.getElementById('btn-cancel-edit-dispensa').addEventListener('click', fecharModalEditDispensa);

window.excluirDispensa = async function(id) {
  if (!confirm('Deseja realmente remover permanentemente este registro de dispensa?')) return;
  try {
    const data = await apiFetch(`/admin/dispensas/${id}`, { method: 'DELETE' });
    showToast(data.message);
    loadDashboardData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

document.getElementById('form-edit-dispensa').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-dispensa-id').value;
  try {
    const data = await apiFetch(`/admin/dispensas/${id}/edit`, {
      method: 'PUT',
      body: JSON.stringify({
        data_inicio: document.getElementById('edit-dispensa-inicio').value,
        data_termino: document.getElementById('edit-dispensa-termino').value,
        tipo_dispensa: document.getElementById('edit-dispensa-tipo').value,
        observacao: document.getElementById('edit-dispensa-observacao').value
      })
    });
    showToast(data.message);
    fecharModalEditDispensa();
    loadDashboardData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Add listeners to close these modais when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === modalEditFerias) fecharModalEditFerias();
  if (e.target === modalEditDispensa) fecharModalEditDispensa();
});
