import {ROOMS,tileAt} from './world.js';
export const SAVE_KEY='umbral-save-v1';
export function serialize(g){
  return {version:1,room:g.room,upgrades:{...g.upgrades},visited:[...g.visited],defeated:[...g.defeated],broken:[...g.broken],completed:g.completed,playtime:g.playtime,deaths:g.deaths};
}
export function loadSave(storage){
  try{
    const s=JSON.parse(storage.getItem(SAVE_KEY));
    if(!s||s.version!==1||!Number.isInteger(s.room)||s.room<0||s.room>5||!s.upgrades||typeof s.upgrades!=='object'||Array.isArray(s.upgrades))return null;
    if(typeof s.upgrades.doubleJump!=='boolean'||typeof s.upgrades.phaseDash!=='boolean')return null;
    if(s.upgrades.phaseDash&&!s.upgrades.doubleJump)return null;
    if((s.room>=2&&!s.upgrades.doubleJump)||(s.room>=4&&!s.upgrades.phaseDash))return null;
    if(!Array.isArray(s.visited)||!s.visited.every(x=>Number.isInteger(x)&&x>=0&&x<6))return null;
    if(!Array.isArray(s.defeated)||!s.defeated.every(x=>typeof x==='string'&&/^\d:\d$/.test(x)))return null;
    if(!Array.isArray(s.broken)||!s.broken.every(x=>typeof x==='string'&&/^\d:\d{1,2}:\d{1,2}$/.test(x)))return null;
    for(const id of s.defeated){const [room,enemy]=id.split(':').map(Number);if(!ROOMS[room]?.enemies[enemy])return null;}
    for(const id of s.broken){const [room,x,y]=id.split(':').map(Number);if(!ROOMS[room]||tileAt(ROOMS[room],x,y)!==4||!s.upgrades.phaseDash)return null;}
    if(typeof s.completed!=='boolean'||s.completed!==s.defeated.includes('5:2'))return null;
    return {...s,completed:s.completed===true,playtime:Number.isFinite(s.playtime)?Math.max(0,s.playtime):0,deaths:Number.isFinite(s.deaths)?Math.max(0,s.deaths):0};
  }catch{return null;}
}
export function writeSave(g,storage){try{storage.setItem(SAVE_KEY,JSON.stringify(serialize(g)));return true;}catch{return false;}}
