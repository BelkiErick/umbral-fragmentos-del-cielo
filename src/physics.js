import {TILE,tileAt} from './world.js';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function solid(t){return t===1||t===2||t===4;}
export function collision(body,room,accept=()=>true){
  const x0=Math.floor(body.x/TILE),x1=Math.floor((body.x+body.w-.001)/TILE);
  const y0=Math.floor(body.y/TILE),y1=Math.floor((body.y+body.h-.001)/TILE);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const t=tileAt(room,x,y);if(solid(t)&&accept(t,x,y))return {x,y,t};}
  return null;
}
// Substeps cap displacement at 3px, including high-speed dashes.
export function moveBody(body,room,dx,dy){
  for(const [axis,distance,size] of [['x',dx,'w'],['y',dy,'h']]){
    if(!distance)continue;
    const count=Math.ceil(Math.abs(distance)/3), delta=distance/count;
    for(let i=0;i<count;i++){
      const previousBottom=body.y+body.h;
      body[axis]+=delta;
      const hit=collision(body,room,(t,x,y)=>t!==2||(axis==='y'&&delta>0&&previousBottom<=y*TILE+.001));
      if(hit){
        body[axis]=delta>0?hit[axis]*TILE-body[size]:(hit[axis]+1)*TILE;
        if(axis==='x')body.vx=0;
        else {body.vy=0;if(delta>0)body.grounded=true;}
        break;
      }
    }
  }
  body.x=clamp(body.x,0,room.width-body.w);
}
