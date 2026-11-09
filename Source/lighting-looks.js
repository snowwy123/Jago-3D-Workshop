// SPDX-License-Identifier: MIT
export const lightingLooks=[
  {name:'Softbox porcelain',group:'Product & material',description:'Pale studio gradient and broad, cool light.',stage:['#e8e5df','#b5c5ca','#d4d8d8'],light:['studio','#fff2db','#d3eaff','#eef9ff',1.5,.85,.65,1.3],style:'solid',finish:'ceramic'},
  {name:'Gallery raking light',group:'Product & material',description:'Warm side light for relief, leather and etched details.',stage:['#3a2b26','#998067','#56443b'],light:['dramatic','#ffd2a0','#b4aeb6','#ffba7c',1.6,.32,1,.65],style:'solid',angle:-64,elevation:19},
  {name:'Moonlit chrome',group:'Product & material',description:'Steel reflections with a cool edge and warm key.',stage:['#101b28','#354553','#273745'],light:['dramatic','#e6efff','#83b9ec','#ffc694',1.35,.48,1.6,1.8],style:'solid',finish:'metal'},
  {name:'Risograph duo',group:'Graphic & editorial',description:'Ochre and petrol blocks with a poster-like finish.',stage:['#eee0bc','#ccac80','#d8c19a'],light:['flat','#fff2d6','#e7d3b8','#fff1dc',1.2,.7,.45,.6],style:'toon',line:'#2f444a',palette:['#28716f','#bb5942','#d5a052']},
  {name:'Graphite study',group:'Graphic & editorial',description:'Neutral shapes with graphite hatching and a paper backdrop.',stage:['#e5e0d5','#bfb8ab','#d5cec0'],light:['flat','#fff4df','#ddd7cd','#ede6d9',1.1,.8,.5,.65],style:'hatch',line:'#3b4547',palette:['#b8b3a9','#8a9091','#d1c6b2']},
  {name:'Amber stage',group:'Stage & atmosphere',description:'Warm key and deep slate shadows.',stage:['#141b24','#51382e','#292629'],light:['dramatic','#ffd09d','#788ea8','#ff9e5a',1.55,.32,1.25,.7],style:'solid',angle:-45,elevation:31},
  {name:'Ultraviolet edge',group:'Stage & atmosphere',description:'Cool blue key and violet rim on a dark stage.',stage:['#131329','#363353','#23233d'],light:['neon','#a6ceff','#a888fa','#eeaaff',1.2,.38,1.9,.85],style:'solid'},
  {name:'Quiet silhouette',group:'Graphic & editorial',description:'Graphic shapes and a warm neutral field.',stage:['#f1e1c6','#c9a69c','#e1cbb5'],light:['flat','#ffffff','#ffffff','#ffffff',1,.5,.5,.65],style:'silhouette',palette:['#213c45','#973f39','#466e6a'],floor:false}
];

export function applyLightingLook(project,look) {
  const [background,backdropSecond,surfaceColour]=look.stage;
  const [light,keyColour,fillColour,rimColour,lightPower,fillPower,rimPower,environmentPower]=look.light;
  Object.assign(project,{background,backdropSecond,surfaceColour,backdropMode:'gradient',floor:look.floor!==false,
    light,keyColour,fillColour,rimColour,lightPower,fillPower,rimPower,environmentPower,
    lightAngle:look.angle??-35,lightElevation:look.elevation??42,ambientPower:.58,exposure:1.05});
  project.objects.forEach((object,index)=>{
    if(object.locked||object.linkedSource||object.type==='sheet'||object.type==='image')return;
    object.renderStyle=object.texture||object.surfaceMaps?'solid':look.style;
    if(look.line)object.lineColour=look.line;
    if(object.texture||object.surfaceMaps)return;
    if(look.palette)object.colour=look.palette[index%look.palette.length];
    if(look.finish)object.finish=look.finish;
  });
}
