import {ZONES} from './world.js';
import {clamp} from './physics.js';
import {rect,text,disc,diamond,playerArt,enemyArt,tileArt,crystal,grass} from './art.js';

function arch(c,x,y,w,h,p,color=3){
  rect(c,x,y+8,w,h-8,p[color]);rect(c,x+3,y+3,w-6,6,p[color]);rect(c,x+8,y,w-16,4,p[color]);
  const inner=w-14;
  rect(c,x+7,y+22,inner,h-22,p[1]);disc(c,x+w/2,y+23,Math.floor(inner/2),p[1]);
  rect(c,x-2,y+h-6,w+4,6,p[color+1]);rect(c,x+2,y+8,3,h-15,p[color+1]);
  for(let j=17;j<h;j+=12){rect(c,x,y+j,7,1,p[1]);rect(c,x+w-7,y+j+4,7,1,p[1]);}
}
function tree(c,x,y,s,p){
  rect(c,x,y-62*s,7*s,62*s,p[1]);rect(c,x-4*s,y-48*s,5*s,36*s,p[1]);
  for(let i=0;i<7;i++){rect(c,x-21*s+i*6*s,y-72*s-(i%3)*6*s,24*s,13*s,p[1]);rect(c,x-25*s+i*7*s,y-63*s+(i%2)*5*s,20*s,11*s,p[2]);}
  rect(c,x+7*s,y-42*s,15*s,4*s,p[1]);rect(c,x+19*s,y-50*s,4*s,12*s,p[1]);
  for(let i=0;i<8;i++){const dx=x-21*s+i*8*s;rect(c,dx,y-55*s,1,8+(i*11)%23,p[3]);if(i%2)rect(c,dx-2,y-40*s,3,2,p[4]);}
}
export function background(c,zone,camera,t,title=false){
  const p=ZONES[zone].colors;rect(c,0,0,320,180,p[0]);
  for(let y=28;y<160;y+=24)rect(c,0,y,320,24,p[y<70?0:y<120?1:2]);
  const moonX=title?236:232-camera.x*.04,moonY=title?43:34;
  if(zone!==1){disc(c,moonX,moonY,24,p[3]);disc(c,moonX,moonY,20,p[4]);disc(c,moonX,moonY,16,p[6]);disc(c,moonX-3,moonY-4,13,p[7]);rect(c,moonX-25,moonY+5,44,2,p[4]);rect(c,moonX-10,moonY+13,42,3,p[3]);}
  for(let i=0;i<30;i++){
    const x=((i*79+17-camera.x*.08)%344+344)%344,y=(i*31)%95;
    rect(c,x,y,1,i%7===0?2:1,p[i%4===0?5:2]);
  }
  // Distant fragments and broken skyline move more slowly than the foreground.
  for(let i=0;i<9;i++){
    const x=i*59-camera.x*.15-40,y=75+(i*17)%35;
    if(zone===1){crystal(c,x+25,y,20+(i%3)*13,p);rect(c,x+23,y-13,1,9,p[5]);}
    else{
      rect(c,x,y,22+(i%3)*8,70,p[2]);rect(c,x+5,y-15,13,20,p[2]);rect(c,x+7,y-18,9,3,p[3]);
      for(let j=0;j<3;j++)rect(c,x+8,y+9+j*14,3,6,p[1]);
      if(zone===2){rect(c,x-8,y+34,46,5,p[3]);for(let j=0;j<7;j++)rect(c,x+j*4,y+39,20-j*2,3,p[2]);}
    }
  }
  if(zone===0){
    for(let i=0;i<4;i++)tree(c,i*114+40-camera.x*.28,165,1,p);
    arch(c,210-camera.x*.23,67,43,80,p,3);arch(c,252-camera.x*.23,82,40,65,p,2);
  }else if(zone===1){
    for(let i=0;i<15;i++){
      const x=i*27-camera.x*.2;rect(c,x,0,19,12+(i*13)%30,p[2]);
      for(let n=0;n<8;n++)rect(c,x+n,12+(i*13)%30+n,17-n*2,2,p[2]);
      if(i%3===0)crystal(c,x+7,37+(i%4)*8,9,p);
    }
    disc(c,230,96,28,p[2]);disc(c,230,96,19,p[3]);crystal(c,230,92,22,p);
  }else{
    for(let i=0;i<6;i++){
      const x=((i*88-t*.035-camera.x*.12)%430+430)%430-50,y=45+i%3*25;
      rect(c,x,y,45,3,p[3]);rect(c,x+9,y-3,26,3,p[3]);rect(c,x-8,y+3,70,2,p[2]);
    }
    arch(c,222-camera.x*.23,67,42,75,p,3);
    rect(c,260-camera.x*.23,98,48,4,p[4]);rect(c,270-camera.x*.23,102,3,35,p[3]);
  }
  // Soft mist is dithered, preserving the palette.
  for(let x=0;x<320;x+=4){const y=140+Math.floor(Math.sin((x+t*.12)*.015)*4);rect(c,x,y,2,1,p[4]);if(x%12===0)rect(c,x+2,y+5,3,1,p[3]);}
}
function gate(c,x,y,p,locked,t,back=false){
  arch(c,x-8,y-36,23,50,p,4);rect(c,x-2,y-23,11,34,p[0]);
  for(let n=0;n<4;n++)rect(c,x+n*2,y-20+Math.sin(t*.045+n)*4,1,26,p[locked?9:15]);
  diamond(c,x+3,y-34,2,3,p[locked?14:13]);
  text(c,back?'<':'>',x+1,y-10,p[locked?5:8]);
}
function shrine(c,x,y,p,t){
  rect(c,x-9,y-4,22,4,p[4]);rect(c,x-6,y-9,16,5,p[5]);rect(c,x-3,y-20,10,11,p[3]);
  rect(c,x-2,y-22,8,3,p[6]);diamond(c,x+2,y-29+Math.sin(t*.04)*2,3,5,p[13]);
  rect(c,x+1,y-17,2,6,p[13]);
}
function heart(c,x,y,full,p){
  const s=['0110110','1111111','1111111','0111110','0011100','0001000'];
  for(let j=0;j<s.length;j++)for(let i=0;i<7;i++)if(s[j][i]==='1')rect(c,x+i,y+j,1,1,p[full?14:3]);
  if(full)rect(c,x+1,y+1,2,1,p[8]);
}
export class Renderer{
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.c.imageSmoothingEnabled=false;this.camera={x:0,y:60};this.lastRoom=-1;}
  title(t){
    const c=this.c,p=ZONES[0].colors;background(c,0,{x:0,y:0},t,true);
    // The monumental doorway is the visual anchor of the title screen.
    arch(c,218,57,43,86,p,4);rect(c,224,72,4,61,p[6]);rect(c,250,74,4,62,p[3]);
    rect(c,231,82,17,56,p[0]);rect(c,238,88,2,45,p[15]);rect(c,234,95,1,34,p[9]);
    diamond(c,240,56,4,7,p[13]);diamond(c,240,56,1,4,p[8]);
    for(let i=0;i<6;i++){const x=220+i*6;rect(c,x,62,2,8+(i*7)%15,p[9]);rect(c,x-1,66,4,2,p[10]);}
    rect(c,193,143,92,5,p[5]);rect(c,187,148,104,5,p[3]);
    for(let row=0;row<9;row++)rect(c,187+row*4,153+row*3,104-row*8,3,p[row%2?1:2]);
    for(let i=0;i<7;i++)grass(c,192+i*13,143,p,i+5);
    tree(c,300,152,1.3,p);rect(c,286,154,34,26,p[0]);
    playerArt(c,p,207,128,1,t,false);
    for(let i=0;i<8;i++){const x=(i*47+185+t*.08)%340,y=56+(i*23)%98+Math.sin(t*.02+i)*3;rect(c,x,y,1,1,p[i%2?13:11]);}
    // A fine ordered dissolve keeps the title readable without coarse diagonal bands.
    const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    rect(c,0,0,76,175,p[0]);
    for(let x=76;x<185;x++)for(let y=0;y<175;y++)if(bayer[(x%4)+(y%4)*4]>(x-76)*16/109)rect(c,x,y,1,1,p[0]);
    // Thin foreground grasses frame the scene without masking the menu.
    for(let i=0;i<17;i++)grass(c,i*21,180,p,i+1);
  }
  render(g,settings={}){
    const c=this.c,p=ZONES[g.world.zone].colors;
    const targetX=clamp(g.player.x-140,0,320),targetY=clamp(g.player.y-100,0,60);
    if(this.lastRoom!==g.room){this.camera.x=targetX;this.camera.y=targetY;this.lastRoom=g.room;}
    this.camera.x+=(targetX-this.camera.x)*.12;this.camera.y+=(targetY-this.camera.y)*.1;
    const shake=settings.reducedMotion?0:g.shake;
    const cx=Math.round(this.camera.x+Math.sin(g.tick*2.7)*shake),cy=Math.round(this.camera.y+Math.cos(g.tick*3.9)*shake*.5);
    background(c,g.world.zone,this.camera,g.tick);
    c.save();c.translate(-cx,-cy);
    // Midground monuments, plants and fallen masonry.
    for(let i=0;i<7;i++){
      const x=100+i*87;
      if(g.world.zone===0){
        if(i%2===0){rect(c,x,157,12,51,p[3]);rect(c,x-3,154,18,5,p[4]);rect(c,x+3,160,2,43,p[4]);rect(c,x+6,171,6,2,p[2]);grass(c,x-3,156,p,i+3);}
        else{rect(c,x,198,25,10,p[3]);rect(c,x+3,195,14,3,p[4]);}
      }else if(g.world.zone===1)crystal(c,x,200,10+i%3*6,p);
      else {rect(c,x,182,4,26,p[4]);rect(c,x-3,180,10,3,p[6]);rect(c,x-2,184,8,2,p[3]);}
    }
    for(let y=0;y<15;y++)for(let x=Math.max(0,Math.floor(cx/16));x<Math.min(40,Math.ceil((cx+320)/16));x++){
      const type=g.world.tiles[y][x];if(type)tileArt(c,x*16,y*16,type,p,x+y*17,g.world.zone);
    }
    if(g.room>0)gate(c,20,194,p,false,g.tick,true);
    if(g.room<5)gate(c,607,194,p,(g.room===1&&!g.upgrades.doubleJump)||(g.room===3&&!g.upgrades.phaseDash),g.tick);
    shrine(c,g.world.checkpoint,208,p,g.tick);
    const u=g.world.upgrade;
    if(u&&!g.upgrades[u.id]){
      const y=u.y+Math.sin(g.tick*.05)*3;
      diamond(c,u.x,y,9,13,p[9]);diamond(c,u.x,y,6,9,p[11]);diamond(c,u.x,y,3,5,p[13]);
      rect(c,u.x-1,y-2,3,4,p[8]);
      if(u.id==='doubleJump'){rect(c,u.x-10,y-3,4,2,p[13]);rect(c,u.x+7,y-3,4,2,p[13]);}
    }
    for(const d of g.drops)diamond(c,d.x+3,d.y+3+Math.sin(g.tick*.08)*2,2,3,p[13]);
    for(const e of g.enemies)if(!e.dead){
      enemyArt(c,e,p,g.tick);
      if(e.hp<e.maxHp&&e.type!=='boss'){rect(c,e.x,e.y-9,12,2,p[0]);rect(c,e.x,e.y-9,Math.ceil(e.hp/e.maxHp*12),1,p[14]);}
    }
    const pl=g.player;
    if(!pl.invuln||g.tick%6<4)playerArt(c,p,pl.x,pl.y,pl.face,g.tick,pl.grounded&&Math.abs(pl.vx)>.5);
    if(pl.attack){
      const x=pl.x+(pl.face>0?14:-8),y=pl.y+6;
      for(let i=-7;i<8;i++){const offset=Math.round(Math.sqrt(60-i*i));rect(c,x+offset*pl.face,y+i,2,1,p[i%3===0?13:8]);}
    }
    for(const s of g.shots){rect(c,s.x-s.vx,s.y,s.w,s.h,p[s.enemy?9:10]);rect(c,s.x,s.y,s.w,s.h,p[s.enemy?14:13]);rect(c,s.x+1,s.y,2,1,p[8]);}
    for(const f of g.particles){
      if(f.ghost){rect(c,f.x+1,f.y+2,8,11,p[f.life>6?9:3]);}
      else rect(c,f.x,f.y,f.size,f.size,p[f.life<8?4:f.color]);
    }
    for(let i=0;i<20;i++){
      const x=(i*71+g.tick*(g.world.zone===2?1.4:.1))%640,y=70+(i*17)%125+Math.sin(g.tick*.02+i)*4;
      rect(c,x,y,g.world.zone===2?5:1,1,p[i%3===0?13:5]);
    }
    c.restore();this.hud(g,p);
    if(g.toast){
      const {title,sub,time}=g.toast;
      // Long instructional subtitles live in the accessible HUD strip, not over combat.
      const width=Math.min(306,title.length*6+20);rect(c,160-width/2,29,width,18,p[0]);rect(c,160-width/2,29,2,18,p[13]);
      text(c,title,160,35,p[7],1,'center');
    }
    let hint=null;
    if(pl.y>170){if(pl.x<38&&g.room>0)hint='W  VOLVER';else if(pl.x>594&&g.room<5)hint='W  CRUZAR';else if(Math.abs(pl.x-g.world.checkpoint)<24)hint='W  DESCANSAR';}
    if(hint){rect(c,160-hint.length*3-5,160,hint.length*6+10,13,p[0]);text(c,hint,160,163,p[7],1,'center');}
    if(g.room===0&&pl.x<150&&g.tick<750&&!hint){text(c,'ESPACIO SALTA / SHIFT DASH',160,168,p[6],1,'center');}
    if(g.flash&&!settings.reducedMotion){rect(c,0,0,320,2,p[14]);rect(c,0,178,320,2,p[14]);}
    if(g.transition>15){for(let y=0;y<180;y+=6)rect(c,0,y,320,Math.ceil((g.transition-15)/3),p[0]);}
  }
  hud(g,p){
    const c=this.c,pl=g.player;
    rect(c,6,6,70,19,p[0]);
    for(let i=0;i<5;i++)heart(c,10+i*10,10,i<pl.hp,p);
    rect(c,10,20,48,2,p[3]);rect(c,10,20,Math.round((1-pl.dashCooldown/(g.upgrades.phaseDash?38:48))*48),2,p[15]);
    for(let i=0;i<6;i++)diamond(c,65+(i%2)*5,10+Math.floor(i/2)*5,1,1,p[i<pl.ammo?13:3]);
    if(g.upgrades.doubleJump){text(c,'+',81,10,p[13]);text(c,'+',84,13,p[13]);}
    if(g.upgrades.phaseDash)text(c,'>',96,12,p[15]);
    rect(c,270,6,44,23,p[0]);
    const objective=!g.upgrades.doubleJump?1:!g.upgrades.phaseDash?3:g.completed?-1:5;
    for(let n=0;n<6;n++){
      const col=Math.floor(n/2),row=n%2,x=275+col*12,y=10+row*9,visited=g.visited.includes(n);
      rect(c,x,y,9,6,p[visited?5:2]);rect(c,x+1,y+1,7,4,p[visited?3:0]);
      if(n===g.room)rect(c,x+3,y+2,3,2,p[13]);
      if(n===objective)diamond(c,x+8,y,1,1,p[13]);
      if(n%2===0)rect(c,x+4,y+6,1,3,p[3]);
      else if(n<5)rect(c,x+9,y-3,3,1,p[g.visited.includes(n+1)?5:2]);
    }
    const boss=g.enemies.find(e=>e.type==='boss'&&!e.dead&&e.phase);
    if(boss){rect(c,90,155,140,12,p[0]);text(c,'EL ULTIMO VIGIA',160,150,p[7],1,'center');rect(c,94,159,132,3,p[3]);rect(c,94,159,132*boss.hp/boss.maxHp,3,p[boss.aggressive?14:13]);}
  }
}
