const $ = id => document.getElementById(id);
const arena = $('arena-canvas');
const arenaContext = arena.getContext('2d', {alpha: false});
const chart = $('evolution-chart');
const chartContext = chart.getContext('2d');
const worker = new Worker('/trainer.worker.js');
const MAX_HISTORY = 30;
let snapshot = null;
let population = 10000;
let generation = 1;
let alive = 10000;
let bestDistance = 0;
let bestFitness = 0;
let history = [];
let isRunning = false;
let startTime = 0;
let elapsedBase = 0;
let timerFrame = 0;
let chosenGame = 'dino';
let imageSummary = null;
let deferredInstall = null;
let champion = null;

function formatNumber(value) { return Math.max(0, Math.floor(value)).toLocaleString('pt-BR'); }
function logTerminal(message, type = 'cyan') {
  const log = $('terminal-log');
  const row = document.createElement('p');
  const mark = document.createElement('span');
  mark.className = type === 'ok' ? 'terminal-green' : type === 'warn' ? 'terminal-muted' : 'terminal-cyan';
  mark.textContent = type === 'ok' ? '✓ ' : type === 'warn' ? '! ' : '› ';
  row.append(mark, document.createTextNode(message));
  log.append(row);
  while (log.children.length > 7) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}

function resizeCanvas(canvas, context) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * ratio));
  const height = Math.max(1, Math.floor(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return {width: rect.width, height: rect.height};
}

function drawArena() {
  const {width, height} = resizeCanvas(arena, arenaContext);
  const ctx = arenaContext;
  ctx.fillStyle = '#08111d';
  ctx.fillRect(0, 0, width, height);
  const rows = Math.max(30, Math.floor(height / 4.1));
  const cols = Math.ceil(population / rows);
  const cellX = width / Math.max(cols, 1);
  const cellY = height / rows;
  ctx.strokeStyle = 'rgba(80,122,159,.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  for (let x = 0; x < width; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  const phase = snapshot ? Math.min(1, snapshot.progress) : 0;
  const obstacles = [0.14, 0.29, 0.45, 0.62, 0.78, 0.93];
  ctx.fillStyle = 'rgba(255,184,107,.35)';
  for (const obstacle of obstacles) {
    const x = width * (obstacle - phase * 0.88);
    if (x > 0 && x < width) ctx.fillRect(x, 17, 2, height - 34);
  }
  if (snapshot?.data) {
    const data = snapshot.data;
    for (let i = 0; i < population; i++) {
      const offset = i * 3;
      const aliveFlag = data[offset + 2] > 0.5;
      const progress = (data[offset] % 2700) / 2700;
      const x = Math.max(2, 9 + progress * (width - 18));
      const lane = i % rows;
      const y = lane * cellY + cellY * 0.5 - Math.min(13, data[offset + 1] * 0.12);
      ctx.fillStyle = aliveFlag ? (data[offset + 1] > 2 ? '#8df0e1' : '#49cddd') : 'rgba(82,101,127,.38)';
      ctx.globalAlpha = aliveFlag ? 0.8 : 0.45;
      ctx.fillRect(x, y, Math.max(1, cellX * 0.76), Math.max(1, cellY * 0.72));
    }
    ctx.globalAlpha = 1;
  } else {
    for (let i = 0; i < population; i++) {
      const lane = i % rows;
      ctx.fillStyle = '#2c8391';
      ctx.globalAlpha = 0.55;
      ctx.fillRect(9 + Math.random() * (width - 18), lane * cellY + cellY * 0.4, Math.max(1, cellX * .7), Math.max(1, cellY * .6));
    }
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = 'rgba(72,217,232,.45)';
  ctx.beginPath(); ctx.moveTo(8, height - 12); ctx.lineTo(width - 8, height - 12); ctx.stroke();
  ctx.fillStyle = 'rgba(72,217,232,.55)';
  ctx.font = '8px monospace';
  ctx.fillText('START', 9, height - 17);
  ctx.fillText('FINISH', width - 42, height - 17);
}

function drawChart() {
  const {width, height} = resizeCanvas(chart, chartContext);
  const ctx = chartContext;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(100,129,164,.15)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (height - 24) * i / 4 + 5;
    ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(width - 8, y); ctx.stroke();
  }
  if (!history.length) {
    ctx.fillStyle = '#657995'; ctx.font = '10px monospace'; ctx.fillText('A curva aparecerá após a primeira geração.', 25, height / 2);
    return;
  }
  const values = history.slice(-MAX_HISTORY).map(item => item.fitness);
  const max = Math.max(1, ...values) * 1.12;
  const points = values.map((value, index) => ({x: 25 + index * (width - 38) / Math.max(1, values.length - 1), y: height - 20 - (value / max) * (height - 36)}));
  const gradient = ctx.createLinearGradient(0, 8, 0, height - 14);
  gradient.addColorStop(0, 'rgba(72,217,232,.22)');
  gradient.addColorStop(1, 'rgba(72,217,232,0)');
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.lineTo(points.at(-1).x, height - 15); ctx.lineTo(points[0].x, height - 15); ctx.closePath();
  ctx.fillStyle = gradient; ctx.fill();
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.strokeStyle = '#48d9e8'; ctx.lineWidth = 2; ctx.shadowColor = '#48d9e8'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  points.forEach(point => { ctx.beginPath(); ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#b2f8f1'; ctx.fill(); });
}

function updateMetrics(data) {
  generation = data.generation || generation;
  alive = data.alive ?? alive;
  bestDistance = Math.max(bestDistance, data.distance || 0);
  bestFitness = Math.max(bestFitness, data.fitness || 0);
  $('generation-value').textContent = String(generation).padStart(4, '0');
  $('alive-value').textContent = formatNumber(alive);
  $('distance-value').innerHTML = `${Math.round(bestDistance).toLocaleString('pt-BR')}<span class="metric-unit">m</span>`;
  $('fitness-value').textContent = Number(data.average || 0).toFixed(2);
  $('generation-progress').style.width = `${Math.round((data.progress || 0) * 100)}%`;
  snapshot = data;
  drawArena();
}

function updateClock() {
  if (isRunning) {
    const elapsed = elapsedBase + performance.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    $('sim-clock').textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  }
  timerFrame = requestAnimationFrame(updateClock);
}

function setRunning(value) {
  isRunning = value;
  $('train-button').innerHTML = value ? '<span class="button-icon">Ⅱ</span> Pausar treinamento' : '<span class="button-icon">▶</span> Ativar modo treinamento';
  $('arena-status').textContent = value ? 'TREINANDO' : 'PAUSADO';
  $('arena-status-dot').classList.toggle('running', value);
  const status = document.querySelector('.panel-status');
  if (status) status.classList.toggle('running', value);
  $('connection-state').textContent = value ? 'TREINAMENTO ATIVO' : 'MOTOR PRONTO';
  if (value) startTime = performance.now();
  else elapsedBase += performance.now() - startTime;
}

worker.onmessage = event => {
  const message = event.data || {};
  if (message.type === 'ready') {
    population = message.population;
    alive = population;
    updateMetrics({generation: 1, alive, distance: 0, fitness: 0, average: 0, progress: 0});
    logTerminal(`População inicializada: ${formatNumber(population)} agentes`, 'ok');
  }
  if (message.type === 'frame') updateMetrics(message);
  if (message.type === 'state') setRunning(message.running);
  if (message.type === 'generation-end') {
    const result = message.result;
    history = message.history || history;
    champion = result.champion;
    if (champion) localStorage.setItem('neural-arena-champion', JSON.stringify(champion));
    const entry = {generation: result.generation, fitness: result.bestFitness};
    const stored = JSON.parse(localStorage.getItem('neural-arena-history') || '[]');
    stored.push(entry);
    localStorage.setItem('neural-arena-history', JSON.stringify(stored.slice(-MAX_HISTORY)));
    $('history-count').textContent = `${history.length} gerações concluídas`;
    drawChart();
    logTerminal(`Geração ${result.generation} concluída · fitness ${result.bestFitness.toFixed(2)}`, 'ok');
    logTerminal('Selecionando elite e aplicando mutações...', 'cyan');
  }
  if (message.type === 'generation-start') {
    bestDistance = 0; bestFitness = 0;
    logTerminal(`Geração ${message.generation} iniciada · ${formatNumber(message.population)} cópias`, 'ok');
  }
};
worker.onerror = error => {
  $('connection-state').textContent = 'ERRO NO MOTOR';
  logTerminal(`Falha no Worker: ${error.message}`, 'warn');
};

function loadChampion() {
  try { const value = JSON.parse(localStorage.getItem('neural-arena-champion') || 'null'); return Array.isArray(value) ? value : null; }
  catch { return null; }
}

worker.postMessage({type: 'init', population, champion: loadChampion()});

$('train-button').addEventListener('click', () => {
  if (isRunning) worker.postMessage({type: 'pause'});
  else {
    if (chosenGame !== 'dino') {
      logTerminal('Treinamento de agentes disponível no Dino Runner integrado. Minecraft usa perfil de estudo.', 'warn');
      $('environment-select').value = 'dino';
      chosenGame = 'dino';
    }
    worker.postMessage({type: 'start'});
    logTerminal('Modo treinamento ativado. Agentes executando em paralelo.', 'ok');
  }
});
$('reset-button').addEventListener('click', () => {
  worker.postMessage({type: 'reset', population, champion: loadChampion()});
  setRunning(false);
  elapsedBase = 0;
  $('sim-clock').textContent = '00:00';
  bestDistance = 0; bestFitness = 0;
  logTerminal('Geração reiniciada com a população selecionada.', 'warn');
});
$('population-select').addEventListener('change', event => {
  population = Number(event.target.value);
  worker.postMessage({type: 'reset', population, champion: loadChampion()});
  setRunning(false);
  elapsedBase = 0;
  logTerminal(`População ajustada para ${formatNumber(population)} agentes.`, 'warn');
});
$('speed-select').addEventListener('change', event => worker.postMessage({type: 'speed', value: Number(event.target.value)}));
$('environment-select').addEventListener('change', event => {
  chosenGame = event.target.value;
  $('study-profile').value = chosenGame === 'minecraft' ? 'minecraft' : 'dino';
  logTerminal(chosenGame === 'dino' ? 'Ambiente Dino Runner selecionado.' : 'Perfil Minecraft selecionado. O treino não controla o jogo real.', 'warn');
});

for (const tab of document.querySelectorAll('.tool-tab')) {
  tab.addEventListener('click', () => {
    for (const item of document.querySelectorAll('.tool-tab')) { item.classList.toggle('active', item === tab); item.setAttribute('aria-selected', item === tab ? 'true' : 'false'); }
    for (const name of ['study','research','modify']) $(name + '-panel').hidden = name !== tab.dataset.tab;
  });
}

const researchLibrary = [
  {keys:['mineração','mineracao','minério','minerio','caverna'], title:'Fluxo de mineração', content:'Priorize iluminação antes da exploração profunda; mantenha rota de retorno e marque bifurcações. Para minério raro, use ramificações curtas e registre coordenadas.'},
  {keys:['fps','lag','desempenho','otimização','otimizacao'], title:'Diagnóstico de desempenho', content:'Reduza distância de renderização e partículas em etapas, desative shaders pesados e compare FPS médio antes/depois. Não substitua arquivos do jogo automaticamente.'},
  {keys:['inventário','inventario','item','hotbar'], title:'Gestão de inventário', content:'Separe slots por função, reserve espaço para blocos de emergência e mantenha ferramentas essenciais na hotbar. O plano pode ser exportado como lista de configuração.'},
  {keys:['parkour','movimento','pulo','salto'], title:'Controle de movimento', content:'Calcule distância até a borda, preserve velocidade e só inicie o salto quando a janela de aterrissagem estiver dentro do alcance. Pratique em mundo de teste.'},
  {keys:['mob','criatura','inimigo','combate'], title:'Leitura de ameaças', content:'Mantenha linha de fuga, evite lutar em terreno sem espaço e use barreiras e iluminação. O protótipo não detecta entidades sozinho; use uma captura e descreva a situação.'},
  {keys:['bloco','construção','construcao','casa','estrutura'], title:'Planejamento de construção', content:'Defina uma grade modular, valide dimensões e materiais antes de colocar blocos. Exporte a planta em JSON para usar como referência manual.'},
  {keys:['sobrevivência','sobrevivencia','vida','comida','fome'], title:'Rotina de sobrevivência', content:'Organize abrigo, fonte de alimento, iluminação e rota segura antes de explorar. Priorize ações reversíveis quando a saúde estiver baixa.'}
];

function runResearch(query, profile) {
  const normalized = (query || '').toLocaleLowerCase('pt-BR').trim();
  const matches = researchLibrary.filter(item => item.keys.some(key => normalized.includes(key)) || (!normalized && item.keys.some(key => key.includes(profile))));
  return matches.length ? matches : [{title:'Pesquisa geral de gameplay', content:'Defina o objetivo, liste as observações, identifique restrições do ambiente e teste uma única alteração de cada vez. A biblioteca local não consulta a internet nem lê dados internos do jogo.'}];
}

function renderResearch(items, label) {
  logTerminal(label, 'ok');
  for (const item of items) logTerminal(`${item.title}: ${item.content}`, 'cyan');
  $('image-result').hidden = false;
  $('image-result').textContent = items.map(item => `${item.title}\n${item.content}`).join('\n\n');
}

$('study-button').addEventListener('click', () => {
  const profile = $('study-profile').value;
  const query = profile === 'mining' ? 'mineração' : profile === 'building' ? 'construção' : profile === 'parkour' ? 'parkour' : profile === 'minecraft' ? 'sobrevivência' : 'parkour';
  const detail = imageSummary ? ` Captura recebida (${imageSummary.width}×${imageSummary.height}); análise de cores: ${imageSummary.colors}.` : ' Nenhuma captura anexada; usando o perfil de estudo selecionado.';
  const items = runResearch(query, profile);
  renderResearch(items, `Estudo local iniciado: ${profile}.${detail}`);
});
$('research-button').addEventListener('click', () => {
  const query = $('research-query').value;
  renderResearch(runResearch(query, 'general'), `Pesquisa local: ${query || 'geral'}`);
});
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { $('research-query').value = button.dataset.query; $('research-button').click(); }));

$('screen-upload').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { logTerminal('Arquivo ignorado: selecione uma imagem.', 'warn'); return; }
  try {
    const image = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    context.drawImage(image, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < pixels.length; i += 4) { r += pixels[i]; g += pixels[i+1]; b += pixels[i+2]; }
    const count = pixels.length / 4;
    const colors = `RGB ${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)}`;
    imageSummary = {width: image.width, height: image.height, colors};
    $('image-result').hidden = false;
    $('image-result').textContent = `Captura carregada localmente · ${image.width}×${image.height} · cor média ${colors}. A análise visual é básica; escolha um perfil para consultar as estratégias predefinidas.`;
    logTerminal(`Captura carregada localmente: ${image.width}×${image.height}`, 'ok');
    image.close();
  } catch (error) { logTerminal(`Não foi possível ler a captura: ${error.message}`, 'warn'); }
});

