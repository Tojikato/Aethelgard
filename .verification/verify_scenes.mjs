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
  'http://localhost:8080/'
]);

await sleep(2000);

async function runTest(sceneName, url) {
  console.log(`\n==================================================`);
  console.log(`TESTING SCENE: ${sceneName} (${url})`);
  console.log(`==================================================`);

  const res = await fetch(`http://127.0.0.1:${PORT}/json`);
  const list = await res.json();
  const pageTarget = list.find(t => t.type === 'page');

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

  const network404s = [];
  const consoleErrors = [];

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value ?? a.description).join(' ');
      if (msg.params.type === 'error') {
        consoleErrors.push(text);
        console.error('CONSOLE ERROR:', text);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const text = msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || '');
      consoleErrors.push(text);
      console.error('EXCEPTION:', text);
    }
    if (msg.method === 'Network.responseReceived') {
      if (msg.params.response.status >= 400) {
        network404s.push(`${msg.params.response.status} ${msg.params.response.url}`);
        console.error('NETWORK 404:', msg.params.response.status, msg.params.response.url);
      }
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  const pageLoaded = new Promise(resolve => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.loadEventFired') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });

  await send('Page.navigate', { url });
  await Promise.race([pageLoaded, sleep(4000)]);

  // Wait for playable scene to be active and player ready
  for (let i = 0; i < 30; i++) {
    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const game = window.__AETHELGARD_GAME__;
        if (!game) return false;
        const active = game.scene.getScenes(true);
        return active.some(s => s.player && s.scene.key.startsWith('Scene_'));
      })()`,
      returnByValue: true
    });
    if (check.result?.value) break;
    await sleep(300);
  }

  // Baseline audit
  const baselineAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      const game = window.__AETHELGARD_GAME__;
      if (!game) return { error: 'No game found' };
      const scenes = game.scene.getScenes(true);
      const scene = scenes.find(s => s.player && s.scene?.key?.startsWith('Scene_')) || scenes[0];
      if (!scene || !scene.player) {
        return {
          error: 'No active playable scene',
          runningScenes: scenes.map(s => ({ key: s.scene?.key, hasPlayer: !!s.player })),
          allScenes: game.scene.scenes.map(s => ({ key: s.scene?.key, status: s.scene?.settings?.status }))
        };
      }

      const p = scene.player;
      return {
        sceneKey: scene.scene.key,
        playerPos: { x: p.x, y: p.y, groundY: scene.playerGroundY },
        hasShadow: !!scene.playerShadow,
        shadowPos: scene.playerShadow ? { x: scene.playerShadow.x, y: scene.playerShadow.y } : null,
        shadowDepth: scene.playerShadow ? scene.playerShadow.depth : null,
        playerDepth: p.depth,
        isObstacleBlockedDefined: typeof scene.isObstacleBlocked === 'function'
      };
    })()`,
    returnByValue: true
  });

  console.log('Baseline Audit:', JSON.stringify(baselineAudit.result.value, null, 2));

  // Simulate walking right for 400ms
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyD', key: 'd' });
  await sleep(400);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'd' });

  // Wait 100ms for zero-momentum snap
  await sleep(100);

  const walkAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      const game = window.__AETHELGARD_GAME__;
      const scenes = game.scene.getScenes(true);
      const scene = scenes.find(s => s.player && s.scene?.key?.startsWith('Scene_')) || scenes[0];
      const p = scene?.player;
      if (!p) return { error: 'No player' };
      return {
        postWalkPos: { x: p.x, y: p.y, groundY: scene.playerGroundY },
        isGrounded: p.y === scene.playerGroundY,
        animKey: p.anims?.currentAnim?.key,
        stepAcc: scene.stepDistanceAccumulator
      };
    })()`,
    returnByValue: true
  });

  console.log('Post-Walk Audit:', JSON.stringify(walkAudit.result.value, null, 2));

  // Simulate sprinting right for 300ms
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'ShiftLeft', key: 'Shift' });
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyD', key: 'd' });
  await sleep(300);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'd' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'ShiftLeft', key: 'Shift' });

  await sleep(100);

  const sprintAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      const game = window.__AETHELGARD_GAME__;
      const scenes = game.scene.getScenes(true);
      const scene = scenes.find(s => s.player && s.scene?.key?.startsWith('Scene_')) || scenes[0];
      const p = scene?.player;
      if (!p) return { error: 'No player' };
      return {
        postSprintPos: { x: p.x, y: p.y, groundY: scene.playerGroundY },
        isGrounded: p.y === scene.playerGroundY,
        animKey: p.anims?.currentAnim?.key
      };
    })()`,
    returnByValue: true
  });

  console.log('Post-Sprint Audit:', JSON.stringify(sprintAudit.result.value, null, 2));
  console.log(`404 Network Errors: ${network404s.length}`);
  console.log(`Console Errors: ${consoleErrors.length}`);

  const passed = network404s.length === 0 &&
    consoleErrors.length === 0 &&
    baselineAudit.result.value.hasShadow === true &&
    baselineAudit.result.value.isObstacleBlockedDefined === true &&
    walkAudit.result.value.isGrounded === true &&
    sprintAudit.result.value.isGrounded === true;

  console.log(`STATUS: ${passed ? '✅ 100% PASS' : '❌ FAIL'}`);

  ws.close();
  return passed;
}

try {
  const campPass = await runTest('Camp', 'http://localhost:8080/?scene=camp');
  const oakhavenPass = await runTest('Oakhaven', 'http://localhost:8080/?scene=oakhaven');

  console.log('\n==================================================');
  console.log(`FINAL RESULT:`);
  console.log(`Camp:     ${campPass ? 'PASS' : 'FAIL'}`);
  console.log(`Oakhaven: ${oakhavenPass ? 'PASS' : 'FAIL'}`);
  console.log('==================================================');

  if (!campPass || !oakhavenPass) {
    process.exit(1);
  }
} finally {
  edgeProc.kill();
  process.exit(0);
}
