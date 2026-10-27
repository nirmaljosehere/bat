/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-product-info variant. Base: columns.
 * Source: https://www.vuse.com/en-gb/products/vuse-ultra-device-mclaren
 * Selector: main-product section.product-page
 * One row, two columns (Columns block: no xwalk field hints).
 * Col 1: rating text, H1 title, subtitle paragraph, description paragraphs.
 * Col 2: price paragraph, "Add to basket" link, icon + label feature pills.
 */
function textLines(el) {
  // Split an element's direct text (excluding nested blocks) into paragraphs
  const lines = [];
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      n.textContent.split(/\n+/).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean)
        .forEach((t) => lines.push(t));
    }
  });
  return lines;
}

export default function parse(element, { document }) {
  const left = [];
  const right = [];

  // Rating (review count)
  const rating = element.querySelector('.bat-reviews__review-count');
  if (rating && rating.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = rating.textContent.trim();
    left.push(p);
  }

  // Title (H1) + subtitle
  const titleEl = element.querySelector('.product-page__title, h1');
  if (titleEl) {
    const subtitleEl = titleEl.querySelector('.product-page__subtitle');
    const subtitle = subtitleEl ? subtitleEl.textContent.trim() : '';
    const h1 = document.createElement('h1');
    const clone = titleEl.cloneNode(true);
    const cs = clone.querySelector('.product-page__subtitle');
    if (cs) cs.remove();
    h1.textContent = clone.textContent.replace(/\s+/g, ' ').trim();
    left.push(h1);
    if (subtitle) {
      const p = document.createElement('p');
      p.textContent = subtitle;
      left.push(p);
    }
  }

  // Description paragraphs
  const desc = element.querySelector('.product-page__description');
  if (desc) {
    textLines(desc).forEach((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      left.push(p);
    });
    const more = desc.querySelector('.product-page__read-more-container');
    if (more) {
      const paras = Array.from(more.querySelectorAll('p'));
      if (paras.length) {
        paras.forEach((p) => { if (p.textContent.trim()) left.push(p); });
      } else {
        textLines(more).forEach((t) => {
          const p = document.createElement('p');
          p.textContent = t;
          left.push(p);
        });
      }
    }
  }

  // Price
  const price = element.querySelector('.product-page__price-label, .product-page__price');
  if (price && price.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = price.textContent.replace(/\s+/g, ' ').trim();
    right.push(p);
  }

  // CTA: source is a <button>, rebuild as link
  const cta = element.querySelector('.product-page__add-to-cart');
  if (cta) {
    const labelEl = cta.querySelector('.button__label') || cta;
    const label = labelEl.textContent.replace(/\s+/g, ' ').trim() || 'Add to basket';
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.setAttribute('href', cta.getAttribute('href') || '#add-to-basket');
    a.textContent = label;
    strong.appendChild(a);
    p.appendChild(strong);
    right.push(p);
  }

  // Feature pills: icon + label
  element.querySelectorAll('.product-page__usp-item').forEach((item) => {
    const img = item.querySelector('img');
    const labelEl = item.querySelector('p') || item;
    const label = labelEl.textContent.replace(/\s+/g, ' ').trim();
    if (!img && !label) return;
    const p = document.createElement('p');
    if (img) p.appendChild(img);
    if (label) p.appendChild(document.createTextNode(` ${label}`));
    right.push(p);
  });

  const cells = [[left, right]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-product-info', cells });
  element.replaceWith(block);
}
