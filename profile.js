(() => {
  'use strict';

  const start = () => {
    document.body.classList.add('has-js');
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollBehavior = () => motionPreference.matches ? 'auto' : 'smooth';

    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuToggle && mobileNav) {
      const setMenuOpen = (open, returnFocus = false) => {
        mobileNav.classList.toggle('is-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        if (returnFocus) menuToggle.focus();
      };

      menuToggle.addEventListener('click', () => {
        setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
      });

      mobileNav.addEventListener('click', (event) => {
        if (event.target.closest('a')) setMenuOpen(false);
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
          setMenuOpen(false, true);
        }
      });
    }

    document.querySelectorAll('[data-gallery]').forEach((gallery) => {
      const track = gallery.querySelector('.gallery-track');
      const slides = track ? Array.from(track.querySelectorAll('.gallery-slide')) : [];
      if (!track || slides.length === 0) return;

      const previous = gallery.querySelector('[data-gallery-prev]');
      const next = gallery.querySelector('[data-gallery-next]');
      const status = gallery.querySelector('[data-gallery-status]');
      let frame = 0;
      let drag = null;
      let suppressClick = false;

      const centerOffset = (slide) => {
        const trackBounds = track.getBoundingClientRect();
        const slideBounds = slide.getBoundingClientRect();
        return slideBounds.left + slideBounds.width / 2
          - (trackBounds.left + track.clientLeft + track.clientWidth / 2);
      };

      const closestIndex = () => {
        let closest = 0;
        let distance = Infinity;
        slides.forEach((slide, index) => {
          const candidate = Math.abs(centerOffset(slide));
          if (candidate < distance) {
            closest = index;
            distance = candidate;
          }
        });
        return closest;
      };

      const update = () => {
        frame = 0;
        const index = closestIndex();
        if (previous) previous.disabled = index === 0;
        if (next) next.disabled = index === slides.length - 1;
        slides.forEach((slide, slideIndex) => {
          slide.classList.toggle('is-active', slideIndex === index);
        });
        if (status) {
          const text = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
          if (status.textContent !== text) status.textContent = text;
        }
      };

      const scheduleUpdate = () => {
        if (!frame) frame = window.requestAnimationFrame(update);
      };

      const goTo = (index) => {
        const destination = Math.max(0, Math.min(slides.length - 1, index));
        const left = Math.max(0, Math.min(
          track.scrollWidth - track.clientWidth,
          track.scrollLeft + centerOffset(slides[destination])
        ));
        track.scrollTo({ left, behavior: scrollBehavior() });
        scheduleUpdate();
      };

      if (previous) previous.addEventListener('click', () => goTo(closestIndex() - 1));
      if (next) next.addEventListener('click', () => goTo(closestIndex() + 1));

      track.addEventListener('keydown', (event) => {
        if (event.target !== track) return;
        let destination;
        if (event.key === 'ArrowLeft') destination = closestIndex() - 1;
        else if (event.key === 'ArrowRight') destination = closestIndex() + 1;
        else if (event.key === 'Home') destination = 0;
        else if (event.key === 'End') destination = slides.length - 1;
        else return;
        event.preventDefault();
        goTo(destination);
      });

      track.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary) return;
        if (event.target.closest('a, button, input, select, textarea')) return;
        drag = { id: event.pointerId, startX: event.clientX, startScroll: track.scrollLeft, moved: false };
        suppressClick = false;
        track.classList.add('is-dragging');
        track.setPointerCapture(event.pointerId);
      });

      track.addEventListener('pointermove', (event) => {
        if (!drag || event.pointerId !== drag.id) return;
        const distance = event.clientX - drag.startX;
        if (Math.abs(distance) > 4) drag.moved = true;
        if (!drag.moved) return;
        event.preventDefault();
        track.scrollLeft = drag.startScroll - distance;
      });

      const finishDrag = (event) => {
        if (!drag || event.pointerId !== drag.id) return;
        const index = closestIndex();
        suppressClick = drag.moved;
        const pointerId = drag.id;
        drag = null;
        track.classList.remove('is-dragging');
        if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
        goTo(index);
        window.setTimeout(() => { suppressClick = false; }, 0);
      };

      track.addEventListener('pointerup', finishDrag);
      track.addEventListener('pointercancel', finishDrag);
      track.addEventListener('lostpointercapture', finishDrag);
      track.addEventListener('dragstart', (event) => event.preventDefault());
      track.addEventListener('click', (event) => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);
      track.addEventListener('scroll', scheduleUpdate, { passive: true });
      window.addEventListener('resize', scheduleUpdate, { passive: true });
      update();
    });

    const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));
    if ('IntersectionObserver' in window && !motionPreference.matches && revealElements.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      document.body.classList.add('has-reveal');
      revealElements.forEach((element) => observer.observe(element));
      motionPreference.addEventListener('change', () => {
        if (!motionPreference.matches) return;
        document.body.classList.remove('has-reveal');
        observer.disconnect();
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
