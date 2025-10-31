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