// SPDX-License-Identifier: MIT
const localFields = ['id','name','linkedSource','x','y','z','rx','ry','rz','sx','sy','sz','scale',
  'visible','locked','group','groupName','assembly','callouts','motion','motionAmount',
  'motionPhase','motionCycles','motionAxis','motionEase'];

export function resolveLinkedCopies(project) {
  const byId = new Map(project.objects.map(object => [object.id, object]));
  project.objects = project.objects.map(copy => {
    if (!copy.linkedSource) return copy;
    const source = byId.get(copy.linkedSource);
    if (!source || source === copy || source.linkedSource || source.solidRecipe || source.type === 'sheet') {
      delete copy.linkedSource;
      return copy;
    }
    const local = Object.fromEntries(localFields.map(field => [field, copy[field]]));
    return {...structuredClone(source),...local};
  });
}

export function makeLinkedCopy(source) {
  return {...structuredClone(source), id:crypto.randomUUID(), name:source.name+' · linked',
    linkedSource:source.id, x:source.x+35, group:'', groupName:'', locked:false, callouts:[]};
}

export const shapeStarters = [
  ['box','Block'],['sphere','Sphere'],['cylinder','Cylinder'],['cone','Cone'],
  ['torus','Ring'],['capsule','Capsule'],['wedge','Wedge'],['tube','Tube']
];

export function construction(name, object) {
  const group = crypto.randomUUID();
  const part = (type, settings) => object(type,{group,groupName:name,...settings});
  switch (name) {
    case 'Ribbed shade': return [
      part('box',{name:'Shade rib',width:6,height:92,depth:12,colour:'#e9bd82',count:16,arrangement:'ring',spread:44,y:46}),
      part('torus',{name:'Top rim',width:110,height:110,depth:4,rx:90,y:94,colour:'#734e37'}),
      part('torus',{name:'Bottom rim',width:110,height:110,depth:4,rx:90,y:4,colour:'#734e37'})
    ];
    case 'Layered sign': return [
      part('box',{name:'Sign backing',width:165,height:82,depth:8,y:45,colour:'#244751'}),
      part('shape',{name:'Raised sign face',shape:'rectangle',width:146,height:67,depth:3,y:12,z:5,colour:'#d3ad73'}),
      part('text',{name:'Editable lettering',text:'STUDIO',width:112,height:25,depth:3,y:27,z:9,colour:'#244751'})
    ];
    case 'Relief badge': return [
      part('cylinder',{name:'Badge blank',width:90,height:8,depth:90,rx:90,y:47,colour:'#274f57'}),
      part('shape',{name:'Relief star',shape:'star',width:65,height:60,depth:3,y:12,z:4,colour:'#e8c485'})
    ];
    case 'Radial sculpture': return [
      part('wedge',{name:'Repeating wedge',width:25,height:60,depth:38,y:32,count:12,arrangement:'ring',spread:45,colour:'#ce7857'}),
      part('cylinder',{name:'Plinth',width:135,height:7,depth:135,y:3.5,colour:'#485e64'})
    ];
    default: throw Error('Choose a construction starter.');
  }
}

export function installConstruction({current,getProject,object,commit,setSelection,frameSelection,selectObject}) {
  const $=id=>document.getElementById(id);
  for (const [type,name] of shapeStarters) $('primitivePicker').add(new Option(name,type));
  $('addPrimitive').onclick=()=>{
    const type=$('primitivePicker').value;
    const size={
      box:[70,70,70],sphere:[70,70,70],cylinder:[68,85,68],cone:[72,95,72],
      torus:[85,85,22],capsule:[45,105,45],wedge:[80,50,65],tube:[75,90,75]
    }[type];
    const [width,height,depth]=size;
    const next=object(type,{name:$('primitivePicker').selectedOptions[0].textContent,
      width,height,depth,y:height/2+(getProject().surfaceHeight||0),dimensionsXYZ:true});
    if (commit(()=>getProject().objects.push(next))) {setSelection([next.id],next.id);frameSelection();}
  };
  $('addConstruction').onclick=()=>{
    const parts=construction($('constructionPicker').value,object);
    if (commit(()=>getProject().objects.push(...parts))) {setSelection(parts.map(o=>o.id),parts[0].id);frameSelection();}
  };
  $('makeLinked').onclick=()=>{
    const selected=current();
    if (!selected || selected.solidRecipe || selected.type==='sheet') return;
    const source=getProject().objects.find(o=>o.id===selected.linkedSource)||selected;
    const copy=makeLinkedCopy(source);
    copy.x=selected.x+Math.min(450,source.width*selected.scale+12);copy.y=selected.y;copy.z=selected.z;
    if (commit(()=>getProject().objects.push(copy))) setSelection([copy.id],copy.id);
  };
  $('linkedEditSource').onclick=()=>{if(current()?.linkedSource)selectObject(current().linkedSource,{ctrlKey:false});};
  $('linkedDetach').onclick=()=>commit(()=>{delete current().linkedSource;});
  return {sync(){
    const active=current(), source=getProject().objects.find(o=>o.id===active?.linkedSource);
    $('makeLinked').disabled=!active||!!active.solidRecipe||active.type==='sheet';
    $('linkedEditSource').hidden=$('linkedDetach').hidden=!source;
    $('linkedStatus').textContent=source?'Follows '+source.name+' for shape and finish. Move, rotate and scale this copy independently.':'Linked copies share the source shape and finish.';
    const panel=$('objectPanel');
    const local=new Set(['objectLock','obj-name','obj-x','obj-y','obj-z','obj-rx','obj-ry','obj-rz','obj-scale']);
    for(const control of panel.querySelectorAll('input,select,button,textarea')) control.inert=!!source&&!local.has(control.id);
  }};
}
