export default function decorate(block) {
  const cells = [...block.children].flatMap((row) => [...row.children]);
  const backgroundElement = cells[0]?.lastElementChild;
  const background = backgroundElement?.textContent.trim().toLowerCase();
  const hasBackground = ['white', 'black', 'blue'].includes(background)
    && (cells.length > 1 || cells[0].querySelector('picture, img')
      || backgroundElement.dataset.aueProp === 'image_background')
    && backgroundElement.matches('p')
    && !backgroundElement.querySelector('picture, img');
  if (hasBackground) {
    block.dataset.background = background;
    backgroundElement.remove();
  }
  const media = cells.find((cell) => cell.querySelector('picture, img'));
  const content = document.createElement('div');
  content.className = 'hero-content';

  cells.filter((cell) => cell !== media && cell.textContent.trim()).forEach((cell, index) => {
    cell.classList.add(index === 0 ? 'hero-headline' : 'hero-description');
    content.append(cell);
  });

  if (media) media.classList.add('hero-media');
  const layouts = ['image-left', 'image-right', 'image-top', 'image-bottom'];
  block.classList.toggle('hero-overlay', !layouts.some((layout) => block.classList.contains(layout)));
  block.classList.toggle('hero-has-image', Boolean(media));
  block.classList.toggle('hero-has-content', Boolean(content.children.length));
  block.replaceChildren(...[media, content.children.length ? content : null].filter(Boolean));
}
