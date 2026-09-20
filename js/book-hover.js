(() => {
  const container = document.querySelector('.book-container');
  const book = container?.querySelector('.book');
  if (!book || !window.matchMedia('(pointer: fine)').matches) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reset = () => {
    book.style.transform = '';
  };

  container.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const bounds = container.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    book.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
  });

  container.addEventListener('pointerleave', reset);
  reducedMotion.addEventListener('change', reset);
})();
