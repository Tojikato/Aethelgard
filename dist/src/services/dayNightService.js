// ═══════════════════════════════════════════════════════════════════════════
//  DAY/NIGHT SERVICE — Real-Time 24-Hour Continuous Lighting Engine
//  Smooth mathematical LERP across 86,400 seconds for seamless immersion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 24-Hour Keyframe definition:
 * hour: decimal hour (0.0 - 24.0)
 * r, g, b: ambient tint multiplier [0-255]
 * alpha: ambient darkness intensity [0.0 - 0.75]
 * lantern: lantern & flame emissive intensity [0.0 - 1.0]
 * name: Phase description
 */
const TIME_KEYFRAMES = [
  { hour: 0.0,  r: 10,  g: 14,  b: 36,  alpha: 0.65, lantern: 1.0,  name: 'Đêm Khuya (Midnight)' },
  { hour: 4.5,  r: 14,  g: 20,  b: 46,  alpha: 0.60, lantern: 1.0,  name: 'Canh Tư (Pre-Dawn)' },
  { hour: 5.5,  r: 50,  g: 38,  b: 72,  alpha: 0.45, lantern: 0.75, name: 'Hừng Đông (Astronomical Dawn)' },
  { hour: 6.25, r: 232, g: 168, b: 124, alpha: 0.22, lantern: 0.35, name: 'Bình Minh (Golden Dawn)' },
  { hour: 7.25, r: 255, g: 242, b: 220, alpha: 0.08, lantern: 0.05, name: 'Sáng Sớm (Early Morning)' },
  { hour: 9.0,  r: 255, g: 255, b: 255, alpha: 0.00, lantern: 0.0,  name: 'Ban Ngày (Daylight)' },
  { hour: 12.0, r: 255, g: 255, b: 255, alpha: 0.00, lantern: 0.0,  name: 'Chính Ngọ (Solar Noon)' },
  { hour: 15.5, r: 255, g: 252, b: 245, alpha: 0.00, lantern: 0.0,  name: 'Buổi Chiều (Afternoon)' },
  { hour: 16.75, r: 255, g: 210, b: 140, alpha: 0.14, lantern: 0.15, name: 'Nắng Xế Chiều (Golden Hour)' },
  { hour: 17.75, r: 243, g: 140, b: 66,  alpha: 0.32, lantern: 0.55, name: 'Hoàng Hôn (Sunset)' },
  { hour: 18.5, r: 130, g: 56,  b: 98,  alpha: 0.46, lantern: 0.85, name: 'Chạng Vạng (Civil Dusk)' },
  { hour: 19.5, r: 36,  g: 28,  b: 72,  alpha: 0.58, lantern: 1.0,  name: 'Chập Tối (Nautical Dusk)' },
  { hour: 21.0, r: 10,  g: 14,  b: 36,  alpha: 0.65, lantern: 1.0,  name: 'Đêm Khuya (Night)' },
  { hour: 24.0, r: 10,  g: 14,  b: 36,  alpha: 0.65, lantern: 1.0,  name: 'Đêm Khuya (Midnight)' }
];

export class DayNightService {
  constructor() {
    this.manualTimeHour = null; // null = use real local clock, number = debug override
    this.timeScale = 1.0;       // 1.0 = real-time clock (1 sec = 1 sec)
  }

  /**
   * Get current continuous decimal hour (e.g. 14.25 for 14:15)
   */
  getCurrentHour() {
    if (this.manualTimeHour !== null) {
      return this.manualTimeHour % 24;
    }
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  }

  /**
   * Calculate current interpolated lighting parameters using linear interpolation (LERP)
   */
  getLightingState() {
    const curHour = this.getCurrentHour();

    // Find the two keyframes surrounding the current hour
    let k1 = TIME_KEYFRAMES[0];
    let k2 = TIME_KEYFRAMES[TIME_KEYFRAMES.length - 1];

    for (let i = 0; i < TIME_KEYFRAMES.length - 1; i++) {
      if (curHour >= TIME_KEYFRAMES[i].hour && curHour <= TIME_KEYFRAMES[i + 1].hour) {
        k1 = TIME_KEYFRAMES[i];
        k2 = TIME_KEYFRAMES[i + 1];
        break;
      }
    }

    const span = k2.hour - k1.hour;
    const progress = span > 0 ? (curHour - k1.hour) / span : 0;

    // Continuous LERP
    const r = Math.round(k1.r + (k2.r - k1.r) * progress);
    const g = Math.round(k1.g + (k2.g - k1.g) * progress);
    const b = Math.round(k1.b + (k2.b - k1.b) * progress);
    const alpha = k1.alpha + (k2.alpha - k1.alpha) * progress;
    const lantern = k1.lantern + (k2.lantern - k1.lantern) * progress;

    const hexColor = (r << 16) | (g << 8) | b;

    const totalMinutes = Math.floor(curHour * 60);
    const displayH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const displayM = String(totalMinutes % 60).padStart(2, '0');

    return {
      hour: curHour,
      timeString: `${displayH}:${displayM}`,
      phaseName: progress < 0.5 ? k1.name : k2.name,
      r, g, b,
      color: hexColor,
      alpha,
      lanternIntensity: lantern
    };
  }

  /**
   * Attach dynamic real-time overlay to a Phaser scene.
   * Creates a camera-following ambient overlay rectangle with smooth real-time update.
   */
  attachToScene(scene, depth = 350) {
    const overlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);

    overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

    const updateAmbient = () => {
      if (!scene.sys || !scene.sys.isActive() || !overlay.active) return;
      const state = this.getLightingState();
      overlay.setFillStyle(state.color, state.alpha);

      // Notify scene if it tracks lanterns or braziers
      if (typeof scene.onDayNightUpdate === 'function') {
        scene.onDayNightUpdate(state);
      }
    };

    // Initial update
    updateAmbient();

    // Smooth check every 1000ms (1 second)
    const timer = scene.time.addEvent({
      delay: 1000,
      callback: updateAmbient,
      loop: true
    });

    scene.events.once('shutdown', () => {
      timer.remove();
      if (overlay.active) overlay.destroy();
    });

    return { overlay, updateAmbient };
  }
}

export const dayNightService = new DayNightService();
export default dayNightService;
