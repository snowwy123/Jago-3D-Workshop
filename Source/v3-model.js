const n=(v,d,a,b)=>Number.isFinite(+v)?Math.max(a,Math.min(b,+v)):d;
const hex=(v,d)=>/^#[\da-f]{6}$/i.test(v)?v:d;
export function normaliseV3(p){
 p.workingFov=n(p.workingFov,38,10,140);p.lensDistortion=n(p.lensDistortion,0,0,.3);p.bloom=n(p.bloom,0,0,2);p.bloomRadius=n(p.bloomRadius,.35,0,1);
 const camera=c=>c&&['position','target'].every(k=>Array.isArray(c[k])&&c[k].length===3&&c[k].every(v=>Number.isFinite(v)&&Math.abs(v)<10000))?{position:c.position.slice(),target:c.target.slice(),zoom:n(c.zoom,1,.1,10),projection:c.projection==='perspective'?'perspective':'orthographic',fov:n(c.fov,38,10,140)}:null;
 p.outputCamera=camera(p.outputCamera);p.cameraEnd=camera(p.cameraEnd);p.cameraTravel=!!p.cameraTravel;p.cameraEase=p.cameraEase!=='linear'?'smooth':'linear';
 for(const o of p.objects){
  if(o.type==='solid'){if(!Array.isArray(o.vertices)||!Array.isArray(o.triangles)||o.vertices.length%3||o.triangles.length%3||o.vertices.length>450000||o.triangles.length>450000||!o.vertices.length||!o.triangles.length||o.vertices.some(v=>!Number.isFinite(v)||Math.abs(v)>10000)||o.triangles.some(v=>!Number.isInteger(v)||v<0||v>=o.vertices.length/3))throw Error('Invalid combined mesh.');if(!o.solidRecipe||!['union','difference','intersection'].includes(o.solidRecipe.operation)||!Array.isArray(o.solidRecipe.sources)||o.solidRecipe.sources.length>64)throw Error('Invalid solid recipe.');o.solidRecipe.sources=o.solidRecipe.sources.map(String);}o.group=String(o.group||'').slice(0,80);o.groupName=String(o.groupName||'Group').slice(0,80);
  o.toonSteps=Math.round(n(o.toonSteps,4,2,8));o.toonShadow=n(o.toonShadow,.16,0,.7);o.lineAngle=n(o.lineAngle,25,1,89);
  o.emission=n(o.emission,0,0,8);o.emissionColour=hex(o.emissionColour,o.colour);o.pulseWidth=n(o.pulseWidth,.15,.02,.9);
  o.pattern=['none','stripes','checker','rings','grid'].includes(o.pattern)?o.pattern:'none';o.patternColour=hex(o.patternColour,'#183b3f');o.imageRepeat=n(o.imageRepeat,1,.1,32);o.patternScale=n(o.patternScale,20,1,200);
  o.flowAxis=['x','y','z'].includes(o.flowAxis)?o.flowAxis:'y';o.flowTurns=n(o.flowTurns,1,-8,8);o.emissionMode=['steady','breathe','travel'].includes(o.emissionMode)?o.emissionMode:'steady';
  o.motionCycles=n(o.motionCycles,1,0,8);o.motionAxis=['x','y','z'].includes(o.motionAxis)?o.motionAxis:'y';o.motionEase=['sine','triangle','hold'].includes(o.motionEase)?o.motionEase:'sine';
  o.roundEnabled=o.roundEnabled!==false;o.repeatEnabled=o.repeatEnabled!==false;o.thickenEnabled=o.thickenEnabled!==false;
  if(o.outlineContours){
    if(!Array.isArray(o.outlineContours)||!o.outlineContours.length||o.outlineContours.length>16)throw Error('Use 1–16 outline contours.');
    o.outlineContours=o.outlineContours.map((c,i)=>{
      if(!Array.isArray(c?.points)||c.points.length<3||c.points.length>160)throw Error('Use 3–160 points per contour.');
      return {operation:i&&c.operation==='subtract'?'subtract':'add',points:c.points.map(q=>[n(q?.[0],0,0,180),n(q?.[1],0,0,120)])};
    });
  }
  if(o.outlineHoles){if(!Array.isArray(o.outlineHoles)||o.outlineHoles.length>8)throw Error('Use up to eight holes.');o.outlineHoles=o.outlineHoles.map(ring=>{if(!Array.isArray(ring)||ring.length<3||ring.length>160)throw Error('Use 3–160 points per hole.');return ring.map(q=>[n(q?.[0],0,0,180),n(q?.[1],0,0,120)]);});}o.outlineSmooth=!!o.outlineSmooth;if(o.outline){if(!Array.isArray(o.outline)||o.outline.length<3||o.outline.length>160)throw Error('Use 3–160 outline points.');o.outline=o.outline.map(q=>[n(q?.[0],0,0,180),n(q?.[1],0,0,120)]);}
 }
 return p;
}
export function cameraAt(a,b,t,ease='smooth'){
 t=Math.max(0,Math.min(1,t));if(ease==='smooth')t=t*t*(3-2*t);
 return {...a,position:a.position.map((v,i)=>v+(b.position[i]-v)*t),target:a.target.map((v,i)=>v+(b.target[i]-v)*t),zoom:a.zoom+(b.zoom-a.zoom)*t,fov:(a.fov||38)+((b.fov||38)-(a.fov||38))*t};
}
