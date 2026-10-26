export const TILE = 16;
export const ZONES = [
  {name:'RUINAS DEL ECO',subtitle:'Donde la piedra recuerda',gravity:.25,wind:0,
    colors:['#0b171c','#13282d','#1d383b','#2b4c4b','#42635b','#658174','#8e9c86','#c2c6a3','#e9e5c5','#2f5650','#49856b','#7ca77c','#b5d4a0','#d4b779','#b76b62','#68b6ad']},
  {name:'CAVERNAS DE CRISTAL',subtitle:'La luz tiene memoria',gravity:.18,wind:0,
    colors:['#100f26','#1c1c3c','#282b50','#384367','#4c5b86','#6c79a3','#9a9cbe','#c9c9e3','#f0e5ff','#3d3970','#6260a3','#8c79ce','#c0a8ee','#8bdee4','#d784ad','#70b8dc']},
  {name:'LA CIUDAD SUSPENDIDA',subtitle:'El último refugio del viento',gravity:.23,wind:.055,
    colors:['#201c28','#312b35','#49404a','#655357','#82695b','#a18768','#bfa782','#dcc798','#f5e6be','#564a4a','#8b6b52','#b28b5a','#d6af6b','#f0ca79','#cb7864','#91b7b0']},
];
const layouts = [
  {name:'El despertar',zone:0,pits:[[17,19]],platforms:[[9,11,4],[24,10,4],[30,11,4]],enemies:[['crawler',208,194],['moth',422,143]],checkpoint:64},
  {name:'Jardín del tiempo',zone:0,pits:[[18,21]],platforms:[[8,11,4],[13,9,3],[25,11,3],[28,10,5]],enemies:[['moth',188,130],['crawler',410,194]],upgrade:{id:'doubleJump',x:488,y:144},checkpoint:64},
  {name:'El prisma dormido',zone:1,pits:[[17,23]],platforms:[[8,10,4],[19,11,3],[27,9,4]],enemies:[['hopper',208,194],['sentinel',464,130]],checkpoint:64},
  {name:'Cámara resonante',zone:1,pits:[[14,19]],platforms:[[9,10,4],[16,11,2],[22,11,4]],enemies:[['sentinel',174,146],['hopper',512,194]],upgrade:{id:'phaseDash',x:384,y:160},barrier:28,checkpoint:64},
  {name:'Las torres sin nombre',zone:2,pits:[[13,17],[24,28]],platforms:[[10,11,3],[15,10,3],[21,11,3],[26,10,3],[31,11,3]],enemies:[['drone',218,122],['lancer',512,194]],checkpoint:64},
  {name:'El corazón del cielo',zone:2,pits:[],platforms:[[12,10,4],[26,10,4]],enemies:[['drone',220,120],['lancer',304,194],['boss',484,176]],checkpoint:64},
];
export const ROOMS = layouts.map((r,id)=>{
  const tiles=Array.from({length:15},(_,y)=>Array(40).fill(y>=13?1:0));
  for(const [a,b] of r.pits) for(let x=a;x<=b;x++) tiles[13][x]=tiles[14][x]=0;
  for(const [x,y,n] of r.platforms) for(let j=0;j<n;j++) tiles[y][x+j]=2;
  if(r.barrier) for(let y=10;y<13;y++) tiles[y][r.barrier]=4;
  return {...r,id,width:640,height:240,tiles};
});
export function tileAt(room,x,y){return room.tiles[y]?.[x]??0;}
export function roomInstance(id,broken=[]){
  const room={...ROOMS[id],tiles:ROOMS[id].tiles.map(row=>[...row])};
  for(const key of broken){const [rid,x,y]=key.split(':').map(Number);if(rid===id&&room.tiles[y])room.tiles[y][x]=0;}
  return room;
}
