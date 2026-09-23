class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
    this.tireNoiseSource = null;
    this.tireFilter = null;
    this.tireGain = null;
    this.windSource = null;
    this.windFilter = null;
    this.windGain = null;
    this.skidSource = null;
    this.skidGain = null;
    this.ambientGain = null;
    this.streamGain = null;
    this.windBreezeGain = null;
    this.chimeTimer = null;
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.masterGain = null;
  }
  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.setupEnginePurrSound();
      this.setupTireRollingSound();
      this.setupWindWhooshSound();
      this.setupSkidSound();
      this.setupNatureAmbiance();
      this.startAnimeChimeLoop();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }
  toggle() {
    this.enabled = !this.enabled;
    if (!this.ctx) return this.enabled;
    if (!this.enabled) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    } else {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.masterGain.gain.setTargetAtTime(0.85, this.ctx.currentTime, 0.05);
    }
    return this.enabled;
  }
  createNoiseBuffer(seconds = 3) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.1243690;
      b2 = 0.57000 * b2 + white * 0.4734740;
      data[i] = (b0 + b1 + b2 + white * 0.25) * 0.22;
    }
    return buffer;
  }
  setupEnginePurrSound() {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = "triangle";
    this.engineOsc.frequency.setValueAtTime(42, this.ctx.currentTime);
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = "sine";
    this.engineSubOsc.frequency.setValueAtTime(28, this.ctx.currentTime);
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();
    this.engineSubOsc.start();
  }
  setupTireRollingSound() {
    if (!this.ctx) return;
    const noiseBuffer = this.createNoiseBuffer(2);
    this.tireNoiseSource = this.ctx.createBufferSource();
    this.tireNoiseSource.buffer = noiseBuffer;
    this.tireNoiseSource.loop = true;
    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = "lowpass";
    this.tireFilter.frequency.setValueAtTime(60, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);
    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.tireNoiseSource.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);
    this.tireNoiseSource.start();
  }
  updateWheelRolling(speedFraction, isAccelerating) {
    if (!this.enabled || !this.ctx || !this.tireGain) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const absSpeed = Math.max(0, Math.min(1.0, speedFraction));
    if (this.engineGain && this.engineOsc && this.engineFilter) {
      if (absSpeed < 0.02) {
        this.engineOsc.frequency.setTargetAtTime(38, now, 0.1);
        this.engineSubOsc.frequency.setTargetAtTime(24, now, 0.1);
        this.engineFilter.frequency.setTargetAtTime(120, now, 0.1);
        this.engineGain.gain.setTargetAtTime(0.016, now, 0.15);
      } else {
        const engineFreq = 42 + absSpeed * 88 + (isAccelerating ? 24 : 0);
        const engineSubFreq = 26 + absSpeed * 50;
        const engineCutoff = 130 + absSpeed * 200 + (isAccelerating ? 65 : 0);
        const engineVol = 0.028 + absSpeed * 0.078 + (isAccelerating ? 0.035 : 0);
        this.engineOsc.frequency.setTargetAtTime(engineFreq, now, 0.08);
        this.engineSubOsc.frequency.setTargetAtTime(engineSubFreq, now, 0.08);
        this.engineFilter.frequency.setTargetAtTime(engineCutoff, now, 0.08);
        this.engineGain.gain.setTargetAtTime(engineVol, now, 0.08);
      }
    }
    if (absSpeed < 0.02) {
      this.tireGain.gain.setTargetAtTime(0, now, 0.08);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0, now, 0.1);
      return;
    }
    const targetFreq = 70 + absSpeed * 240 + (isAccelerating ? 35 : 0);
    const targetVol = 0.02 + absSpeed * 0.14;
    this.tireFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.tireGain.gain.setTargetAtTime(targetVol, now, 0.08);
    if (this.windGain && this.windFilter) {
      const windVol = Math.pow(absSpeed, 2.2) * 0.09;
      const windCutoff = 180 + absSpeed * 650;
      this.windFilter.frequency.setTargetAtTime(windCutoff, now, 0.12);
      this.windGain.gain.setTargetAtTime(windVol, now, 0.12);
    }
  }
  updateEngine(speedFraction, isAccelerating) {
    this.updateWheelRolling(speedFraction, isAccelerating);
  }
  setupWindWhooshSound() {
    if (!this.ctx) return;
    const noiseBuffer = this.createNoiseBuffer(3);
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.setValueAtTime(200, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windSource.start();
  }
  setupSkidSound() {
    if (!this.ctx) return;
    const noiseBuffer = this.createNoiseBuffer(2);
    this.skidSource = this.ctx.createBufferSource();
    this.skidSource.buffer = noiseBuffer;
    this.skidSource.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1350;
    filter.Q.value = 3.5;
    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.skidSource.connect(filter);
    filter.connect(this.skidGain);
    this.skidGain.connect(this.masterGain);
    this.skidSource.start();
  }
  updateSkid(isSkidding) {
    if (!this.enabled || !this.ctx || !this.skidGain) return;
    const now = this.ctx.currentTime;
    const targetVol = isSkidding ? 0.14 : 0;
    this.skidGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }
  setupNatureAmbiance() {
    if (!this.ctx) return;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.ambientGain.connect(this.masterGain);
    const streamNoise = this.ctx.createBufferSource();
    streamNoise.buffer = this.createNoiseBuffer(4);
    streamNoise.loop = true;
    const waterFilter1 = this.ctx.createBiquadFilter();
    waterFilter1.type = "bandpass";
    waterFilter1.frequency.setValueAtTime(420, this.ctx.currentTime);
    waterFilter1.Q.setValueAtTime(3.0, this.ctx.currentTime);
    const waterFilter2 = this.ctx.createBiquadFilter();
    waterFilter2.type = "bandpass";
    waterFilter2.frequency.setValueAtTime(860, this.ctx.currentTime);
    waterFilter2.Q.setValueAtTime(2.5, this.ctx.currentTime);
    const waterLfo = this.ctx.createOscillator();
    const waterLfoGain = this.ctx.createGain();
    waterLfo.frequency.setValueAtTime(0.35, this.ctx.currentTime);
    waterLfoGain.gain.setValueAtTime(90, this.ctx.currentTime);
    waterLfo.connect(waterLfoGain);
    waterLfoGain.connect(waterFilter1.frequency);
    waterLfo.start();
    this.streamGain = this.ctx.createGain();
    this.streamGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    streamNoise.connect(waterFilter1);
    streamNoise.connect(waterFilter2);
    waterFilter1.connect(this.streamGain);
    waterFilter2.connect(this.streamGain);
    this.streamGain.connect(this.ambientGain);
    streamNoise.start();
    const breezeNoise = this.ctx.createBufferSource();
    breezeNoise.buffer = this.createNoiseBuffer(5);
    breezeNoise.loop = true;
    const breezeFilter = this.ctx.createBiquadFilter();
    breezeFilter.type = "lowpass";
    breezeFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windBreezeGain = this.ctx.createGain();
    this.windBreezeGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    breezeNoise.connect(breezeFilter);
    breezeFilter.connect(this.windBreezeGain);
    this.windBreezeGain.connect(this.ambientGain);
    breezeNoise.start();
  }
  startAnimeChimeLoop() {
    const scheduleNext = () => {
      const delay = 7000 + Math.random() * 8000;
      this.chimeTimer = setTimeout(() => {
        if (this.enabled && this.ctx) {
          this.playAnimeWindChime();
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }
  playAnimeWindChime() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const notes = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98];
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const noteFreq = notes[Math.floor(Math.random() * notes.length)];
      const startTime = now + i * (0.12 + Math.random() * 0.15);
      const duration = 1.8 + Math.random() * 0.8;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(noteFreq, startTime);
      const overtone = this.ctx.createOscillator();
      const overGain = this.ctx.createGain();
      overtone.type = "sine";
      overtone.frequency.setValueAtTime(noteFreq * 2.76, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.045, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      overGain.gain.setValueAtTime(0, startTime);
      overGain.gain.linearRampToValueAtTime(0.012, startTime + 0.015);
      overGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);
      osc.connect(gain);
      overtone.connect(overGain);
      gain.connect(this.masterGain);
      overGain.connect(this.masterGain);
      osc.start(startTime);
      overtone.start(startTime);
      osc.stop(startTime + duration);
      overtone.stop(startTime + duration);
    }
  }
  playVoidFallSplash() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const plungeOsc = this.ctx.createOscillator();
    const plungeGain = this.ctx.createGain();
    plungeOsc.type = "sine";
    plungeOsc.frequency.setValueAtTime(280, now);
    plungeOsc.frequency.exponentialRampToValueAtTime(45, now + 0.55);
    plungeGain.gain.setValueAtTime(0.18, now);
    plungeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    plungeOsc.connect(plungeGain);
    plungeGain.connect(this.masterGain);
    plungeOsc.start(now);
    plungeOsc.stop(now + 0.65);
    const splashSource = this.ctx.createBufferSource();
    splashSource.buffer = this.createNoiseBuffer(1);
    const splashFilter = this.ctx.createBiquadFilter();
    splashFilter.type = "bandpass";
    splashFilter.frequency.setValueAtTime(800, now + 0.15);
    splashFilter.frequency.exponentialRampToValueAtTime(300, now + 0.65);
    splashFilter.Q.setValueAtTime(1.5, now);
    const splashGain = this.ctx.createGain();
    splashGain.gain.setValueAtTime(0, now);
    splashGain.gain.setValueAtTime(0.2, now + 0.15);
    splashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    splashSource.connect(splashFilter);
    splashFilter.connect(splashGain);
    splashGain.connect(this.masterGain);
    splashSource.start(now + 0.15);
    splashSource.stop(now + 0.8);
  }
  playHit(intensity = 1.0) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
    const hitVol = Math.min(0.28 * intensity, 0.4);
    gain.gain.setValueAtTime(hitVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }
  playChime() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98, 1975.5, 2093.0].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      gain.gain.setValueAtTime(0, now + i * 0.045);
      gain.gain.linearRampToValueAtTime(0.05, now + i * 0.045 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.045 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.45);
    });
  }
  playHorn() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const duration = 0.35;
    [370, 466].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.03);
      gain.gain.setValueAtTime(0.1, now + duration - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }
  playFootstep(isSprinting = false) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const baseFreq = (isSprinting ? 220 : 160) + Math.random() * 50;
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(isSprinting ? 55 : 45, now + (isSprinting ? 0.065 : 0.08));
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isSprinting ? 480 : 350, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(isSprinting ? 0.075 : 0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isSprinting ? 0.075 : 0.09));
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.095);
  }
  playAscensionSound() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00, 2637.02, 3135.96];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.3);
    });
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweepOsc.type = "triangle";
    sweepOsc.frequency.setValueAtTime(440, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(3500, now + 1.8);
    sweepGain.gain.setValueAtTime(0, now);
    sweepGain.gain.linearRampToValueAtTime(0.04, now + 0.3);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.masterGain);
    sweepOsc.start(now);
    sweepOsc.stop(now + 2.1);
  }
  playKeySuccess() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    [880, 1174.66, 1760].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.65);
    });
  }
  playKeyError() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    [220, 196].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.035, now + i * 0.1 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.25);
    });
  }
  playTurboBlowOff() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.38);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(260, now + 0.35);
    filter.Q.setValueAtTime(1.1, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.038, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }
  playBackfirePop() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.09);
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }
  playSniperShot() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const crackLen = Math.floor(this.ctx.sampleRate * 0.04);
    const crackBuf = this.ctx.createBuffer(1, crackLen, this.ctx.sampleRate);
    const cData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
    }
    const crackSrc = this.ctx.createBufferSource();
    crackSrc.buffer = crackBuf;
    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = "highpass";
    crackFilter.frequency.setValueAtTime(2200, now);
    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.28, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    crackSrc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterGain);
    crackSrc.start(now);
    const boomOsc = this.ctx.createOscillator();
    boomOsc.type = "triangle";
    boomOsc.frequency.setValueAtTime(160, now);
    boomOsc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
    const boomGain = this.ctx.createGain();
    boomGain.gain.setValueAtTime(0.35, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.30);
    const tailLen = Math.floor(this.ctx.sampleRate * 0.45);
    const tailBuf = this.ctx.createBuffer(1, tailLen, this.ctx.sampleRate);
    const tData = tailBuf.getChannelData(0);
    for (let i = 0; i < tailLen; i++) {
      tData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const tailSrc = this.ctx.createBufferSource();
    tailSrc.buffer = tailBuf;
    const tailFilter = this.ctx.createBiquadFilter();
    tailFilter.type = "bandpass";
    tailFilter.frequency.setValueAtTime(650, now);
    tailFilter.Q.setValueAtTime(1.8, now);
    const tailGain = this.ctx.createGain();
    tailGain.gain.setValueAtTime(0.18, now);
    tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    tailSrc.connect(tailFilter);
    tailFilter.connect(tailGain);
    tailGain.connect(this.masterGain);
    tailSrc.start(now);
  }
  playTeleportHiraishin() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const sweepOsc = this.ctx.createOscillator();
    sweepOsc.type = "sine";
    sweepOsc.frequency.setValueAtTime(420, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);
    sweepOsc.frequency.exponentialRampToValueAtTime(600, now + 0.32);
    const sweepGain = this.ctx.createGain();
    sweepGain.gain.setValueAtTime(0.01, now);
    sweepGain.gain.linearRampToValueAtTime(0.24, now + 0.04);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.masterGain);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.36);
    const zapLen = Math.floor(this.ctx.sampleRate * 0.15);
    const zapBuf = this.ctx.createBuffer(1, zapLen, this.ctx.sampleRate);
    const zData = zapBuf.getChannelData(0);
    for (let i = 0; i < zapLen; i++) {
      zData[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.15);
    }
    const zapSrc = this.ctx.createBufferSource();
    zapSrc.buffer = zapBuf;
    const zapFilter = this.ctx.createBiquadFilter();
    zapFilter.type = "highpass";
    zapFilter.frequency.setValueAtTime(1400, now);
    const zapGain = this.ctx.createGain();
    zapGain.gain.setValueAtTime(0.15, now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    zapSrc.connect(zapFilter);
    zapFilter.connect(zapGain);
    zapGain.connect(this.masterGain);
    zapSrc.start(now);
  }
  playKunaiThrow() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.14);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}
window.soundEngine = new SoundEngine();