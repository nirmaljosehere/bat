/*
 * Tabs Tile Carousel
 * Tabs whose panels are horizontally scrolling carousels of tiles.
 * Row = item: tab title | image | text. Consecutive items with the same tab
 * title are grouped into one tab, whose panel content is split into tiles:
 * every image starts a new tile; content before the first image becomes a
 * text-only intro tile.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

let blockCount = 0;

const hasPicture = (el) => el.tagName === 'PICTURE' || !!el.querySelector('picture');

function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
}

/** Group a panel cell's children into tile elements. */
function buildTiles(cell) {
  const tiles = [];
  let current = null;
  [...cell.children].forEach((el) => {
    if (!el.textContent.trim() && !hasPicture(el)) {
      el.remove();
      return;
    }
    if (hasPicture(el) || !current) {
      current = document.createElement('li');
      current.className = 'tabs-tile-carousel-tile';
      tiles.push(current);
    }
    current.append(el);
  });

  tiles.forEach((tile) => {
    const picEl = [...tile.children].find(hasPicture);
    if (!picEl) {
      tile.classList.add('tabs-tile-carousel-tile-intro');
      return;
    }
    picEl.classList.add('tabs-tile-carousel-tile-image');
    const body = document.createElement('div');
    body.className = 'tabs-tile-carousel-tile-body';
    [...tile.children].filter((c) => c !== picEl).forEach((c) => body.append(c));
    if (body.children.length) tile.append(body);
    // tiles carrying only a heading (no copy) use the light caption style
    if (!body.querySelector('p')) tile.classList.add('tabs-tile-carousel-tile-heading-only');
  });
  return tiles;
}

// intro tile sits above the carousel on small screens, inside it on desktop
const introMedia = window.matchMedia('(width >= 1024px)');

function placeIntro(panel) {
  const content = panel.querySelector('.tabs-tile-carousel-intro-content');
  if (!content) return;
  const target = introMedia.matches
    ? panel.querySelector('.tabs-tile-carousel-tile-intro')
    : panel.querySelector('.tabs-tile-carousel-intro');
  if (target && content.parentElement !== target) target.append(content);
}

function updateNav(panel) {
  const track = panel.querySelector('.tabs-tile-carousel-track');
  const prev = panel.querySelector('.tabs-tile-carousel-prev');
  const next = panel.querySelector('.tabs-tile-carousel-next');
  if (!track || !prev || !next) return;
  prev.disabled = track.scrollLeft <= 0;
  next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
}

function scrollTrack(panel, direction) {
  const track = panel.querySelector('.tabs-tile-carousel-track');
  const tile = track && [...track.querySelectorAll('.tabs-tile-carousel-tile')]
    .find((t) => t.offsetWidth > 0);
  if (!tile) return;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  track.scrollBy({ left: direction * (tile.offsetWidth + gap), behavior: 'smooth' });
}

function buildPanelCarousel(panel, cell, placeholders) {
  optimizePictures(cell);
  const tiles = buildTiles(cell);
  const track = document.createElement('ul');
  track.className = 'tabs-tile-carousel-track';
  track.append(...tiles);
  cell.replaceChildren(track);
  cell.classList.add('tabs-tile-carousel-panel-content');

  const introTile = tiles.find((t) => t.classList.contains('tabs-tile-carousel-tile-intro'));
  if (introTile) {
    const content = document.createElement('div');
    content.className = 'tabs-tile-carousel-intro-content';
    content.append(...introTile.children);
    introTile.append(content);
    const staticIntro = document.createElement('div');
    staticIntro.className = 'tabs-tile-carousel-intro';
    cell.prepend(staticIntro);
    placeIntro(panel);
    introMedia.addEventListener('change', () => placeIntro(panel));
  }

  if (tiles.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'tabs-tile-carousel-nav';
    nav.innerHTML = `
      <button type="button" class="tabs-tile-carousel-prev" aria-label="${placeholders.previousSlide || 'Previous'}"></button>
      <button type="button" class="tabs-tile-carousel-next" aria-label="${placeholders.nextSlide || 'Next'}"></button>
    `;
    nav.querySelector('.tabs-tile-carousel-prev').addEventListener('click', () => scrollTrack(panel, -1));
    nav.querySelector('.tabs-tile-carousel-next').addEventListener('click', () => scrollTrack(panel, 1));
    track.addEventListener('scroll', () => updateNav(panel), { passive: true });
    cell.append(nav);
    // recompute when the track gets its real size (section revealed, tab shown, resize)
    const resizeObserver = new ResizeObserver(() => updateNav(panel));
    resizeObserver.observe(track);
  }
}

