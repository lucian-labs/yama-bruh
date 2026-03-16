// ── YAMA-BRUH Synth Engine ────────────────────────────────────────────
// AudioWorklet-based FM synth for minimal latency

const SAMPLE_RATE = 44100;
const BPM = 140;

const PRESET_NAMES = [
  'Piano 1','Piano 2','Honky-Tonk Piano','Electric Piano 1','Electric Piano 2',
  'Harpsichord 1','Harpsichord 2','Harpsichord 3','Honky-Tonk Clavi','Glass Celesta',
  'Reed Organ','Pipe Organ 1','Pipe Organ 2','Electronic Organ 1','Electronic Organ 2',
  'Jazz Organ','Accordion','Vibraphone','Marimba 1','Marimba 2',
  'Trumpet','Mute Trumpet','Trombone','Soft Trombone','Horn',
  'Alpenhorn','Tuba','Brass Ensemble 1','Brass Ensemble 2','Brass Ensemble 3',
  'Flute','Panflute','Piccolo','Clarinet','Bass Clarinet',
  'Oboe','Bassoon','Saxophone','Bagpipe','Woodwinds',
  'Violin 1','Violin 2','Cello','Strings','Electric Bass',
  'Slap Bass','Wood Bass','Synth Bass','Banjo','Mandolin',
  'Classic Guitar','Jazz Guitar','Folk Guitar','Hawaiian Guitar','Ukulele',
  'Koto','Shamisen','Harp','Harmonica','Music Box',
  'Brass & Marimba','Flute & Harpsichord','Oboe & Vibraphone','Clarinet & Harp','Violin & Steel Drum',
  'Handsaw','Synth Brass','Metallic Synth','Sine Wave','Reverse',
  'Human Voice 1','Human Voice 2','Human Voice 3','Whisper','Whistle',
  'Gurgle','Bubble','Raindrop','Popcorn','Drip',
  'Dog Pianist','Duck','Babydoll','Telephone Bell','Emergency Alarm',
  'Leaf Spring','Comet','Fireworks','Crystal','Ghost',
  'Hand Bell','Chimes','Bell','Steel Drum','Cowbell',
  'Synth Tom 1','Synth Tom 2','Snare Drum','Machine Gun','Wave'
];

class YamaBruhSynth {
  constructor() {
    this.ctx = null;
    this.wasm = null;
    this.wasmMemory = null;
    this.workletNode = null;
    this.currentPreset = 0;
    this.ready = false;
    this._presetCache = new Map();
  }

