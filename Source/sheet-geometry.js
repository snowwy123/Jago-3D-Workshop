import * as T from 'three';
import {sheetSettings,sheetPoint} from './sheet-model.js';
export function sheetGeometry(o,time=0){const g=new T.PlaneGeometry(o.width,o.height,48,40);updateSheet(g,o,time);return g;}
export function updateSheet(g,o,time=0){const s=sheetSettings(o.sheet),signature=JSON.stringify([o.width,o.height,s,s.wind?time:0]);if(g.userData.sheetPose===signature)return;g.userData.sheetPose=signature;const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)p.setXYZ(i,...sheetPoint(uv.getX(i),uv.getY(i),o.width,o.height,s,time));p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();}
export function sheetMaterial(o,textures){const s=sheetSettings(o.sheet),p={color:o.texture?'#ffffff':o.colour,side:T.DoubleSide,roughness:s.roughness,metalness:s.metalness};
 if(s.finish==='foil'){p.metalness=.95;p.roughness=s.roughness;}
 if(s.finish==='leather'){p.roughness=Math.max(.4,s.roughness);}
 const m=new T.MeshPhysicalMaterial({...p,clearcoat:s.finish==='foil'||s.finish==='holo'?.65:0,iridescence:s.finish==='holo'?1:0,iridescenceIOR:1.35,iridescenceThicknessRange:[150,650],sheen:s.finish==='cloth'?.6:0});
 if(o.texture){m.map=textures.get(o.texture)||null;m.transparent=true;m.alphaTest=.03;}
 if(o.surfaceMaps){if(s.finish==='imported'){for(const [key,property]of [['roughness','roughnessMap'],['metallic','metalnessMap']])m[property]=textures.get('linear:'+o.surfaceMaps[key])||null;m.roughness=1;m.metalness=1;}m.normalMap=textures.get('linear:'+o.surfaceMaps.normal)||null;m.normalScale.set(s.relief,s.relief);}
 return m;
}
export function sheetTime(root,objects,turns){for(const o of objects)if(o.type==='sheet'){const group=root.children.find(g=>g.userData.id===o.id);if(group)for(const m of group.children)if(m.isMesh)updateSheet(m.geometry,o,turns);}}
