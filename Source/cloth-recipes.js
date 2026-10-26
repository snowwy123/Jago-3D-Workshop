import {sheetSettings} from './sheet-model.js';
// Recipes affect only the selected sheet's pose and finish, never its artwork or placement.
export const clothRecipes={
 banner:{name:'Gallery banner',shape:{bend:4,drape:12,fold:6,curl:2,pins:'corners',physics:{gravity:180,wind:25,bend:.25,damping:.025}},finish:{finish:'cloth',roughness:.58,sheen:.8,weave:.22,metalness:0,clearcoat:0}},
 silk:{name:'Floating silk',shape:{bend:20,drape:18,fold:10,curl:12,pins:'corners',physics:{gravity:45,wind:100,bend:.05,damping:.012,ground:false}},finish:{finish:'cloth',roughness:.25,sheen:1,weave:.1,metalness:0,clearcoat:.12}},
 foil:{name:'Sculpted foil',shape:{bend:35,drape:20,fold:12,curl:18,pins:'corners',physics:{gravity:75,wind:65,bend:.62,damping:.035}},finish:{finish:'holo',roughness:.2,sheen:.05,weave:.04,metalness:.8,clearcoat:.8,iridescence:1,film:420}},
 drape:{name:'Drape over a sphere',shape:{bend:12,drape:20,fold:5,curl:8,pins:'none',physics:{gravity:150,wind:10,bend:.12,damping:.05,sphere:true,radius:48,ground:true,floor:0,horizontal:true}},finish:{finish:'cloth',roughness:.42,sheen:.8,weave:.18,metalness:0,clearcoat:.08}}
};
export function applyClothRecipe(o,key){const r=clothRecipes[key];if(!r)throw Error('Choose a cloth recipe.');const finish=o.surfaceMaps?{}:r.finish;o.sheet=sheetSettings({...o.sheet,...r.shape,...finish,physics:r.shape.physics,marks:[],anchors:[],bake:undefined,frozenWind:undefined,wind:0});return o;}
export function installClothRecipes({current,commit}){
 function inspector(){const body=document.getElementById('sheetInspector'),o=current();if(!body||o?.type!=='sheet')return;const section=document.createElement('section');section.className='clothRecipes';section.innerHTML='<h3>Start with a cloth direction</h3><p class="hint">Replaces this sheet’s pose and pins. Keeps your artwork, position and Material maps. Undo restores it. Then open the playground or bake motion.</p><select id="clothRecipe" aria-label="Cloth direction"><option value="">Choose a direction…</option></select>';for(const [key,r]of Object.entries(clothRecipes))section.querySelector('select').add(new Option(r.name,key));section.querySelector('select').onchange=e=>{const key=e.target.value;if(key)commit(()=>applyClothRecipe(current(),key));};body.querySelector('.sheet-route').after(section);}
 return{inspector};
}
