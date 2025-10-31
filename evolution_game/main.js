// Evolution Trail - combines evolution simulation with Oregon Trail elements
(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => { 
    W = canvas.width = window.innerWidth; 
    H = canvas.height = window.innerHeight; 
  });

  // UI elements
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const speedRange = document.getElementById('speedRange');
  const speedLabel = document.getElementById('speedLabel');
  const timeScaleRange = document.getElementById('timeScaleRange');
  const timeScaleLabel = document.getElementById('timeScaleLabel');
  const fastEvoCheckbox = document.getElementById('fastEvo');
  const statsEl = document.getElementById('stats');
  const speciesImgEl = document.getElementById('speciesImg');
  const speciesNameEl = document.getElementById('speciesName');
  const partyListEl = document.getElementById('partyList');
  const partyCountEl = document.getElementById('partyCount');
  const eventLogEl = document.getElementById('eventLog');
  const foodCountEl = document.getElementById('foodCount');
  const toolCountEl = document.getElementById('toolCount');
  const medicineCountEl = document.getElementById('medicineCount');

  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

  // Game state
  const DEFAULT_POP = 8; // smaller initial population for named characters
  const FOOD_COUNT = 40;
  const BASE_MUTATION_RATE = 0.08;
  let MUTATION_RATE = BASE_MUTATION_RATE;
  let reproductionFactor = 1;
  const MAX_POP = 20; // lower cap for named characters

  // Resources
  let resources = {
    food: 100,
    tools: 3,
    medicine: 2
  };

  let agents = [];
  let foods = [];
  let running = false;
  let simSpeed = parseFloat(speedRange.value) || 1;
  let generation = 0;
  let simAccumulator = 0;
  let timeScale = parseFloat(timeScaleRange?.value || 1) || 1;
  let lastEventTime = 0;

  class Agent {
    constructor(genes, x, y) {
      this.x = x ?? Math.random() * W;
      this.y = y ?? Math.random() * H;
      
      // Genes: speed (0.4-2.2), vision (20-220), intelligence (0-1)
      if (genes) this.genes = genes;
      else this.genes = {
        speed: 0.6 + Math.random() * 1.2,
        vision: 30 + Math.random() * 120,
        intelligence: Math.random() * 0.6
      };
      
      // Oregon Trail additions
      const species = speciesLabel(this.genes.speed, this.genes.intelligence);
      this.name = getRandomName(species);
      this.role = getRandomRole();
      this.health = 100;
      this.energy = 30 + Math.random() * 20;
      this.age = 0;
      this.diseases = [];
      this.skills = {
        gathering: Math.random(),
        hunting: Math.random(),
        healing: Math.random()
      };
    }

    step(dt) {
      this.age++;
      // Health affects energy drain
      const healthFactor = this.health / 100;
      this.energy -= (0.02 * this.genes.speed * dt) / healthFactor;

      // Find nearest food within vision
      let target = null; let bestD = Infinity;
      for (let f of foods) {
        const dx = f.x - this.x; const dy = f.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < bestD && d <= this.genes.vision) { bestD = d; target = f; }
      }

      if (target) {
        // Move toward target
        const dx = target.x - this.x; const dy = target.y - this.y;
        const ang = Math.atan2(dy, dx);
        // Health affects movement speed
        const moveSpeed = this.genes.speed * healthFactor;
        this.x += Math.cos(ang) * moveSpeed * dt;
        this.y += Math.sin(ang) * moveSpeed * dt;
        
        if (bestD < 6 + this.genes.speed) {
          // consume - role affects gathering
          const gatherBonus = this.role === 'gatherer' ? 1 + this.skills.gathering : 1;
          const foodGained = (18 + this.genes.intelligence * 10) * gatherBonus;
          this.energy += foodGained;
          resources.food += Math.floor(foodGained / 3);
          const idx = foods.indexOf(target); 
          if (idx !== -1) foods.splice(idx, 1);

          // Chance to find tools/medicine while gathering
          if (Math.random() < 0.1 * this.skills.gathering) {
            if (Math.random() < 0.5) {
              resources.tools++;
              addEvent(`${this.name} found useful tools while gathering!`, 'positive');
            } else {
              resources.medicine++;
              addEvent(`${this.name} discovered medicinal plants!`, 'positive');
            }
          }
        }
      } else {
        // wander - health affects movement
        const wanderSpeed = this.genes.speed * healthFactor;
        this.x += (Math.random() - 0.5) * wanderSpeed * dt;
        this.y += (Math.random() - 0.5) * wanderSpeed * dt;
      }

      // keep in bounds
      if (this.x < 0) this.x = 0; if (this.x > W) this.x = W;
      if (this.y < 0) this.y = 0; if (this.y > H) this.y = H;

      // Random events based on role
      if (Math.random() < 0.001 * dt) {
        if (this.role === 'healer' && resources.medicine > 0) {
          // Healers can cure diseases
          const sickMember = agents.find(a => a.health < 70 && a !== this);
          if (sickMember) {
            sickMember.health = Math.min(100, sickMember.health + 20);
            resources.medicine--;
            addEvent(`${this.name} treated ${sickMember.name}'s ailments`, 'positive');
          }
        } else if (this.role === 'hunter' && resources.tools > 0) {
          // Hunters can find extra food
          const bonus = Math.floor(20 * this.skills.hunting);
          resources.food += bonus;
          addEvent(`${this.name} had a successful hunt! (+${bonus} food)`, 'positive');
        }
      }

      // Health slowly recovers if energy is high
      if (this.energy > 50) {
        this.health = Math.min(100, this.health + 0.1 * dt);
      }

      // Diseases cause health loss
      if (this.diseases.length > 0) {
        this.health -= 0.2 * this.diseases.length * dt;
      }

      // reproduction: energy threshold and health check
      if (this.energy > 70 && this.health > 50 && Math.random() < 0.02 * this.genes.intelligence * reproductionFactor) {
        this.energy *= 0.6; // cost
        const childGenes = this.mutateGenes();
        const child = new Agent(childGenes, this.x + 4 * (Math.random()-0.5), this.y + 4 * (Math.random()-0.5));
        agents.push(child);
        addEvent(`${this.name} welcomed a child, ${child.name}!`, 'positive');
      }

      // Random diseases
      if (Math.random() < 0.0001 * dt && this.health > 20) {
        this.diseases.push('fever');
        this.health -= 10;
        addEvent(`${this.name} fell ill`, 'negative');
      }
    }

    mutateGenes() {
      const g = JSON.parse(JSON.stringify(this.genes));
      if (Math.random() < MUTATION_RATE) g.speed = Math.max(0.2, g.speed + (Math.random()-0.5) * 0.4);
      if (Math.random() < MUTATION_RATE) g.vision = Math.max(10, g.vision + (Math.random()-0.5) * 30);
      if (Math.random() < MUTATION_RATE) g.intelligence = Math.max(0, Math.min(1, g.intelligence + (Math.random()-0.5) * 0.15));
      return g;
    }
  }

  function addEvent(text, type = null) {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'event' + (type ? ` ${type}` : '');
    eventLogEl.insertBefore(div, eventLogEl.firstChild);
    // Trim old events
    while (eventLogEl.children.length > 8) {
      eventLogEl.removeChild(eventLogEl.lastChild);
    }
  }

  function updatePartyList() {
    partyListEl.innerHTML = '';
    partyCountEl.textContent = `(${agents.length})`;
    
    for (let a of agents) {
      const div = document.createElement('div');
      div.className = `party-member${a.health < 30 ? ' dying' : ''}`;
      div.innerHTML = `
        <div style="flex:1">
          <div>${a.name}</div>
          <div class="role">${a.role}</div>
        </div>
        <div style="width:60px">
          <div class="health" style="width:${a.health}%"></div>
        </div>
      `;
      partyListEl.appendChild(div);
    }
  }

  function spawnFood(n) {
    for (let i=0;i<n;i++) foods.push({x: Math.random()*W, y: Math.random()*H});
  }

  function updateResources() {
    // Consume food based on population
    resources.food = Math.max(0, resources.food - agents.length * 0.1);
    // Tools wear out
    if (Math.random() < 0.002) {
      resources.tools = Math.max(0, resources.tools - 1);
      addEvent("A tool broke from wear and tear", 'negative');
    }
    
    // Update UI
    foodCountEl.textContent = Math.floor(resources.food);
    toolCountEl.textContent = resources.tools;
    medicineCountEl.textContent = resources.medicine;
  }

  function init(pop=DEFAULT_POP) {
    agents = [];
    foods = [];
    generation = 0;
    resources = { food: 100, tools: 3, medicine: 2 };
    for (let i=0;i<pop;i++) agents.push(new Agent());
    spawnFood(FOOD_COUNT);
    updatePartyList();
    addEvent("A new group embarks on their journey...");
  }

  function stepFrame() {
    const dt = 1 * simSpeed;
    // update agents
    for (let a of agents) a.step(dt);

    // natural death from low health or energy
    const before = agents.length;
    agents = agents.filter(a => {
      const died = a.energy <= 0.5 || a.health <= 0;
      if (died) addEvent(`${a.name} has died`, 'negative');
      return !died;
    });
    if (agents.length < before) updatePartyList();

    // keep population cap
    if (agents.length > MAX_POP) {
      agents.sort((a,b)=>b.energy-a.energy);
      const removed = agents.splice(MAX_POP);
      removed.forEach(a => addEvent(`${a.name} left the group`, 'negative'));
      updatePartyList();
    }

    // refill food slowly
    if (foods.length < FOOD_COUNT) spawnFood(1);

    // occasionally increase generation 
    if (Math.random() < 0.002 * simSpeed) {
      generation++;
      // Random events on generation change
      if (Math.random() < 0.3) {
        const event = getRandomEvent();
        const agent = agents[Math.floor(Math.random() * agents.length)];
        if (agent) {
          addEvent(event.text.replace("{name}", agent.name), event.effect.health ? 'negative' : 'positive');
          // Apply event effects
          if (event.effect.health) agent.health = Math.max(0, agent.health + event.effect.health);
          if (event.effect.food) resources.food = Math.max(0, resources.food + event.effect.food);
          if (event.effect.speed) agent.genes.speed = Math.max(0.2, agent.genes.speed + event.effect.speed);
          if (event.effect.intelligence) agent.genes.intelligence = Math.max(0, Math.min(1, agent.genes.intelligence + event.effect.intelligence));
        }
      }
    }

    updateResources();
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    
    // draw foods
    ctx.fillStyle = '#f6d365';
    for (let f of foods) {
      ctx.beginPath();
      ctx.arc(f.x,f.y,3,0,Math.PI*2);
      ctx.fill();
    }

    // draw agents - color based on role and health
    for (let a of agents) {
      const t = a.genes.intelligence;
      const h = a.health / 100;
      let r, g, b;
      
      switch(a.role) {
        case 'gatherer':
          r = Math.floor(40 + (1-t)*60);
          g = Math.floor(160 + t*70);
          b = Math.floor(100 + t*55);
          break;
        case 'hunter':
          r = Math.floor(160 + t*70);
          g = Math.floor(40 + (1-t)*60);
          b = Math.floor(100 + t*55);
          break;
        case 'healer':
          r = Math.floor(100 + t*55);
          g = Math.floor(160 + t*70);
          b = Math.floor(40 + (1-t)*60);
          break;
        default:
          r = Math.floor(40 + (1-t)*60);
          g = Math.floor(160 + t*70);
          b = Math.floor(200 + t*55);
      }
      
      // Fade color based on health
      r = Math.floor(r * h + (1-h) * 255);
      g = Math.floor(g * h + (1-h) * 255);
      b = Math.floor(b * h + (1-h) * 255);
      
      ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
      const size = 3 + a.genes.speed;
      ctx.beginPath();
      ctx.arc(a.x, a.y, size, 0, Math.PI*2);
      ctx.fill();
    }

    drawHUD();
  }

  function drawHUD(){
    if (agents.length === 0) return;
    
    const avgSpeed = agents.reduce((s,a)=>s+a.genes.speed,0)/agents.length;
    const avgVision = agents.reduce((s,a)=>s+a.genes.vision,0)/agents.length;
    const avgIntel = agents.reduce((s,a)=>s+a.genes.intelligence,0)/agents.length;
    const avgHealth = agents.reduce((s,a)=>s+a.health,0)/agents.length;

    const species = speciesLabel(avgSpeed, avgIntel);

    statsEl.innerHTML = `
      Population: <b>${agents.length}</b> &nbsp; | &nbsp; 
      Generation: <b>${generation}</b> &nbsp; | &nbsp; 
      Species: <b>${species}</b><br>
      Avg speed: ${avgSpeed.toFixed(2)} &nbsp; | &nbsp; 
      Avg vision: ${avgVision.toFixed(0)} &nbsp; | &nbsp; 
      Avg intelligence: ${avgIntel.toFixed(2)} &nbsp; | &nbsp;
      Avg health: ${avgHealth.toFixed(1)}%
    `;

    try {
      if (speciesNameEl) speciesNameEl.textContent = species;
      if (speciesImgEl) speciesImgEl.src = `assets/${species.toLowerCase()}.svg`;
    } catch (e) {}
  }

  function speciesLabel(avgSpeed, avgIntel){
    if (avgIntel > 0.6 && avgSpeed > 1.2) return 'Human';
    if (avgIntel > 0.35 || avgSpeed > 0.9) return 'Hominin';
    return 'Ape';
  }

  function loop() {
    if (running) {
      simAccumulator += timeScale * simSpeed;
      const MAX_STEPS = 200;
      let steps = 0;
      while (simAccumulator >= 1 && steps < MAX_STEPS) {
        stepFrame();
        simAccumulator -= 1;
        steps++;
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  // UI hooks
  startBtn.addEventListener('click', ()=>{ running = true; });
  pauseBtn.addEventListener('click', ()=>{ running = false; });
  resetBtn.addEventListener('click', ()=>{ init(DEFAULT_POP); });
  speedRange.addEventListener('input', (e)=>{ simSpeed = parseFloat(e.target.value); speedLabel.textContent = simSpeed + 'x'; });
  if (timeScaleRange) timeScaleRange.addEventListener('input', (e)=>{ timeScale = parseFloat(e.target.value); timeScaleLabel.textContent = timeScale + 'x'; });
  if (fastEvoCheckbox) fastEvoCheckbox.addEventListener('change', (e)=>{
    if (e.target.checked) { MUTATION_RATE = BASE_MUTATION_RATE * 4; reproductionFactor = 3; }
    else { MUTATION_RATE = BASE_MUTATION_RATE; reproductionFactor = 1; }
  });

  // bootstrap
  init();
  loop();
    draw();
    requestAnimationFrame(loop);
  }

  // UI hooks
  startBtn.addEventListener('click', ()=>{ running = true; });
  pauseBtn.addEventListener('click', ()=>{ running = false; });
  resetBtn.addEventListener('click', ()=>{ init(DEFAULT_POP); });
  speedRange.addEventListener('input', (e)=>{ simSpeed = parseFloat(e.target.value); speedLabel.textContent = simSpeed + 'x'; });
  if (timeScaleRange) timeScaleRange.addEventListener('input', (e)=>{ timeScale = parseFloat(e.target.value); timeScaleLabel.textContent = timeScale + 'x'; });
  if (fastEvoCheckbox) fastEvoCheckbox.addEventListener('change', (e)=>{
    if (e.target.checked) { MUTATION_RATE = BASE_MUTATION_RATE * 4; reproductionFactor = 3; }
    else { MUTATION_RATE = BASE_MUTATION_RATE; reproductionFactor = 1; }
  });

  // bootstrap
  init();
  loop();

})();
