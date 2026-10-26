import {ROOMS,ZONES,roomInstance,tileAt} from './world.js';
import {clamp,overlaps,moveBody,collision} from './physics.js';

const TYPES={crawler:10,moth:10,hopper:14,sentinel:14,drone:14,lancer:18,boss:72};
export function createGame(save=null){
  const g={room:0,world:null,player:{x:32,y:194,w:10,h:14,vx:0,vy:0,face:1,hp:5,maxHp:5,ammo:6,grounded:false,coyote:0,jumpBuffer:0,airJump:false,dashTime:0,dashCooldown:0,dashX:1,dashY:0,invuln:0,attack:0,attackCooldown:0,shootCooldown:0,attackId:0},
    upgrades:{doubleJump:false,phaseDash:false,...save?.upgrades},visited:save?.visited?[...save.visited]:[],defeated:save?.defeated?[...save.defeated]:[],broken:save?.broken?[...save.broken]:[],completed:save?.completed??false,
    enemies:[],shots:[],particles:[],drops:[],events:[],mode:'playing',tick:0,playtime:save?.playtime??0,deaths:save?.deaths??0,rng:93281,shake:0,flash:0,transition:0,toast:null,saveDirty:false,checkpointLit:false};
  enterRoom(g,save?.room??0,'left');return g;
}
export function random(g){g.rng=(Math.imul(g.rng,1664525)+1013904223)>>>0;return g.rng/4294967296;}
export function burst(g,x,y,color,count=10,speed=1.8){
  for(let n=0;n<count;n++){const a=random(g)*Math.PI*2,v=random(g)*speed+.2;g.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.4,life:20+random(g)*14,max:34,color,size:random(g)>.7?2:1});}
  if(g.particles.length>240)g.particles.splice(0,g.particles.length-240);
}
function event(g,name){g.events.push(name);}
export function notice(g,title,sub='',duration=180){g.toast={title,sub,time:duration,total:duration};}
export function enterRoom(g,id,side='left'){
  if(!ROOMS[id])return;
  g.room=id;g.world=roomInstance(id,g.broken);g.visited=[...new Set([...g.visited,id])];
  Object.assign(g.player,{x:side==='left'?40:582,y:194,vx:0,vy:0,dashTime:0,attack:0,grounded:false,coyote:0,invuln:60,jumpBuffer:0});
  g.shots=[];g.particles=[];g.drops=[];g.transition=24;g.checkpointLit=false;
  g.enemies=g.world.enemies.map(([type,x,y],i)=>({id:`${id}:${i}`,type,x,y,w:type==='boss'?28:12,h:type==='boss'?30:14,homeX:x,homeY:y,vx:0,vy:0,grounded:false,hp:TYPES[type],maxHp:TYPES[type],face:-1,timer:0,phase:0,aggressive:false,dead:g.defeated.includes(`${id}:${i}`),hurt:0,attackHit:-1}));
  g.saveDirty=true;notice(g,ZONES[g.world.zone].name,g.world.name,160);event(g,'enter');
}
export function collectUpgrade(g,id){
  if(g.upgrades[id])return;
  g.upgrades[id]=true;g.saveDirty=true;g.player.ammo=6;g.player.hp=g.player.maxHp;
  burst(g,g.player.x+5,g.player.y+6,13,32,3);event(g,'upgrade');
  notice(g,id==='doubleJump'?'ALAS DEL ECO':'DASH RESONANTE',id==='doubleJump'?'ESPACIO en el aire / camino al cristal abierto':'SHIFT rompe cristal / camino al cielo abierto',270);
}
export function interact(g){
  const p=g.player;
  if(p.y<170)return;
  if(p.x<38&&g.room>0){enterRoom(g,g.room-1,'right');return;}
  if(p.x>594&&g.room<5){
    if(g.room===1&&!g.upgrades.doubleJump){notice(g,'EL UMBRAL ESPERA','Encuentra las alas del eco');event(g,'locked');return;}
    if(g.room===3&&!g.upgrades.phaseDash){notice(g,'EL CRISTAL RESISTE','Encuentra el dash resonante');event(g,'locked');return;}
    enterRoom(g,g.room+1,'left');return;
  }
  if(Math.abs(p.x-g.world.checkpoint)<24){
    p.hp=p.maxHp;p.ammo=6;p.dashCooldown=0;g.saveDirty=true;g.checkpointLit=true;
    burst(g,p.x+5,p.y+7,13,16);event(g,'save');notice(g,'SANTUARIO','Vida y cargas restauradas',120);
  }
}
export function hitPlayer(g,damage=1,from=0){
  const p=g.player;if(p.invuln||p.dashTime||g.mode!=='playing')return;
  p.hp=Math.max(0,p.hp-damage);p.invuln=66;p.vy=-2.6;p.vx=(from?p.x<from?-1:1:-p.face)*2.3;
  g.shake=6;g.flash=5;burst(g,p.x+5,p.y+5,14,14);event(g,'hurt');
  if(!p.hp){g.mode='dead';g.deaths++;g.saveDirty=true;event(g,'death');}
}
export function damageEnemy(g,e,amount){
  if(e.dead)return;
  e.hp=Math.max(0,e.hp-amount);e.hurt=7;e.aggressive=e.hp<=e.maxHp*.3+.0001;g.shake=Math.min(5,g.shake+2);event(g,'hit');burst(g,e.x+e.w/2,e.y+7,13,7);
  if(e.hp<=0){
    e.dead=true;g.defeated=[...new Set([...g.defeated,e.id])];g.saveDirty=true;
    burst(g,e.x+e.w/2,e.y+e.h/2,14,e.type==='boss'?60:22,2.8);event(g,'kill');
    g.drops.push({x:e.x+3,y:e.y,w:6,h:6,type:'ammo',life:1000});
    if(e.type==='boss'){g.completed=true;g.mode='ending';g.saveDirty=true;g.shake=12;event(g,'victory');}
  }
}
function shoot(g,e,angle,speed=1.7){
  g.shots.push({x:e.x+e.w/2,y:e.y+e.h/2,w:4,h:4,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:220,enemy:true,damage:1});
}
function updateEnemy(g,e){
  if(e.dead)return;
  const p=g.player,dist=p.x-e.x,near=Math.abs(dist)<210;
  e.timer++;e.hurt=Math.max(0,e.hurt-1);e.face=dist<0?-1:1;
  const rage=e.aggressive?1.65:1;
  if(e.type==='moth'||e.type==='drone'){
    const cycle=e.timer%(e.aggressive?120:180),dive=cycle>100&&near;
    if(dive){e.vx+=(p.x-e.x)*.0025*rage;e.vy+=(p.y-e.y)*.003;}
    else{e.vx+=(e.homeX+Math.sin(e.timer*.025)*42-e.x)*.014;e.vy+=(e.homeY+Math.sin(e.timer*.045)*10-e.y)*.025;}
    e.vx=clamp(e.vx*.92,-2.2*rage,2.2*rage);e.vy=clamp(e.vy*.9,-1.7,1.7);e.x+=e.vx;e.y+=e.vy;
    if(e.type==='drone'&&near&&e.timer%Math.round(100/rage)===0)shoot(g,e,Math.atan2(p.y-e.y,dist),2.1);
  }else if(e.type==='sentinel'){
    e.y=e.homeY+Math.sin(e.timer*.03)*4;
    const cycle=e.timer%Math.round(100/rage);
    if(near&&cycle===0){const a=Math.atan2(p.y-e.y,dist);shoot(g,e,a,1.9);if(e.aggressive){shoot(g,e,a-.3,1.9);shoot(g,e,a+.3,1.9);}event(g,'enemyShoot');}
  }else if(e.type==='boss'){
    if(!near&&e.phase===0)return;
    e.phase=1;const length=e.aggressive?150:210,t=e.timer%length;
    e.vx*=.85;
    if(t===30||t===65){const a=Math.atan2(p.y-e.y,dist);for(let k=-2;k<=2;k++)shoot(g,e,a+k*.22,1.6*rage);event(g,'enemyShoot');}
    if(t===100&&e.grounded){e.vy=-6;e.vx=e.face*2.4;event(g,'jump');}
    if(t>135&&t<165)e.vx=e.face*2*rage;
    if(e.y>220){e.y=176;e.vy=0;}
    const wasGrounded=e.grounded;e.grounded=false;e.vy+=.22;moveBody(e,g.world,e.vx,e.vy);
    if(!wasGrounded&&e.grounded){g.shake=5;burst(g,e.x+14,e.y+30,13,22,2.5);}
  }else{
    e.grounded=false;
    if(e.type==='crawler'){
      const direction=e.aggressive&&near?e.face:(Math.sin(e.timer*.015)>0?1:-1);
      e.vx=direction*.55*rage;
    }
    if(e.type==='hopper'){
      if(e.timer%Math.round(85/rage)===0){e.vy=-4.8;e.vx=(near?e.face:Math.sin(e.timer)>0?1:-1)*1.3*rage;}
      e.vx*=.986;
    }
    if(e.type==='lancer'){
      const cycle=e.timer%Math.round(130/rage);
      e.vx=cycle>70&&cycle<96?e.face*3.1*rage:0;
    }
    const ahead=Math.floor((e.x+e.w/2+Math.sign(e.vx)*12)/16),below=Math.floor((e.y+e.h+5)/16);
    if(e.type!=='hopper'&&!tileAt(g.world,ahead,below))e.vx=0;
    e.vy=Math.min(5,e.vy+ZONES[g.world.zone].gravity);moveBody(e,g.world,e.vx,e.vy);
    if(e.y>245){e.x=e.homeX;e.y=e.homeY;e.vy=0;}
  }
  if(overlaps(p,e))hitPlayer(g,e.type==='boss'?2:1,e.x);
  if(p.attack>0&&e.attackHit!==p.attackId){
    const box={x:p.face>0?p.x+6:p.x-22,y:p.y-5,w:26,h:23};
    if(overlaps(box,e)){e.attackHit=p.attackId;damageEnemy(g,e,g.upgrades.phaseDash?5:4);}
  }
  if(p.dashTime&&g.upgrades.phaseDash&&e.attackHit!==-p.attackId-100&&overlaps({x:p.x-5,y:p.y-3,w:20,h:20},e)){
    e.attackHit=-p.attackId-100;damageEnemy(g,e,3);
  }
}
function updateParticles(g){
  for(const f of g.particles){f.x+=f.vx;f.y+=f.vy;if(!f.ghost)f.vy+=.025;f.life--;}
  g.particles=g.particles.filter(f=>f.life>0);
}
export function step(g,input={}){
  if(g.mode!=='playing'){g.events=[];g.shake*=.8;g.flash=Math.max(0,g.flash-1);updateParticles(g);return;}
  g.events=[];g.tick++;g.playtime++;g.shake*=.8;g.flash=Math.max(0,g.flash-1);g.transition=Math.max(0,g.transition-1);
  if(g.toast&&--g.toast.time<=0)g.toast=null;
  const p=g.player,z=ZONES[g.world.zone];
  for(const key of ['invuln','dashCooldown','attackCooldown','shootCooldown','attack'])p[key]=Math.max(0,p[key]-1);
  if(input.interactPressed){interact(g);if(g.transition===24)return;}
  if(input.jumpPressed)p.jumpBuffer=6;else p.jumpBuffer=Math.max(0,p.jumpBuffer-1);
  const axis=(input.right?1:0)-(input.left?1:0);
  if(axis)p.face=axis;
  if(input.dashPressed&&p.dashCooldown===0){
    const dy=(input.down?1:0)-(input.up?1:0),dx=axis||(!dy?p.face:0),length=Math.hypot(dx,dy)||1;
    p.dashX=dx/length;p.dashY=dy/length;p.dashTime=g.upgrades.phaseDash?12:10;p.dashCooldown=g.upgrades.phaseDash?38:48;p.attackId++;
    burst(g,p.x+5,p.y+9,15,10);event(g,'dash');
  }
  if(p.jumpBuffer>0&&(p.grounded||p.coyote>0||(g.upgrades.doubleJump&&!p.airJump))){
    const air=!p.grounded&&p.coyote===0;p.vy=air?-4.9:-5.2;p.airJump=air;p.grounded=false;p.coyote=0;p.jumpBuffer=0;
    burst(g,p.x+5,p.y+14,air?13:6,air?14:8);event(g,'jump');
  }
  if(!input.jump&&!input.jumpPressed&&p.vy<-2&&!p.dashTime)p.vy=-2;
  if(p.dashTime>0){
    p.vx=p.dashX*7.5;p.vy=p.dashY*7.5;
    if(g.upgrades.phaseDash){
      const next={...p,x:p.x+p.vx,y:p.y+p.vy};
      for(let y=Math.floor((next.y-4)/16);y<=Math.floor((next.y+next.h+4)/16);y++)for(let x=Math.floor((next.x-4)/16);x<=Math.floor((next.x+next.w+4)/16);x++)if(tileAt(g.world,x,y)===4){g.world.tiles[y][x]=0;g.broken.push(`${g.room}:${x}:${y}`);g.saveDirty=true;burst(g,x*16+8,y*16+8,13,20);event(g,'break');}
    }
    if(g.tick%2===0)g.particles.push({x:p.x,y:p.y,vx:0,vy:0,life:12,max:12,color:15,size:9,ghost:true});
    p.dashTime--;
  }else{
    const target=axis*2.15,accel=p.grounded?.65:.4;
    p.vx+=clamp(target-p.vx,-accel,accel);
    if(Math.abs(p.vx)<.01)p.vx=0;
    if(z.wind&&!p.grounded)p.vx+=Math.sin(g.tick*.017)*z.wind*8;
    p.vy=Math.min(6,p.vy+z.gravity);
  }
  const landed=p.grounded;p.grounded=false;moveBody(p,g.world,p.vx,p.vy);
  if(p.grounded){p.coyote=6;p.airJump=false;if(!landed)burst(g,p.x+5,p.y+14,6,6,1.2);}
  else p.coyote=Math.max(0,p.coyote-1);
  if(p.grounded&&axis&&g.tick%7===0)burst(g,p.x+5,p.y+14,5,2,.5);
  if(p.y<-40){p.y=-40;p.vy=0;}
  if(p.y>245){
    p.invuln=0;p.dashTime=0;hitPlayer(g,1);if(g.mode==='playing'){p.x=g.world.checkpoint;p.y=194;p.vx=0;p.vy=0;p.invuln=90;}
  }
  if(input.attackPressed&&p.attackCooldown===0){p.attack=9;p.attackCooldown=18;p.attackId++;event(g,'slash');burst(g,p.x+p.face*12,p.y+6,8,4);}
  if(input.shootPressed&&p.ammo>0&&p.shootCooldown===0){
    p.ammo--;p.shootCooldown=20;g.shots.push({x:p.x+(p.face>0?10:-4),y:p.y+5,w:5,h:3,vx:p.face*4.8,vy:0,life:80,enemy:false,damage:6});event(g,'shoot');
  }
  const upgrade=g.world.upgrade;
  if(upgrade&&!g.upgrades[upgrade.id]&&overlaps(p,{x:upgrade.x-8,y:upgrade.y-10,w:24,h:28}))collectUpgrade(g,upgrade.id);
  if(!g.checkpointLit&&Math.abs(p.x-g.world.checkpoint)<15&&p.grounded){p.hp=p.maxHp;p.ammo=6;g.checkpointLit=true;g.saveDirty=true;event(g,'save');burst(g,p.x+5,p.y+7,13,12);}
  for(const e of g.enemies)updateEnemy(g,e);
  for(const shot of g.shots){
    const count=Math.ceil(Math.hypot(shot.vx,shot.vy)/2);
    for(let n=0;n<count&&shot.life>0;n++){
      shot.x+=shot.vx/count;shot.y+=shot.vy/count;
      if(collision(shot,g.world)){shot.life=0;burst(g,shot.x,shot.y,shot.enemy?14:15,4);break;}
      if(shot.enemy){if(overlaps(shot,p)){hitPlayer(g,shot.damage,shot.x);shot.life=0;}}
      else for(const e of g.enemies)if(!e.dead&&overlaps(shot,e)){damageEnemy(g,e,shot.damage);shot.life=0;break;}
    }
    shot.life--;
  }
  g.shots=g.shots.filter(s=>s.life>0);
  for(const drop of g.drops){
    drop.life--;if(overlaps(p,{...drop,x:drop.x-6,y:drop.y-6,w:18,h:18})){p.ammo=Math.min(6,p.ammo+2);drop.life=0;event(g,'pickup');burst(g,drop.x,drop.y,13,8);}
  }
  g.drops=g.drops.filter(d=>d.life>0);
  updateParticles(g);
}
export function respawn(g){
  g.mode='playing';Object.assign(g.player,{hp:5,ammo:6,dashCooldown:0,shootCooldown:0,attackCooldown:0,airJump:false});enterRoom(g,g.room,'left');
}
