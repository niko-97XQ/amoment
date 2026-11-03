import * as THREE from 'three';
import { GLTFLoader } from './vendor/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from './vendor/addons/environments/RoomEnvironment.js';

const cameras=[
 ['hasselblad-500cm','Hasselblad 500C/M','MEDIUM FORMAT / 6 × 6','A12 · Planar 80mm · Waist-level finder'],
 ['nikon-f3','Nikon F3 HP','35 MM / SLR','DE-3 high-eyepoint finder · Nikkor 50mm'],
 ['leica-m6','Leica M6','35 MM / RANGEFINDER','Rangefinder · Manual focus'],
 ['polaroid-sx70','Polaroid SX-70','INSTANT / FOLDING SLR','Folding body · Integral film'],
 ['kodak-funsaver','Kodak FunSaver','35 MM / SINGLE USE','Fixed-focus lens · Built-in flash'],
 ['instax-mini90','Instax Mini 90','INSTANT / MINI','Retractable lens · Instant prints']
];
export function initCameraRoom(toast){
 const $=id=>document.getElementById(id),canvas=$('camera-canvas'),cache=new Map();
 let renderer,scene,camera,pivot,model,request=0,drag=null;
 function mode(photo){$('camera-stage').hidden=photo;$('photo-stage').hidden=!photo;$('model-tab').setAttribute('aria-pressed',String(!photo));$('photo-tab').setAttribute('aria-pressed',String(photo));if(!photo)resize();}
 $('model-tab').onclick=()=>mode(false);$('photo-tab').onclick=()=>mode(true);
 $('import-button').addEventListener('click',()=>mode(true));
 $('photo-input').addEventListener('change',()=>mode(true));
 $('studio').addEventListener('drop',e=>{if(e.dataTransfer?.files?.length)mode(true);});
 $('look-list').addEventListener('click',()=>mode(true));
 $('adjustments').addEventListener('input',()=>mode(true));
 $('print-template').addEventListener('change',()=>mode(true));
 $('print-options').addEventListener('input',()=>mode(true));
 $('compare-button').addEventListener('click',()=>mode(true));
 function setup(){
  if(renderer)return;
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.01,100);camera.position.set(3.8,2.1,6.7);camera.lookAt(0,0,0);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();scene.environmentIntensity=.65;
  const key=new THREE.DirectionalLight(0xfff7e8,1.8);key.position.set(3,5,5);scene.add(key);const rim=new THREE.DirectionalLight(0xe2e8ef,.85);rim.position.set(-4,2,-3);scene.add(rim);scene.add(new THREE.HemisphereLight(0xffffff,0x383734,.35));
  pivot=new THREE.Group();scene.add(pivot);
 }
 function resize(){if(!renderer||$('studio').hidden||$('camera-stage').hidden)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.render(scene,camera);}
 function reset(){if(!pivot)return;pivot.rotation.set(0,-.15,0);camera.zoom=1;camera.updateProjectionMatrix();resize();}
 async function choose(item){
  const token=++request;mode(false);$('camera-name').textContent=item[1];$('camera-format').textContent=item[2];$('camera-detail').textContent=item[3];$('camera-status').textContent='Loading camera…';
  document.querySelectorAll('.camera-choice').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.camera===item[0])));
  $('camera-fallback').src=`./assets/cameras/${item[0]}.png`;
  try{setup();if(model){pivot.remove(model);model=null;}resize();
   let asset=cache.get(item[0]);if(!asset){asset=await new GLTFLoader().loadAsync(`./assets/cameras/${item[0]}.glb`);cache.set(item[0],asset);}
   if(token!==request)return;model=asset.scene;model.scale.setScalar(1);model.position.set(0,0,0);model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),scale=3.45/Math.max(size.x,size.y,size.z);model.scale.setScalar(scale);model.position.copy(center.multiplyScalar(-scale));pivot.add(model);reset();$('camera-status').textContent='Drag to rotate · Scroll to zoom';$('camera-fallback').hidden=true;
  }catch{if(token!==request)return;$('camera-fallback').hidden=false;$('camera-status').textContent='Model preview unavailable. Showing the studio render.';toast('The interactive model could not load. Its render is still available.');}
 }
 for(const item of cameras){const b=document.createElement('button');b.className='camera-choice';b.dataset.camera=item[0];b.setAttribute('aria-label',item[1]);b.setAttribute('aria-pressed','false');const img=document.createElement('img');img.src=`./assets/cameras/${item[0]}.png`;img.alt='';const label=document.createElement('span');label.textContent=item[1];b.append(img,label);b.onclick=()=>choose(item);$('camera-list').append(b);}
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag||!pivot)return;pivot.rotation.y+=(e.clientX-drag.x)*.008;pivot.rotation.x=THREE.MathUtils.clamp(pivot.rotation.x+(e.clientY-drag.y)*.006,-1.2,1.2);drag={x:e.clientX,y:e.clientY};resize();});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{if(!camera)return;e.preventDefault();camera.zoom=THREE.MathUtils.clamp(camera.zoom*Math.exp(-e.deltaY*.001),.7,1.8);camera.updateProjectionMatrix();resize();},{passive:false});
 canvas.tabIndex=0;canvas.addEventListener('keydown',e=>{if(!pivot)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key.includes('Left'))pivot.rotation.y-=.15;if(e.key.includes('Right'))pivot.rotation.y+=.15;if(e.key.includes('Up'))pivot.rotation.x-=.1;if(e.key.includes('Down'))pivot.rotation.x+=.1;resize();}});
 $('reset-camera').onclick=reset;new ResizeObserver(resize).observe($('camera-stage'));new MutationObserver(()=>{if(!$('studio').hidden){if(!request)choose(cameras[0]);else resize();}}).observe($('studio'),{attributes:true,attributeFilter:['hidden']});
}
