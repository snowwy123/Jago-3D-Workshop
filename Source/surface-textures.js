// Per-material UV state. Never mutate shared cached images or serialize runtime textures.
const states=new WeakMap();
export function ownSurfaceTextures(material,textures,flow){states.set(material,{textures,flow});}
export function updateSurfaceTextures(material,time){const s=states.get(material);if(s)for(const texture of s.textures)texture.offset.x=time*s.flow;}
export function disposeSurfaceTextures(material){const s=states.get(material);if(s){s.textures.forEach(t=>t.dispose());states.delete(material);}}
