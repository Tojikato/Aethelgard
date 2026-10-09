const $ = id => document.getElementById(id);
const defaults = { level: 1, sanity: 100, gold: 0, renown: 0, class: 'Wandering Soul', name: '' };
let firebase, user, player, game, scene, mode = 'login', busy = false, demo = false;
let audio, soundEnabled = false, drone;
const lore = [
  'Another soul, tumbling from the realm of endless, rotting scrolls...',
  'Thy mind is frail, poisoned by fleeting illusions and cheap dopamine. Yet, Aethelgard demands sharp intellect, not hollow stares.',
  'If thou art to survive the trials of commerce, ancient tongues, and shifting logic... thou must first remember who thou art.',
  'Speak, wanderer. What name shall be etched upon thy gravestone?'
];
const config = { apiKey: 'AIzaSyCythBSmy4ZYQquOQHn5sZCdj42IQmMWzo', authDomain: 'aethelgard-5c566.firebaseapp.com', projectId: 'aethelgard-5c566', storageBucket: 'aethelgard-5c566.firebasestorage.app', messagingSenderId: '511143254128', appId: '1:511143254128:web:9703c7e9712238fe27fcb5', measurementId: 'G-3DDPZ828M7' };
const errors = {
  'auth/invalid-credential': 'Thy credentials hold no power here.',
  'auth/wrong-password': 'Thy credentials hold no power here.',
  'auth/user-not-found': 'Thy credentials hold no power here.',
  'auth/invalid-email': 'That address belongs to no earthly realm.',
  'auth/email-already-in-use': 'A soul is already bound to this address. Return through the first rite.',
  'auth/weak-password': 'Thy secret is frail. Forge it with at least six characters.',
  'auth/password-does-not-meet-requirements': 'Thy secret fails the laws of this realm. Forge a stronger one.',
  'auth/too-many-requests': 'The gate must rest. Wait a while before thy next attempt.',
  'auth/network-request-failed': 'The threads between realms are severed. Check thy connection.',
  'auth/operation-not-allowed': 'The keeper must enable Email/Password in Firebase Authentication.',
  'auth/unauthorized-domain': 'The keeper must authorize this domain in Firebase Authentication.',
  'auth/invalid-api-key': 'The seal of this realm is invalid. The keeper must inspect the Firebase configuration.',
  'permission-denied': 'The archive bars thy passage. The keeper must grant thy soul access through Firestore rules.',
  'unavailable': 'The archive is beyond reach. Restore thy connection and try again.'
};
function errorText(e) { return errors[e.code] || 'The rite faltered. Try again when the shadows settle.'; }
function setBusy(value) { busy = value; document.querySelectorAll('#auth-form button,.tabs button,#preview').forEach(b => b.disabled = value); $('enter').textContent = value ? 'The gate stirs…' : mode === 'login' ? 'Cross the threshold ⟶' : 'Bind thy soul ⟶'; }
function selectMode(next) { if(busy) return; mode = next; $('login-tab').setAttribute('aria-selected', next === 'login'); $('register-tab').setAttribute('aria-selected', next === 'register'); $('password').autocomplete = next === 'login' ? 'current-password' : 'new-password'; $('auth-error').textContent = ''; setBusy(false); }
$('login-tab').onclick = () => selectMode('login');
$('register-tab').onclick = () => selectMode('register');
$('show-password').onclick = () => { const reveal = $('password').type === 'password'; $('password').type = reveal ? 'text' : 'password'; $('show-password').textContent = reveal ? 'Conceal' : 'Reveal'; };
for(let i=0;i<35;i++){ const e=document.createElement('i'); e.className='ember'; e.style.cssText=`left:${Math.random()*100}%;bottom:${Math.random()*20}%;animation-duration:${7+Math.random()*11}s;animation-delay:-${Math.random()*18}s`; document.querySelector('.embers').append(e); }
$('sound').onclick = async () => {
  try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); await audio.resume();
    if(!drone){ drone=audio.createOscillator(); drone.type='sine'; drone.frequency.value=55; const gain=audio.createGain(); gain.gain.value=.035; drone.connect(gain).connect(audio.destination); drone.start(); }
    soundEnabled=!soundEnabled; if(soundEnabled) await audio.resume(); else await audio.suspend(); $('sound').textContent=soundEnabled?'♪ Sound on':'♪ Sound off'; $('sound').setAttribute('aria-pressed',soundEnabled);
  } catch { $('sound').textContent='Sound unavailable'; }
};
async function loadFirebase() {
  const [app, auth, store] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js')
  ]);
  const instance=app.initializeApp(config); firebase={...auth,...store,auth:auth.getAuth(instance),db:store.getFirestore(instance)};
  // Resolve persisted authentication before enabling account actions. The submit handler
  // owns profile creation and game startup, avoiding registration/auth-observer races.
  await new Promise(resolve => { const unsubscribe=auth.onAuthStateChanged(firebase.auth, u => { user=u; resolve(); queueMicrotask(unsubscribe); }); });
  if(user){ $('email').value=user.email || ''; $('auth-error').textContent='Thy soul is remembered. Cross the threshold to resume.'; }
  return firebase;
}
const ready = loadFirebase().catch(e => { $('auth-error').textContent='The Firebase archive could not be summoned. Check thy connection and reload. The awakening preview remains open.'; throw e; });
ready.catch(() => {});
async function ensureProfile(uid) {
  const ref=firebase.doc(firebase.db,'users',uid);
  // Never reset an existing soul; also repairs a registration whose first save failed.
  return firebase.runTransaction(firebase.db,async tx => { const snap=await tx.get(ref); if(snap.exists()) return {...defaults,...snap.data()}; tx.set(ref,defaults); return {...defaults}; });
}
$('auth-form').onsubmit = async e => {
  e.preventDefault(); if(busy) return; setBusy(true); $('auth-error').textContent='';
  try {
    await ready;
    const email=$('email').value.trim(), password=$('password').value;
    if(mode==='register') user=(await firebase.createUserWithEmailAndPassword(firebase.auth,email,password)).user;
    else user=(await firebase.signInWithEmailAndPassword(firebase.auth,email,password)).user;
    player=await ensureProfile(user.uid); demo=false; await startGame();
  } catch(e){ $('auth-error').textContent=errorText(e); } finally { setBusy(false); }
};
$('preview').onclick = async () => { if(busy)return; demo=true; player={...defaults}; setBusy(true); try{await startGame();}catch(e){$('auth-error').textContent=e.message;}finally{setBusy(false);} };
async function startGame() {
  if(!window.Phaser) throw new Error('The game engine is beyond reach. Check thy connection and reload.');
  $('session-label').textContent=demo?'UNSAVED PREVIEW':'SOUL BOUND · CLOUD SAVE';
  $('gate').style.opacity='0'; await new Promise(r=>setTimeout(r,800)); $('gate').hidden=true; $('gate').inert=true; $('game-shell').hidden=false;
  try { game=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#000000',scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight},scene:[Scene_Awakening],render:{antialias:true},audio:{noAudio:true}}); }
  catch(e){await returnToGate(false);throw e;}
}
class Scene_Awakening extends Phaser.Scene {
  constructor(){super('Scene_Awakening');}
  create(){
    scene=this; this.line=0; this.typing=false; this.finished=false; this.saving=false;
    $('arrival').hidden=true; $('arrival').style.opacity='0'; $('dialogue').hidden=false; $('name-form').hidden=true; $('name-error').textContent=''; $('soul-name').value=player.name;
    const dot=this.make.graphics({x:0,y:0,add:false});dot.fillStyle(0xbbb8b0).fillRect(0,0,3,3);dot.generateTexture('ash',3,3);dot.destroy();
    this.ash=this.add.particles(0,0,'ash',{x:{min:0,max:this.scale.width},y:-10,lifespan:16000,speedY:{min:18,max:55},speedX:{min:-12,max:12},scale:{start:.6,end:0},alpha:{start:.4,end:0},frequency:140});
    this.resize= size => this.ash.setEmitterX({min:0,max:size.width}); this.scale.on('resize',this.resize);
    this.advance=()=>{if(this.saving||!$('name-form').hidden||this.finished)return;if(this.typing){this.timer.remove();this.typing=false;$('lore').textContent=this.current;this.afterLine();}else if(this.line<3){this.line++;this.write(lore[this.line]);}else if(this.line===4){this.endAwakening();}};
    $('next').onclick=this.advance;
    this.keyboardHandler=e=>{if(['INPUT','BUTTON'].includes(document.activeElement?.tagName))return;if(e.code==='Space'||e.code==='Enter'){e.preventDefault();this.advance();}};
    window.addEventListener('keydown',this.keyboardHandler);
    $('name-form').onsubmit=e=>{e.preventDefault();this.saveName();};
    this.events.once('shutdown',()=>{window.removeEventListener('keydown',this.keyboardHandler);this.scale.off('resize',this.resize);$('next').onclick=null;$('name-form').onsubmit=null;});
    this.write(lore[0]);
  }
  write(text){this.timer?.remove();this.current=text;this.typing=true;let i=0;$('lore').textContent='';$('next').hidden=false;$('next').textContent='Reveal ▾';this.timer=this.time.addEvent({delay:30,repeat:text.length-1,callback:()=>{$('lore').textContent=text.slice(0,++i);if(i===text.length){this.typing=false;this.afterLine();}}});}
  afterLine(){if(this.line===3){$('next').hidden=true;$('name-form').hidden=false;$('soul-name').focus();}else{$('next').textContent=this.line===4?'Enter the hamlet ▾':'Continue ▾';}}
  async saveName(){
    if(this.saving)return; const name=$('soul-name').value.trim().replace(/\s+/g,' ');
    if(!name||name.length>32||/[\u0000-\u001f\u007f]/.test(name)){$('name-error').textContent='Speak a name of one to thirty-two characters.';return;}
    this.saving=true;const button=$('name-form').querySelector('button');button.disabled=true;button.textContent='Etching…';$('name-error').textContent='';
    try{if(!demo)await firebase.updateDoc(firebase.doc(firebase.db,'users',user.uid),{name});if(!this.sys.isActive())return;player.name=name;$('name-form').hidden=true;this.line=4;this.write(`Ah, ${name}... A pitiful title. Welcome to the Ashen Hamlet. May thy sanity hold.`);}
    catch(e){$('name-error').textContent=errorText(e);}
    finally{this.saving=false;button.disabled=false;button.textContent='Etch thy name ⟶';}
  }
  endAwakening(){
    if(this.finished)return;this.finished=true;$('next').hidden=true;
    this.cameras.main.flash(800,255,255,255); this.time.delayedCall(850,()=>{this.cameras.main.fadeOut(1100,0,0,0);});
    this.time.delayedCall(2000,()=>{$('dialogue').hidden=true;$('arrival').hidden=false;$('welcome').textContent=`${player.name}, thy chronicle awaits.`;$('stats').replaceChildren();for(const [label,value] of Object.entries(player)){if(label==='name')continue;const stat=document.createElement('span');stat.textContent=`${label.toUpperCase()} · ${value}`;$('stats').append(stat);}requestAnimationFrame(()=>$('arrival').style.opacity='1');$('replay').focus();});
  }
}
async function returnToGate(logout=true){
  game?.destroy(true);game=null;scene=null;$('game-shell').hidden=true;$('name-form').hidden=true;$('arrival').hidden=true;$('gate').hidden=false;$('gate').inert=false;$('gate').style.opacity='1';$('password').value='';
  if(logout&&!demo&&firebase){try{await firebase.signOut(firebase.auth);user=null;}catch(e){$('auth-error').textContent=errorText(e);}}
  $('enter').focus();
}
$('leave').onclick=()=>returnToGate();
$('replay').onclick=()=>scene.scene.restart();
