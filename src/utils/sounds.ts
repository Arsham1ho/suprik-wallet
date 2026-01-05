/**
 * Sound effects utility for the wallet app
 * Uses Web Audio API to generate different sounds
 */

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface ToneConfig {
  frequency: number;
  startTime: number;
  duration: number;
  volume?: number;
  type?: OscillatorType;
}

// Create audio context lazily
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playTone = (config: ToneConfig) => {
  const ctx = getAudioContext();
  const { frequency, startTime, duration, volume = 0.2, type = 'sine' } = config;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

/**
 * SEND SOUND OPTIONS - Test these to find the best one
 */

// Option 1: Whoosh/Swoosh - Like sending something away
export const playSendWhoosh = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Descending sweep (sending away effect)
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.25);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 2: Digital Blip - Modern, clean confirmation
export const playSendBlip = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Quick double blip
    playTone({ frequency: 880, startTime: now, duration: 0.08, volume: 0.15 });
    playTone({ frequency: 1100, startTime: now + 0.1, duration: 0.1, volume: 0.18 });
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 3: Coin Send - Like a coin being tossed/sent
export const playSendCoin = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Metallic coin-like sound
    playTone({ frequency: 2200, startTime: now, duration: 0.05, volume: 0.12, type: 'triangle' });
    playTone({ frequency: 1800, startTime: now + 0.05, duration: 0.08, volume: 0.1, type: 'triangle' });
    playTone({ frequency: 1400, startTime: now + 0.1, duration: 0.15, volume: 0.08, type: 'sine' });
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 4: Soft Pop - Gentle, satisfying confirmation
export const playSendPop = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Soft pop with slight resonance
    playTone({ frequency: 600, startTime: now, duration: 0.06, volume: 0.2 });
    playTone({ frequency: 800, startTime: now + 0.03, duration: 0.1, volume: 0.12 });
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 5: Futuristic Beam - Like teleporting money
export const playSendBeam = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Ascending then fading beam
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    oscillator.start(now);
    oscillator.stop(now + 0.4);

    // Add harmonic
    playTone({ frequency: 1600, startTime: now + 0.05, duration: 0.15, volume: 0.08 });
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 6: Cash Register - Classic money sent sound
export const playSendCashRegister = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Ka-ching!
    playTone({ frequency: 1500, startTime: now, duration: 0.05, volume: 0.15, type: 'triangle' });
    playTone({ frequency: 2000, startTime: now + 0.06, duration: 0.08, volume: 0.18, type: 'triangle' });
    playTone({ frequency: 2500, startTime: now + 0.12, duration: 0.15, volume: 0.12, type: 'sine' });
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

/**
 * SWAP SOUND OPTIONS
 */

// Current swap sound (for reference)
export const playSwapChime = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Main melody - ascending success tones
    playTone({ frequency: 659.25, startTime: now, duration: 0.12, volume: 0.25 }); // E5
    playTone({ frequency: 830.61, startTime: now + 0.12, duration: 0.12, volume: 0.28 }); // G#5
    playTone({ frequency: 1046.5, startTime: now + 0.24, duration: 0.25, volume: 0.3 }); // C6

    // Harmonics for richness
    playTone({ frequency: 1318.51, startTime: now + 0.24, duration: 0.2, volume: 0.15 }); // E6 (harmonic)

    // Subtle echo
    playTone({ frequency: 1046.5, startTime: now + 0.4, duration: 0.15, volume: 0.1 }); // C6 echo
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 1: Exchange Whoosh - Two-way swoosh like items exchanging
export const playSwapExchange = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First swoosh down (token leaving)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(700, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second swoosh up (token arriving)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(300, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(900, now + 0.25);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);

    // Confirmation ding
    playTone({ frequency: 1200, startTime: now + 0.28, duration: 0.12, volume: 0.1 });
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 2: Coin Flip - Classic exchange sound
export const playSwapCoinFlip = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Spinning coin effect
    playTone({ frequency: 1800, startTime: now, duration: 0.04, volume: 0.1, type: 'triangle' });
    playTone({ frequency: 2000, startTime: now + 0.05, duration: 0.04, volume: 0.12, type: 'triangle' });
    playTone({ frequency: 2200, startTime: now + 0.1, duration: 0.04, volume: 0.14, type: 'triangle' });
    playTone({ frequency: 2400, startTime: now + 0.15, duration: 0.06, volume: 0.16, type: 'triangle' });

    // Land sound
    playTone({ frequency: 800, startTime: now + 0.22, duration: 0.15, volume: 0.18, type: 'sine' });
    playTone({ frequency: 1000, startTime: now + 0.25, duration: 0.12, volume: 0.12, type: 'sine' });
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 3: Digital Transform - Modern swap effect
export const playSwapDigital = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Glitchy transform effect
    playTone({ frequency: 440, startTime: now, duration: 0.05, volume: 0.12 });
    playTone({ frequency: 880, startTime: now + 0.04, duration: 0.05, volume: 0.15 });
    playTone({ frequency: 660, startTime: now + 0.08, duration: 0.05, volume: 0.12 });
    playTone({ frequency: 1100, startTime: now + 0.12, duration: 0.08, volume: 0.18 });

    // Success tone
    playTone({ frequency: 880, startTime: now + 0.2, duration: 0.15, volume: 0.15 });
    playTone({ frequency: 1320, startTime: now + 0.22, duration: 0.18, volume: 0.1 });
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Option 4: Refresh/Cycle - Circular motion sound
export const playSwapRefresh = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Circular sweep
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, now);
    oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
    oscillator.frequency.linearRampToValueAtTime(600, now + 0.2);
    oscillator.frequency.linearRampToValueAtTime(1000, now + 0.3);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.setValueAtTime(0.15, now + 0.25);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    oscillator.start(now);
    oscillator.stop(now + 0.45);
  } catch (error) {
    console.log('Could not play sound:', error);
  }
};

// Export a test function to try all sounds
export const testAllSendSounds = () => {
  console.log('Testing all send sounds...');
  console.log('1. Whoosh');
  playSendWhoosh();

  setTimeout(() => { console.log('2. Blip'); playSendBlip(); }, 800);
  setTimeout(() => { console.log('3. Coin'); playSendCoin(); }, 1600);
  setTimeout(() => { console.log('4. Pop'); playSendPop(); }, 2400);
  setTimeout(() => { console.log('5. Beam'); playSendBeam(); }, 3200);
  setTimeout(() => { console.log('6. Cash Register'); playSendCashRegister(); }, 4000);
};

export const testAllSwapSounds = () => {
  console.log('Testing all swap sounds...');
  console.log('1. Current Chime');
  playSwapChime();

  setTimeout(() => { console.log('2. Exchange'); playSwapExchange(); }, 1000);
  setTimeout(() => { console.log('3. Coin Flip'); playSwapCoinFlip(); }, 2000);
  setTimeout(() => { console.log('4. Digital'); playSwapDigital(); }, 3000);
  setTimeout(() => { console.log('5. Refresh'); playSwapRefresh(); }, 4000);
};
