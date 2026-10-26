const bindings={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyZ:'attack',KeyJ:'attack',KeyX:'shoot',KeyK:'shoot'};
export class Input{
  constructor(onPause,onBlur){
    this.keys=new Set();this.pressed=new Set();this.enabled=false;
    window.addEventListener('keydown',e=>{
      if(e.code==='Escape'){e.preventDefault();if(!e.repeat)onPause();return;}
      if(!this.enabled||e.target instanceof HTMLInputElement)return;
      if(bindings[e.code]){e.preventDefault();if(!e.repeat&&!this.keys.has(e.code))this.pressed.add(bindings[e.code]);this.keys.add(e.code);}
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>{this.clear();onBlur();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clear();onBlur();}});
  }
  clear(){this.keys.clear();this.pressed.clear();}
  sample(){
    const i={};for(const k of this.keys)i[bindings[k]]=true;
    for(const k of this.pressed)i[`${k}Pressed`]=true;
    i.interactPressed=this.pressed.has('up');this.pressed.clear();return i;
  }
}
