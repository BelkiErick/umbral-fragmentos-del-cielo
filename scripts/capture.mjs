// Captures the shipped simulation + renderer driven solely by controller inputs.
// Requires Playwright (dev tool only). The game itself has no runtime dependencies.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const page=await browser.newPage({viewport:{width:1440,height:960}});
await mkdir('.artifacts/frames',{recursive:true});await mkdir('docs',{recursive:true});
try{
  await page.goto('http://localhost:4173');await page.waitForTimeout(250);
  await page.locator('#game-frame').screenshot({path:'docs/cover.png'});
  const result=await page.evaluate(async()=>{
    const {createGame,step,respawn}=await import('/src/simulation.js');
    const {Renderer}=await import('/src/render.js');
    const {explorerInput}=await import('/scripts/campaign.mjs');
    const g=createGame(),canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
    const renderer=new Renderer(canvas),frames=[],scenes={};
    for(let n=0;n<12000;n++){
      if(g.mode==='dead')respawn(g);
      step(g,explorerInput(g));renderer.render(g,{reducedMotion:false});
      if(n%6===0)frames.push(canvas.toDataURL('image/png').split(',')[1]);
      if(!scenes[g.world.zone]&&g.player.x>250&&g.player.x<400)scenes[g.world.zone]=canvas.toDataURL('image/png').split(',')[1];
      if(g.completed){for(let k=0;k<12;k++){for(let j=0;j<6;j++)step(g);renderer.render(g);frames.push(canvas.toDataURL('image/png').split(',')[1]);}return {completed:true,frames,scenes};}
    }
    return {completed:false,frames,scenes};
  });
  if(!result.completed)throw Error('Campaign did not finish during capture');
  await Promise.all(result.frames.map((b64,i)=>writeFile(`.artifacts/frames/${String(i).padStart(4,'0')}.png`,Buffer.from(b64,'base64'))));
  await Promise.all(Object.entries(result.scenes).map(([zone,b64])=>writeFile(`docs/zone-${zone}.png`,Buffer.from(b64,'base64'))));
  console.log(`Captured ${result.frames.length} frames, three biomes, and title cover. Use scripts/make_gif.py to encode.`);
}finally{await browser.close();}