  async init() {
    this.ctx = new AudioContext({
      sampleRate: SAMPLE_RATE,
      latencyHint: 'interactive',
    });

    // Load WASM (for ringtone rendering + preset params)
    const response = await fetch('yama_bruh.wasm');
    const bytes = await response.arrayBuffer();
    const result = await WebAssembly.instantiate(bytes, {
      env: { memory: new WebAssembly.Memory({ initial: 32 }) }
    });
    this.wasm = result.instance.exports;
    this.wasmMemory = this.wasm.memory;

    // Load AudioWorklet
    await this.ctx.audioWorklet.addModule('synth-worklet.js');
    this.workletNode = new AudioWorkletNode(this.ctx, 'yambruh-synth', {
      outputChannelCount: [1],
    });
    this.workletNode.connect(this.ctx.destination);

    // Listen for crash reports from worklet
    this.workletNode.port.onmessage = (e) => {
      if (e.data?.type === 'crash') {
        console.error('[SYNTH CRASH]', e.data.reason, e.data.detail, 'total:', e.data.count);
        const lcd = document.getElementById('lcd-info');
        if (lcd) lcd.textContent = 'AUDIO ERR: ' + e.data.reason;
      } else if (e.data?.type === 'health') {
        this._lastHealth = e.data;
      }
    };

    // Send initial preset to worklet
    this._sendPreset();

    // Health monitor — detect AudioContext suspension, worklet death
    this._healthLog = [];
    this._lastHealth = null;
    this._monitorId = setInterval(() => {
      const state = this.ctx.state;
      const now = performance.now();
      if (state !== 'running') {
        console.warn('[AUDIO HEALTH] Context state:', state, 'at', (now/1000).toFixed(1) + 's');
        const lcd = document.getElementById('lcd-info');
        if (lcd && state === 'suspended') lcd.textContent = 'AUDIO SUSPENDED';
        // Try to resume
        this.ctx.resume().then(() => {
          console.log('[AUDIO HEALTH] Resumed context');
        }).catch(() => {});
      }
      // Ping worklet for voice count
      if (this.workletNode) {
        this.workletNode.port.postMessage({ type: 'healthCheck' });
      }
    }, 3000);

    // Log state changes
    this.ctx.onstatechange = () => {
      console.warn('[AUDIO HEALTH] Context state changed to:', this.ctx.state);
      if (this.ctx.state === 'suspended') {
        const lcd = document.getElementById('lcd-info');
        if (lcd) lcd.textContent = 'AUDIO SUSPENDED';
      }
    };

    // Auto-resume on any user interaction
    const resumeHandler = () => {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          console.log('[AUDIO HEALTH] Resumed on interaction');
          const lcd = document.getElementById('lcd-info');
          if (lcd) lcd.textContent = 'READY';
        });
      }
    };
    document.addEventListener('pointerdown', resumeHandler);
    document.addEventListener('keydown', resumeHandler);

    this.ready = true;
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getPresetName(index) {
    return PRESET_NAMES[index] || `Preset ${index + 1}`;
  }

  hashString(str) {
    const inputPtr = this.wasm.get_input_buffer_ptr();
    const inputView = new Uint8Array(this.wasmMemory.buffer, inputPtr, 1024);
    const encoded = new TextEncoder().encode(str);
    inputView.set(encoded.slice(0, 1024));
    return this.wasm.hash_input(Math.min(encoded.length, 1024));
  }

  getPresetParams(index) {
    if (this._presetCache.has(index)) return this._presetCache.get(index);
    const params = [
      this.wasm.get_preset_param(index, 0),
      this.wasm.get_preset_param(index, 1),
      this.wasm.get_preset_param(index, 2),
      this.wasm.get_preset_param(index, 3),
      this.wasm.get_preset_param(index, 4),
      this.wasm.get_preset_param(index, 5),
      this.wasm.get_preset_param(index, 6),
      this.wasm.get_preset_param(index, 7),
    ];
    this._presetCache.set(index, params);
    return params;
  }

  _sendPreset() {
    if (!this.workletNode) return;
    this.workletNode.port.postMessage({
      type: 'preset',
      params: this.getPresetParams(this.currentPreset),
    });
  }

  // Play ringtone from seed (uses WASM buffer — not latency critical)
  playRingtone(seedStr, onDone) {
    this.ensureContext();
    const seed = this.hashString(seedStr);
    const sampleCount = this.wasm.render_ringtone(seed, this.currentPreset, BPM, SAMPLE_RATE);
    if (sampleCount === 0) return;

    const samplePtr = this.wasm.get_sample_buffer_ptr();
    const samples = new Float32Array(this.wasmMemory.buffer, samplePtr, sampleCount);

    const buffer = this.ctx.createBuffer(1, sampleCount, SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start();
    if (onDone) source.onended = onDone;
    return source;
  }

  // Play note via AudioWorklet — minimal latency
  // Optional presetIndex overrides current preset (for MIDI channel routing)
  playNote(midiNote, velocity = 0.8, presetIndex) {
    this.ensureContext();
    if (!this.workletNode) return midiNote;

    const preset = presetIndex !== undefined
      ? this.getPresetParams(presetIndex)
      : this.getPresetParams(this.currentPreset);
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    this.workletNode.port.postMessage({
      type: 'noteOn',
      note: midiNote,
      freq: freq,
      velocity: velocity,
      preset: preset,
    });
    return midiNote;
  }

  stopNote(noteId) {
    if (!this.workletNode) return;
    this.workletNode.port.postMessage({
      type: 'noteOff',
      note: noteId,
    });
  }

  // Keypad click — fire and forget via worklet
  playClick() {
    this.ensureContext();
    if (!this.workletNode) return;
    const p = this.getPresetParams(this.currentPreset);
    this.workletNode.port.postMessage({
      type: 'noteOn',
      note: -1,
      freq: 1200 * p[0],
      velocity: 0.15,
      preset: [1, 1, 0.5, 0.001, 0.03, 0, 0.02, 0],
    });
    setTimeout(() => {
      this.workletNode.port.postMessage({ type: 'noteOff', note: -1 });
    }, 40);
  }

  setCustomParams(params) {
    const keys = ['carrierRatio','modRatio','modIndex','attack','decay','sustain','release','feedback'];
    keys.forEach((k, i) => {
      if (params[k] !== undefined) {
        this.wasm.set_custom_param(i, params[k]);
      }
    });
  }

  // ── Effect toggles (PSS-470 style) ──────────────────────────────────

  setVibrato(on, rate, depth) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'vibrato', on, rate, depth });
    }
    if (this.wasm?.set_vibrato) {
      this.wasm.set_vibrato(on ? 1 : 0, rate || 5.5, depth ?? 0.004);
    }
  }

  setPortamento(on, time) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'portamento', on, time });
    }
  }

  setSustain(on, mult) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'sustain', on, mult });
    }
    if (this.wasm?.set_sustain) {
      this.wasm.set_sustain(on ? 1 : 0, mult || 3.0);
    }
  }
}

window.synth = new YamaBruhSynth();
