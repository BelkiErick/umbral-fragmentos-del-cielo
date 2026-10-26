import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, step, damageEnemy, hitPlayer, enterRoom, interact, collectUpgrade} from '../src/simulation.js';
import {moveBody} from '../src/physics.js';
import {ROOMS, ZONES, tileAt} from '../src/world.js';
import {serialize, loadSave, writeSave} from '../src/save.js';

const idle = {};
function grounded() { const g=createGame(); for(let n=0;n<75;n++) step(g,idle); return g; }
test('run reaches responsive speed, release brakes and walls stop dash', () => {
  const g=grounded(); const start=g.player.x;
  for(let n=0;n<10;n++) step(g,{right:true});
  assert.ok(g.player.x > start+15);
  for(let n=0;n<8;n++) step(g,idle);
  assert.equal(g.player.vx,0);
  const b={x:16,y:16,w:10,h:14,vx:10,vy:0,grounded:false};
  const room={tiles:Array.from({length:5},()=>[0,0,1,0,0]),width:80,height:80};
  moveBody(b,room,100,0);
  assert.equal(b.x,22);
});
test('jump starts immediately; release produces a lower arc', () => {
  const a=grounded(),b=grounded(), y=a.player.y;
  step(a,{jumpPressed:true,jump:true}); step(b,{jumpPressed:true,jump:true});
  assert.ok(a.player.y<y-4);
  for(let n=0;n<10;n++){step(a,{jump:true});step(b,idle);}
  assert.ok(a.player.y < b.player.y-10);
});
test('thin platforms allow jumping from below and landing from above',()=>{
  const room={tiles:[[0,0,0],[0,2,0],[0,0,0],[0,0,0]],width:48,height:64};
  const b={x:18,y:32,w:10,h:14,vx:0,vy:-5,grounded:false};
  moveBody(b,room,0,-30);assert.equal(b.y,2,'upward passage');
  b.y=0;b.vy=5;moveBody(b,room,0,12);assert.equal(b.y,2);assert.equal(b.grounded,true,'lands on platform top');
});
test('coyote permits six airborne frames and rejects the seventh', () => {
  for(const [frames,canJump] of [[6,true],[7,false]]) {
    const g=createGame(); Object.assign(g.player,{x:180,y:50,grounded:false,coyote:6,vy:0});
    for(let n=1;n<frames;n++) step(g,idle);
    step(g,{jumpPressed:true,jump:true});
    assert.equal(g.player.vy<0,canJump);
  }
});
test('dash is immediate, consumes stamina, cannot repeat until recharged', () => {
  const g=grounded(),x=g.player.x;
  step(g,{right:true,dashPressed:true});
  assert.ok(g.player.x>=x+6); assert.ok(g.player.dashCooldown>0);
  for(let n=0;n<12;n++) step(g,idle);
  step(g,{dashPressed:true}); assert.equal(g.player.dashTime,0);
  for(let n=0;n<45;n++) step(g,idle);
  step(g,{dashPressed:true}); assert.ok(g.player.dashTime>0);
});
test('projectiles are finite and cannot fire while cooling down', () => {
  const g=grounded(); step(g,{shootPressed:true}); assert.equal(g.player.ammo,5);
  step(g,{shootPressed:true}); assert.equal(g.player.ammo,5);
  for(let n=0;n<6;n++) { for(let i=0;i<22;i++) step(g,idle); step(g,{shootPressed:true}); }
  assert.equal(g.player.ammo,0);
});
test('all enemies become aggressive at 30% and die with particles', () => {
  for(let room=0;room<6;room++) {
    const g=createGame(); enterRoom(g,room,'left');
    for(const e of [...g.enemies]) {
      damageEnemy(g,e,e.maxHp*.7);
      assert.equal(e.aggressive,true);
      damageEnemy(g,e,e.maxHp);
      assert.equal(e.dead,true); assert.ok(g.particles.length>0);
    }
  }
});
test('damage has invulnerability and zero health enters game over', () => {
  const g=grounded(); hitPlayer(g,1); hitPlayer(g,1); assert.equal(g.player.hp,4);
  g.player.invuln=0; hitPlayer(g,10); assert.equal(g.mode,'dead');
});
test('gates require upgrades, backtracking works, boss completes campaign', () => {
  const g=createGame(); enterRoom(g,1,'left');
  Object.assign(g.player,{x:607,y:194}); interact(g); assert.equal(g.room,1);
  collectUpgrade(g,'doubleJump'); interact(g); assert.equal(g.room,2);
  Object.assign(g.player,{x:18,y:194}); interact(g); assert.equal(g.room,1);
  enterRoom(g,3,'left'); Object.assign(g.player,{x:607,y:194}); interact(g); assert.equal(g.room,3);
  collectUpgrade(g,'phaseDash'); interact(g); assert.equal(g.room,4);
  enterRoom(g,5,'left'); const boss=g.enemies.find(e=>e.type==='boss');
  damageEnemy(g,boss,999); assert.equal(g.mode,'ending'); assert.equal(g.completed,true);
});
test('boss death particles continue animating after the ending without moving the player',()=>{
  const g=createGame();enterRoom(g,5,'left');damageEnemy(g,g.enemies.find(e=>e.type==='boss'),999);
  const life=g.particles[0].life,x=g.player.x,time=g.playtime;
  step(g,{right:true});assert.ok(g.particles[0].life<life);assert.equal(g.player.x,x);assert.equal(g.playtime,time);assert.equal(g.mode,'ending');
});
test('upgraded double jump works once before landing',()=>{
  const g=grounded(); collectUpgrade(g,'doubleJump');
  step(g,{jumpPressed:true,jump:true}); for(let n=0;n<15;n++) step(g,{jump:true});
  step(g,{jumpPressed:true,jump:true}); assert.ok(g.player.vy<-4);
  for(let n=0;n<8;n++) step(g,{jump:true}); const vy=g.player.vy;
  step(g,{jumpPressed:true,jump:true}); assert.ok(g.player.vy>vy);
});
test('jump buffered just before landing launches on the next step',()=>{
  const g=createGame();Object.assign(g.player,{x:110,y:190,vy:3,grounded:false,coyote:0});
  step(g,{jumpPressed:true,jump:true});assert.equal(g.player.grounded,false);
  step(g,{jump:true});assert.equal(g.player.grounded,true);
  step(g,{jump:true});assert.ok(g.player.vy<-4);assert.ok(g.player.y<190);
});
test('resonant dash breaks crystal and respawn keeps both abilities and destroyed tiles',()=>{
  const g=createGame();collectUpgrade(g,'doubleJump');collectUpgrade(g,'phaseDash');enterRoom(g,3,'left');
  Object.assign(g.player,{x:430,y:194,grounded:true});
  step(g,{right:true,dashPressed:true});
  assert.equal(g.world.tiles[12][28],0);assert.ok(g.broken.includes('3:28:12'));
  const restored=createGame(loadSave({getItem:()=>JSON.stringify(serialize(g))}));
  assert.equal(restored.world.tiles[12][28],0);assert.equal(restored.upgrades.phaseDash,true);
});
test('maps have 16-color palettes, safe spawns and reachable room exits',()=>{
  assert.equal(ZONES.length,3);
  for(const z of ZONES) assert.equal(z.colors.length,16);
  for(const room of ROOMS){
    assert.equal(room.tiles.length,15); assert.equal(room.tiles[0].length,40);
    assert.equal(tileAt(room,2,12),0); assert.ok(tileAt(room,2,13));
    assert.equal(tileAt(room,38,12),0); assert.ok(tileAt(room,38,13));
  }
});
test('save roundtrip retains upgrades, room, discoveries and defeated enemies',()=>{
  const g=createGame(); collectUpgrade(g,'doubleJump');enterRoom(g,2,'left');
  damageEnemy(g,g.enemies[0],999);
  const data=serialize(g); const storage={getItem:()=>JSON.stringify(data)};
  const restored=createGame(loadSave(storage));
  assert.equal(restored.room,2);assert.equal(restored.upgrades.doubleJump,true);
  assert.ok(restored.visited.includes(0)); assert.equal(restored.enemies[0].dead,true);
});
test('corrupt or unavailable storage never crashes and cannot inject invalid states',()=>{
  for(const raw of ['{','null','{"version":1,"room":99}','{"version":1,"room":2,"upgrades":"oops"}']){
    assert.equal(loadSave({getItem:()=>raw}),null);
  }
  assert.equal(loadSave({getItem(){throw Error('denied');}}),null);
  assert.equal(writeSave(createGame(),{setItem(){throw Error('quota');}}),false);
});
test('semantically corrupt progress cannot delete ground or permanently disable the boss',()=>{
  const valid=serialize(createGame());
  const cases=[
    {...valid,room:5,upgrades:{doubleJump:true,phaseDash:true},defeated:['5:2'],completed:false},
    {...valid,completed:true},
    {...valid,broken:['0:2:13']},
    {...valid,defeated:['4:9']},
    {...valid,upgrades:{doubleJump:false,phaseDash:true}},
  ];
  for(const data of cases)assert.equal(loadSave({getItem:()=>JSON.stringify(data)}),null,JSON.stringify(data));
  const barrier={...valid,upgrades:{doubleJump:true,phaseDash:true},broken:['3:28:10','3:28:11','3:28:12']};
  assert.ok(loadSave({getItem:()=>JSON.stringify(barrier)}),'legitimate broken barriers restore');
});
