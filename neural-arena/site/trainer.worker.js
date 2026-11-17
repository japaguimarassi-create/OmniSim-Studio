const INPUTS = 6;
const HIDDEN = 8;
const OUTPUTS = 3;
const GENOME_SIZE = INPUTS * HIDDEN + HIDDEN + HIDDEN * OUTPUTS + OUTPUTS;
const inputScratch = new Float32Array(INPUTS);
const hiddenScratch = new Float32Array(HIDDEN);
const outputScratch = new Float32Array(OUTPUTS);
let population = 10000;
let generation = 1;
let agents = [];
let obstacles = [];
let frame = 0;
let speedMultiplier = 2;
let running = false;
let lastTick = 0;
let bestDistance = 0;
let bestFitness = 0;
let history = [];
let champion = null;
let averageFitness = 0;
const capDistance = 2700;

function randomGenome() {
  const values = new Float32Array(GENOME_SIZE);
  for (let i = 0; i < values.length; i++) values[i] = (Math.random() * 2 - 1) * 1.25;
  return values;
}

function makeObstacles() {
  const out = [];
  let cursor = 245;
  for (let i = 0; i < 13; i++) {
    cursor += 190 + Math.random() * 145;
    out.push({x: cursor, h: 22 + Math.random() * 37, w: 10 + Math.random() * 9, type: Math.random() > .78 ? 1 : 0});
  }
  return out;
}

function makeAgent(genome) {
  return {g: genome, x: 0, y: 0, vy: 0, alive: 1, score: 0, age: 0, fitness: 0, next: 0, duck: 0, max: 0};
}

function initialize(count, seed) {
  population = count || 10000;
  generation = 1;
  frame = 0;
  bestDistance = 0;
  bestFitness = 0;
  averageFitness = 0;
  history = [];
  champion = seed instanceof Array && seed.length === GENOME_SIZE ? new Float32Array(seed) : null;
  agents = Array.from({length: population}, (_, i) => makeAgent(i === 0 && champion ? new Float32Array(champion) : randomGenome()));
  obstacles = makeObstacles();
  running = false;
  publish(true);
  postMessage({type: 'ready', population, generation, genomeSize: GENOME_SIZE});
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-Math.max(-12, Math.min(12, x))));
}

function infer(agent, distance, obstacleHeight, obstacleGap) {
  const g = agent.g;
  inputScratch[0] = Math.max(0, Math.min(1, distance / 260));
  inputScratch[1] = obstacleHeight / 65;
  inputScratch[2] = 6.5 / 12;
  inputScratch[3] = agent.y / 80;
  inputScratch[4] = agent.vy / 14;
  inputScratch[5] = Math.max(0, Math.min(1, obstacleGap / 260));
  let p = 0;
  for (let h = 0; h < HIDDEN; h++) {
    let sum = g[INPUTS * HIDDEN + h];
    for (let i = 0; i < INPUTS; i++) sum += inputScratch[i] * g[p++];
    hiddenScratch[h] = Math.max(0, sum);
  }
  const base = INPUTS * HIDDEN + HIDDEN;
  p = base;
  for (let o = 0; o < OUTPUTS; o++) {
    let sum = g[base + HIDDEN * OUTPUTS + o];
    for (let h = 0; h < HIDDEN; h++) sum += hiddenScratch[h] * g[p++];
    outputScratch[o] = sigmoid(sum);
  }
  return outputScratch;
}

function findObstacleIndex(x) {
  for (let i = 0; i < obstacles.length - 1; i++) {
    if (obstacles[i].x + obstacles[i].w >= x - 4) return i;
  }
  return obstacles.length - 1;
}