/**
 * Group consecutive item rows (tab title | image | text) that share a tab title
 * into one row per tab: [label cell, content cell]. Each item contributes its
 * image (wrapped in a paragraph) followed by its text.
 */
function groupRows(block) {
  const tabs = [];
  [...block.children].forEach((row) => {
    const [titleCell, imageCell, textCell] = row.children;
    const label = titleCell ? titleCell.textContent.trim() : '';
    let tab = tabs[tabs.length - 1];
    if (!tab || (label && label !== tab.label)) {
      const tabRow = document.createElement('div');
      const labelCell = document.createElement('div');
      labelCell.innerHTML = titleCell ? titleCell.innerHTML : '';
      const contentCell = document.createElement('div');
      tabRow.append(labelCell, contentCell);
      tab = { label, row: tabRow, content: contentCell };
      tabs.push(tab);
    }
    const parts = [];
    const pic = imageCell && imageCell.querySelector('picture');
    if (pic) {
      const p = document.createElement('p');
      p.append(pic);
      parts.push(p);
    }
    if (textCell) {
      if (!textCell.children.length && textCell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = textCell.textContent.trim();
        parts.push(p);
      } else {
        parts.push(...textCell.children);
      }
    }
    if (parts.length) moveInstrumentation(row, parts[0]);
    tab.content.append(...parts);
    row.remove();
  });
  block.append(...tabs.map((t) => t.row));
}

export default async function decorate(block) {
  blockCount += 1;
  groupRows(block);
  const placeholders = await fetchPlaceholders();

  const tablist = document.createElement('div');
  tablist.className = 'tabs-tile-carousel-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tabs-tile-carousel-list-${blockCount}`;

  const rows = [...block.children].filter((row) => row.firstElementChild
    && row.firstElementChild.textContent.trim());

  const panels = [];
  const buttons = [];

  const activate = (index) => {
    panels.forEach((p, i) => p.setAttribute('aria-hidden', i !== index));
    buttons.forEach((b, i) => {
      b.setAttribute('aria-selected', i === index);
      b.tabIndex = i === index ? 0 : -1;
    });
    updateNav(panels[index]);
  };

  rows.forEach((row, i) => {
    const id = `tabs-tile-carousel-${blockCount}-panel-${i + 1}`;
    const [labelCell, contentCell] = row.children;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-tile-carousel-tab';
    button.id = `tab-${id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', id);
    button.innerHTML = labelCell.innerHTML;
    if (button.firstElementChild) moveInstrumentation(button.firstElementChild, null);
    button.addEventListener('click', () => activate(i));
    buttons.push(button);
    tablist.append(button);
    labelCell.remove();

    row.className = 'tabs-tile-carousel-panel';
    row.id = id;
    row.setAttribute('role', 'tabpanel');
    row.setAttribute('aria-labelledby', button.id);
    panels.push(row);

    if (contentCell) buildPanelCarousel(row, contentCell, placeholders);
  });

  tablist.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (current + delta + buttons.length) % buttons.length;
    buttons[nextIndex].focus();
    activate(nextIndex);
  });

  block.prepend(tablist);
  if (panels.length) activate(0);
}
