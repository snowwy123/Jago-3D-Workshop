// SPDX-License-Identifier: MIT
const mm=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:min));
const round=value=>Number(value.toFixed(3));
const pointKey=point=>point.map(round).join(',');
const edgeKey=(a,b)=>[pointKey(a),pointKey(b)].sort().join('|');
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const line=(a,b)=>'M'+pointKey(a)+'L'+pointKey(b);
const polygon=points=>'M'+points.map(pointKey).join('L')+'Z';

export function paperKit(type,width,height,depth,artwork=null) {
  const w=mm(width,15,80), h=mm(height,15,160), d=mm(depth,15,80), margin=14;
  const faces=[];
  const face=(name,points,tabs=[])=>faces.push({name,points,tabs});
  const prismSides=type==='hexagon'?6:type==='prism'?3:0;
  if(prismSides){
    const rise=w*Math.sqrt(3)*(prismSides===6?1:.5);
    const x=margin+(prismSides===6?w/2:0), y=margin+rise;
    for(let i=0;i<prismSides;i++)face('Side '+(i+1),rect(x+i*w,y,w,h),i===prismSides-1?[1]:[]);
    function end(start,second,angle) {
      const points=[start,second];
      for(let i=1;i<prismSides-1;i++){
        const a=angle+i*2*Math.PI/prismSides, prior=points.at(-1);
        points.push([prior[0]+Math.cos(a)*w,prior[1]+Math.sin(a)*w]);
      }
      return points;
    }
    const tabs=Array.from({length:prismSides-1},(_,i)=>i+1);
    face('End A',end([x+w,y],[x,y],Math.PI),tabs);
    face('End B',end([x,y+h],[x+w,y+h],0),tabs);
  } else if(type==='pyramid'){
    const slope=Math.hypot(h,w/2), x=margin+slope, y=margin+slope;
    const base=rect(x,y,w,w);
    face('Base',base);
    base.forEach((a,index)=>{
      const b=base[(index+1)%4];
      const tip=[(a[0]+b[0])/2+(b[1]-a[1])/w*slope,(a[1]+b[1])/2-(b[0]-a[0])/w*slope];
      face('Face '+(index+1),[b,a,tip],[1]);
    });
  } else {
    const x=margin+d,y=margin+d;
    face('Front',rect(x,y,w,h));
    face('Left',rect(margin,y,d,h));
    face('Right',rect(x+w,y,d,h));
    face('Back',rect(x+w+d,y,w,h),[1]);
    face('Top',rect(x,margin,w,d),[0,1,3]);
    face('Bottom',rect(x,y+h,w,d),[1,2,3]);
  }
  const edges=new Map(), labels=[];
  for(const {points,name,tabs} of faces){
    const x=points.reduce((sum,p)=>sum+p[0],0)/points.length;
    const y=points.reduce((sum,p)=>sum+p[1],0)/points.length;
    labels.push('<text x="'+round(x)+'" y="'+round(y)+'">'+name+'</text>');
    points.forEach((a,i)=>{
      const b=points[(i+1)%points.length], key=edgeKey(a,b);
      const prior=edges.get(key);
      if(prior)prior.fold=true;
      else edges.set(key,{a,b,tab:tabs.includes(i)});
    });
  }
  const joins=[];
  if(prismSides){
    joins.push(['Side '+prismSides,1,'Side 1',3]);
    for(let index=1;index<prismSides;index++){
      joins.push(['End A',index,'Side '+(prismSides+1-index),0]);
      joins.push(['End B',index,'Side '+(index+1),2]);
    }
  }else if(type==='pyramid'){
    for(let index=1;index<=4;index++)joins.push(['Face '+index,1,'Face '+(index===1?4:index-1),2]);
  }else{
    joins.push(['Back',1,'Left',3],['Top',0,'Back',0],['Top',1,'Right',0],['Top',3,'Left',0],
      ['Bottom',2,'Back',2],['Bottom',1,'Right',2],['Bottom',3,'Left',2]);
  }
  const labelsByEdge=new Map();
  joins.forEach(([name,edge,receiving,other],index)=>{
    for(const [faceName,side] of [[name,edge],[receiving,other]]) {
      const {points}=faces.find(face=>face.name===faceName);
      labelsByEdge.set(edgeKey(points[side],points[(side+1)%points.length]),index+1);
    }
  });
  const cuts=[],scores=[], limit=[0,0];
  const track=points=>points.forEach(([x,y])=>{limit[0]=Math.max(x,limit[0]);limit[1]=Math.max(y,limit[1]);});
  for(const [key,{a,b,tab,fold}] of edges){
    track([a,b]);
    if(fold||tab)scores.push(line(a,b));
    if(fold)continue;
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
    const join=labelsByEdge.get(key);
    if(!tab){
      cuts.push(line(a,b));
      if(join)labels.push('<text x="'+round((a[0]+b[0])/2-dy/length*3.8)+'" y="'+round((a[1]+b[1])/2+dx/length*3.8)+'">'+join+'</text>');
      continue;
    }
    const outward=Math.min(7,length*.22);
    const c=[a[0]+dx*.16+dy/length*outward,a[1]+dy*.16-dx/length*outward];
    const e=[b[0]-dx*.16+dy/length*outward,b[1]-dy*.16-dx/length*outward];
    track([c,e]);
    cuts.push('M'+[a,c,e,b].map(pointKey).join('L'));
    labels.push('<text x="'+round((c[0]+e[0]+a[0]+b[0])/4)+'" y="'+round((c[1]+e[1]+a[1]+b[1])/4)+'">GLUE '+(join||'')+'</text>');
  }
  const page=limit[0]<=199&&limit[1]<=267?[210,297]:limit[0]<=286&&limit[1]<=180?[297,210]:null;
  if(!page)throw Error('This net will not fit on one A4 page. Reduce the dimensions.');
  const [pageWidth,pageHeight]=page;
  let printLayer='';
  if(artwork&&typeof artwork.data==='string'&&artwork.data.length<=2_000_000&&
     /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(artwork.data)&&Number.isFinite(artwork.aspect)&&artwork.aspect>0){
    const defs=[], facesWithArt=[];
    faces.forEach(({points},index)=>{
      const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
      const x=Math.min(...xs),y=Math.min(...ys),width=Math.max(...xs)-x,height=Math.max(...ys)-y;
      const scale=Math.max(width/artwork.aspect,height);
      defs.push('<clipPath id="face-'+index+'"><path d="'+polygon(points)+'"/></clipPath>');
      facesWithArt.push('<g clip-path="url(#face-'+index+')"><use href="#face-art" transform="translate('+
        round(x+(width-scale*artwork.aspect)/2)+' '+round(y+(height-scale)/2)+') scale('+round(scale)+')"/></g>');
    });
    printLayer='<defs><image id="face-art" width="'+artwork.aspect+'" height="1" href="'+artwork.data+'"/>'+defs.join('')+
      '</defs><g id="print-artwork">'+facesWithArt.join('')+'</g>';
  }
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+pageWidth+'mm" height="'+pageHeight+'mm" viewBox="0 0 '+pageWidth+' '+pageHeight+'">'+printLayer+
    '<g id="cut" fill="none" stroke="#243a40" stroke-width=".3"><path d="'+cuts.join(' ')+'"/></g>'+
    '<g id="score" fill="none" stroke="#256f91" stroke-width=".25" stroke-dasharray="2 1"><path d="'+scores.join(' ')+'"/></g>'+
    '<g id="assembly-labels" text-anchor="middle" dominant-baseline="middle" fill="#26383e" stroke="#fff" stroke-width=".55" paint-order="stroke" font-size="3.2" font-family="sans-serif">'+labels.join('')+'</g>'+
    '<text x="10" y="'+(pageHeight-10)+'" fill="#243a40" font-family="sans-serif" font-size="3.4">Print at 100%. Cut solid lines, score dashed lines, glue matching numbers inside.</text></svg>';
  return {svg,width:w,height:h,depth:d,type};
}

