/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-product-cards variant. Base: tabs.
 * Source: https://www.vuse.com/en-gb/products/vuse-ultra-device-mclaren
 * Selector: .product-card-carousel product-card-carousel.product-card-carousel__wrapper
 * Model (xwalk): tabs-product-cards-item -> title | image | text.
 * One row per item (tile/card or text-only intro/link), grouped into tabs by title:
 *  - optional first paragraph with only the "View all" link (before first image);
 *  - per product card: packshot image FIRST, then badge, price, H3 name,
 *    subtitle and a link to the product detail page.
 */
function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function para(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function linkPara(document, href, text) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = text;
  p.appendChild(a);
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
  const tabs = Array.from(element.querySelectorAll('.product-card-carousel__tab'));
  const groups = Array.from(element.querySelectorAll('.product-card-carousel__group'));
  const cells = [];

  groups.forEach((group, i) => {
    const tabEl = tabs[i];
    const label = tabEl
      ? clean((tabEl.querySelector('.product-card-carousel__tab-text') || tabEl).textContent)
      : `Tab ${i + 1}`;

    const items = [];
    let current = { img: null, nodes: [] };
    items.push(current);
    const nodes = { push: (n) => {
      if (n.tagName === 'IMG') { current = { img: n, nodes: [] }; items.push(current); } else { current.nodes.push(n); }
    } };

    // Per-tab "View all" link
    const viewAll = element.querySelector(`.product-card-carousel__button--tab-${i + 1} a[href]`);
    if (viewAll) {
      const text = clean((viewAll.querySelector('.button__label') || viewAll).textContent) || 'View all';
      nodes.push(linkPara(document, viewAll.getAttribute('href'), text));
    }

    // Product cards
    const seen = new Set();
    group.querySelectorAll('product-card, .product-card').forEach((card) => {
      if (card.closest('.swiper-slide-duplicate')) return;
      const titleLink = card.querySelector('.product-card__title a[href]');
      const imageLink = card.querySelector('.product-card__image-link[href]');
      const href = (titleLink && titleLink.getAttribute('href'))
        || (imageLink && imageLink.getAttribute('href'));
      const img = card.querySelector('.product-card__image img, .product-card__image-container img');
      const key = href || (img && img.getAttribute('src'));
      if (!key || seen.has(key)) return;
      seen.add(key);

      // Packshot first (starts the card)
      if (img) {
        const pic = document.createElement('img');
        pic.setAttribute('src', img.getAttribute('src'));
        pic.setAttribute('alt', img.getAttribute('alt') || '');
        nodes.push(pic);
      }

      // Badge
      const badge = card.querySelector('.product-card__badge-container .badge');
      if (badge && clean(badge.textContent)) nodes.push(para(document, clean(badge.textContent)));

      // Price (+ subscription price)
      const price = card.querySelector('.product-card__pricing-label');
      if (price && clean(price.textContent)) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = clean(price.textContent);
        p.appendChild(strong);
        nodes.push(p);
      }
      const sub = card.querySelector('.product-card__pricing-subscription');
      if (sub && clean(sub.textContent)) nodes.push(para(document, clean(sub.textContent)));

      // Name (H3) + subtitle
      const titleEl = card.querySelector('.product-card__title');
      let name = '';
      let subtitle = '';
      if (titleEl) {
        const subEl = titleEl.querySelector('.product-card__subtitle-condensed');
        subtitle = subEl ? clean(subEl.textContent) : '';
        const clone = titleEl.cloneNode(true);
        const cs = clone.querySelector('.product-card__subtitle-condensed');
        if (cs) cs.remove();
        name = clean(clone.textContent);
      }
      if (name) {
        const h3 = document.createElement('h3');
        h3.textContent = name;
        nodes.push(h3);
      }
      if (subtitle) nodes.push(para(document, subtitle));

      // Link to product detail page (source CTA label, e.g. "Add")
      if (href) {
        const ctaLabelEl = card.querySelector('.product-card__actions .button__label');
        const ctaText = (ctaLabelEl && clean(ctaLabelEl.textContent)) || 'Shop now';
        nodes.push(linkPara(document, href, ctaText));
      }
    });

    items.filter((it) => it.img || it.nodes.length).forEach((it) => {
      cells.push(itemRow(document, label, it.img, it.nodes));
    });
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-product-cards', cells });
  element.replaceWith(block);
}
