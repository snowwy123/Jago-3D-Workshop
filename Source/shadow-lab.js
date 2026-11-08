// SPDX-License-Identifier: MIT
const bounded=(value,fallback,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
function light(value={}){
  return {x:bounded(value.x,.25,-2,2),y:bounded(value.y,.65,-2,2),distance:bounded(value.distance,2,.5,5)};
}
export function normaliseShadow(value){
  value=value&&typeof value==='object'?value:{};
  const frame=value.frame;
  const validFrame=frame&&['min','max'].every(key=>Array.isArray(frame[key])&&frame[key].length===3&&frame[key].every(n=>Number.isFinite(n)&&Math.abs(n)<=20000))&&frame.max.every((n,i)=>n>=frame.min[i]);
  return {...light(value),frame:validFrame?{min:frame.min,max:frame.max}:null,opacity:bounded(value.opacity,.5,0,1),
    target:typeof value.target==='string'&&value.target.length<=2_000_000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.target)?value.target:null,
    lights:(Array.isArray(value.lights)?value.lights:[]).slice(0,8).filter(item=>item&&typeof item==='object')
      .map(item=>({...light(item),name:String(item.name||'Light').slice(0,60)}))};
}
export function drawShadow(canvas,geometry,settings,transparent=false){
  const {min,max}=settings.frame||geometry.bounds;
  const size=Math.max(10,...max.map((value,index)=>value-min[index]));
  const centre=[(min[0]+max[0])/2,(min[1]+max[1])/2];
  const light=[centre[0]+settings.x*size,centre[1]+settings.y*size,max[2]+settings.distance*size];
  const receiver=min[2]-size*.15;
  const scale=Math.min(canvas.width,canvas.height)/(size*2.5);
  const context=canvas.getContext('2d');
  context.clearRect(0,0,canvas.width,canvas.height);
  if(!transparent){
    context.fillStyle='#f3eada';
    context.fillRect(0,0,canvas.width,canvas.height);
  }
  const project=([x,y,z])=>{
    const t=(receiver-light[2])/(z-light[2]);
    return [canvas.width/2+(light[0]+(x-light[0])*t-centre[0])*scale,
      canvas.height/2-(light[1]+(y-light[1])*t-centre[1])*scale];
  };
  function clip(points,edge,keep) {
    const result=[];
    for(let i=0;i<points.length;i++){
      const a=points[i], b=points[(i+1)%points.length], inside=keep(a[2],edge), next=keep(b[2],edge);
      if(inside)result.push(a);
      if(inside!==next){
        const t=(edge-a[2])/(b[2]-a[2]);
        result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,edge]);
      }
    }
    return result;
  }
  context.beginPath();
  for(const triangle of geometry.triangles){
    let polygon=triangle;
    if(polygon.some(p=>p[2]<receiver))polygon=clip(polygon,receiver,(z,edge)=>z>=edge);
    const far=light[2]-size*.001;
    if(polygon.some(p=>p[2]>far))polygon=clip(polygon,far,(z,edge)=>z<=edge);
    if(polygon.length<3)continue;
    const points=polygon.map(project);
    let winding=0;
    points.forEach(([x,y],index)=>{
      const [nextX,nextY]=points[(index+1)%points.length];
      winding+=x*nextY-y*nextX;
    });
    if(Math.abs(winding)<.00001)continue;
    if(winding<0)points.reverse();
    context.moveTo(...points[0]);
    for(const point of points.slice(1))context.lineTo(...point);
    context.closePath();
  }
  context.fillStyle='#202b32';
  context.fill();
}
