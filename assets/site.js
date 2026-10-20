// Native anchors work without JavaScript. Preserve an explicit section choice
// at its landing position, including when a short final section is bottom-clamped.
(() => {
  const links = [...document.querySelectorAll('.section-nav a')];
  const sections = links.map(link => document.querySelector(link.hash));
  if (!sections.length || !sections.every(Boolean)) return;
  const sectionFromHash = () => sections.find(section => `#${section.id}` === window.location.hash);
  let chosenSection = sectionFromHash();
  let landingY;
  let scheduled = false;
  const updateCurrent = () => {
    scheduled = false;
    if (chosenSection && landingY !== undefined && Math.abs(window.scrollY - landingY) > 1) {
      chosenSection = undefined;
    }
    if (chosenSection) landingY = window.scrollY;
    let active = chosenSection || sections[0];
    if (!chosenSection) {
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 140) active = section;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        active = sections[sections.length - 1];
      }
    }
    links.forEach(link => {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const scheduleUpdate = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateCurrent); }
  };
  const chooseSection = section => {
    chosenSection = section;
    landingY = undefined;
    // Native anchor scrolling happens before the next animation frame.
    scheduleUpdate();
  };
  links.forEach((link, index) => link.addEventListener('click', () => chooseSection(sections[index])));
  window.addEventListener('hashchange', () => chooseSection(sectionFromHash()));
  window.addEventListener('load', () => chooseSection(sectionFromHash()));
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', () => { landingY = undefined; scheduleUpdate(); });
  scheduleUpdate();
})();
