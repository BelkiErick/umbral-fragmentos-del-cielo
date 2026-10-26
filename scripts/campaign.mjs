import {createGame,step,respawn} from '../src/simulation.js';
import {tileAt} from '../src/world.js';

// A deterministic input-only explorer. It never edits player HP, positions or upgrades.
// Exported to reuse the same route for the simulation regression and the gameplay capture.
export function explorerInput(g){
  const p=g.player,room=g.world,u=room.upgrade;
  const target=u&&!g.upgrades[u.id]?u.x:610;
  let dir=target>p.x+5?1:target<p.x-5?-1:0;
  const i={right:dir>0,left:dir<0,jump:true};
  const enemies=g.enemies.filter(e=>!e.dead&&Math.abs(e.y-p.y)<26);
  const nearest=enemies.sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(nearest&&Math.abs(nearest.x-p.x)<65){
    i.attackPressed=p.attackCooldown===0;
    if(Math.abs(nearest.x-p.x)<100&&p.ammo&&p.shootCooldown===0)i.shootPressed=true;
  }
  const foot=Math.floor((p.y+p.h+2)/16),ahead=Math.floor((p.x+5+dir*20)/16);
  const obstacle=tileAt(room,ahead,Math.floor((p.y+7)/16));
  const gap=!tileAt(room,ahead,foot);
  if(p.grounded&&(gap||obstacle||g.tick%40===0||u&&!g.upgrades[u.id]&&Math.abs(u.x-p.x)<60))i.jumpPressed=true;
  if(!p.grounded&&g.upgrades.doubleJump&&!p.airJump&&p.vy>-.3&&(gap||p.y>184||u&&!g.upgrades[u.id]&&Math.abs(u.x-p.x)<40))i.jumpPressed=true;
  if(obstacle===4&&g.upgrades.phaseDash&&p.dashCooldown===0)i.dashPressed=true;
  if(p.y>175&&!p.grounded&&gap&&p.dashCooldown===0&&Math.abs(target-p.x)>35)i.dashPressed=true;
  if(p.x>598&&p.y>170)i.interactPressed=true;
  const boss=g.enemies.find(e=>e.type==='boss'&&!e.dead);
  if(boss&&g.room===5&&p.x>310){
    const dx=boss.x-p.x;
    i.right=dx>20;i.left=dx<-20;i.attackPressed=p.attackCooldown===0;
    i.shootPressed=p.ammo>0&&p.shootCooldown===0&&Math.abs(boss.y-p.y)<28;
    if(p.grounded&&Math.abs(dx)<70)i.jumpPressed=true;
    if(Math.abs(dx)<30&&p.dashCooldown===0)i.dashPressed=true;
  }
  return i;
}
export function runCampaign(limit=24000){
  const g=createGame(),milestones=[];let lastRoom=-1,lastUpgrades='',resets=0;
  for(let n=0;n<limit;n++){
    if(g.mode==='dead'){respawn(g);resets++;}
    step(g,explorerInput(g));
    const upgrades=JSON.stringify(g.upgrades);
    if(g.room!==lastRoom||upgrades!==lastUpgrades){milestones.push({frame:n,room:g.room,x:Math.round(g.player.x),hp:g.player.hp,upgrades:{...g.upgrades}});lastRoom=g.room;lastUpgrades=upgrades;}
    if(g.completed)return {completed:true,frames:n,resets,milestones};
  }
  return {completed:false,room:g.room,x:g.player.x,y:g.player.y,hp:g.player.hp,upgrades:g.upgrades,resets,milestones};
}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('campaign.mjs'))console.log(JSON.stringify(runCampaign(),null,2));
