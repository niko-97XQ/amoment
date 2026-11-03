import { photos } from './photos.js';
import { frames, composePrint } from './print-frame.js';

const looks=[
  {id:'original',name:'Original',note:'AS CAPTURED',rgb:[1,1,1],contrast:1,saturation:1,lift:0,grain:0,filter:'none'},
  {id:'golden',name:'Golden 200',note:'WARM / COLOR',rgb:[1.065,1.015,.94],contrast:1.04,saturation:.94,lift:4,grain:4,filter:'sepia(.25) saturate(.9)'},
  {id:'chrome',name:'Quiet Chrome',note:'MUTED / COLOR',rgb:[.97,1.015,1.035],contrast:1.11,saturation:.7,lift:3,grain:3,filter:'saturate(.55) contrast(1.13)'},
  {id:'instant',name:'Instant 70',note:'SOFT / COLOR',rgb:[1.035,1.015,.97],contrast:.89,saturation:.8,lift:10,grain:5,filter:'sepia(.12) contrast(.85)'},
  {id:'silver',name:'Silver 400',note:'BLACK & WHITE',rgb:[1,1,1],contrast:1.17,saturation:0,lift:2,grain:7,filter:'grayscale(1) contrast(1.15)'}
];
const controls=[{id:'exposure',label:'Exposure',min:-1.5,max:1.5,step:.05},{id:'contrast',label:'Contrast',min:-40,max:40,step:1},{id:'saturation',label:'Saturation',min:-50,max:50,step:1},{id:'temperature',label:'Warmth',min:-30,max:30,step:1},{id:'grain',label:'Grain',min:0,max:35,step:1}];
const $=id=>document.getElementById(id);

