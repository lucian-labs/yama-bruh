// ── MIDI Support ──────────────────────────────────────────────────────
// 16-channel routing — each channel can have its own voice preset
// Channels 13-16 route to drum engine instead of synth

class MIDIManager {
  constructor(synth) {
    this.synth = synth;
    this.access = null;
    this.connected = false;
    this.selectedInputId = null;
    this.activeNotes = new Map(); // key: "ch:note", value: noteId
    this.onStateChange = null;
    this.onDevicesChange = null;

    // Channel map: channel (0-15) → preset index
    // Channels 12-15 (displayed as 13-16) are drum channels
    this.channelMap = new Array(16).fill(0);
    this.drumChannels = new Set([12, 13, 14, 15]); // 0-indexed

    // Active channel — auto-set by incoming MIDI, used for preset assignment
    this.activeChannel = 0;
    this.onChannelChange = null; // (channel) => {}
    this.onPresetChange = null;  // (preset) => {}
    this.onCC = null;            // (cc, value) => {} — for MIDI learn
    this.onDrumNote = null;      // ({ channel, note, velocity, sound }) => {}
    this.lastError = null;       // last connection error message

    this._loadChannelMap();
  }

  _loadChannelMap() {
    const saved = localStorage.getItem('yamabruh_chmap');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 16) {
          this.channelMap = parsed;
        }
      } catch (e) {}
    }
  }

  saveChannelMap() {
    localStorage.setItem('yamabruh_chmap', JSON.stringify(this.channelMap));
  }

  setChannelPreset(channel, preset) {
    if (channel >= 0 && channel < 16) {
      this.channelMap[channel] = preset;
      this.saveChannelMap();
    }
  }

  getChannelPreset(channel) {
    return this.channelMap[channel] || 0;
  }

  isDrumChannel(channel) {
    return this.drumChannels.has(channel);
  }

  async connect() {
    if (!navigator.requestMIDIAccess) {
      this.lastError = 'MIDI API blocked (disable MetaMask or use Incognito)';
      return false;
    }

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
      this.access.onstatechange = () => this._updateDeviceList();
      this._updateDeviceList();
      await this._openAllAndBind();
      this.connected = true;
      this.lastError = null;
      if (this.onStateChange) this.onStateChange(true);
      return true;
    } catch (e) {
      this.lastError = e.message || 'MIDI access denied';
      return false;
    }
  }

  disconnect() {
    if (this.access) {
      for (const input of this.access.inputs.values()) {
        input.onmidimessage = null;
      }
    }
    for (const [key, noteId] of this.activeNotes) {
      this.synth.stopNote(noteId);
    }
    this.activeNotes.clear();
    this.connected = false;
    this.selectedInputId = null;
    if (this.onStateChange) this.onStateChange(false);
  }

  getInputs() {
    if (!this.access) return [];
    const inputs = [];
    for (const input of this.access.inputs.values()) {
      inputs.push({ id: input.id, name: input.name, manufacturer: input.manufacturer });
    }
    return inputs;
  }

  async selectInput(inputId) {
    if (this.access) {
      for (const input of this.access.inputs.values()) {
        input.onmidimessage = null;
      }
    }
    for (const [key, noteId] of this.activeNotes) {
      this.synth.stopNote(noteId);
    }
    this.activeNotes.clear();
    this.selectedInputId = inputId;
    await this._bindSelected();
  }

  _updateDeviceList() {
    if (this.onDevicesChange) this.onDevicesChange(this.getInputs());
  }

  async _openAllAndBind() {
    if (!this.access) return;
    const promises = [];
    for (const input of this.access.inputs.values()) {
      promises.push(this._openAndBind(input));
    }
    await Promise.all(promises);
  }

  async _bindSelected() {
    if (!this.access) return;
    for (const input of this.access.inputs.values()) {
      input.onmidimessage = null;
    }
    if (!this.selectedInputId) {
      await this._openAllAndBind();
    } else {
      const selected = this.access.inputs.get(this.selectedInputId);
      if (selected) await this._openAndBind(selected);
    }
  }

  async _openAndBind(input) {
    try {
      if (input.connection !== 'open') await input.open();
      input.onmidimessage = (e) => this._handleMessage(e);
    } catch (e) {}
  }

  // HOT PATH — no logging, no allocations, minimal work
  _handleMessage(event) {
    const d = event.data;
    if (!d || d.length < 2) return;
    const cmd = d[0] & 0xf0;
    const ch = d[0] & 0x0f;   // MIDI channel 0-15
    const note = d[1];
    const vel = d.length > 2 ? d[2] : 0;
    const noteKey = ch * 128 + note; // unique key per channel+note

    if (cmd === 0x90 && vel > 0) {
      // Track active channel — auto-selects on note-on
      if (this.activeChannel !== ch) {
        this.activeChannel = ch;
        if (this.onChannelChange) this.onChannelChange(ch);
      }

      if (this.isDrumChannel(ch)) {
        // Drum channel — map MIDI notes to drum sounds
        this._triggerDrum(ch, note, vel / 127);
      } else {
        // Melodic channel — use channel's assigned preset
        const preset = this.channelMap[ch];
        const noteId = this.synth.playNote(note, vel / 127, preset);
        this.activeNotes.set(noteKey, noteId);
        if (typeof noteId === 'string') {
          this.synth.onNoteEnded(noteId, () => {
            if (this.activeNotes.get(noteKey) === noteId) {
              this.activeNotes.delete(noteKey);
              this._highlightKey(note, false);
            }
          });
        }
        this._highlightKey(note, true);
      }
      // Update LCD
      const lcdInfo = document.getElementById('lcd-info');
      if (lcdInfo) {
        const names = 'C C#D D#E F F#G G#A A#B ';
        const n = note % 12;
        const chLabel = this.isDrumChannel(ch) ? 'DR' : ('CH' + (ch + 1));
        lcdInfo.textContent = names.substr(n * 2, 2).trim() + (((note / 12) | 0) - 1) + ' ' + chLabel;
      }
    } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
      if (!this.isDrumChannel(ch)) {
        const noteId = this.activeNotes.get(noteKey);
        if (noteId !== undefined) {
          const stopped = this.synth.stopNote(noteId);
          if (stopped !== false) {
            this.activeNotes.delete(noteKey);
          }
        }
        if (!this.activeNotes.has(noteKey)) {
          this._highlightKey(note, false);
        }
      }
    } else if (cmd === 0xC0) {
      // Program Change — map MIDI program to our preset
      const program = note; // byte 1 is program number for PC messages
      const preset = program > 99 ? program % 100 : program;
      this.channelMap[ch] = preset;
      // If this is the active channel, update the UI preset selector
      if (ch === this.activeChannel) {
        this.synth.currentPreset = preset;
        this.synth._presetCache.clear();
        this.synth._sendPreset();
        if (this.onPresetChange) this.onPresetChange(preset);
      }
    } else if (cmd === 0xE0) {
      // Pitch Bend — 14-bit value from two data bytes
      const bendVal = (vel << 7) | note; // LSB=note, MSB=vel for pitch bend
      if (this.synth && this.synth.workletNode) {
        this.synth.workletNode.port.postMessage({ type: 'pitchBend', value: bendVal });
      }
    } else if (cmd === 0xB0) {
      // Control Change
      const cc = note;  // CC number
      const val = vel;  // CC value 0-127
      this._handleCC(ch, cc, val);
    }
  }

  _handleCC(ch, cc, val) {
    // Fire onCC for MIDI learn mode (before handling built-in CCs)
    if (this.onCC) this.onCC(cc, val);

    switch (cc) {
      case 1: // Mod Wheel
        if (this.synth && this.synth.workletNode) {
          this.synth.workletNode.port.postMessage({ type: 'modWheel', value: val / 127 });
        }
        break;
      case 64: // Sustain Pedal
        if (this.synth && this.synth.workletNode) {
          this.synth.workletNode.port.postMessage({ type: 'sustain', on: val >= 64, mult: 3.0 });
        }
        break;
      case 65: // Portamento On/Off
        if (this.synth && this.synth.workletNode) {
          this.synth.workletNode.port.postMessage({ type: 'portamento', on: val >= 64 });
        }
        break;
      case 5: // Portamento Time
        if (this.synth && this.synth.workletNode) {
          this.synth.workletNode.port.postMessage({ type: 'portamento', on: true, time: val / 127 * 0.5 });
        }
        break;
      // Bank select could switch drum banks
      case 0: // Bank Select MSB — use for drum bank on drum channels
        if (this.isDrumChannel(ch) && window.drums) {
          window.drums.setBank(val % 8);
        }
        break;
    }
  }

  // Full GM drum map — note number passed through for pitch variation
  _triggerDrum(channel, note, velocity) {
    if (!window.drums) return;
    // Map GM percussion notes to our sound types
    // Pitched sounds (tom, kick variants) pass the MIDI note for frequency derivation
    const drumMap = {
      // Kicks (vary pitch by note)
      35: 'kick',  // Acoustic Bass Drum (lower)
      36: 'kick',  // Bass Drum 1
      // Rimshot / Cross Stick
      37: 'rimshot',
      // Snares
      38: 'snare', // Acoustic Snare
      39: 'clap',  // Hand Clap
      40: 'snare', // Electric Snare
      // Toms — all use 'tom' with MIDI note for pitch
      41: 'tom',   // Low Floor Tom
      43: 'tom',   // High Floor Tom
      45: 'tom',   // Low Tom
      47: 'tom',   // Low-Mid Tom
      48: 'tom',   // Hi-Mid Tom
      50: 'tom',   // High Tom
      // Hi-Hats
      42: 'hihat_c', // Closed Hi-Hat
      44: 'hihat_c', // Pedal Hi-Hat
      46: 'hihat_o', // Open Hi-Hat
      // Cymbals
      49: 'cymbal',  // Crash Cymbal 1
      51: 'cymbal',  // Ride Cymbal 1
      52: 'cymbal',  // Chinese Cymbal
      53: 'cymbal',  // Ride Bell
      55: 'cymbal',  // Splash Cymbal
      57: 'cymbal',  // Crash Cymbal 2
      59: 'cymbal',  // Ride Cymbal 2
      // Percussion
      54: 'rimshot',  // Tambourine (bright rim sound)
      56: 'cowbell',  // Cowbell
      // Extended — fill the rest of the keyboard
      58: 'rimshot',  // Vibraslap (use rimshot approximation)
      60: 'tom',      // Hi Bongo
      61: 'tom',      // Low Bongo
      62: 'tom',      // Mute Hi Conga
      63: 'tom',      // Open Hi Conga
      64: 'tom',      // Low Conga
      65: 'tom',      // High Timbale
      66: 'tom',      // Low Timbale
      67: 'cowbell',  // High Agogo
      68: 'cowbell',  // Low Agogo
      69: 'hihat_c',  // Cabasa
      70: 'hihat_c',  // Maracas
      71: 'rimshot',  // Short Whistle
      72: 'rimshot',  // Long Whistle
      73: 'hihat_c',  // Short Guiro
      74: 'hihat_o',  // Long Guiro
      75: 'rimshot',  // Claves
      76: 'tom',      // Hi Wood Block
      77: 'tom',      // Low Wood Block
      78: 'tom',      // Mute Cuica
      79: 'tom',      // Open Cuica
      80: 'rimshot',  // Mute Triangle
      81: 'rimshot',  // Open Triangle
      // ── Extended Wild SFX (below & above GM range) ──
      // Low range (notes 24-34)
      24: 'bomb',      // Explosion
      25: 'bomb',      // Explosion variant
      26: 'whoosh',    // Whoosh sweep
      27: 'riser',     // Rising sweep
      28: 'riser',     // Rising sweep variant
      29: 'scratch',   // Vinyl scratch
      30: 'scratch',   // Scratch variant
      31: 'noise_burst', // Noise hit
      32: 'zap',       // Laser zap
      33: 'zap',       // Zap variant
      34: 'glitch',    // Digital glitch
      // High range (notes 82+)
      82: 'blip',      // Retro blip
      83: 'blip',      // Blip variant
      84: 'chirp',     // Synth chirp
      85: 'chirp',     // Chirp variant
      86: 'metallic',  // Metallic ring
      87: 'metallic',  // Metallic variant
      88: 'zap',       // High zap
      89: 'glitch',    // High glitch
      90: 'riser',     // High riser
      91: 'whoosh',    // High whoosh
      92: 'bomb',      // Big boom
      93: 'noise_burst', // Static burst
      94: 'scratch',   // Turntable
      95: 'blip',      // High blip
      96: 'chirp',     // Chirp high
    };
    const sound = drumMap[note];
    if (!sound) return;
    const mappedConfig = typeof window.resolveDrumPadConfig === 'function'
      ? window.resolveDrumPadConfig({ channel, note, velocity, sound })
      : null;
    if (this.onDrumNote) {
      this.onDrumNote({ channel, note, velocity, sound });
    }
    if (mappedConfig) {
      window.drums.triggerPad(mappedConfig);
      return;
    }
    window.drums.trigger(sound, velocity, note);
  }

  _highlightKey(midiNote, on) {
    const key = document.querySelector(`[data-midi="${midiNote}"]`);
    if (key) {
      if (on) key.classList.add('active');
      else key.classList.remove('active');
    }
  }
}

window.midiManager = new MIDIManager(window.synth);
