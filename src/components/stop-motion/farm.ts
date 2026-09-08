import * as THREE from 'three';

// Reusable scenery: built once per Stage, shared by preview and video export.
export function createFarm(): THREE.Group {
  const farm = new THREE.Group();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const material = (color:string) => {
    if (!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.95}));
    return materials.get(color)!;
  };
  const mesh = (geometry:THREE.BufferGeometry,color:string,x:number,y:number,z:number) => {
    const m=new THREE.Mesh(geometry,material(color)); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; farm.add(m); return m;
  };
  const box=(color:string,x:number,y:number,z:number,w:number,h:number,d:number)=>mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z);
  const ball=(color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const m=mesh(new THREE.SphereGeometry(1,16,12),color,x,y,z);m.scale.set(sx,sy,sz);return m;};
  box('#a4b783',0,-.12,0,40,.2,40);
  box('#dfc6a0',0,-.005,1,3,.03,9);
  box('#f0d6a6',0,1.65,-3.5,5.6,3.3,2.6);
  const roof=mesh(new THREE.ConeGeometry(4.1,1.5,4),'#ab593d',0,3.9,-3.5);roof.rotation.y=Math.PI/4;roof.scale.z=.8;
  box('#385d49',0,1.15,-2.17,.95,2.3,.12);
  ball('#d3ae62',.29,1.1,-2.07,.055,.055,.04);
  for(const side of [-1,1]) {
    box('#fff0d0',side*1.7,1.95,-2.13,1.25,1.35,.13);
    box('#507a78',side*1.7,1.95,-2.04,1.04,1.12,.08);
    box('#fff0d0',side*1.7,1.95,-1.97,.065,1.12,.06);
    box('#fff0d0',side*1.7,1.95,-1.97,1.04,.065,.06);
    box('#805938',side*2.55,1.45,-1.15,.12,2.9,.12);
    box('#b46643',side*1.7,1.19,-1.94,1.2,.22,.33);
    for(let i=0;i<5;i++) ball('#638349',side*1.7-.45+i*.22,1.38,-1.92,.17,.2,.16);
  }
  box('#bd7650',0,3,-1.5,5.9,.16,1.6).rotation.x=.12;
  box('#d8bd90',0,.08,-1.15,5.7,.17,1.3);
  for(const side of [-1,1]) {
    const x=side*4.1,z=-1.5;
    mesh(new THREE.CylinderGeometry(.17,.25,2.8,12),'#826043',x,1.4,z);
    ball('#587844',x,3.2,z,1.15,1.3,1);
    ball('#70904f',x-side*.55,3.4,z+.1,.85,.9,.8);
    for(let i=0;i<4;i++) ball('#dbaa50',x+Math.sin(i*2)*.7,2.8+i*.2,z+.8,.12,.12,.12);
    for(let i=0;i<4;i++) box('#f1ddb3',side*(3.1+i*.65),.52,1,.12,1.05,.12);
    box('#e8cea3',side*4.1,.75,1,2.7,.12,.12);
    box('#e8cea3',side*4.1,.3,1,2.7,.12,.12);
  }
  // Food table behind the hosts, visible between them.
  box('#9c6948',0,.92,.15,1.05,.12,.65);
  for(const x of [-.4,.4]) for(const z of [-.08,.38]) box('#795337',x,.44,z,.09,.88,.09);
  mesh(new THREE.CylinderGeometry(.29,.29,.04,28),'#f3e7cf',0,1.01,.15);
  box('#edc55e',-.1,1.1,.15,.24,.14,.25);
  box('#a44432',.16,1.1,.15,.18,.12,.23);
  for(let i=0;i<18;i++) {
    const x=Math.sin(i*12.7)*6,z=2+Math.cos(i*8.1)*2;
    if(Math.abs(x)<1.7) continue;
    ball('#73914e',x,.12,z,.25,.14,.23);
    ball(i%2?'#edcf70':'#e9a78f',x,.26,z,.075,.08,.075);
  }
  return farm;
}
