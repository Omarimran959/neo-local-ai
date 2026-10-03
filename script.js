const preview=document.getElementById('app-preview');
for(const button of document.querySelectorAll('[data-theme]'))button.addEventListener('click',()=>{
  const theme=button.dataset.theme;
  preview.src=`assets/app-${theme}.png`;
  preview.alt=`Neo Local AI in ${theme} mode, with Chat, Code and Images assistants`;
  for(const item of document.querySelectorAll('[data-theme]')){const selected=item===button;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));}
});
