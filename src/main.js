import {createGame,step,respawn} from './simulation.js';
import {loadSave,writeSave,SAVE_KEY} from './save.js';
import {ZONES} from './world.js';
import {Renderer} from './render.js';
import {text} from './art.js';
import {Input} from './input.js';
import {Audio} from './audio.js';

const $=id=>document.getElementById(id);
const canvas=$('game'),frame=$('game-frame'),renderer=new Renderer(canvas),audio=new Audio();
let storage=null;try{storage=window.localStorage;}catch{}
let saved=loadSave(storage),scene='title',lastTime=0,accumulator=0,titleTick=0,lastToast='',dialogWasPlaying=false,previousScene='title',saveTimer=null,saveAvailable=true;
export let game=null;
const settings={scanlines:false,vignette:true,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,volume:.35,sound:true};
try{const stored=JSON.parse(storage?.getItem('umbral-settings'));if(stored){for(const key of ['scanlines','vignette','reducedMotion','sound'])if(typeof stored[key]==='boolean')settings[key]=stored[key];if(typeof stored.volume==='number'&&stored.volume>=0&&stored.volume<=1)settings.volume=stored.volume;}}catch{}
audio.enabled=settings.sound;audio.setVolume(settings.volume);
const input=new Input(()=>{
  if($('info-dialog').open){$('info-dialog').close();return;}
  if(scene==='playing')pause();else if(scene==='paused')resume();
},()=>{if(scene==='playing')pause();});
const logo=$('wordmark').getContext('2d');text(logo,'UMBRAL',2,1,'#e5e7cb',6);

