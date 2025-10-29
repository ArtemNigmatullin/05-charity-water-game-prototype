console.log('JavaScript file is linked correctly.');

/* ==========================
   Fill the Well — Quiz Logic
   ========================== */

const startScreen   = document.getElementById('startScreen');
const quizScreen    = document.getElementById('quizScreen');
const resultScreen  = document.getElementById('resultScreen');

const startBtn      = document.getElementById('startBtn');
const nextBtn       = document.getElementById('nextBtn');
const learnBtn      = document.getElementById('learnBtn');
const playAgainBtn  = document.getElementById('playAgainBtn');
const resetBtn      = document.getElementById('resetBtn');
const soundBtn      = document.getElementById('soundBtn');

const questionEl    = document.getElementById('question');
const answersEl     = document.getElementById('answers');
const qCountEl      = document.getElementById('qCount');

const meterFill     = document.getElementById('meterFill');
const meterPct      = document.getElementById('meterPct');
const streakEl      = document.getElementById('streak');
const timerEl       = document.getElementById('timer');

const toast         = document.getElementById('toast');
const bestStats     = document.getElementById('bestStats');

const resultTitle   = document.getElementById('resultTitle');
const resultStats   = document.getElementById('resultStats');
const wellPctBig    = document.getElementById('wellPctBig');

const obstacleLayer = document.getElementById('obstacleLayer');
const confettiLayer = document.getElementById('confettiLayer');

/* ---------- Questions ---------- */
let questions = [
  { q:"Which approach best supports long-term access to clean water?",
    options:["One-time bottled water deliveries","Drill a well without a maintenance plan","Partner with communities and train caretakers","Social media awareness only"],
    correct:2, fact:"Community partnership and training keep projects running for years." },
  { q:"What does clean water most directly improve?",
    options:["Test scores","Health, time saved, and livelihoods","Internet speed","Air quality"],
    correct:1, fact:"Safe water reduces illness and frees hours each day for work and school." },
  { q:"What is charity: water’s visual symbol used worldwide?",
    options:["Jerry Can","Raindrop","Blue Ribbon","Waterfall icon"],
    correct:0, fact:"The yellow Jerry Can represents the global fight for clean water." },
  { q:"Which is a sustainable practice for a water project?",
    options:["No training needed","No parts fund","Local water committee","Randomized drilling"],
    correct:2, fact:"Local committees manage maintenance, funding and accountability." },
  { q:"What’s a respectful way to use photography?",
    options:["Cover faces with logos","Place text away from faces and keep it legible","Add heavy filters","Crop too tight"],
    correct:1, fact:"Brand guidelines prioritize dignity, clarity and hopeful imagery." },
  { q:"What should players do at the end of the quiz?",
    options:["Close the tab","Nothing","Learn more at charitywater.org","Disable images"],
    correct:2, fact:"Visiting charitywater.org connects curiosity to real-world impact." },
  { q:"What increases motivation in this game?",
    options:["Punishing players often","Unclear scoring","Water progress bar & streaks","Long forms"],
    correct:2, fact:"Visual progress and streaks make learning feel rewarding." },
  { q:"What happens when you answer correctly?",
    options:["Lose progress","Fill the well","Hide the question","Start over"],
    correct:1, fact:"Each correct answer fills the well closer to 100%." },
  { q:"Keyboard accessibility in the quiz means…",
    options:["Mouse only","Random keys","1–4 keys select answers","No focus states"],
    correct:2, fact:"Players can press 1–4 to answer quickly and accessibly." },
  { q:"What does the streak represent?",
    options:["Wrong answers in a row","Correct answers in a row","Random luck","Timer speed"],
    correct:1, fact:"Streaks reward consistent learning and focus." }
];

const TOTAL = questions.length;
const PER_CORRECT = 10; // % per correct

/* ---------- Milestones ---------- */
const MILESTONES = [30, 50, 80, 100];
let lastMilestone = 0;

/* ---------- State ---------- */
let state;

/* ---------- Utilities ---------- */
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }
function toastMsg(msg, color="#000"){
  toast.textContent = msg;
  toast.style.background = color;
  show(toast);
  setTimeout(()=>hide(toast), 1200);
}
function setMeter(p){
  const pct = Math.max(0, Math.min(100, Math.round(p)));
  meterFill.style.width = pct + '%';
  meterPct.textContent = pct + '%';
  wellPctBig.textContent = pct + '%';
}
function saveBest(){
  const best = JSON.parse(localStorage.getItem('cw_best')||'{"score":0,"streak":0}');
  if(state.score>best.score) best.score = state.score;
  if(state.bestStreak>best.streak) best.streak = state.bestStreak;
  localStorage.setItem('cw_best', JSON.stringify(best));
}
function loadBest(){
  const best = JSON.parse(localStorage.getItem('cw_best')||'{"score":0,"streak":0}');
  bestStats.textContent = `Best Score: ${best.score}/${TOTAL} • Best Streak: ${best.streak}`;
}

