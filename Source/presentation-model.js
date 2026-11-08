// SPDX-License-Identifier: MIT
const image = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const colour = /^#[\da-f]{6}$/i;
const bounded = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const vector = (value, length, limit) => Array.isArray(value) && value.length === length &&
  value.every(n => Number.isFinite(n) && Math.abs(n) <= limit);

export function normalisePresentation(project) {
  for (const object of project.objects) {
    if (object.type === 'mesh') {
      if (!Array.isArray(object.vertices) || !Array.isArray(object.triangles) ||
          object.vertices.length < 9 || object.vertices.length > 450000 || object.vertices.length % 3 ||
          object.triangles.length < 3 || object.triangles.length > 300000 || object.triangles.length % 3 ||
          object.vertices.some(n => !Number.isFinite(n) || Math.abs(n)>1000) ||
          object.triangles.some(n => !Number.isInteger(n) || n < 0 || n >= object.vertices.length/3)) throw Error('Invalid imported mesh.');
      if (object.meshUVs && (!Array.isArray(object.meshUVs) || object.meshUVs.length !== object.vertices.length/3*2 ||
          object.meshUVs.some(n => !Number.isFinite(n) || Math.abs(n)>10000))) throw Error('Invalid imported UV coordinates.');
      object.meshRoughness = bounded(object.meshRoughness,.7,0,1);
      object.meshMetalness = bounded(object.meshMetalness,0,0,1);
    }
    object.callouts = (Array.isArray(object.callouts) ? object.callouts : []).slice(0,12)
      .filter(v => v && vector(v.point,3,10000) && String(v.text || '').trim())
      .map(v => ({point:v.point, uv:vector(v.uv,2,1) ? v.uv : null, text:String(v.text).slice(0,140)}));
    object.decals = (Array.isArray(object.decals) ? object.decals : []).slice(0,6)
      .filter(v => v && vector(v.point,3,10000) && vector(v.normal,3,1) && typeof v.texture==='string' && v.texture.length<=2_000_000 && image.test(v.texture))
      .map(v => ({point:v.point, normal:v.normal, uv:vector(v.uv,2,1) ? v.uv : null,
        texture:v.texture, size:bounded(v.size,30,1,300), angle:bounded(v.angle,0,-360,360)}));
  }
  project.variants = (Array.isArray(project.variants) ? project.variants : []).slice(0,8).filter(v=>v&&Array.isArray(v.objects))
    .map(v => ({
      name:String(v.name||'Look').slice(0,80),
      background:colour.test(v.background)?v.background:'#eee7d8',
      light:['studio','warm','dramatic','neon','rim','flat'].includes(v.light)?v.light:'studio',
      lightPower:bounded(v.lightPower,1,.1,3), lightAngle:bounded(v.lightAngle,-35,-180,180),
      objects:v.objects.slice(0,64).filter(o=>o&&typeof o.id==='string').map(o=>({
        id:o.id.slice(0,100), colour:colour.test(o.colour)?o.colour:'#d9a959',
        edge:colour.test(o.edge)?o.edge:'#b47437', finish:String(o.finish||'paper').slice(0,16),
        texture:typeof o.texture==='string'&&o.texture.length<=12_000_000&&image.test(o.texture)?o.texture:null
      }))
    }));
  return project;
}
export function captureLook(project,name) {
  return {name, background:project.background, light:project.light, lightPower:project.lightPower, lightAngle:project.lightAngle,
    objects:project.objects.map(({id,colour,edge,finish,texture})=>({id,colour,edge,finish,texture}))};
}
export function applyLook(project,look) {
  const values = new Map(look.objects.map(o=>[o.id,o]));
  for (const object of project.objects) {
    const value = values.get(object.id);
    if (value && !object.locked) Object.assign(object,value);
  }
  const {background,light,lightPower,lightAngle} = look;
  Object.assign(project,{background,light,lightPower,lightAngle});
}
