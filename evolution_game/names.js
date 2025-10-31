// Character name generation for evolution game
const NAMES = {
  ape: [
    'Koko', 'Caesar', 'Kong', 'Nim', 'Lucy', 'Kanzi', 'Washoe', 'Loulis',
    'Bonnie', 'Chim', 'Panzee', 'Travis', 'Oliver', 'Bubbles', 'Nim'
  ],
  hominin: [
    'Ardi', 'Lucy', 'Selam', 'Asa', 'Omo', 'Turkana', 'Naledi', 'Neo',
    'Ida', 'Taung', 'Sediba', 'Homo', 'Paranthropus', 'Australo'
  ],
  human: [
    'Adam', 'Eve', 'Zara', 'Kai', 'Luna', 'Atlas', 'Nova', 'Phoenix',
    'River', 'Sage', 'Terra', 'Sky', 'Rain', 'Dawn', 'Dusk'
  ]
};

const ROLES = ['gatherer', 'hunter', 'healer'];

const EVENTS = [
  {
    text: "{name} discovered ancient hunting techniques",
    effect: { intelligence: 0.05 }
  },
  {
    text: "{name} found a natural spring",
    effect: { health: 20 }
  },
  {
    text: "{name} encountered a dangerous predator",
    effect: { health: -30 }
  },
  {
    text: "Food spoiled in the heat",
    effect: { food: -20 }
  },
  {
    text: "{name} mastered tool crafting",
    effect: { tools: 2 }
  },
  {
    text: "{name}'s agility improved from constant foraging",
    effect: { speed: 0.2 }
  },
  {
    text: "A storm damaged the group's supplies",
    effect: { food: -15, tools: -1 }
  },
  {
    text: "{name} learned medicinal properties of plants",
    effect: { medicine: 2 }
  }
];

function getRandomName(species) {
  const names = NAMES[species.toLowerCase()] || NAMES.ape;
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomRole() {
  return ROLES[Math.floor(Math.random() * ROLES.length)];
}

function getRandomEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

function getRandomSkill() {
  return Math.random();
}
    { text: "{name} discovered a new food source!", effect: { food: 20 } },
    { text: "{name} taught others better gathering techniques", effect: { intelligence: 0.1 } },
    { text: "{name} found a safe shelter", effect: { health: 15 } },
    { text: "{name} improved tool use", effect: { speed: 0.2 } }
  ],
  negative: [
    { text: "{name} is sick", effect: { health: -10 } },
    { text: "{name} injured while foraging", effect: { speed: -0.1 } },
    { text: "Food stores spoiled", effect: { food: -15 } },
    { text: "Harsh weather slows the group", effect: { speed: -0.15 } }
  ]
};

function getRandomName(species) {
  const names = NAMES[species.toLowerCase()] || NAMES.ape;
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomRole() {
  return ROLES[Math.floor(Math.random() * ROLES.length)];
}

function getRandomEvent(type = null) {
  const events = type ? EVENTS[type] : [...EVENTS.positive, ...EVENTS.negative];
  return events[Math.floor(Math.random() * events.length)];
}