function contours(triangles,level){
  const segments=[];
  for (const points of triangles) {
    const crossings=[];
    for(let i=0;i<3;i++){
      const a=points[i],b=points[(i+1)%3];
      if((a[1]<=level)===(b[1]<=level))continue;
      const t=(level-a[1])/(b[1]-a[1]);
      crossings.push([a[0]+(b[0]-a[0])*t,a[2]+(b[2]-a[2])*t]);
    }
    if(crossings.length===2 && pointKey(crossings[0])!==pointKey(crossings[1]))segments.push(crossings);
  }
  const neighbors=new Map();
  segments.forEach((segment,i)=>segment.forEach((point,end)=>{
    const key=pointKey(point);
    if(!neighbors.has(key))neighbors.set(key,[]);
    neighbors.get(key).push([i,end]);
  }));
  if([...neighbors.values()].some(edges=>edges.length!==2))throw Error('A slice has open or intersecting edges. Choose a closed solid with separate, non-overlapping shells.');
  const used=new Set(), loops=[];
  for(let i=0;i<segments.length;i++){
    if(used.has(i))continue;
    const start=pointKey(segments[i][0]), points=[segments[i][0]];
    let index=i, end=1;
    while(!used.has(index)){
      used.add(index);
      const next=segments[index][end], key=pointKey(next);
      if(key===start)break;
      points.push(next);
      const connection=neighbors.get(key).find(([id])=>!used.has(id));
      if(!connection)throw Error('A layer could not form a closed outline.');
      [index,end]=connection;
      end=1-end;
    }
    if(points.length>=3)loops.push(points);
  }
  return loops;
}
function fitsHole(loops,x,y,radius) {
  let inside=false;
  for(const loop of loops)for(let i=0;i<loop.length;i++){
    const [a,b]=loop[i], [c,d]=loop[(i+1)%loop.length];
    if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;
    const length=(c-a)**2+(d-b)**2;
    const t=length?Math.max(0,Math.min(1,((x-a)*(c-a)+(y-b)*(d-b))/length)):0;
    if(Math.hypot(x-a-(c-a)*t,y-b-(d-b)*t)<radius+.5)return false;
  }
  return inside;
}

