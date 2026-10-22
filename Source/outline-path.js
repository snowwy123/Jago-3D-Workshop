import {outlineCheck} from './authoring.js';
export function authoredOutline(points,holes=[],smooth=false){
 const outer=outlineCheck(points);for(const hole of holes)outlineCheck(hole);
 const inside=(p,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const intersects=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1]));
 for(let h=0;h<holes.length;h++){const hole=holes[h];if(!hole.every(p=>inside(p,points)))throw Error('Keep every hole inside the outside outline.');for(const ring of [points,...holes.slice(0,h)]){if(ring!==points&&(inside(hole[0],ring)||inside(ring[0],hole)))throw Error('Keep holes separate.');for(let i=0;i<hole.length;i++)for(let j=0;j<ring.length;j++)if(intersects(hole[i],hole[(i+1)%hole.length],ring[j],ring[(j+1)%ring.length]))throw Error('A hole touches or crosses another outline.');}}
 const minX=Math.min(...points.map(p=>p[0])),maxY=Math.max(...points.map(p=>p[1]));
 function path(ring){const pts=ring.map(p=>[p[0]-minX,maxY-p[1]]);if(!smooth)return 'M'+pts.map(p=>p.join(',')).join(' L')+' Z';// Quadratic corner rounding stays within the polygon's local hull.
 const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];let d='M'+midpoint(pts.at(-1),pts[0]).join(',');for(let i=0;i<pts.length;i++)d+=' Q'+pts[i].join(',')+' '+midpoint(pts[i],pts[(i+1)%pts.length]).join(',');return d+' Z';}
 // Even-odd holes use opposite winding for SVGLoader's shape extraction.
 const area=ring=>ring.reduce((sum,p,i)=>sum+p[0]*ring[(i+1)%ring.length][1]-ring[(i+1)%ring.length][0]*p[1],0);
 const rings=[points,...holes.map(h=>area(h)*area(points)>0?h.slice().reverse():h)];
 return {...outer,svg:`<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="${rings.map(path).join(' ')}"/></svg>`};
}
