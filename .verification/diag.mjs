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

const res = await fetch(`http://127.0.0.1:${PORT}/json`);
const list = await res.json();
const pageTarget = list.find(t => t.type === 'page');
console.log('Selected Page Target:', pageTarget.title, pageTarget.url);

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

await new Promise(r => ws.onopen = r);

let id = 1;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const curId = id++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

const consoleLogs = [];
const network404s = [];

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map(a => a.value ?? a.description).join(' ');
    consoleLogs.push(`[${msg.params.type}] ${text}`);
    console.log('PAGE LOG:', `[${msg.params.type}] ${text}`);
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    console.error('EXCEPTION:', msg.params.exceptionDetails);
  }
  if (msg.method === 'Network.responseReceived') {
    if (msg.params.response.status >= 400) {
      network404s.push(`${msg.params.response.status} ${msg.params.response.url}`);
      console.error('404 ERROR:', msg.params.response.status, msg.params.response.url);
    }
  }
});

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');

console.log('Navigating to http://localhost:8080/?scene=camp ...');
await send('Page.navigate', { url: 'http://localhost:8080/?scene=camp' });

await sleep(5000);

const info = await send('Runtime.evaluate', {
  expression: `(() => {
    const game = window.__AETHELGARD_GAME__;
    if (!game) return { error: 'No __AETHELGARD_GAME__ found' };
    const scenes = game.scene.getScenes(true).map(s => s.scene.key);
    const missingTextures = game.textures.exists('__MISSING');
    const texturesCount = Object.keys(game.textures.list).length;
    return {
      scenes,
      missingTextures,
      texturesCount,
      playerName: window.player?.name || 'default',
      campVisible: !document.querySelector('.game-top')?.hidden
    };
  })()`,
  returnByValue: true
});

console.log('Page info:', JSON.stringify(info, null, 2));
console.log('Total 404s:', network404s.length);

ws.close();
edgeProc.kill();
