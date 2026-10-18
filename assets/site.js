// Native anchors work without JavaScript. This tracks the current section.
(() => {
  const links = [...document.querySelectorAll('.rg-nav a')];
  const sections = links.map(link => document.querySelector(link.hash));
  if (!sections.every(Boolean) || !('IntersectionObserver' in window)) return;
  const setCurrent = id => links.forEach(link => {
    if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting);
    if (visible.length) setCurrent(visible[visible.length - 1].target.id);
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));
  links.forEach(link => link.addEventListener('click', () => setCurrent(link.hash.slice(1))));
})();
