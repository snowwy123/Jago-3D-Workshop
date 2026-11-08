// SPDX-License-Identifier: MIT
import * as T from 'three';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';
import {sheetPoint} from './sheet-model.js';

export function addDecals(mesh, object, textures) {
  if (!object.decals?.length) return;
  const source = new T.Mesh(mesh.geometry);
  source.updateMatrixWorld(true);
  for (const decal of object.decals) {
    const map = textures.get(decal.texture);
    if (!map) continue;
    let point = new T.Vector3(...decal.point);
    let normal = new T.Vector3(...decal.normal).normalize();
    if (object.sheet && decal.uv) {
      const [u,v] = decal.uv;
      const sample = (u,v) => new T.Vector3(...sheetPoint(u,v,object.width,object.height,object.sheet));
      point = sample(u,v);
      const across = sample(u+.0001,v).sub(sample(u-.0001,v));
      const along = sample(u,v+.0001).sub(sample(u,v-.0001));
      const next = across.cross(along).normalize();
      normal = next.dot(normal) < 0 ? next.negate() : next;
    }
    const orientation = new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1), normal);
    orientation.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1), decal.angle * Math.PI/180));
    const rotation = new T.Euler().setFromQuaternion(orientation);
    const aspect = map.image.width / map.image.height;
    const size = new T.Vector3(decal.size, decal.size / aspect, Math.max(.25, decal.size*.12));
    const geometry = new DecalGeometry(source, point, rotation, size);
    const material = new T.MeshStandardMaterial({map, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, alphaTest:.02});
    const overlay = new T.Mesh(geometry,material);
    overlay.userData.decoration = true;
    overlay.userData.id = object.id;
    overlay.renderOrder = 2;
    mesh.add(overlay);
  }
}

export function projectedCallouts(project, groups, camera, width, height, respectEditorVisibility=false) {
  camera.updateMatrixWorld();
  const result = [];
  for (const object of project.objects) {
    const group = groups.get(object.id);
    if (!group || !object.visible || (respectEditorVisibility && !group.visible)) continue;
    group.updateWorldMatrix(true,false);
    for (const note of object.callouts || []) {
      const local = object.sheet && note.uv ?
        sheetPoint(...note.uv,object.width,object.height,object.sheet) : note.point;
      const point = new T.Vector3(...local).applyMatrix4(group.matrixWorld).project(camera);
      if (Math.abs(point.x)>1 || Math.abs(point.y)>1 || Math.abs(point.z)>1) continue;
      result.push({x:(point.x+1)*width/2,y:(1-point.y)*height/2,text:note.text});
    }
  }
  return result;
}