/* ---------- Confetti ---------- */
function confetti(count=120){
  for(let i=0;i<count;i++){
    const piece = document.createElement('div');
    piece.className='confetti';
    const left = Math.random()*100;
    const delay = Math.random()*300;
    const colors = ['#FFC907','#2E9DF7','#4FCB53','#FF902A','#F16061'];
    piece.style.left = left+'vw';
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.top='-10px';
    piece.style.animationDelay = delay+'ms';
    confettiLayer.appendChild(piece);
    setTimeout(()=>piece.remove(), 2000+delay);
  }
}

/* ---------- SOUND: WebAudio unlock + toggle ---------- */
let audioCtx;
let soundEnabled = (localStorage.getItem('cw_sound') ?? 'on') === 'on';
let audioUnlocked = false;

function ensureAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// unlock once on first user gesture
function unlockAudioOnce(){
  if(audioUnlocked) return;
  const ctx = ensureAudio();
  ctx.resume?.();
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
  audioUnlocked = true;
  window.removeEventListener('pointerdown', unlockAudioOnce);
  window.removeEventListener('keydown', unlockAudioOnce);
}

function setSoundUI(){
  soundBtn.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
  soundBtn.textContent = soundEnabled ? '🔊 Sound' : '🔇 Sound Off';
  localStorage.setItem('cw_sound', soundEnabled ? 'on' : 'off');
}

function tone(freq=440, dur=0.18, type='sine', gain=0.14){
  if(!soundEnabled) return;
  const ctx = ensureAudio();
  if(ctx.state === 'suspended') { ctx.resume?.(); }
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.01);
  g.gain.linearRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}
function playCorrect(){ tone(540,0.12,'triangle',0.16); setTimeout(()=>tone(760,0.13,'triangle',0.14),110); }
function playWrong(){   tone(180,0.11,'square',0.15);   setTimeout(()=>tone(120,0.12,'square',0.14),90); }
function playTimeout(){ tone(160,0.22,'sawtooth',0.14); }
function playMilestone(){ tone(660,0.10,'sine',0.15); setTimeout(()=>tone(880,0.10,'sine',0.14),100); setTimeout(()=>tone(1040,0.12,'sine',0.14),200); }
function playLeak(){     tone(540,0.08,'triangle',0.13); setTimeout(()=>tone(360,0.10,'triangle',0.13),70); }

/* ---------- Obstacle (score penalty) ---------- */
let obstacleTimer = null;
function spawnObstacle(){
  const o = document.createElement('div');
  o.className='obstacle';
  o.textContent='💧';
  const x = Math.random()* (window.innerWidth - 60);
  const y = Math.random()* (window.innerHeight - 200) + 80;
  o.style.left = x+'px'; o.style.top = y+'px';
  obstacleLayer.appendChild(o);

  o.addEventListener('click', ()=>{
    state.score = Math.max(0, state.score-1);
    const before = state.progress;
    state.progress = Math.max(0, state.progress-PER_CORRECT);
    state.streak = 0;
    updateHUD();
    toastMsg('Leak! −1 score, −10% water', '#c62828');
    playLeak();
    o.remove();
    checkMilestones(before, state.progress);
  });

  setTimeout(()=>o.remove(), 3000);
}
function startObstacles(){ stopObstacles(); obstacleTimer = setInterval(spawnObstacle, 5000); }
function stopObstacles(){ if(obstacleTimer){ clearInterval(obstacleTimer); obstacleTimer=null; } obstacleLayer.querySelectorAll('.obstacle').forEach(n=>n.remove()); }

/* ---------- Timer per question ---------- */
let tick = null;
function startTimer(){
  let t = 15;
  timerEl.textContent = `⏱ ${t}`;
  clearInterval(tick);
  tick = setInterval(()=>{
    t--;
    timerEl.textContent = `⏱ ${t}`;
    if(t<=0){
      clearInterval(tick);
      lockAnswers();
      markWrong();
      toastMsg('Time’s up!', '#c62828');
      playTimeout();
      nextBtn.disabled = false;
      learnBtn.disabled = false;
    }
  },1000);
}
function stopTimer(){ clearInterval(tick); }

/* ---------- Milestones ---------- */
function checkMilestones(before, after){
  for(const m of MILESTONES){
    if(before < m && after >= m && m > lastMilestone){
      lastMilestone = m;
      const msg = m===50 ? 'Halfway there! 🙌'
                : m===100 ? 'Well filled to 100%! 🎉'
                : m===80 ? 'So close — 80%!'
                : 'Great start — 30%!';
      toastMsg(msg, '#111');
      playMilestone();
      if(m===100) confetti(150);
      break;
    }
  }
}

