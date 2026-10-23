// Apple-style sliding pill navigation with smooth section scrolling.
(() => {
  const nav = document.querySelector('.section-nav');
  if (!nav) return;

  const links = [...nav.querySelectorAll('a')];
  const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
  if (links.length === 0 || sections.length !== links.length) return;

  // Create sliding pill indicator
  let indicator = nav.querySelector('.nav-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'nav-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    nav.prepend(indicator);
  }

  const navWrap = document.querySelector('.nav-wrap');
  const getNavOffset = () => (navWrap ? navWrap.offsetHeight + 20 : 80);

  let activeIndex = 0;
  let isProgrammatic = false;
  let scrollTimeout = null;

  const moveIndicator = (link) => {
    if (!link) return;
    const linkRect = link.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const x = linkRect.left - navRect.left;
    const width = linkRect.width;

    indicator.style.transform = `translate3d(${x}px, 0, 0)`;
    indicator.style.width = `${width}px`;
    indicator.style.opacity = '1';
  };

  const setActive = (index, shouldMoveIndicator = true) => {
    if (index < 0 || index >= links.length) return;
    activeIndex = index;

    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    if (shouldMoveIndicator) {
      moveIndicator(links[index]);
    }
  };

  const scrollToSection = (targetSection, index) => {
    if (!targetSection) return;

    isProgrammatic = true;
    clearTimeout(scrollTimeout);

    // Slide indicator immediately to clicked tab
    setActive(index, true);

    const navOffset = getNavOffset();
    const targetTop = targetSection.getBoundingClientRect().top + window.scrollY - navOffset;

    window.scrollTo({
      top: Math.max(0, Math.round(targetTop)),
      behavior: 'smooth'
    });

    // Handle when smooth scroll finishes
    const finishScroll = () => {
      isProgrammatic = false;
      window.removeEventListener('scrollend', finishScroll);
    };

    if ('onscrollend' in window) {
      window.addEventListener('scrollend', finishScroll, { once: true });
    }

    // Safety fallback timer for scroll completion
    scrollTimeout = setTimeout(() => {
      isProgrammatic = false;
    }, 750);
  };

  // Nav click handlers
  links.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = sections[index];
      if (!target) return;

      scrollToSection(target, index);

      if (history.pushState) {
        history.pushState(null, '', link.hash);
      } else {
        window.location.hash = link.hash;
      }
    });
  });

  // Track position during manual scrolling
  const updateOnScroll = () => {
    if (isProgrammatic) return;

    const navOffset = getNavOffset();
    const triggerY = window.scrollY + navOffset + 60;

    let current = 0;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= triggerY) {
        current = i;
      }
    }

    if (current !== activeIndex) {
      setActive(current, true);
    }
  };

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateOnScroll();
        scrollTicking = false;
      });
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    moveIndicator(links[activeIndex]);
  });

  // Initial state check (e.g. if loaded with #skills or #contact)
  const initialHash = window.location.hash;
  const initialIndex = sections.findIndex(s => `#${s.id}` === initialHash);
  if (initialIndex >= 0) {
    setActive(initialIndex, false);
    setTimeout(() => {
      moveIndicator(links[initialIndex]);
      scrollToSection(sections[initialIndex], initialIndex);
    }, 50);
  } else {
    setActive(0, false);
    // Wait for fonts & layout
    requestAnimationFrame(() => moveIndicator(links[0]));
    window.addEventListener('load', () => moveIndicator(links[activeIndex]));
  }

  // Theme toggle handler
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const getPreferredTheme = () => {
      const stored = localStorage.getItem('theme');
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      requestAnimationFrame(() => moveIndicator(links[activeIndex]));
    };

    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // -------------------------------------------------------------
  // Party Confetti & Sparkles Celebration Effect (Double-Click)
  // -------------------------------------------------------------
  const initPartyEffect = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let canvas = document.getElementById('party-canvas');
    let ctx = null;
    let particles = [];
    let animId = null;

    const colors = [
      '#6366f1', // Indigo
      '#ec4899', // Pink / Rose
      '#06b6d4', // Cyan
      '#f59e0b', // Amber / Gold
      '#10b981', // Emerald
      '#8b5cf6', // Violet
      '#ef4444', // Coral Red
      '#3b82f6', // Electric Blue
      '#ffffff'  // Shimmering White
    ];

    const setupCanvas = () => {
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'party-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);
      }
      ctx = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', () => {
      if (canvas && particles.length > 0) setupCanvas();
    });

    const createParticle = (x, y, vx, vy, color, type = 'ribbon') => {
      return {
        x,
        y,
        vx,
        vy,
        color: color || colors[Math.floor(Math.random() * colors.length)],
        type, // 'ribbon', 'circle', 'star'
        size: type === 'star' ? Math.random() * 6 + 5 : Math.random() * 8 + 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.12 + 0.05,
        opacity: 1,
        decay: Math.random() * 0.008 + 0.007,
        gravity: 0.22,
        drag: 0.975
      };
    };

    const triggerParty = (clientX, clientY, targetEl) => {
      // Clear any text selection caused by double-clicking
      if (window.getSelection) {
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
      }

      setupCanvas();

      // Find target panel: closest bento section, header, or fallback to closest visible section
      let panel = targetEl ? targetEl.closest('main section, header.resume-header, .resume-pill, .section-nav') : null;
      if (!panel) {
        const sections = document.querySelectorAll('main section');
        let closest = null;
        let minDist = Infinity;
        sections.forEach(s => {
          const r = s.getBoundingClientRect();
          const dist = Math.abs(r.top + r.height / 2 - clientY);
          if (dist < minDist) {
            minDist = dist;
            closest = s;
          }
        });
        panel = closest;
      }

      // Celebratory bounce & rim-glow pulse on the panel
      if (panel && panel.classList) {
        panel.classList.remove('party-active');
        void panel.offsetWidth; // trigger reflow
        panel.classList.add('party-active');
        setTimeout(() => panel.classList.remove('party-active'), 800);
      }

      const types = ['ribbon', 'ribbon', 'circle', 'star'];

      // 1. Launch confetti particles outward from the 4 perimeter edges of the panel
      if (panel) {
        const rect = panel.getBoundingClientRect();

        // Top edge: shoot upward & outward
        const topCount = Math.max(14, Math.floor(rect.width / 40));
        for (let i = 0; i < topCount; i++) {
          const x = rect.left + Math.random() * rect.width;
          const y = rect.top;
          const vx = (Math.random() - 0.5) * 8;
          const vy = -(Math.random() * 9 + 4);
          particles.push(createParticle(x, y, vx, vy, null, types[Math.floor(Math.random() * types.length)]));
        }

        // Bottom edge: shoot downward & outward
        const bottomCount = Math.max(14, Math.floor(rect.width / 40));
        for (let i = 0; i < bottomCount; i++) {
          const x = rect.left + Math.random() * rect.width;
          const y = rect.bottom;
          const vx = (Math.random() - 0.5) * 8;
          const vy = Math.random() * 7 + 2;
          particles.push(createParticle(x, y, vx, vy, null, types[Math.floor(Math.random() * types.length)]));
        }

        // Left edge: shoot leftward & outward
        const leftCount = Math.max(10, Math.floor(rect.height / 50));
        for (let i = 0; i < leftCount; i++) {
          const x = rect.left;
          const y = rect.top + Math.random() * rect.height;
          const vx = -(Math.random() * 9 + 4);
          const vy = (Math.random() - 0.5) * 7;
          particles.push(createParticle(x, y, vx, vy, null, types[Math.floor(Math.random() * types.length)]));
        }

        // Right edge: shoot rightward & outward
        const rightCount = Math.max(10, Math.floor(rect.height / 50));
        for (let i = 0; i < rightCount; i++) {
          const x = rect.right;
          const y = rect.top + Math.random() * rect.height;
          const vx = Math.random() * 9 + 4;
          const vy = (Math.random() - 0.5) * 7;
          particles.push(createParticle(x, y, vx, vy, null, types[Math.floor(Math.random() * types.length)]));
        }
      }

      // 2. Radial explosion directly from the double-click point
      const clickBurstCount = 28;
      for (let i = 0; i < clickBurstCount; i++) {
        const angle = (Math.PI * 2 * i) / clickBurstCount + (Math.random() - 0.5) * 0.4;
        const speed = Math.random() * 8 + 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 1.5;
        particles.push(createParticle(clientX, clientY, vx, vy, null, types[Math.floor(Math.random() * types.length)]));
      }

      // Start animation loop if not running
      if (!animId) {
        animate();
      }
    };

    const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Physics updates
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx + Math.cos(p.wobble) * 1.2;
        p.y += p.vy;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > window.innerHeight + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.type === 'ribbon') {
          // 3D flutter rotation
          const scaleY = Math.cos(p.wobble);
          ctx.scale(1, scaleY);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'star') {
          drawStar(0, 0, 4, p.size, p.size * 0.35);
        }

        ctx.restore();
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        animId = null;
      }
    };

    // Desktop double-click
    window.addEventListener('dblclick', (e) => {
      if (e.target.closest('a, button, input, textarea')) return;
      triggerParty(e.clientX, e.clientY, e.target);
    });

    // Touch device double-tap support (iPhone / Android)
    let lastTap = 0;
    window.addEventListener('touchend', (e) => {
      if (e.target.closest('a, button, input, textarea')) return;
      const now = Date.now();
      if (now - lastTap < 380 && e.changedTouches && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        triggerParty(touch.clientX, touch.clientY, e.target);
        lastTap = 0;
      } else {
        lastTap = now;
      }
    }, { passive: true });
  };

  initPartyEffect();
})();
