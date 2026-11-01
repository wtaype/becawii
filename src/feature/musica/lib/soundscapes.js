// src/feature/musica/lib/soundscapes.js
// 🌧️ Generador Procedural de Sonidos Ambientales con Web Audio API
// 100% Offline · Cero Archivos Externos · Cero Latencia · Sonido Infinito sin Cortes

class SoundscapeEngine {
  constructor() {
    this.ctx = null;
    this.ambientGenerators = {
      lluvia: { node: null, gain: null, isPlaying: false, vol: 0.4 },
      cafe: { node: null, gain: null, isPlaying: false, vol: 0.3 },
      brisa: { node: null, gain: null, isPlaying: false, vol: 0.35 },
      olas: { node: null, gain: null, isPlaying: false, vol: 0.45 }
    };
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generador de buffer de ruido (blanco, rosa, marrón)
  createNoiseBuffer(type = 'white', seconds = 5) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else if (type === 'brown') {
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      } else {
        // white
        data[i] = white * 0.15;
      }
    }

    return buffer;
  }

  toggle(tipo) {
    this.initContext();
    if (!this.ctx) return false;

    const ambient = this.ambientGenerators[tipo];
    if (!ambient) return false;

    if (ambient.isPlaying) {
      this.stop(tipo);
      return false;
    } else {
      this.play(tipo);
      return true;
    }
  }

  play(tipo) {
    this.initContext();
    if (!this.ctx) return;

    const ambient = this.ambientGenerators[tipo];
    if (!ambient || ambient.isPlaying) return;

    const noiseType = tipo === 'olas' || tipo === 'cafe' ? 'brown' : tipo === 'brisa' ? 'pink' : 'white';
    const buffer = this.createNoiseBuffer(noiseType, 4);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(ambient.vol, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();

    if (tipo === 'lluvia') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      filter.Q.setValueAtTime(1, this.ctx.currentTime);
    } else if (tipo === 'olas') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);

      // LFO para efecto de olas que vienen y van
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      ambient.lfo = lfo;
    } else if (tipo === 'brisa') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
    } else if (tipo === 'cafe') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    }

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noiseSource.start();

    ambient.node = noiseSource;
    ambient.gain = gainNode;
    ambient.filter = filter;
    ambient.isPlaying = true;
  }

  stop(tipo) {
    const ambient = this.ambientGenerators[tipo];
    if (!ambient || !ambient.isPlaying) return;

    try {
      if (ambient.node) {
        ambient.node.stop();
        ambient.node.disconnect();
      }
      if (ambient.lfo) {
        ambient.lfo.stop();
        ambient.lfo.disconnect();
      }
    } catch (e) {}

    ambient.node = null;
    ambient.gain = null;
    ambient.filter = null;
    ambient.isPlaying = false;
  }

  setVolume(tipo, vol) {
    const ambient = this.ambientGenerators[tipo];
    if (!ambient) return;
    ambient.vol = Math.max(0, Math.min(1, vol));
    if (ambient.gain && this.ctx) {
      ambient.gain.gain.setValueAtTime(ambient.vol, this.ctx.currentTime);
    }
  }

  stopAll() {
    for (const key of Object.keys(this.ambientGenerators)) {
      this.stop(key);
    }
  }
}

export const soundscapes = new SoundscapeEngine();