function setScene(next){
  scene=next;input.enabled=next==='playing';input.clear();accumulator=0;
  for(const [id,state] of [['title-panel','title'],['pause-panel','paused'],['dead-panel','dead'],['ending-panel','ending']])$(id).hidden=next!==state;
  $('title-detail').hidden=next!=='title';$('menu-shade').hidden=next==='title'||next==='playing';
  if(next==='playing')canvas.focus({preventScroll:true});
  else ({title:$('play'),paused:$('resume'),dead:$('retry'),ending:$('ending-credits')})[next]?.focus({preventScroll:true});
  status();
}
function status(){
  const names={title:'LISTO PARA EXPLORAR',playing:game?ZONES[game.world.zone].name:'',paused:'VIAJE EN PAUSA',dead:'LA LUZ PERMANECE',ending:'EL CIELO VUELVE A LATIR'};
  $('status-label').textContent=names[scene];
  $('status-sub').textContent=!saveAvailable?'SIN GUARDADO · ALMACENAMIENTO NO DISPONIBLE':game&&scene==='playing'?game.world.name.toUpperCase():'GUARDADO AUTOMÁTICO';
}
function applySettings(){
  frame.classList.toggle('scanlines',settings.scanlines);frame.classList.toggle('vignette',settings.vignette);document.body.classList.toggle('reduced-motion',settings.reducedMotion);
  audio.enabled=settings.sound;audio.setVolume(settings.volume);
  $('sound-toggle').setAttribute('aria-pressed',String(settings.sound));$('sound-toggle').setAttribute('aria-label',settings.sound?'Silenciar sonido':'Activar sonido');
  try{storage?.setItem('umbral-settings',JSON.stringify(settings));}catch{}
}
function updateTitle(){saved=loadSave(storage);$('play-label').textContent=saved?'Continuar viaje':'Comenzar viaje';$('new-game').hidden=!saved;}
function save(){
  if(!game)return;
  const ok=writeSave(game,storage);game.saveDirty=false;saveAvailable=ok;
  if(ok){saved=loadSave(storage);$('status-sub').textContent='PROGRESO GUARDADO';}
  else $('status-sub').textContent='SIN GUARDADO · ALMACENAMIENTO NO DISPONIBLE';
  clearTimeout(saveTimer);if(ok)saveTimer=setTimeout(status,2200);
}
function start(fresh=false){
  game=createGame(fresh?null:saved);renderer.lastRoom=-1;
  if(game.completed){game.mode='playing';game.toast={title:'BIENVENIDO DE VUELTA',sub:'El cielo vuelve a respirar. Explora a tu ritmo.',time:180};}
  audio.start();setScene('playing');save();
}
function pause(){if(!game||scene!=='playing')return;save();setScene('paused');}
function resume(){if(!game)return;audio.start();setScene('playing');}
function showDialog(title,body,eyebrow='BITÁCORA DEL EXPLORADOR'){
  if($('info-dialog').open)$('info-dialog').close();
  previousScene=scene;dialogWasPlaying=scene==='playing';if(dialogWasPlaying)pause();
  $('dialog-title').textContent=title;$('dialog-body').innerHTML=body;$('dialog-eyebrow').textContent=eyebrow;
  $('info-dialog').showModal();$('close-dialog').focus();
}
function controls(){showDialog('TRAZA TU CAMINO',`<div class="key-grid"><div>Moverse <kbd>WASD / FLECHAS</kbd></div><div>Saltar <kbd>ESPACIO</kbd></div><div>Dash <kbd>SHIFT + DIRECCIÓN</kbd></div><div>Espada <kbd>J / Z</kbd></div><div>Proyectil <kbd>K / X</kbd></div><div>Umbral / santuario <kbd>W / ↑</kbd></div><div>Pausa <kbd>ESC</kbd></div><div>Pantalla completa <kbd>BOTÓN ⛶</kbd></div></div><p class="dialog-note">Mantén Espacio para saltar más alto. Puedes hacer dash en ocho direcciones. La barra turquesa indica cuándo vuelve a estar disponible.</p><p>Busca los fragmentos luminosos: las alas del eco permiten un segundo salto; el dash resonante atraviesa barreras de cristal. Acércate a un umbral y pulsa W para cruzar.</p><p>Los santuarios restauran corazones y las seis cargas de proyectil. Los enemigos sueltan cargas. El guardado es automático al explorar, recoger mejoras y descansar.</p>`);}
function settingsDialog(){
  showDialog('A TU MANERA',`<label class="setting">Scanlines CRT <input id="setting-scanlines" type="checkbox" ${settings.scanlines?'checked':''}></label><label class="setting">Viñeta <input id="setting-vignette" type="checkbox" ${settings.vignette?'checked':''}></label><label class="setting">Reducir sacudidas de cámara <input id="setting-reducedMotion" type="checkbox" ${settings.reducedMotion?'checked':''}></label><label class="setting">Sonido y música <input id="setting-sound" type="checkbox" ${settings.sound?'checked':''}></label><label class="setting">Volumen <input id="setting-volume" aria-label="Volumen" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></label><p>Tu configuración se conserva en este navegador.</p>`,'IMAGEN Y SONIDO');
  for(const key of ['scanlines','vignette','reducedMotion','sound'])$('setting-'+key).onchange=e=>{settings[key]=e.target.checked;applySettings();if(key==='sound'&&settings.sound)audio.start();};
  $('setting-volume').oninput=e=>{settings.volume=Number(e.target.value);applySettings();};
}
function credits(){
  showDialog('HECHO DE FRAGMENTOS',`<p>En un mundo que olvidó cómo permanecer unido, una exploradora sigue el pulso de la última luz.</p><div class="credit-list"><strong>ARTE Y SONIDO</strong><br>Pixel art original dibujado por código<br>Chiptune y efectos originales con Web Audio<br><br><strong>INSPIRACIONES</strong><br>Celeste · Cave Story · Hyper Light Drifter</div><p>UMBRAL es una aventura independiente breve. Seis salas, tres biomas, seis especies y un último guardián. Sin recursos descargados, sin cuentas, sin conexión a servicios externos.</p>`,'UMBRAL / CRÉDITOS');
}
$('play').onclick=()=>start();
$('new-game').onclick=()=>{
  showDialog('UN NUEVO COMIENZO',`<p>Comenzar otro viaje sustituirá el progreso guardado en este navegador.</p><div class="dialog-actions"><button id="confirm-new" class="button primary">Comenzar de nuevo <span>↗</span></button><button id="cancel-new" class="quiet">Conservar mi viaje</button></div>`);
  $('confirm-new').onclick=()=>{dialogWasPlaying=false;$('info-dialog').close();start(true);};$('cancel-new').onclick=()=>$('info-dialog').close();
};
for(const id of ['controls-top','title-controls','pause-controls'])$(id).onclick=controls;
for(const id of ['settings-toggle','pause-settings'])$(id).onclick=settingsDialog;
for(const id of ['about-top','credits-link','ending-credits'])$(id).onclick=credits;
$('resume').onclick=resume;
$('retry').onclick=()=>{respawn(game);setScene('playing');audio.start();save();};
$('to-title').onclick=()=>{save();updateTitle();setScene('title');};
$('ending-explore').onclick=()=>{game.mode='playing';setScene('playing');};
$('sound-toggle').onclick=()=>{settings.sound=!settings.sound;applySettings();if(settings.sound)audio.start();};
$('close-dialog').onclick=()=>$('info-dialog').close();
$('info-dialog').addEventListener('close',()=>{if(dialogWasPlaying&&scene==='paused'){dialogWasPlaying=false;resume();}else if(previousScene==='title')$('play').focus({preventScroll:true});});
$('info-dialog').addEventListener('click',e=>{if(e.target===$('info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('fullscreen').onclick=async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await frame.requestFullscreen();if(scene==='playing')canvas.focus();}catch{$('status-sub').textContent='PANTALLA COMPLETA NO DISPONIBLE';}
};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa');});
window.addEventListener('pagehide',save);
// Menus keep native focus and Enter/Space behavior; arrows are a convenience.
window.addEventListener('keydown',e=>{
  if(scene==='playing'||$('info-dialog').open||!['ArrowUp','ArrowDown'].includes(e.code))return;
  const panel=document.querySelector('.panel:not([hidden])'),buttons=[...panel.querySelectorAll('button:not([hidden])')];
  const current=buttons.indexOf(document.activeElement),dir=e.code==='ArrowDown'?1:-1;
  buttons[(current+dir+buttons.length)%buttons.length]?.focus({preventScroll:true});e.preventDefault();
});
function animate(now){
  const elapsed=Math.min(100,now-(lastTime||now));lastTime=now;
  if(scene==='title'){titleTick+=elapsed/16.667;renderer.title(settings.reducedMotion?0:titleTick);audio.update(0,$('info-dialog').open);}
  else if(game){
    if(scene==='playing'){
      accumulator+=elapsed;
      while(accumulator>=1000/60){
        step(game,input.sample());accumulator-=1000/60;
        for(const fx of game.events)audio.fx(fx);
        if(game.mode==='dead'){setScene('dead');save();break;}
        if(game.mode==='ending'){
          $('end-stats').textContent=`${Math.floor(game.playtime/3600)} MIN · ${game.visited.length}/6 SALAS · ${game.deaths} CAÍDAS`;
          setScene('ending');save();break;
        }
      }
      if(game.saveDirty){save();status();}
      if(game.toast&&game.toast.title!==lastToast){lastToast=game.toast.title;$('game-announcer').textContent=game.toast.title+'. '+game.toast.sub;if(saveAvailable)$('status-sub').textContent=game.toast.sub||game.world.name;}
    }
    if(scene==='dead'||scene==='ending'){
      accumulator+=elapsed;while(accumulator>=1000/60){step(game);accumulator-=1000/60;}
    }
    renderer.render(game,settings);audio.update(game.world.zone,scene!=='playing'||$('info-dialog').open);
  }
  requestAnimationFrame(animate);
}
applySettings();updateTitle();setScene('title');requestAnimationFrame(animate);
