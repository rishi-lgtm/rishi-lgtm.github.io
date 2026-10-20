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
})();
