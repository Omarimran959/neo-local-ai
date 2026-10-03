'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const tabs=[...document.querySelectorAll('[data-tool]')];
  function selectTool(name){
    if(!['colors','storyboard','models'].includes(name))name='colors';
    for(const button of tabs){const active=button.dataset.tool===name;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;$(button.dataset.tool).hidden=!active;}
    history.replaceState(null,'','#'+name);
  }
  tabs.forEach((button,i)=>{button.addEventListener('click',()=>selectTool(button.dataset.tool));button.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;tabs[next].click();tabs[next].focus();});});
  selectTool(location.hash.slice(1));
  let pictureURL=null,videoURL=null,palette=[],picture=null,paletteGeneration=0,videoGeneration=0;
  function revoke(url){if(url)URL.revokeObjectURL(url);}
  function clearPalette(){paletteGeneration++;revoke(pictureURL);pictureURL=null;picture=null;palette=[];$('palette-preview').removeAttribute('src');$('palette-preview').hidden=true;$('palette-results').hidden=true;$('palette-empty').hidden=false;$('palette-file').value='';$('palette-status').textContent='';}
  $('palette-clear').addEventListener('click',clearPalette);
  function readPicture(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('This picture could not be read. Try a JPG, PNG or WebP.'));img.src=url;});}
  function prominentColors(image){
    const canvas=document.createElement('canvas'),size=112;canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,size,size);const pixels=ctx.getImageData(0,0,size,size).data,bins=new Map();
    for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<180)continue;const r=pixels[i],g=pixels[i+1],b=pixels[i+2],key=[r>>4,g>>4,b>>4].join(',');let bin=bins.get(key);if(!bin){bin={n:0,sum:[0,0,0]};bins.set(key,bin);}bin.n++;bin.sum[0]+=r;bin.sum[1]+=g;bin.sum[2]+=b;}
    const candidates=[...bins.values()].sort((a,b)=>b.n-a.n).map(b=>b.sum.map(x=>Math.round(x/b.n)));const found=[];
    for(const c of candidates){if(found.every(v=>Math.hypot(c[0]-v[0],c[1]-v[1],c[2]-v[2])>48))found.push(c);if(found.length===5)break;}
    for(const c of candidates){if(found.length===5)break;if(!found.some(v=>v.join()===c.join()))found.push(c);}
    if(!found.length)throw new Error('Choose an image with visible, nontransparent colors.');
    return found.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase());
  }
  async function copy(text,status){try{await navigator.clipboard.writeText(text);$(status).textContent=text+' copied.';}catch{$(status).textContent='Color: '+text+' — select and copy this text.';}}
  $('palette-file').addEventListener('change',async()=>{
    const file=$('palette-file').files[0];if(!file)return;clearPalette();const generation=paletteGeneration;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024){$('palette-status').textContent='Choose a JPG, PNG or WebP smaller than 15 MB.';return;}
    $('palette-status').textContent='Finding your colors…';pictureURL=URL.createObjectURL(file);
    try{const img=await readPicture(pictureURL);if(generation!==paletteGeneration)return;if(img.naturalWidth*img.naturalHeight>40000000)throw new Error('This image is too large to process here. Choose a smaller picture.');picture=img;palette=prominentColors(img);$('palette-preview').src=pictureURL;$('palette-preview').hidden=false;$('palette-empty').hidden=true;$('palette-swatches').replaceChildren();
      palette.forEach(color=>{const button=document.createElement('button');button.className='swatch';button.setAttribute('aria-label','Copy '+color);const swatch=document.createElement('canvas');swatch.width=100;swatch.height=100;const context=swatch.getContext('2d');context.fillStyle=color;context.fillRect(0,0,100,100);const label=document.createElement('span');label.textContent=color;button.append(swatch,label);button.addEventListener('click',()=>copy(color,'palette-status'));$('palette-swatches').append(button);});
      $('palette-results').hidden=false;$('palette-status').textContent='Your palette is ready. Click a color to copy its code.';
    }catch(error){if(generation!==paletteGeneration)return;clearPalette();$('palette-status').textContent=error.message;}
  });
  function saveCanvas(canvas,name){canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);},'image/png');}
  $('palette-download').addEventListener('click',()=>{if(!picture||!palette.length)return;const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=930;const ctx=canvas.getContext('2d');ctx.fillStyle='#faf9f6';ctx.fillRect(0,0,1200,930);const scale=Math.min(1120/picture.width,650/picture.height),w=picture.width*scale,h=picture.height*scale;ctx.drawImage(picture,(1200-w)/2,40+(650-h)/2,w,h);palette.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(40+i*1120/palette.length,720,1120/palette.length,100);ctx.fillStyle='#302820';ctx.font='20px monospace';ctx.textAlign='center';ctx.fillText(c,40+(i+.5)*1120/palette.length,854);});ctx.font='14px sans-serif';ctx.fillText('A palette from your picture · Neo Local AI',600,905);saveCanvas(canvas,'Neo-color-palette.png');});
  function clearVideo(){videoGeneration++;const video=$('video-player');video.pause();video.removeAttribute('src');video.load();revoke(videoURL);videoURL=null;video.hidden=true;$('video-empty').hidden=false;$('storyboard-canvas').hidden=true;$('storyboard-download').hidden=true;$('video-clear').hidden=true;$('video-file').value='';$('video-file').disabled=false;$('video-status').textContent='';}
  $('video-clear').addEventListener('click',clearVideo);
  function once(element,event,action,ms=20000){return new Promise((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);element.removeEventListener(event,done);element.removeEventListener('error',fail);};const done=()=>{cleanup();resolve();};const fail=()=>{cleanup();reject(new Error('Your browser could not decode this video. Try an MP4 encoded with H.264.'));};const timer=setTimeout(()=>{cleanup();reject(new Error('The video took too long to open. Try a shorter or smaller MP4.'));},ms);element.addEventListener(event,done,{once:true});element.addEventListener('error',fail,{once:true});action();});}
  const timestamp=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
  $('video-file').addEventListener('change',async()=>{
    const file=$('video-file').files[0];if(!file)return;clearVideo();const generation=videoGeneration;
    if(!/^video\/(mp4|webm|quicktime)$/.test(file.type)||file.size>100*1024*1024){$('video-status').textContent='Choose an MP4, WebM or MOV smaller than 100 MB.';return;}
    const video=$('video-player');videoURL=URL.createObjectURL(file);$('video-file').disabled=true;$('video-clear').hidden=false;$('video-status').textContent='Opening your video locally…';
    try{await once(video,'loadedmetadata',()=>{video.src=videoURL;});if(generation!==videoGeneration)return;if(!Number.isFinite(video.duration)||video.duration<=0||video.duration>600)throw new Error('Choose a video between 1 second and 10 minutes.');if(video.videoWidth*video.videoHeight>17000000)throw new Error('Choose a video at 4K resolution or smaller.');
      const canvas=$('storyboard-canvas');canvas.width=1440;canvas.height=660;const ctx=canvas.getContext('2d');ctx.fillStyle='#faf9f6';ctx.fillRect(0,0,1440,660);ctx.fillStyle='#554337';ctx.font='20px sans-serif';ctx.fillText('YOUR STORYBOARD',24,32);ctx.font='13px sans-serif';ctx.fillText('Six sampled moments · Neo Local AI',24,57);
      for(let i=0;i<6;i++){if(generation!==videoGeneration)return;const t=Math.max(.001,Math.min(video.duration-.001,video.duration*(i+.5)/6));$('video-status').textContent='Finding moment '+(i+1)+' of 6…';await once(video,'seeked',()=>{video.currentTime=t;});if(generation!==videoGeneration)return;const x=24+(i%3)*472,y=80+Math.floor(i/3)*278,w=448,h=230;ctx.fillStyle='#292420';ctx.fillRect(x,y,w,h);const ratio=Math.min(w/video.videoWidth,h/video.videoHeight),dw=video.videoWidth*ratio,dh=video.videoHeight*ratio;ctx.drawImage(video,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.fillStyle='#604b3f';ctx.font='14px monospace';ctx.fillText(timestamp(t),x,y+h+23);}
      video.hidden=false;$('video-empty').hidden=true;canvas.hidden=false;$('storyboard-download').hidden=false;$('video-status').textContent='Your storyboard is ready. Audio is not analyzed or included.';
    }catch(error){if(generation!==videoGeneration)return;clearVideo();$('video-status').textContent=error.message;}finally{if(generation===videoGeneration)$('video-file').disabled=false;}
  });
  $('storyboard-download').addEventListener('click',()=>saveCanvas($('storyboard-canvas'),'Neo-video-storyboard.png'));
  const guides={chat:{kind:'Your everyday thinking partner',name:'Qwen3 1.7B',description:'Draft messages, explain a topic, or explore an idea. Short, focused prompts work best.',prompt:'Try: “Help me turn this rough idea into three clear next steps.”'},code:{kind:'A second look at your code',name:'Qwen2.5-Coder 1.5B',description:'Explain a small function, draft a script, or understand an error. Always review and test code before running it.',prompt:'Try: “Explain this function in plain language and suggest one improvement.”'},images:{kind:'Notice the visible details',name:'SmolVLM 500M',description:'Ask simple questions about a clear picture. This small vision model understands images; it does not generate them.',prompt:'Try: “What objects are visible in this picture?”'}};
  document.querySelectorAll('[data-guide]').forEach(button=>button.addEventListener('click',()=>{const guide=guides[button.dataset.guide];for(const [key,text]of Object.entries(guide))$('guide-'+key).textContent=text;document.querySelectorAll('[data-guide]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
  window.addEventListener('pagehide',()=>{revoke(pictureURL);revoke(videoURL);});
})();
