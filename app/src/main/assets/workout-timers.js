const exerciseClocks = new Map();
let alarmAudio;

function unlockAlarm() {
  try {
    alarmAudio ??= new AudioContext();
    if (alarmAudio.state !== 'running') alarmAudio.resume().catch(() => {});
  } catch {}
}

function playAlarm(mode) {
  if (alarmAudio?.state !== 'running') return;
  const start = alarmAudio.currentTime;
  const notes = mode === 'rest' ? [660, 880, 1047] : [880, 660];
  for (const [index, frequency] of notes.entries()) {
    const tone = alarmAudio.createOscillator();
    const volume = alarmAudio.createGain();
    const time = start + index * 0.19;
    tone.frequency.value = frequency;
    volume.gain.setValueAtTime(0.001, time);
    volume.gain.exponentialRampToValueAtTime(0.20, time + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    tone.connect(volume).connect(alarmAudio.destination);
    tone.start(time);
    tone.stop(time + 0.16);
  }
}

function executionDuration(target) {
  const timed = target.match(/^(\d+)(?:–\d+)?\s*(min|s)$/);
  return timed ? Number(timed[1]) * (timed[2] === 'min' ? 60 : 1) : 30;
}

function exerciseClockHTML(id, mode, initial) {
  const key = id + '-' + mode;
  if (!exerciseClocks.has(key)) {
    exerciseClocks.set(key, { initial, remaining: initial * 1000, until: null, done: false });
  }
  const clock = exerciseClocks.get(key);
  const label = mode === 'rest' ? 'Descanso' : 'Execução';
  return `<section class="exercise-clock" data-clock="${key}">
    <div class="clock-heading"><label for="duration-${key}">${label}</label>
      <label class="duration"><input id="duration-${key}" type="number" min="1" max="3600" value="${clock.initial}" aria-label="Duração de ${label.toLowerCase()} em segundos" onchange="changeExerciseDuration('${key}',this)"> s</label>
    </div>
    <output>${fmt(Math.ceil(clock.remaining / 1000))}</output>
    <small class="clock-message" aria-live="polite">${clock.done ? 'Tempo concluído' : ''}</small>
    <div class="clock-buttons"><button type="button" onclick="toggleExerciseClock('${key}')">${clock.until ? 'Pausar' : 'Iniciar'}</button><button type="button" onclick="resetExerciseClock('${key}')">Reiniciar</button></div>
  </section>`;
}

function changeExerciseDuration(key, input) {
  const clock = exerciseClocks.get(key);
  const duration = input.valueAsNumber;
  if (Number.isInteger(duration) && duration >= 1 && duration <= 3600) {
    clock.initial = duration;
    resetExerciseClock(key);
  }
  input.value = clock.initial;
}

function resetExerciseClock(key) {
  const clock = exerciseClocks.get(key);
  clock.until = null;
  clock.remaining = clock.initial * 1000;
  clock.done = false;
  paintExerciseClock(key, clock);
}

function toggleExerciseClock(key) {
  unlockAlarm();
  const clock = exerciseClocks.get(key);
  const now = Date.now();
  tickExerciseClocks(now);
  if (clock.until) {
    clock.remaining = clock.until - now;
    clock.until = null;
  } else {
    if (clock.done) resetExerciseClock(key);
    clock.until = now + clock.remaining;
  }
  paintExerciseClock(key, clock);
}

function paintExerciseClock(key, clock) {
  const panel = document.querySelector(`[data-clock="${key}"]`);
  if (!panel) return;
  const time = fmt(Math.ceil(clock.remaining / 1000));
  const output = panel.querySelector('output');
  if (output.textContent !== time) output.textContent = time;
  const status = panel.querySelector('.clock-message');
  const message = clock.done ? 'Tempo concluído' : '';
  if (status.textContent !== message) status.textContent = message;
  const button = panel.querySelector('button');
  const label = clock.until ? 'Pausar' : 'Iniciar';
  if (button.textContent !== label) button.textContent = label;
  panel.classList.toggle('clock-running', Boolean(clock.until));
}

function tickExerciseClocks(now = Date.now()) {
  for (const [key, clock] of exerciseClocks) {
    if (!clock.until) continue;
    clock.remaining = Math.max(0, clock.until - now);
    if (!clock.remaining) {
      clock.until = null;
      clock.done = true;
      playAlarm(key.endsWith('-rest') ? 'rest' : 'execution');
    }
    paintExerciseClock(key, clock);
  }
}

setInterval(tickExerciseClocks, 200);
document.addEventListener('visibilitychange', () => tickExerciseClocks());