$('generate-plan-button').addEventListener('click', () => {
  const type = $('modification-type').value;
  const notes = $('modification-notes').value.trim();
  const plan = {
    format: 'neural-arena-plan',
    version: 1,
    game: $('study-profile').value,
    target: type,
    description: notes || 'Plano criado a partir da biblioteca local.',
    status: 'proposal-only',
    generatedAt: new Date().toISOString(),
    changes: runResearch(type === 'mining' ? 'mineração' : type === 'movement' ? 'parkour' : type === 'building' ? 'construção' : type === 'survival' ? 'sobrevivência' : 'FPS', type)
  };
  const blob = new Blob([JSON.stringify(plan, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'neural-arena-plan.json'; a.click(); URL.revokeObjectURL(url);
  renderResearch(plan.changes, `Plano ${type} exportado em JSON. Nenhum arquivo do jogo foi alterado.`);
});

window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstall = event; $('install-button').hidden = false; });
$('install-button').addEventListener('click', async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('install-button').hidden = true; });
window.addEventListener('resize', () => { drawArena(); drawChart(); });
window.addEventListener('beforeunload', () => { cancelAnimationFrame(timerFrame); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(error => logTerminal(`PWA offline indisponível: ${error.message}`, 'warn'));
if (new URLSearchParams(location.search).get('hud') === '1') document.body.classList.add('hud-mode');
const storedHistory = JSON.parse(localStorage.getItem('neural-arena-history') || '[]');
history = storedHistory.map(entry => ({generation: entry.generation, fitness: entry.fitness}));
$('history-count').textContent = `${history.length} gerações concluídas`;
drawChart(); drawArena(); updateClock();