export function stackedLayers(triangles,bounds,thickness,registration){
  const step=mm(thickness,1,40), height=bounds.max[1]-bounds.min[1];
  const count=Math.ceil(height/step-1e-8);
  if(count<1||count>24)throw Error('Choose a thickness that gives 1–24 layers.');
  const layers=Array.from({length:count},(_,index)=>{
    const bottom=bounds.min[1]+index*step;
    const level=(bottom+Math.min(bottom+step,bounds.max[1]))/2;
    const loops=contours(triangles,level);
    if(!loops.length)throw Error('One layer is empty. Choose a continuous solid or a different thickness.');
    return {index,bottom,loops};
  });
  const holes=[];
  if(registration) {
    const [x,,z]=bounds.min,[maxX,,maxZ]=bounds.max;
    for(const ratio of [.28,.72]){
      const centre=[x+(maxX-x)*ratio,(z+maxZ)/2],radius=1.5;
      if(layers.every(layer=>fitsHole(layer.loops,...centre,radius)))holes.push({centre,radius});
    }
  }
  return {layers,holes,step,bounds};
}

export function layerPath(layer,holes,origin){
  const [x,z]=origin;
  let path=layer.loops.map(loop=>polygon(loop.map(([a,b])=>[a-x,b-z]))).join(' ');
  for(const {centre:[a,b],radius:r} of holes){
    const left=round(a-x-r), right=round(a-x+r), y=round(b-z);
    path+=' M'+left+','+y+' A'+r+','+r+' 0 1 0 '+right+','+y+' A'+r+','+r+' 0 1 0 '+left+','+y+' Z';
  }
  return path;
}