function tick() {
  if (!running) return;
  frame++;
  const dt = 0.56 * speedMultiplier;
  let alive = 0;
  let totalFit = 0;
  let maxDist = 0;
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    if (!a.alive) continue;
    alive++;
    a.age++;
    const obstacleIndex = findObstacleIndex(a.x);
    const first = obstacles[obstacleIndex];
    const second = obstacles[Math.min(obstacleIndex + 1, obstacles.length - 1)];
    const distance = first.x - a.x;
    const out = infer(a, distance, first.h, second.x - first.x);
    const wantsJump = out[0] > 0.56;
    a.duck = out[1] > 0.62 ? 1 : 0;
    const pace = 5.3 + out[2] * 1.1;
    if (wantsJump && a.y <= 0.1 && distance > 3 && distance < 95) a.vy = 10.7 + out[0] * 1.3;
    a.x += pace * dt;
    if (a.vy !== 0 || a.y > 0) {
      a.y += a.vy * dt;
      a.vy -= 0.58 * dt;
      if (a.y <= 0) { a.y = 0; a.vy = 0; }
    }
    const collisionDistance = first.x - a.x;
    if (collisionDistance < first.w + 4 && collisionDistance > -3) {
      const clears = a.y > first.h * 0.72 || (a.duck && first.h < 31);
      if (!clears) a.alive = 0;
      else if (!first.collected) a.score += 1;
    }
    a.fitness = a.x + a.score * 26 + a.age * 0.045;
    if (a.x > a.max) a.max = a.x;
    if (a.x > maxDist) maxDist = a.x;
    totalFit += a.fitness;
    if (a.x > bestDistance) bestDistance = a.x;
    if (a.fitness > bestFitness) bestFitness = a.fitness;
  }
  averageFitness = alive ? totalFit / alive : averageFitness;
  if (frame % 3 === 0) publish(false);
  if (alive === 0 || maxDist >= capDistance || frame > 1600) endGeneration();
}

function publish(force) {
  if (!agents.length) return;
  const data = new Float32Array(agents.length * 3);
  let alive = 0;
  let maximum = 0;
  let sum = 0;
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const offset = i * 3;
    data[offset] = a.x;
    data[offset + 1] = a.y;
    data[offset + 2] = a.alive;
    if (a.alive) { alive++; sum += a.fitness; }
    if (a.x > maximum) maximum = a.x;
  }
  postMessage({type: 'frame', data, alive, population, generation, distance: Math.max(bestDistance, maximum), fitness: bestFitness, average: alive ? sum / alive : averageFitness, progress: Math.min(1, maximum / capDistance), frame}, [data.buffer]);
}

function mutate(genome, strength) {
  const child = new Float32Array(genome);
  const mutationRate = 0.085;
  for (let i = 0; i < child.length; i++) {
    if (Math.random() < mutationRate) child[i] += (Math.random() * 2 - 1) * strength;
    if (Math.random() < 0.007) child[i] = (Math.random() * 2 - 1) * 1.2;
    child[i] = Math.max(-4, Math.min(4, child[i]));
  }
  return child;
}

function endGeneration() {
  if (!running) return;
  running = false;
  agents.sort((a, b) => b.fitness - a.fitness);
  const top = agents.slice(0, Math.max(12, Math.ceil(population * 0.12)));
  const winner = top[0] || agents[0];
  const result = {
    generation,
    bestDistance: winner ? winner.x : 0,
    bestFitness: winner ? winner.fitness : 0,
    averageFitness: top.length ? top.reduce((sum, a) => sum + a.fitness, 0) / top.length : 0,
    score: winner ? winner.score : 0,
    champion: winner ? Array.from(winner.g) : null
  };
  history.push({generation, fitness: result.bestFitness, distance: result.bestDistance});
  champion = winner ? new Float32Array(winner.g) : champion;
  postMessage({type: 'generation-end', result, history});
  generation++;
  frame = 0;
  bestDistance = 0;
  bestFitness = 0;
  obstacles = makeObstacles();
  const next = new Array(population);
  const eliteCount = Math.max(4, Math.ceil(population * 0.02));
  for (let i = 0; i < eliteCount; i++) next[i] = makeAgent(new Float32Array(top[i % top.length].g));
  for (let i = eliteCount; i < population; i++) {
    const parent = top[Math.floor(Math.pow(Math.random(), 1.75) * top.length)];
    next[i] = makeAgent(mutate(parent.g, 0.18 + Math.random() * 0.32));
  }
  agents = next;
  averageFitness = 0;
  publish(true);
  postMessage({type: 'generation-start', generation, population, champion: Array.from(champion)});
  running = true;
}

let timer = setInterval(() => {
  if (!running) return;
  const now = performance.now();
  const elapsed = now - lastTick;
  if (elapsed < 30) return;
  lastTick = now;
  tick();
}, 8);

onmessage = event => {
  const message = event.data || {};
  if (message.type === 'init') initialize(message.population || 10000, message.champion);
  if (message.type === 'start') { running = true; lastTick = performance.now(); postMessage({type: 'state', running}); }
  if (message.type === 'pause') { running = false; postMessage({type: 'state', running}); }
  if (message.type === 'speed') speedMultiplier = Math.max(1, Math.min(4, Number(message.value) || 1));
  if (message.type === 'reset') initialize(message.population || population, message.champion);
};
