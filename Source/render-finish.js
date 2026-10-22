import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
const pipelines=new WeakMap();
export function finishedRender(r,scene,camera,p,transparent=false){
 if(transparent||(!p.bloom&&!p.lensDistortion)){r.render(scene,camera);return;}
 let fx=pipelines.get(r);if(!fx){const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:2});const composer=new EffectComposer(r,target),pass=new RenderPass(scene,camera),bloom=new UnrealBloomPass(new T.Vector2(1,1),1,.35,1),lens=new ShaderPass({uniforms:{tDiffuse:{value:null},bend:{value:0},aspect:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float bend;uniform float aspect;varying vec2 vUv;void main(){vec2 p=vUv*2.-1.;vec2 q=p*vec2(aspect,1.);vec2 uv=(p*(1.+bend*dot(q,q)))*.5+.5;if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))gl_FragColor=vec4(0.,0.,0.,1.);else gl_FragColor=texture2D(tDiffuse,uv);}'});composer.addPass(pass);composer.addPass(bloom);composer.addPass(lens);composer.addPass(new OutputPass());fx={composer,pass,bloom,lens,w:0,h:0};pipelines.set(r,fx);}
 const size=r.getSize(new T.Vector2()),ratio=r.getPixelRatio();if(size.x!==fx.w||size.y!==fx.h||ratio!==fx.ratio){fx.composer.setPixelRatio(ratio);fx.composer.setSize(size.x,size.y);fx.w=size.x;fx.h=size.y;fx.ratio=ratio;}
 fx.pass.scene=scene;fx.pass.camera=camera;fx.bloom.enabled=p.bloom>0;fx.bloom.threshold=3;fx.bloom.strength=p.bloom;fx.bloom.radius=p.bloomRadius;fx.lens.enabled=!!p.lensDistortion;fx.lens.uniforms.bend.value=p.lensDistortion||0;fx.lens.uniforms.aspect.value=size.x/size.y;fx.composer.render();
}
export function disposeFinish(r){const fx=pipelines.get(r);if(!fx)return;fx.bloom.dispose();fx.lens.dispose();fx.composer.passes.at(-1).dispose();fx.composer.dispose();pipelines.delete(r);}
