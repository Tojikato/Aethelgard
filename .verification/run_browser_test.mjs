import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const edgeProc = spawn(EDGE_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--no-sandbox',
  '--disable-extensions',
  '--window-size=1280,720',
  'about:blank'
]);

await sleep(1500);

async function getWsUrl() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json`);
  const list = await res.json();
  return list[0].webSocketDebuggerUrl;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        } else if (msg.method) {
          const listeners = this.eventListeners.get(msg.method) || [];
          listeners.forEach(fn => fn(msg.params));
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, fn) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(fn);
  }

  close() {
    this.ws.close();
  }
}

async function testScene(sceneName, url) {
  console.log(`\n==================================================`);
  console.log(`TESTING SCENE: ${sceneName} (${url})`);
  console.log(`==================================================`);

  const wsUrl = await getWsUrl();
  const cdp = new CDPClient(wsUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');

  const errors = [];
  const network404s = [];
  const logs = [];

  cdp.on('Runtime.consoleAPICalled', (params) => {
    const text = params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
    logs.push(`[${params.type}] ${text}`);
    if (params.type === 'error') {
      errors.push(text);
    }
  });

  cdp.on('Runtime.exceptionThrown', (params) => {
    const text = params.exceptionDetails.text + ' ' + (params.exceptionDetails.exception?.description || '');
    errors.push(text);
  });

  cdp.on('Network.responseReceived', (params) => {
    if (params.response.status >= 400) {
      network404s.push(`${params.response.status} ${params.response.url}`);
    }
  });

  await cdp.send('Page.navigate', { url });

  // Wait 4 seconds for scene launch
  await sleep(4000);

  // Inspect Phaser runtime
  const evalRes = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const game = window.__AETHELGARD_GAME__ || window.game || (typeof Phaser !== 'undefined' && Phaser.GAMES && Phaser.GAMES[0]);
      if (!game) return { error: 'No Phaser game found' };
      const activeScenes = game.scene.getScenes(true).map(s => s.scene.key);
      const textures = Object.keys(game.textures.list);
      return {
        activeScenes,
        textureCount: textures.length,
        hasMissingTexture: game.textures.exists('__MISSING'),
        domTopVisible: !document.querySelector('.game-top')?.hidden
      };
    })()`,
    returnByValue: true,
    awaitPromise: true
  });

  const gameStatus = evalRes?.result?.value || evalRes;
  console.log('Game status:', JSON.stringify(gameStatus, null, 2));

  console.log(`Network 404s count: ${network404s.length}`);
  if (network404s.length > 0) {
    console.error('FAIL - 404 URLs:', network404s);
  }

  console.log(`Console Errors count: ${errors.length}`);
  if (errors.length > 0) {
    console.error('FAIL - Errors:', errors);
  }

  console.log('Console logs sample:');
  logs.slice(-6).forEach(l => console.log('  ', l));

  cdp.close();

  const passed = network404s.length === 0 && errors.length === 0 && !gameStatus?.error && gameStatus?.activeScenes?.length > 0;
  return { scene: sceneName, passed, network404s, errors, gameStatus };
}

try {
  const camp = await testScene('Camp', 'http://localhost:8080/?scene=camp');
  const oakhaven = await testScene('Oakhaven', 'http://localhost:8080/?scene=oakhaven');

  console.log('\n==================================================');
  console.log(`CAMP TEST:     ${camp.passed ? 'PASSED (0 errors, 0 404s)' : 'FAILED'}`);
  console.log(`OAKHAVEN TEST: ${oakhaven.passed ? 'PASSED (0 errors, 0 404s)' : 'FAILED'}`);
  console.log('==================================================');

  if (!camp.passed || !oakhaven.passed) {
    process.exit(1);
  }
} finally {
  edgeProc.kill();
  process.exit(0);
}
