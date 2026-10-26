// ═══════════════════════════════════════════════════════════════════════════
//  PHASER GAME CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export function getPhaserConfig(scenes = []) {
  return {
    type: window.Phaser ? Phaser.AUTO : 0,
    parent: 'game',
    transparent: true,
    backgroundColor: 'rgba(0,0,0,0)',
    dom: { createContainer: true },
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: window.Phaser ? Phaser.Scale.RESIZE : 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    scene: scenes,
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true
    },
    audio: { noAudio: true }
  };
}
