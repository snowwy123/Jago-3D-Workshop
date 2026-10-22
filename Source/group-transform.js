import * as T from 'three';
export function companionPose(before,after,part,mode){
 const result=structuredClone(part),pivot=new T.Vector3(before.x,before.y,before.z),next=new T.Vector3(after.x,after.y,after.z),position=new T.Vector3(part.x,part.y,part.z).sub(pivot);
 const q=o=>new T.Quaternion().setFromEuler(new T.Euler(...[o.rx,o.ry,o.rz].map(T.MathUtils.degToRad)));
 if(mode==='rotate'){const delta=q(after).multiply(q(before).invert());position.applyQuaternion(delta);const rotation=new T.Euler().setFromQuaternion(delta.multiply(q(part)));[result.rx,result.ry,result.rz]=[rotation.x,rotation.y,rotation.z].map(T.MathUtils.radToDeg);}
 if(mode==='scale'){const ratios=['sx','sy','sz'].map(k=>(after[k]||1)/(before[k]||1));position.multiply(new T.Vector3(...ratios));for(const [i,k]of ['sx','sy','sz'].entries())result[k]=Math.max(.05,Math.min(10,(part[k]||1)*ratios[i]));}
 position.add(next);[result.x,result.y,result.z]=position.toArray();return result;
}
