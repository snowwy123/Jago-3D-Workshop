// SPDX-License-Identifier: MIT
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function readGLB(file, object) {
  if (file.size < 20 || file.size > 12_000_000) throw Error('Choose a GLB under 12 MB.');
  const bytes = await file.arrayBuffer();
  const header = new DataView(bytes);
  const jsonLength = header.getUint32(12, true);
  if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 ||
      header.getUint32(8, true) !== bytes.byteLength || header.getUint32(16, true) !== 0x4e4f534a ||
      jsonLength > bytes.byteLength - 20) throw Error('Choose a valid GLB 2.0 file.');
  const spec = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, jsonLength)));
  if ([...(spec.buffers || []), ...(spec.images || [])].some(entry => entry.uri !== undefined)) {
    throw Error('Embed all buffers and images inside the GLB.');
  }
  if (spec.skins?.length || spec.extensionsRequired?.length || spec.nodes?.some(node => node.extensions?.EXT_mesh_gpu_instancing)) {
    throw Error('Use a static GLB with standard, uncompressed meshes.');
  }
  if ((spec.nodes?.length || 0) > 512 || (spec.accessors || []).reduce((total,a)=>total+(a.count||0),0)>2_000_000 || (spec.accessors || []).some(a => !Number.isInteger(a.count) || a.count < 0 || a.count > 450000)) {
    throw Error('This GLB exceeds the preview import limits.');
  }
  const result = await new GLTFLoader().parseAsync(bytes, '');
  const geometries = new Set(), materials = new Set(), textures = new Set();
  try {
    result.scene.updateMatrixWorld(true);
    const parts = [];
    let triangleCount = 0;
    const allBounds = new T.Box3();
    result.scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(m);
        for (const value of Object.values(m)) if (value?.isTexture) textures.add(value);
      }
    });
    result.scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      if (mesh.isInstancedMesh || Array.isArray(mesh.material)) throw Error('Export each material as a separate mesh primitive.');
      const position = mesh.geometry.getAttribute('position');
      const uv = mesh.geometry.getAttribute('uv');
      const index = mesh.geometry.index;
      const count = index?.count || position.count;
      triangleCount += count / 3;
      if (triangleCount > 100000 || parts.length >= 32 || count % 3) throw Error('Use up to 32 mesh parts and 100,000 triangles.');
      const bounds = new T.Box3();
      const vertices = [];
      for (let i = 0; i < position.count; i++) {
        const point = new T.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
        if (!point.toArray().every(Number.isFinite)) throw Error('GLB contains an invalid position.');
        bounds.expandByPoint(point);
        vertices.push(...point.toArray());
      }
      const triangles = Array.from({length: count}, (_, i) => index ? index.getX(i) : i);
      if (mesh.matrixWorld.determinant() < 0) {
        for (let i = 0; i < triangles.length; i += 3) [triangles[i+1], triangles[i+2]] = [triangles[i+2], triangles[i+1]];
      }
      const material = mesh.material;
      let texture = null;
      if (material.map?.image && uv) {
        const image = material.map.image;
        const ratio = Math.min(1, 1024 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        texture = canvas.toDataURL('image/png');
      }
      const uvs = uv ? Array.from({length: uv.count}, (_, i) => [uv.getX(i), 1 - uv.getY(i)]).flat() : null;
      allBounds.union(bounds);
      parts.push({name: mesh.name || 'Mesh ' + (parts.length+1), bounds, vertices, triangles, uvs, texture,
        colour: '#' + (material.color?.getHexString() || 'ffffff'), roughness: material.roughness ?? .7, metalness: material.metalness ?? 0});
    });
    if (!parts.length) throw Error('The GLB has no triangle meshes.');
    const centre = allBounds.getCenter(new T.Vector3());
    const size = allBounds.getSize(new T.Vector3());
    const factor = Math.min(1000, 450 / Math.max(.001, size.x, size.y, size.z));
    const group = crypto.randomUUID();
    return parts.map(part => {
      const origin = part.bounds.getCenter(new T.Vector3());
      const dimensions = part.bounds.getSize(new T.Vector3()).multiplyScalar(factor);
      return object('mesh', {
        name: part.name, group, groupName: file.name.replace(/\.glb$/i, ''),
        vertices: part.vertices.map((value, i) => (value - origin.getComponent(i%3)) * factor),
        triangles: part.triangles, meshUVs: part.uvs, texture: part.texture, colour: part.colour,
        meshRoughness: part.roughness, meshMetalness: part.metalness,
        width: Math.max(.1,dimensions.x), height: Math.max(.1,dimensions.y), depth: Math.max(.1,dimensions.z),
        x:(origin.x-centre.x)*factor, y:(origin.y-allBounds.min.y)*factor, z:(origin.z-centre.z)*factor
      });
    });
  } finally {
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    textures.forEach(value => { value.dispose(); value.image?.close?.(); });
  }
}
