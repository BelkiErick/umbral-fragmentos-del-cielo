const melodies=[
  [64,71,76,78,76,71,67,71,62,69,74,76,74,69,66,69],
  [61,68,73,75,80,75,73,68,59,66,71,73,78,73,71,66],
  [62,69,74,78,81,78,74,69,60,67,72,76,79,76,72,67],
];
export class Audio{
  constructor(){this.ctx=null;this.enabled=true;this.volume=.35;this.zone=0;this.index=0;this.next=0;this.paused=false;}
  async start(){
    try{
      if(!this.ctx){
        this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);
      }
      await this.ctx.resume();this.master.gain.value=this.enabled?this.volume*.32:0;this.next=this.ctx.currentTime+.04;
    }catch{/* Browsers without Web Audio still run the complete game. */}
  }
  setVolume(v){this.volume=v;if(this.master)this.master.gain.setTargetAtTime(this.enabled?v*.32:0,this.ctx.currentTime,.03);}
  toggle(){this.enabled=!this.enabled;this.setVolume(this.volume);if(this.enabled)this.start();return this.enabled;}
  note(freq,duration=.15,type='triangle',volume=.3,delay=0,end=null){
    if(!this.ctx||!this.enabled||this.ctx.state!=='running')return;
    const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);
    if(end)osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.006);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    osc.connect(gain);gain.connect(this.master);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  update(zone,paused=false){
    this.zone=zone;
    if(!this.ctx||!this.enabled||paused||this.ctx.state!=='running'){if(this.ctx)this.next=this.ctx.currentTime+.05;return;}
    if(this.next<this.ctx.currentTime-.2)this.next=this.ctx.currentTime;
    while(this.next<this.ctx.currentTime+.1){
      const n=this.index++,delay=Math.max(0,this.next-this.ctx.currentTime),m=melodies[zone];
      this.note(440*2**((m[n%16]-69)/12),.24,'triangle',.15,delay);
      if(n%4===0)this.note(440*2**((m[Math.floor(n/8)%2*8]-24-69)/12),.45,'triangle',.3,delay);
      if(n%2===1)this.note(70,.045,'square',.045,delay,35);
      this.next+=.205;
    }
  }
  fx(name){
    switch(name){
      case 'jump':this.note(200,.12,'square',.14,0,450);break;
      case 'dash':this.note(550,.15,'sawtooth',.08,0,70);break;
      case 'slash':this.note(280,.09,'sawtooth',.1,0,70);break;
      case 'shoot':this.note(850,.12,'square',.1,0,270);break;
      case 'hurt':this.note(150,.2,'sawtooth',.3,0,40);break;
      case 'hit':this.note(100,.08,'square',.2,0,30);break;
      case 'kill':this.note(240,.22,'triangle',.22,0,40);break;
      case 'upgrade':case 'victory': [0,4,7,12,16].forEach((n,i)=>this.note(330*2**(n/12),.45,'triangle',.3,i*.11));break;
      case 'save':case 'pickup':this.note(880,.18,'triangle',.2);this.note(1320,.25,'triangle',.14,.1);break;
      case 'locked':this.note(90,.12,'square',.12);break;
      case 'break':this.note(450,.18,'sawtooth',.15,0,80);break;
      case 'death':this.note(220,.65,'triangle',.3,0,30);break;
      default:break;
    }
  }
}
