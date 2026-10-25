import {ownSurfaceTextures} from './surface-textures.js';
import {sampleBake,clothSignature} from './cloth.js';
import * as T from 'three';
import {sheetSettings,sheetPoint} from './sheet-model.js';
const bakeCache=new WeakMap();
export function sheetGeometry(o,time=0){const g=new T.PlaneGeometry(o.width,o.height,48,40);updateSheet(g,o,time);return g;}
export function updateSheet(g,o,time=0){const s=o.sheet||sheetSettings(),b=s.bake,valid=b&&b.signature===clothSignature(o),signature=JSON.stringify([o.width,o.height,{...s,bake:undefined},valid?b.signature:null,valid||s.wind?time:0]);if(g.userData.sheetPose===signature&&bakeCache.get(g)===b)return;g.userData.sheetPose=signature;bakeCache.set(g,b);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const u=uv.getX(i),v=uv.getY(i);p.setXYZ(i,...(valid?sampleBake(b,u,v,time):sheetPoint(u,v,o.width,o.height,s,time)));}p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();}
export function sheetMaterial(o,textures){const s=sheetSettings(o.sheet),p={color:o.texture?'#ffffff':o.colour,side:T.DoubleSide,roughness:s.roughness,metalness:s.metalness};
 if(s.finish==='foil'){p.metalness=.95;p.roughness=s.roughness;}
 if(s.finish==='leather'){p.roughness=Math.max(.4,s.roughness);}
 const m=new T.MeshPhysicalMaterial({...p,clearcoat:s.finish==='foil'||s.finish==='holo'?.65:0,iridescence:s.finish==='holo'?1:0,iridescenceIOR:1.35,iridescenceThicknessRange:[150,650],sheen:s.finish==='cloth'?.6:0});
 if(o.surfaceMaps)applySurfaceMaps(m,o,textures,{surface:s.finish==='imported',relief:s.relief});else if(o.texture){m.map=textures.get(o.texture)||null;m.transparent=true;m.alphaTest=.03;}
 return m;
}
export function sheetTime(root,objects,turns){for(const o of objects)if(o.type==='sheet'){const group=root.children.find(g=>g.userData.id===o.id);if(group)for(const m of group.children)if(m.isMesh)updateSheet(m.geometry,o,turns);}}

export function applySurfaceMaps(m,o,textures,{surface=true,relief=.6}={}){if(!o.surfaceMaps)return m;m.color?.set('#ffffff');const owned=[];for(const [property,key,data]of [['map',o.texture,false],['normalMap',o.surfaceMaps.normal,true],...(surface?[['roughnessMap',o.surfaceMaps.roughness,true],['metalnessMap',o.surfaceMaps.metallic,true]]:[])]){const original=textures.get((data?'linear:':'')+key);if(!original)continue;const t=original.clone();t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(o.imageRepeat||1,o.imageRepeat||1);t.needsUpdate=true;m[property]=t;owned.push(t);}m.normalScale?.set(relief,relief);if(surface){m.roughness=1;m.metalness=1;}m.transparent=true;m.alphaTest=.03;ownSurfaceTextures(m,owned,o.flowTurns||0);return m;}
