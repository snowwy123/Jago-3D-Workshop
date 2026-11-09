// SPDX-License-Identifier: MIT
import * as T from 'three';
import {alignedLetters} from './specialist-tools.js';
import {captureLook} from './presentation-model.js';

export const studies = [
  ['shadow-relay','Shadow Relay · light study'],
  ['signal-pavilion','Signal Pavilion · folds & projection'],
  ['paper-delta','Delta · printable prism'],
  ['strata-relief','Strata · layered sculpture'],
  ['viewpoint-offset','Offset · perspective lettering'],
  ['ocean-breakwater','Breakwater · ocean stage'],
  ['prism-poster','Prism · crumpled holographic poster'],
  ['afterimage-mapping','Afterimage · projection mapping'],
  ['kinetic-orbit','Kinetic Orbit · animated sculpture'],
  ['moonlit-coast','Moonlit coast · night ocean']
];

function camera(position,target) {
  return {name:'Working view',position,target,projection:'perspective',zoom:1,fov:38};
}
function stage(project,name,background,surface,view){
  Object.assign(project,{name,background,surfaceColour:surface,camera:view,projection:'perspective',
    outputCamera:view,grid:false,light:'studio',lightPower:1.2,fillPower:.55,ambientPower:.42,environmentPower:.58});
}
function artwork(title,subtitle,background,ink,accent){
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=480;
  const g=canvas.getContext('2d');
  if(Array.isArray(background)){
    const foil=g.createLinearGradient(110,0,840,480);
    background.forEach((colour,i)=>foil.addColorStop(i/(background.length-1),colour));
    g.fillStyle=foil;
  }else g.fillStyle=background;
  g.fillRect(0,0,960,480);
  g.fillStyle=ink;g.font='bold 92px Segoe UI';g.fillText(title,56,123,846);
  g.font='22px Segoe UI';g.fillText(subtitle,61,167,820);
  g.strokeStyle=accent;g.lineWidth=4;
  for(let row=0;row<9;row++){
    g.beginPath();
    for(let x=45;x<=915;x+=5){
      const y=235+row*23+Math.sin(x*.015+row*.3)*25;
      if(x===45)g.moveTo(x,y);else g.lineTo(x,y);
    }
    g.stroke();
  }
  g.strokeStyle=ink;g.lineWidth=2;g.strokeRect(24,24,912,432);
  return canvas.toDataURL('image/png');
}
function ellipse(width,height) {
  return '<svg xmlns="http://www.w3.org/2000/svg"><ellipse cx="'+width/2+'" cy="'+height/2+'" rx="'+width/2+'" ry="'+height/2+'"/></svg>';
}
export function study(key,{fresh,object,letteringRatio}){
  const p=fresh();
  if(key==='shadow-relay'){
    stage(p,'Shadow Relay','#182a33','#314851',camera([248,154,365],[0,51,0]));
    p.objects=[
      object('box',{name:'Graphite plinth',width:220,height:7,depth:70,y:3.5,colour:'#304850'}),
      object('text',{name:'Cast lettering',text:'ECHO',width:158,height:55,depth:7,y:42,z:6,bevel:.55,colour:'#d6a45f'}),
      object('cylinder',{name:'Left riser',width:8,height:38,y:24,x:-64,z:6,colour:'#d6a45f'}),
      object('cylinder',{name:'Right riser',width:8,height:38,y:24,x:64,z:6,colour:'#d6a45f'}),
      object('sphere',{name:'Ceramic accent',width:22,height:22,depth:22,x:-92,y:19,z:14,colour:'#679397'}),
      object('torus',{name:'Offset ring',width:27,height:27,depth:5,x:91,y:32,z:-12,rx:20,ry:26,colour:'#a66e50'})
    ];
    p.shadowLab={x:0,y:.08,distance:4,lights:[
      {name:'Read the silhouette',x:0,y:.08,distance:4},
      {name:'Long diagonal',x:1.05,y:.75,distance:1.6}
    ]};
  }else if(key==='signal-pavilion'){
    const view=camera([175,143,364],[0,65,0]);
    stage(p,'Signal Pavilion','#172731','#39505a',view);
    const gold=artwork('SIGNAL','PAVILION / FOLD AND LIGHT','#ecd1a0','#253f46','#b46342');
    const cyan=artwork('SIGNAL','PAVILION / NIGHT EDITION','#183f4b','#e1e8d6','#68b6be');
    p.objects=[
      object('sheet',{name:'Pleated signal wall',width:240,height:120,depth:.1,y:10,texture:gold,
        sheet:{finish:'paper',crease:{panels:8,angle:32}},callouts:[{point:[45,55,0],uv:[.73,.47],text:'Score and fold'}]}),
      object('box',{name:'Display foot',width:226,height:10,depth:52,y:5,colour:'#273e48'}),
      object('box',{name:'Brass inlay',width:222,height:1.5,depth:3,y:7,z:26,colour:'#d5a15e',finish:'metal'})
    ];
    p.variants=[captureLook(p,'Paper gold')];
    const night=captureLook(p,'Night cyan');
    night.background='#101c2c';night.light='neon';night.objects[0].texture=cyan;
    p.variants.push(night);
    p.projectorCamera=view;
    p.rehearsal={enabled:false,artwork:cyan,mix:0,power:2.2,cues:[
      {name:'Alignment grid',mix:0,power:2.2,tint:'#fff1d5'},
      {name:'Cyan artwork',mix:1,power:3,tint:'#bce9f2'}
    ]};
    p.cameras=[view,camera([0,74,380],[0,65,0]),camera([140,105,233],[35,76,0])].map((view,i)=>({...view,name:['Pavilion','Front elevation','Fold detail'][i]}));
  }else if(key==='paper-delta'){
    stage(p,'Delta · paper prism','#234249','#426563',camera([153,110,212],[0,25,8]));
    const width=52,height=width*Math.sqrt(3)/2,length=85;
    const print=artwork('DELTA','PAPER / SCORE / ASSEMBLE','#edc884','#2a4345','#c06a45');
    const group=crypto.randomUUID();
    const proofs=[-1,1].map(side=>{
      const u=new T.Vector3(0,0,-side),v=new T.Vector3(-side*.5,Math.sqrt(3)/2,0),n=u.clone().cross(v);
      const rotation=new T.Euler().setFromRotationMatrix(new T.Matrix4().makeBasis(u,v,n));
      return object('image',{name:side===1?'Right print face':'Left print face',texture:print,singleSided:true,
        group,width:78,height:46,depth:.1,x:side*13-v.x*23+n.x*.15,y:8+height/2-v.y*23+n.y*.15,z:0,
        rx:T.MathUtils.radToDeg(rotation.x),ry:T.MathUtils.radToDeg(rotation.y),rz:T.MathUtils.radToDeg(rotation.z)});
    });
    p.objects=[
      object('svg',{name:'Delta prism · A4 kit',svg:'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 '+height+' L52 '+height+' L26 0 Z"/></svg>',
        width,height,depth:length,bevel:0,y:8,colour:'#e2be78',edge:'#c69557',
        group,paperKit:{type:'prism',width,height:length,depth:35},texture:print,printOnlyArtwork:true}),
      ...proofs,
      object('box',{name:'Slate presentation base',width:132,height:8,depth:114,y:4,colour:'#30474a'}),
      object('text',{name:'Edition plate',text:'DELTA',width:43,height:11,depth:1.5,x:-37,y:8,z:49,rx:-90,colour:'#f0d9a9'})
    ];
  }else if(key==='strata-relief'){
    stage(p,'Strata · layered sculpture','#24323b','#4c5d64',camera([185,146,250],[0,38,0]));
    const palette=['#c4a577','#d6b88d','#e7c9a0','#af7c63','#825f60','#527478','#789a91','#9cb5a2','#c7c6a8'];
    const group=crypto.randomUUID();
    p.objects=palette.map((colour,index)=>{
      const width=174-7.5*index,height=111-6.5*index;
      return object('svg',{name:'Stratum '+String(index+1).padStart(2,'0'),group,groupName:'Strata stack',
        svg:ellipse(width,height),width,height,depth:7,bevel:0,rx:-90,
        x:index*2.3,y:3.5+7*index,z:height/2-index*.7,colour,edge:colour});
    });
    p.objects.push(object('capsule',{name:'Solid for new slices · show to use',width:154,height:67,depth:98,y:33.5,colour:'#bda27e',visible:false}));
  }else if(key==='viewpoint-offset'){
    const view=camera([161,112,345],[0,72,0]);
    stage(p,'Offset · perspective lettering','#26363f','#405660',view);
    const {objects,group}=alignedLetters('OFFSET',view,208,146,{object,letteringRatio});
    p.objects=objects;
    p.alignment={group,camera:view};
    p.cameras=[{...view,name:'Read OFFSET'},camera([342,151,70],[0,64,-60])].map((view,i)=>({...view,name:i?'See the depth':'Read OFFSET'}));
  }else if(key==='ocean-breakwater'||key==='moonlit-coast'){
    const view=camera([163,77,263],[0,19,0]);
    const night=key==='moonlit-coast';
    stage(p,night?'Moonlit coast · night ocean':'Breakwater · ocean stage','#17333e','#23444d',view);
    p.duration=12;p.animationMode='objects';p.floor=false;
    p.waterStage={enabled:true,style:'natural',level:-12,units:38,extent:9000,amplitude:.42,scale:1.65,
      skyMode:night?'night':'day',moonElevation:5,moonAzimuth:-19,foam:night?.10:.24,choppy:.38,sunElevation:12,sunAzimuth:-26,water:'#123c4f',horizon:'#dca57a',sky:'#263d64',light:'#ffd59e'};
    p.objects=[
      object('box',{name:'Lower breakwater',width:132,height:17,depth:74,y:-4,colour:'#344d55'}),
      object('box',{name:'Raised concrete deck',width:94,height:7,depth:51,y:13,colour:'#8b8c7d'}),
      object('cylinder',{name:'Beacon tower',width:18,height:37,depth:18,x:-18,y:20,colour:'#e1d7b6'}),
      object('cylinder',{name:'Red band',width:18.5,height:7,depth:18.5,x:-18,y:39,colour:'#a84c40'}),
      object('cylinder',{name:'Lamp housing',width:22,height:10,depth:22,x:-18,y:57,colour:'#e1a563',emission:.65}),
      object('cone',{name:'Beacon cap',width:27,height:10,depth:27,x:-18,y:67,colour:'#aa5649'}),
      object('box',{name:'Landing step',width:24,height:7,depth:21,x:46,y:13,z:26,colour:'#657980'})
    ];
  }else if(key==='prism-poster'){
    stage(p,'Prism · crumpled holographic poster','#242031','#2b2739',camera([142,134,355],[0,81,0]));
    p.floor=false;p.animationMode='objects';p.duration=8;
    p.keyColour='#ffe4bd';p.fillColour='#aebaff';p.rimColour='#eac5ff';p.rimPower=1.45;
    const image=artwork('PRISM','CRUMPLED FOIL / FIELD NOTES',['#6150bb','#72cce2','#96e9c3','#f6db93','#f2a5d2','#8267d9','#64c6dc'],'#272149','#4c387b');
    p.objects=[object('sheet',{name:'Prism poster · editable crumple',width:188,height:161,depth:.1,y:0,texture:image,
      sheet:{finish:'holo',pins:'none',creaseDetail:.85,bend:8,drape:8,fold:12,curl:-7,wind:8,
        iridescence:1,film:390,clearcoat:.92,metalness:.48,roughness:.19,
        marks:[{u:.16,v:.81,amount:17,radius:.17},{u:.38,v:.72,amount:-22,radius:.14},
          {u:.66,v:.89,amount:16,radius:.14},{u:.83,v:.6,amount:-20,radius:.18},
          {u:.24,v:.4,amount:-13,radius:.18},{u:.53,v:.42,amount:23,radius:.14},
          {u:.75,v:.22,amount:17,radius:.16},{u:.37,v:.12,amount:-16,radius:.13}]}})];
  }else if(key==='afterimage-mapping'){
    const view=camera([25,107,465],[0,62,0]);
    stage(p,'Afterimage · projection mapping','#111d2a','#27363e',view);
    p.animationMode='objects';p.duration=8;
    const colours=[['#d6a363','#233c44','#a15e4c'],['#28515e','#f0d6a4','#73b8b7'],['#873d53','#f4dfb0','#db8491']];
    const names=['Left · Amber','Centre · Tide','Right · Plum'];
    p.objects=names.map((name,index)=>object('image',{name,width:index===1?116:93,height:102,depth:.1,
      x:(index-1)*113,y:63,z:index===1?-5:5,ry:index===1?0:(1-index)*12,
      motion:'float',motionAmount:7,motionCycles:1,motionPhase:index/3,
      texture:artwork(['AMBER','TIDE','PLUM'][index],'AFTERIMAGE / PANEL '+(index+1),...colours[index])}));
    p.objects.push(object('box',{name:'Stage riser',width:344,height:9,depth:74,y:4.5,colour:'#263640'}));
    p.projectorCamera=view;
    p.surfaces=[
      {id:'amber',name:'Amber panel',source:p.objects[0].id,enabled:true,quad:[[.04,.29],[.30,.19],[.30,.78],[.04,.70]]},
      {id:'tide',name:'Tide panel',source:p.objects[1].id,enabled:true,quad:[[.33,.16],[.67,.16],[.67,.80],[.33,.80]]},
      {id:'plum',name:'Plum panel',source:p.objects[2].id,enabled:true,quad:[[.70,.19],[.96,.29],[.96,.70],[.70,.78]]}
    ];
  }else if(key==='kinetic-orbit'){
    stage(p,'Kinetic Orbit · animated sculpture','#090f21','#20294b',camera([180,160,435],[0,100,0]));
    p.floor=false;p.animationMode='objects';p.duration=10;p.bloom=.24;
    p.backdropMode='gradient';p.backdropSecond='#24203f';
    p.objects=[
      object('torus',{name:'Copper orbit',width:192,height:192,depth:7,y:0,rx:0,colour:'#fb9467',
        finish:'metal',emission:.5,emissionColour:'#ff6c4f',motion:'spin',motionAxis:'y',motionCycles:1}),
      object('torus',{name:'Violet orbit',width:98,height:98,depth:8,y:47,rx:0,colour:'#b58bff',
        finish:'iridescent',emission:.55,emissionColour:'#a377ff',motion:'spin',motionAxis:'y',motionCycles:2,motionPhase:.25}),
      object('sphere',{name:'Pearlescent core',width:32,height:32,depth:32,y:73,colour:'#83e3dc',
        finish:'iridescent',motion:'float',motionAmount:13,motionCycles:2}),
      object('sphere',{name:'Orbiting bead',width:11,height:11,depth:11,y:80,colour:'#fff0c5',
        emission:2,emissionColour:'#ffd58b',motion:'orbit',motionAmount:125,motionCycles:1})
    ];
  }else throw Error('Choose a Workshop study.');
  return p;
}
