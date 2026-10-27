/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-tile-carousel variant. Base: tabs.
 * Source: https://www.vuse.com/en-gb/products/vuse-ultra-device-mclaren
 * Selector: .carousel-b carousel-b.carousel-b__wrapper
 * Model (xwalk): tabs-tile-carousel-item -> title | image | text.
 * One row per item (tile/card or text-only intro/link), grouped into tabs by title where the intro
 * heading/text comes first and every tile STARTS with its image, followed by
 * its H3 title and paragraph.
 */
function cleanHeading(document, src) {
  const h3 = document.createElement('h3');
  h3.innerHTML = src.innerHTML.replace(/\s+/g, ' ').trim();
  return h3;
}

function textPara(document, el) {
  const text = el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  if (!text) return null;
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function fieldCell(document, field, nodes) {
  const frag = document.createDocumentFragment();
  if (nodes.length) {
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
  }
  return frag;
}

// One row per item: tab title | image | text.
function itemRow(document, label, img, textNodes) {
  return [
    fieldCell(document, 'title', [document.createTextNode(label)]),
    fieldCell(document, 'image', img ? [img] : []),
    fieldCell(document, 'text', textNodes),
  ];
}

export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.carousel-b__tab'));
  const groups = Array.from(element.querySelectorAll('.carousel-b__group'));
  const cells = [];

  groups.forEach((group, i) => {
    const tabEl = tabs[i];
    const label = tabEl
      ? (tabEl.querySelector('.carousel-b__tab-text') || tabEl).textContent.replace(/\s+/g, ' ').trim()
      : `Tab ${i + 1}`;

    const items = [];
    let current = { img: null, nodes: [] };
    items.push(current);
    const nodes = { push: (n) => {
      if (n.tagName === 'IMG') { current = { img: n, nodes: [] }; items.push(current); } else { current.nodes.push(n); }
    } };

    // Intro tile (static copy preferred; the swiper copy is a duplicate)
    const intro = group.querySelector('.carousel-b__tile--intro--static')
      || group.querySelector('.carousel-b__tile--intro');
    if (intro) {
      const h = intro.querySelector('h1, h2, h3, h4, h5, h6');
      if (h) nodes.push(cleanHeading(document, h));
      const p = textPara(document, intro.querySelector('.carousel-b__tile-text'));
      if (p) nodes.push(p);
    }

    // Image tiles: image first, then heading, then lede
    const seen = new Set();
    group.querySelectorAll('.carousel-b__tile:not(.carousel-b__tile--intro)').forEach((tile) => {
      if (tile.classList.contains('swiper-slide-duplicate')) return;
      const img = tile.querySelector('.carousel-b__tile-image img, img');
      const h = tile.querySelector('.carousel-b__tile-content-headings h1, .carousel-b__tile-content-headings h2, .carousel-b__tile-content-headings h3, .carousel-b__tile-content-headings h4, h3, h4');
      const key = (img && img.getAttribute('src')) || (h && h.textContent.trim());
      if (!key || seen.has(key)) return;
      seen.add(key);
      if (img) {
        const pic = document.createElement('img');
        pic.setAttribute('src', img.getAttribute('src'));
        pic.setAttribute('alt', img.getAttribute('alt') || '');
        nodes.push(pic);
      }
      if (h) nodes.push(cleanHeading(document, h));
      const p = textPara(document, tile.querySelector('.carousel-b__tile-content-lede'));
      if (p) nodes.push(p);
    });

    items.filter((it) => it.img || it.nodes.length).forEach((it) => {
      cells.push(itemRow(document, label, it.img, it.nodes));
    });
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-tile-carousel', cells });
  element.replaceWith(block);
}
