/*
 * Tabs Product Cards
 * Tabs whose panels are horizontally scrolling carousels of product cards.
 * Row = item: tab title | image | text. Consecutive items with the same tab
 * title are grouped into one tab, whose panel content is:
 *  - a paragraph holding only a link, placed before the first card image, is the
 *    panel's "View all" action (shown beside the tab list while the tab is active);
 *  - every image starts a new product card; the following elements (badge, price,
 *    H3 name, links) belong to that card.
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

let blockCount = 0;

const hasPicture = (el) => el.tagName === 'PICTURE' || !!el.querySelector('picture');

const isLinkOnly = (el) => {
  const links = el.querySelectorAll('a[href]');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim();
};

function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
}

const isStrongOnly = (el) => {
  const strong = el.querySelector('strong, b');
  return !!strong && el.textContent.trim() === strong.textContent.trim();
};

const div = (className) => {
  const el = document.createElement('div');
  el.className = className;
  return el;
};

/**
 * Arrange a card (image + following elements) like the source product card:
 *  - header: elements before the heading; badges on the left, and the bold price
 *    plus anything after it (subscription price) on the right;
 *  - image;
 *  - body: info (heading + subtitle) beside the action link(s).
 */
function structureCard(card) {
  const [picEl, ...rest] = card.children;
  picEl.classList.add('tabs-product-cards-card-image');
  const headingIndex = rest.findIndex((el) => el.matches('h1, h2, h3, h4, h5, h6'));
  const pre = headingIndex >= 0 ? rest.slice(0, headingIndex) : [];
  const post = headingIndex >= 0 ? rest.slice(headingIndex) : rest;

  if (pre.length) {
    const header = div('tabs-product-cards-card-header');
    const badges = div('tabs-product-cards-card-badges');
    const pricing = div('tabs-product-cards-card-pricing');
    let inPricing = false;
    pre.forEach((el) => {
      if (!inPricing && isStrongOnly(el)) {
        inPricing = true;
        el.classList.add('tabs-product-cards-card-price');
      } else if (inPricing) {
        el.classList.add('tabs-product-cards-card-subscription');
      } else {
        el.classList.add('tabs-product-cards-card-badge');
      }
      (inPricing ? pricing : badges).append(el);
    });
    header.append(badges, pricing);
    card.prepend(header);
  }

  const body = div('tabs-product-cards-card-body');
  const info = div('tabs-product-cards-card-info');
  const actions = div('tabs-product-cards-card-actions');
  post.forEach((el) => {
    if (el.matches('h1, h2, h3, h4, h5, h6')) {
      el.classList.add('tabs-product-cards-card-title');
      info.append(el);
    } else if (el.querySelector('a') && isLinkOnly(el)) {
      el.classList.add('tabs-product-cards-card-cta');
      actions.append(el);
    } else {
      el.classList.add('tabs-product-cards-card-subtitle');
      info.append(el);
    }
  });
  body.append(info);
  if (actions.children.length) body.append(actions);
  card.append(body);
}

/** Split a panel cell into { action, intro[], cards[] }. */
function parsePanel(cell) {
  const result = { action: null, intro: [], cards: [] };
  let current = null;
  [...cell.children].forEach((el) => {
    if (!el.textContent.trim() && !hasPicture(el)) {
      el.remove();
      return;
    }
    if (hasPicture(el)) {
      current = document.createElement('li');
      current.className = 'tabs-product-cards-card';
      result.cards.push(current);
      current.append(el);
      return;
    }
    if (current) {
      current.append(el);
    } else if (!result.action && isLinkOnly(el)) {
      result.action = el;
    } else {
      result.intro.push(el);
    }
  });

  result.cards.forEach(structureCard);
  return result;
}

function updateNav(panel) {
  const track = panel && panel.querySelector('.tabs-product-cards-track');
  const prev = panel && panel.querySelector('.tabs-product-cards-prev');
  const next = panel && panel.querySelector('.tabs-product-cards-next');
  if (!track || !prev || !next) return;
  prev.disabled = track.scrollLeft <= 0;
  next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
}

function scrollTrack(panel, direction) {
  const track = panel.querySelector('.tabs-product-cards-track');
  const card = track && track.querySelector('.tabs-product-cards-card');
  if (!card) return;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' });
}

function buildPanel(panel, cell, placeholders) {
  optimizePictures(cell);
  const { action, intro, cards } = parsePanel(cell);

  cell.replaceChildren();
  cell.classList.add('tabs-product-cards-panel-content');
  if (intro.length) {
    const introEl = document.createElement('div');
    introEl.className = 'tabs-product-cards-intro';
    introEl.append(...intro);
    cell.append(introEl);
  }
  const track = document.createElement('ul');
  track.className = 'tabs-product-cards-track';
  track.append(...cards);
  cell.append(track);

  if (cards.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'tabs-product-cards-nav';
    nav.innerHTML = `
      <button type="button" class="tabs-product-cards-prev" aria-label="${placeholders.previousSlide || 'Previous'}"></button>
      <button type="button" class="tabs-product-cards-next" aria-label="${placeholders.nextSlide || 'Next'}"></button>
    `;
    nav.querySelector('.tabs-product-cards-prev').addEventListener('click', () => scrollTrack(panel, -1));
    nav.querySelector('.tabs-product-cards-next').addEventListener('click', () => scrollTrack(panel, 1));
    track.addEventListener('scroll', () => updateNav(panel), { passive: true });
    // the section is hidden while the block decorates: recompute once laid out / resized
    new ResizeObserver(() => updateNav(panel)).observe(track);
    cell.append(nav);
  }

  if (action) action.classList.add('tabs-product-cards-action');
  return action;
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

  const header = document.createElement('div');
  header.className = 'tabs-product-cards-header';
  const tablist = document.createElement('div');
  tablist.className = 'tabs-product-cards-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tabs-product-cards-list-${blockCount}`;
  const actions = document.createElement('div');
  actions.className = 'tabs-product-cards-actions';
  header.append(tablist, actions);

  const rows = [...block.children].filter((row) => row.firstElementChild
    && row.firstElementChild.textContent.trim());

  const panels = [];
  const buttons = [];
  const panelActions = [];

  const activate = (index) => {
    panels.forEach((p, i) => p.setAttribute('aria-hidden', i !== index));
    buttons.forEach((b, i) => {
      b.setAttribute('aria-selected', i === index);
      b.tabIndex = i === index ? 0 : -1;
    });
    panelActions.forEach((a, i) => {
      if (a) a.hidden = i !== index;
    });
    updateNav(panels[index]);
  };

  rows.forEach((row, i) => {
    const id = `tabs-product-cards-${blockCount}-panel-${i + 1}`;
    const [labelCell, contentCell] = row.children;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-product-cards-tab';
    button.id = `tab-${id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', id);
    button.innerHTML = labelCell.innerHTML;
    if (button.firstElementChild) moveInstrumentation(button.firstElementChild, null);
    button.addEventListener('click', () => activate(i));
    buttons.push(button);
    tablist.append(button);
    labelCell.remove();

    row.className = 'tabs-product-cards-panel';
    row.id = id;
    row.setAttribute('role', 'tabpanel');
    row.setAttribute('aria-labelledby', button.id);
    panels.push(row);

    const action = contentCell ? buildPanel(row, contentCell, placeholders) : null;
    if (action) actions.append(action);
    panelActions.push(action);
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

  block.prepend(header);
  if (panels.length) activate(0);
}
