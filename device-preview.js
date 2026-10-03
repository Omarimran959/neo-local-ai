(() => {
  'use strict';
  const preview = document.querySelector('.neo-preview');
  if (!preview) return;
  const panels = [...preview.querySelectorAll('.preview-panel')];
  const image = document.getElementById('app-preview');
  const themeButtons = [...preview.querySelectorAll('[data-theme]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 7000;
  let current = 0;
  let timer;
  let hovered = false;

  function show(index) {
    current = index;
    panels.forEach((panel, i) => {
      const active = i === index;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', String(!active));
    });
  }

  function schedule() {
    window.clearTimeout(timer);
    if (document.hidden || reducedMotion.matches || hovered || preview.querySelector(':focus-visible')) return;
    timer = window.setTimeout(() => {
      show((current + 1) % panels.length);
      schedule();
    }, interval);
  }

  // Keeping both layers in the same grid reserves their space during each fade.
  panels.forEach(panel => { panel.hidden = false; });
  show(0);
  themeButtons.forEach(button => button.addEventListener('click', () => {
    const theme = button.dataset.theme;
    image.src = `assets/app-${theme}.png`;
    image.alt = `Neo Local AI interface in ${theme} mode, with Chat, Code and Images assistants`;
    themeButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    show(0);
    schedule();
  }));

  // Pause while someone is interacting, and do not animate a hidden tab.
  preview.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovered = true;
    schedule();
  });
  preview.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  preview.addEventListener('focusin', schedule);
  preview.addEventListener('focusout', () => window.setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) show(0);
    schedule();
  });
  schedule();
})();