export function initStudio(toast){
  const canvas=$('photo-canvas'),ctx=canvas.getContext('2d');
  const original=document.createElement('canvas'),source=original.getContext('2d',{willReadFrequently:true});
  const graded=document.createElement('canvas'),gradeCtx=graded.getContext('2d');
  const printed=document.createElement('canvas'),originalPrint=document.createElement('canvas');
  const print={id:'none',width:100,fit:'contain'};
  for(const frame of frames){const option=document.createElement('option');option.value=frame.id;option.textContent=frame.name;$('print-template').append(option);const button=document.createElement('button');button.className='print-choice';button.dataset.frame=frame.id;button.setAttribute('aria-label',frame.name);button.setAttribute('aria-pressed',String(frame.id==='none'));button.innerHTML=`<span class="frame-icon frame-${frame.id}" aria-hidden="true"><i></i></span><span>${frame.name}</span>`;button.addEventListener('click',()=>{$('print-template').value=frame.id;$('print-template').dispatchEvent(new Event('change',{bubbles:true}));});$('print-choices').append(button);}
  function updatePrint(){
    print.id=$('print-template').value;print.width=Number($('print-width').value);print.fit=$('print-fit').value;
    $('print-selection').textContent=frames.find(f=>f.id===print.id).name;document.querySelectorAll('.print-choice').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.frame===print.id)));canvas.classList.toggle('is-paper',!['none','film35','film120'].includes(print.id));
    $('print-width-value').textContent=`${print.width}%`;
    $('print-options').hidden=print.id==='none';
    $('print-fit-field').hidden=!['instant','mini','wide'].includes(print.id);
    display();fitCompare();
  }
  $('print-template').addEventListener('change',updatePrint);$('print-width').addEventListener('input',updatePrint);$('print-fit').addEventListener('change',updatePrint);
  let imageData,look=looks[0],values=Object.fromEntries(controls.map(c=>[c.id,0])),comparing=false,scheduled=false,loadId=0,dragDepth=0;
  for(const preset of looks){
    const button=document.createElement('button');button.className='look-button';button.dataset.look=preset.id;button.setAttribute('aria-pressed',String(preset===look));button.setAttribute('aria-label',preset.name);
    const swatch=document.createElement('span');swatch.className='look-swatch';swatch.style.backgroundImage="url('./assets/photos/coast.jpg')";swatch.style.filter=preset.filter;
    const name=document.createElement('span');name.textContent=preset.name;const note=document.createElement('small');note.textContent=preset.note;name.append(note);button.append(swatch,name);$('look-list').append(button);
    button.addEventListener('click',()=>{look=preset;$('look-name').textContent=preset.name;document.querySelectorAll('.look-button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));queueRender()});
  }
  for(const c of controls){
    const field=document.createElement('div');field.className='adjustment';const label=document.createElement('label');label.htmlFor=`adjust-${c.id}`;label.textContent=c.label;
    const output=document.createElement('output');output.id=`value-${c.id}`;output.htmlFor=`adjust-${c.id}`;output.textContent=c.id==='exposure'?'0.00':'0';label.append(output);
    const input=document.createElement('input');input.type='range';input.id=`adjust-${c.id}`;input.min=c.min;input.max=c.max;input.step=c.step;input.value=0;
    input.addEventListener('input',()=>{values[c.id]=Number(input.value);output.textContent=c.id==='exposure'?Number(input.value).toFixed(2):input.value;queueRender()});field.append(label,input);$('adjustments').append(field);
  }
  function display(){
    if(!imageData)return;
    composePrint(printed,graded,print);
    if(canvas.width!==printed.width)canvas.width=printed.width;if(canvas.height!==printed.height)canvas.height=printed.height;
    ctx.drawImage(printed,0,0);
    $('image-dimensions').textContent=`${canvas.width} × ${canvas.height} PX`;
    if(comparing){composePrint(originalPrint,original,print);const fraction=Number($('compare-slider').value)/100;ctx.save();ctx.beginPath();ctx.rect(0,0,canvas.width*fraction,canvas.height);ctx.clip();ctx.drawImage(originalPrint,0,0);ctx.restore();$('compare-divider').style.left=`${fraction*100}%`}
  }
  function render(){
    scheduled=false;if(!imageData)return;
    const pixels=new Uint8ClampedArray(imageData.data),exposure=2**values.exposure,contrast=look.contrast*(1+values.contrast/100),sat=Math.max(0,look.saturation*(1+values.saturation/100)),temp=values.temperature,grain=look.grain+values.grain*.65;
    for(let i=0;i<pixels.length;i+=4){
      let r=pixels[i]*exposure*look.rgb[0]+temp*.6,g=pixels[i+1]*exposure*look.rgb[1],b=pixels[i+2]*exposure*look.rgb[2]-temp*.8;
      const l=r*.2126+g*.7152+b*.0722;r=l+(r-l)*sat;g=l+(g-l)*sat;b=l+(b-l)*sat;
      let hash=(i/4+1)|0;hash=Math.imul(hash^(hash>>>15),0x45d9f3b);hash=Math.imul(hash^(hash>>>13),0x45d9f3b);hash^=hash>>>16;
      const noise=((hash>>>0)/4294967295-.5)*grain;
      pixels[i]=(r-127.5)*contrast+127.5+look.lift+noise;pixels[i+1]=(g-127.5)*contrast+127.5+look.lift+noise;pixels[i+2]=(b-127.5)*contrast+127.5+look.lift+noise;
    }
    gradeCtx.putImageData(new ImageData(pixels,imageData.width,imageData.height),0,0);display();fitCompare();
  }
  function queueRender(){if(!scheduled){scheduled=true;requestAnimationFrame(render)}}
  function fitCompare(){
    if($('studio').hidden)return;const r=canvas.getBoundingClientRect(),p=$('photo-view').getBoundingClientRect();Object.assign($('compare-overlay').style,{left:`${r.left-p.left}px`,top:`${r.top-p.top}px`,width:`${r.width}px`,height:`${r.height}px`,right:'auto',bottom:'auto'});
  }
  async function loadImage(url,label,index=-1){
    const current=++loadId;const image=new Image();image.src=url;
    try{await image.decode();if(current!==loadId)return;
      const scale=Math.min(1,2400/Math.max(image.naturalWidth,image.naturalHeight)),w=Math.round(image.naturalWidth*scale),h=Math.round(image.naturalHeight*scale);
      for(const c of [canvas,original,graded]){c.width=w;c.height=h}source.drawImage(image,0,0,w,h);imageData=source.getImageData(0,0,w,h);$('file-name').textContent=label;$('image-dimensions').textContent=`${w} × ${h} PX`;
      document.querySelectorAll('.sample-button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));render();
    }catch{toast('This image could not be opened. Try a JPG or PNG photograph.')}
  }
  photos.forEach((photo,index)=>{
    const b=document.createElement('button');b.className='sample-button';b.setAttribute('aria-label',`Try ${photo.title}`);b.setAttribute('aria-pressed',String(index===0));const img=document.createElement('img');img.src=`./assets/photos/${photo.file}`;img.alt='';b.append(img);b.addEventListener('click',()=>loadImage(img.src,`${photo.title} · Sample`,index));$('sample-tray').append(b);
  });
  $('compare-button').addEventListener('click',()=>{comparing=!comparing;$('compare-button').setAttribute('aria-pressed',String(comparing));$('compare-overlay').hidden=!comparing;display();fitCompare()});$('compare-slider').addEventListener('input',display);
  $('reset-button').addEventListener('click',()=>{values=Object.fromEntries(controls.map(c=>[c.id,0]));for(const c of controls){$(`adjust-${c.id}`).value=0;$(`value-${c.id}`).textContent=c.id==='exposure'?'0.00':'0'}look=looks[0];$('look-name').textContent=look.name;document.querySelectorAll('.look-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.look===look.id)));queueRender()});
  async function importFile(file){
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)){toast('Choose a JPG, PNG, WebP, or AVIF photograph.');return}
    if(file.size>40*1024*1024){toast('Choose a photograph smaller than 40 MB.');return}
    const url=URL.createObjectURL(file);$('import-button').disabled=true;
    try{await loadImage(url,file.name)}finally{URL.revokeObjectURL(url);$('import-button').disabled=false}
  }
  $('import-button').addEventListener('click',()=>$('photo-input').click());$('photo-input').addEventListener('change',e=>{importFile(e.target.files?.[0]);e.target.value=''});
  $('export-button').addEventListener('click',()=>{
    if(!imageData)return;render();$('export-button').disabled=true;
    printed.toBlob(blob=>{if(!blob){toast('The image could not be exported.');$('export-button').disabled=false;return}const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`amoment-${look.id}-${print.id}.jpg`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('export-button').disabled=false;toast('Your moment is ready.')},'image/jpeg',.95);
  });
  $('studio').addEventListener('dragenter',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();dragDepth++;$('drop-overlay').hidden=false}});
  $('studio').addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files'))e.preventDefault()});
  $('studio').addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)$('drop-overlay').hidden=true});
  $('studio').addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('drop-overlay').hidden=true;importFile(e.dataTransfer?.files?.[0])});
  new ResizeObserver(fitCompare).observe($('photo-view'));
  loadImage('./assets/photos/coast.jpg','Coast · Sample',0);
  return{resize:fitCompare};
}
