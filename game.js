// Evolution Trail - Oregon Trail inspired evolution journey
// High-level: manage resources, face events, and evolve through hominin milestones to reach Homo sapiens

window.EvolutionTrail = (function() {
  /** Data: species timeline (major highlights from apes to modern humans) */
  const SPECIES = [
    {
      key: 'dryopithecus',
      name: 'Dryopithecus (Dryopithecine)',
      era: 'Miocene (~12–9 mya)',
      distanceToNext: 120,
      modifiers: { forage: 1.0, hunt: 0.4, travel: 0.8, resilience: 0.8 },
      note: 'Arboreal great apes; forest foragers; no true tools.'
    },
    {
      key: 'ramapithecus',
      name: 'Ramapithecus (Sivapithecus)',
      era: 'Late Miocene (~12–8 mya)',
      distanceToNext: 120,
      modifiers: { forage: 1.0, hunt: 0.5, travel: 0.9, resilience: 0.9 },
      note: 'Ground time increases; robust jaws; proto-social behaviors.'
    },
    {
      key: 'australopithecus',
      name: 'Australopithecus (Southern Apes)',
      era: '~4–2 mya',
      distanceToNext: 160,
      modifiers: { forage: 1.2, hunt: 0.7, travel: 1.1, resilience: 1.0 },
      note: 'Habitual bipedalism emerges; simple tool use appears.'
    },
    {
      key: 'habilis',
      name: 'Homo habilis (Able Man)',
      era: '~2.4–1.4 mya',
      distanceToNext: 180,
      modifiers: { forage: 1.2, hunt: 0.8, travel: 1.1, resilience: 1.1, innovate: 1.1 },
      note: 'Oldowan tools; increased cognition; opportunistic hunting/scavenging.'
    },
    {
      key: 'erectus',
      name: 'Homo erectus (Upright Man)',
      era: '~1.9 mya–140 kya',
      distanceToNext: 220,
      modifiers: { forage: 1.2, hunt: 1.0, travel: 1.3, resilience: 1.2, innovate: 1.2 },
      note: 'Fire, endurance walking/running, wider ecological range.'
    },
    {
      key: 'neanderthalensis',
      name: 'Homo sapiens neanderthalensis (New Human Species)',
      era: '~400–40 kya',
      distanceToNext: 140,
      modifiers: { forage: 1.2, hunt: 1.3, travel: 1.0, resilience: 1.3, innovate: 1.2 },
      note: 'Cold adaptation, culture, care for group members.'
    },
    {
      key: 'sapiens',
      name: 'Homo sapiens (Wise Men)',
      era: '~300 kya–present',
      distanceToNext: 0,
      modifiers: { forage: 1.4, hunt: 1.3, travel: 1.2, resilience: 1.3, innovate: 1.4 },
      note: 'Symbolic thought, language, rapid innovation.'
    }
  ];

  const INITIAL_STATE = () => ({
    day: 1,
    speciesIndex: 0,
    distance: 0, // progress within the current species segment
    totalDistance: 0, // cumulative
    food: 60,
    health: 100,
    morale: 80,
    tech: 0, // innovations accumulated
    alive: true,
    won: false,
    log: []
  });

  const ui = {};

  function $(id) { return document.getElementById(id); }

  function pushLog(state, text, tone) {
    state.log.push({ text, tone });
    const entry = document.createElement('div');
    entry.className = `entry ${tone || ''}`;
    entry.textContent = text;
    ui.log.prepend(entry);
  }

  function currentSpecies(state) { return SPECIES[state.speciesIndex]; }

  function updateStatus(state) {
    const s = currentSpecies(state);
    ui.speciesName.textContent = s.name;
    ui.era.textContent = s.era;
    ui.day.textContent = `${state.day}`;
    ui.distance.textContent = `${state.distance}/${s.distanceToNext} km`;
    ui.food.textContent = `${Math.max(0, Math.floor(state.food))}`;
    ui.health.textContent = `${Math.max(0, Math.floor(state.health))}`;
    ui.morale.textContent = `${Math.max(0, Math.floor(state.morale))}`;

    const pct = s.distanceToNext === 0 ? 100 : Math.min(100, Math.floor((state.distance / s.distanceToNext) * 100));
    ui.progressFill.style.width = pct + '%';

    // milestones
    ui.milestones.innerHTML = '';
    SPECIES.forEach((sp, i) => {
      const tag = document.createElement('div');
      tag.className = 'milestone' + (i <= state.speciesIndex ? ' reached' : '');
      tag.textContent = sp.name;
      ui.milestones.appendChild(tag);
    });

    // enable/disable actions if dead or won
    const disabled = !state.alive || state.won;
    ['btn-travel','btn-rest','btn-forage','btn-hunt','btn-research'].forEach(id => {
      $(id).disabled = disabled;
    });
  }

  function consumeFood(state, amount) {
    state.food -= amount;
    if (state.food < 0) {
      // starvation penalty
      state.health += state.food; // subtract overflow as health loss
      state.food = 0;
      pushLog(state, 'Starvation takes a toll on the group.', 'bad');
    }
  }

  function clampStats(state) {
    state.health = Math.max(0, Math.min(100, state.health));
    state.morale = Math.max(0, Math.min(100, state.morale));
  }

  function nextDay(state) { state.day += 1; }

  function roll(min, max) { return Math.random() * (max - min) + min; }

  function chance(p) { return Math.random() < p; }

  function baseDifficulty(state) {
    // Slightly ramps over time and lowers with innovations
    return 1 + (state.day / 200) - (state.tech * 0.05);
  }

  function travel(state) {
    const s = currentSpecies(state);
    const km = Math.max(2, Math.floor(roll(8, 16) * (s.modifiers.travel)));
    const foodCost = Math.floor(roll(6, 10) * baseDifficulty(state));
    const moraleCost = Math.floor(roll(3, 8) / s.modifiers.resilience);
    state.distance += km;
    state.totalDistance += km;
    consumeFood(state, foodCost);
    state.morale -= moraleCost;
    clampStats(state);
    pushLog(state, `You travel ${km} km. Food -${foodCost}, Morale -${moraleCost}.`);
    randomEvent(state, 'travel');
    evolveIfReady(state);
    nextDay(state);
  }

  function rest(state) {
    const s = currentSpecies(state);
    const heal = Math.floor(roll(6, 14) * s.modifiers.resilience);
    const moraleGain = Math.floor(roll(6, 12));
    const foodCost = Math.floor(roll(4, 8));
    state.health += heal;
    state.morale += moraleGain;
    consumeFood(state, foodCost);
    clampStats(state);
    pushLog(state, `You rest. Health +${heal}, Morale +${moraleGain}, Food -${foodCost}.`, 'good');
    randomEvent(state, 'rest');
    nextDay(state);
  }

  function forage(state) {
    const s = currentSpecies(state);
    const base = roll(8, 20) * s.modifiers.forage;
    const bonus = 1 + (state.tech * 0.1);
    const foodGain = Math.floor(base * bonus);
    state.food += foodGain;
    pushLog(state, `You forage and find ${foodGain} food.`, 'good');
    randomEvent(state, 'forage');
    nextDay(state);
  }

  function hunt(state) {
    const s = currentSpecies(state);
    const success = chance(0.45 * s.modifiers.hunt + (state.tech * 0.03));
    if (success) {
      const foodGain = Math.floor(roll(18, 40) * (1 + state.tech * 0.05));
      state.food += foodGain;
      pushLog(state, `Successful hunt yields ${foodGain} food.`, 'good');
    } else {
      const injury = Math.floor(roll(6, 16) / s.modifiers.resilience * baseDifficulty(state));
      state.health -= injury;
      pushLog(state, `Hunt fails and causes injuries (-${injury} health).`, 'bad');
      clampStats(state);
    }
    randomEvent(state, 'hunt');
    nextDay(state);
  }

  function innovate(state) {
    const s = currentSpecies(state);
    const progress = chance(0.6 * (s.modifiers.innovate || 1));
    if (progress) {
      state.tech += 1;
      pushLog(state, `Innovation! Your group develops a useful advancement (tech ${state.tech}).`, 'good');
    } else {
      pushLog(state, 'Experiments yield little today. Try again later.');
    }
    randomEvent(state, 'innovate');
    nextDay(state);
  }

  // Random events and choices
  const EVENT_DECK = [
    {
      id: 'storm',
      title: 'Sudden Storm',
      text: 'A violent storm batters the landscape. You can seek shelter or press on.',
      when: ['travel','rest','forage','hunt'],
      choices: [
        { label: 'Seek shelter', effect: (st) => { st.morale -= 3; st.food -= 4; clampStats(st); pushLog(st, 'You wait it out. Some supplies spoiled.', 'bad'); }},
        { label: 'Press on', effect: (st) => { const dmg = Math.floor(roll(6, 18) * baseDifficulty(st)); st.health -= dmg; clampStats(st); pushLog(st, `You press on and suffer ${dmg} damage.`, 'bad'); }}
      ]
    },
    {
      id: 'predator',
      title: 'Predator Stalks the Group',
      text: 'A large predator circles nearby. Confront it or evade?',
      when: ['travel','forage','hunt'],
      choices: [
        { label: 'Confront', effect: (st) => { const win = chance(0.45 + st.tech*0.05); if (win) { const food = Math.floor(roll(14, 28)); st.food += food; pushLog(st, `You drive it off and salvage ${food} food.`, 'good'); } else { const dmg = Math.floor(roll(10, 22)); st.health -= dmg; clampStats(st); pushLog(st, `Injuries sustained (-${dmg} health).`, 'bad'); } }},
        { label: 'Evade', effect: (st) => { st.morale -= 5; clampStats(st); pushLog(st, 'You evade, shaken but safe. Morale -5.'); }}
      ]
    },
    {
      id: 'river',
      title: 'River Crossing',
      text: 'You reach a river. Build a raft or find a ford?',
      when: ['travel'],
      choices: [
        { label: 'Build raft', effect: (st) => { const ok = chance(0.55 + st.tech*0.05); if (ok) { st.distance += 12; pushLog(st, 'Raft works! You advance 12 km.', 'good'); } else { const foodLoss = Math.floor(roll(6, 14)); st.food -= foodLoss; st.morale -= 6; clampStats(st); pushLog(st, `Supplies lost in the current (-${foodLoss} food, -6 morale).`, 'bad'); } }},
        { label: 'Find a ford', effect: (st) => { st.day += 1; st.morale -= 2; clampStats(st); pushLog(st, 'You find a safe crossing but lose a day.', ''); }}
      ]
    },
    {
      id: 'disease',
      title: 'Illness Spreads',
      text: 'A sickness moves through the group. Treat with herbs or rest?',
      when: ['travel','rest','forage','hunt','innovate'],
      choices: [
        { label: 'Herbal treatment', effect: (st) => { const success = chance(0.5 + st.tech*0.05); if (success) { st.health += 12; clampStats(st); pushLog(st, 'Herbs help. Health +12.', 'good'); } else { st.health -= 10; st.morale -= 6; clampStats(st); pushLog(st, 'Treatment fails. Health -10, Morale -6.', 'bad'); } }},
        { label: 'Rest it out', effect: (st) => { st.day += 1; st.food -= 6; st.health += 6; clampStats(st); pushLog(st, 'Time and rest bring some recovery.', ''); }}
      ]
    },
    {
      id: 'discovery',
      title: 'Promising Discovery',
      text: 'You notice signs of resources and tool opportunities.',
      when: ['innovate','forage','hunt'],
      choices: [
        { label: 'Focus on tools', effect: (st) => { st.tech += 1; pushLog(st, 'A clever innovation boosts your tech by 1.', 'good'); }},
        { label: 'Harvest resources', effect: (st) => { const gain = Math.floor(roll(10, 22)); st.food += gain; pushLog(st, `You gather ${gain} food.`, 'good'); }}
      ]
    }
  ];

  function randomEvent(state, context) {
    // low chance each day, increases with difficulty
    const p = 0.25 * Math.min(1.0, baseDifficulty(state));
    if (!chance(p)) return;
    const options = EVENT_DECK.filter(e => e.when.includes(context));
    if (options.length === 0) return;
    const event = options[Math.floor(Math.random() * options.length)];
    showEvent(event, state);
  }

  function evolveIfReady(state) {
    const s = currentSpecies(state);
    if (state.distance >= s.distanceToNext && state.speciesIndex < SPECIES.length - 1) {
      state.distance = 0;
      state.speciesIndex += 1;
      const next = currentSpecies(state);
      // modest bonuses on evolution
      state.health = Math.min(100, state.health + 10);
      state.morale = Math.min(100, state.morale + 12);
      state.food += 12;
      pushLog(state, `You evolve into ${next.name}! New capabilities unlocked.`, 'good');
      if (next.key === 'sapiens') {
        state.won = true;
        pushLog(state, 'You have reached Homo sapiens. Your lineage thrives. You win!', 'good');
      }
    }
  }

  function checkDeath(state) {
    if (state.health <= 0) {
      state.alive = false;
      pushLog(state, 'Your group succumbs to the challenges. Game over.', 'bad');
    }
  }

  // UI - events dialog
  function showEvent(event, state) {
    ui.eventTitle.textContent = event.title;
    ui.eventText.textContent = event.text;
    ui.eventChoices.innerHTML = '';
    event.choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = c.label;
      btn.addEventListener('click', () => {
        c.effect(state);
        clampStats(state);
        updateStatus(state);
        checkDeath(state);
        ui.eventDialog.close();
      });
      ui.eventChoices.appendChild(btn);
    });
    ui.eventDialog.showModal();
  }

  // Persistence
  const SAVE_KEY = 'evolution_trail_save_v1';
  function save(state) {
    const toSave = { ...state, log: [] }; // don’t persist full log for size
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    pushLog(state, 'Game saved.');
  }
  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const loaded = JSON.parse(raw);
      return { ...INITIAL_STATE(), ...loaded, log: [] };
    } catch { return null; }
  }
  function reset() { return INITIAL_STATE(); }

  function bindUI() {
    ui.speciesName = $('species-name');
    ui.era = $('era');
    ui.day = $('day');
    ui.distance = $('distance');
    ui.food = $('food');
    ui.health = $('health');
    ui.morale = $('morale');
    ui.progressFill = $('progress-fill');
    ui.milestones = $('milestones');
    ui.log = $('log');
    ui.eventDialog = $('event-dialog');
    ui.eventTitle = $('event-title');
    ui.eventText = $('event-text');
    ui.eventChoices = $('event-choices');
    ui.helpDialog = $('help-dialog');

    $('btn-help').addEventListener('click', () => ui.helpDialog.showModal());
  }

  function bindActions(state) {
    $('btn-travel').addEventListener('click', () => { travel(state); updateStatus(state); checkDeath(state); });
    $('btn-rest').addEventListener('click', () => { rest(state); updateStatus(state); checkDeath(state); });
    $('btn-forage').addEventListener('click', () => { forage(state); updateStatus(state); checkDeath(state); });
    $('btn-hunt').addEventListener('click', () => { hunt(state); updateStatus(state); checkDeath(state); });
    $('btn-research').addEventListener('click', () => { innovate(state); updateStatus(state); checkDeath(state); });

    $('btn-save').addEventListener('click', () => { save(state); });
    $('btn-load').addEventListener('click', () => {
      const loaded = load();
      if (loaded) {
        Object.assign(state, loaded);
        ui.log.innerHTML = '';
        pushLog(state, 'Save loaded.', 'good');
        updateStatus(state);
      } else {
        pushLog(state, 'No save found.');
      }
    });
    $('btn-reset').addEventListener('click', () => {
      const fresh = reset();
      Object.keys(state).forEach(k => { state[k] = fresh[k]; });
      ui.log.innerHTML = '';
      pushLog(state, 'Game reset.');
      updateStatus(state);
    });
  }

  function start() {
    bindUI();
    const state = load() || INITIAL_STATE();
    bindActions(state);
    pushLog(state, 'Your journey begins among the apes of the Miocene.', 'good');
    updateStatus(state);
  }

  return {
    init: start
  };
})();