/* ---------- Game Flow ---------- */
function init(){
  loadBest();
  state = { order: shuffle([...Array(TOTAL).keys()]), index: 0, score: 0, progress: 0, streak: 0, bestStreak: 0 };
  lastMilestone = 0;
  setMeter(0);
  streakEl.textContent = '🔥 x0';
  qCountEl.textContent = `Q 1/${TOTAL}`;
  nextBtn.disabled = true; learnBtn.disabled = true;
  answersEl.innerHTML = '';
  setSoundUI();
}
function startGame(){
  hide(startScreen); hide(resultScreen);
  show(quizScreen);
  init();
  startObstacles();
  renderQuestion();
  startTimer();
}
function renderQuestion(){
  const qi = state.order[state.index];
  const item = questions[qi];
  questionEl.textContent = item.q;
  qCountEl.textContent = `Q ${state.index+1}/${TOTAL}`;
  answersEl.innerHTML='';
  item.options.forEach((opt,i)=>{
    const btn = document.createElement('button');
    btn.className='answer';
    btn.textContent = opt;
    btn.dataset.index = i;
    btn.addEventListener('click', ()=>selectAnswer(i, item.correct, item.fact, btn));
    answersEl.appendChild(btn);
  });

  // keyboard 1–4
  document.onkeydown = (e)=>{
    const map = { '1':0,'2':1,'3':2,'4':3 };
    if(map[e.key]!==undefined){
      const btn = answersEl.querySelectorAll('.answer')[map[e.key]];
      if(btn && !btn.disabled) btn.click();
    }
  };
}
function selectAnswer(i, correct, fact, btn){
  stopTimer();
  lockAnswers();

  const before = state.progress;

  if(i===correct){
    btn.classList.add('correct');
    state.score++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.progress = Math.min(100, state.progress + PER_CORRECT);
    setMeter(state.progress);
    toastMsg(`✓ Correct! ${fact}`, '#159A48');
    playCorrect();
  }else{
    btn.classList.add('wrong');
    state.streak = 0;
    toastMsg('Not this time — keep going!', '#c62828');
    playWrong();
  }
  updateHUD();
  nextBtn.disabled = false;
  learnBtn.disabled = false;

  checkMilestones(before, state.progress);

  nextBtn.textContent = (state.progress>=100 || state.index===TOTAL-1) ? 'Finish' : 'Next';
}
function markWrong(){
  const qi = state.order[state.index];
  const item = questions[qi];
  const nodes = answersEl.querySelectorAll('.answer');
  nodes.forEach((n,idx)=>{ if(idx===item.correct) n.classList.add('correct'); });
  state.streak = 0;
  updateHUD();
}
function lockAnswers(){ answersEl.querySelectorAll('.answer').forEach(b=>b.disabled=true); }
function updateHUD(){ streakEl.textContent = `🔥 x${state.streak}`; setMeter(state.progress); }
function next(){
  if(state.progress>=100 || state.index===TOTAL-1){ finish(); return; }
  state.index++;
  nextBtn.disabled = true; learnBtn.disabled = true;
  renderQuestion();
  startTimer();
}
function finish(){
  stopTimer(); stopObstacles();
  hide(quizScreen); show(resultScreen);
  saveBest();

  const pct = Math.round(state.progress);
  resultTitle.textContent = pct>=100 ? 'Well filled to 100% 🎉' : `Well filled to ${pct}%`;
  resultStats.textContent = `Score: ${state.score}/${TOTAL} • Best Streak: ${state.bestStreak}`;
  setMeter(pct);

  if(pct>=100){ confetti(150); }
}

/* ---------- Controls ---------- */
startBtn.addEventListener('click', ()=>{ unlockAudioOnce(); startGame(); });
nextBtn.addEventListener('click', next);
learnBtn.addEventListener('click', ()=>window.open('https://www.charitywater.org/','_blank'));
playAgainBtn.addEventListener('click', ()=>{ unlockAudioOnce(); startGame(); });
resetBtn.addEventListener('click', ()=>{
  stopTimer(); stopObstacles();
  show(startScreen); hide(quizScreen); hide(resultScreen);
  init();
});
soundBtn.addEventListener('click', ()=>{
  soundEnabled = !soundEnabled;
  setSoundUI();
  unlockAudioOnce();
});

// also unlock on first interaction
window.addEventListener('pointerdown', unlockAudioOnce, { once:true });
window.addEventListener('keydown', unlockAudioOnce, { once:true });

/* Initialize landing */
init();
