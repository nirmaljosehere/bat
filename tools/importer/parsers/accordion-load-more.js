/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-load-more variant. Base: accordion.
 * Source: https://www.vuse.com/en-gb/products/vuse-ultra-device-mclaren
 * Selector: .content-block-g .content-block-g__block-table
 * Model (xwalk): accordion-load-more-item -> summary (text), text (richtext).
 * One row per FAQ item (all items, including those hidden behind "Load more").
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('site-accordion, .content-block-g-accordion'))
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
  const cells = [];

  items.forEach((item) => {
    const labelEl = item.querySelector('.accordion__label, .content-block-g-accordion__label, .accordion__button');
    const question = labelEl ? labelEl.textContent.replace(/\s+/g, ' ').trim() : '';
    const panel = item.querySelector('.content-block-g-accordion__wrapper, .accordion__panel');
    if (!question && !panel) return;

    const qFrag = document.createDocumentFragment();
    if (question) {
      qFrag.appendChild(document.createComment(' field:summary '));
      qFrag.appendChild(document.createTextNode(question));
    }

    const aFrag = document.createDocumentFragment();
    if (panel) {
      const nodes = Array.from(panel.children).filter((c) => c.textContent.replace(/ /g, ' ').trim() || c.querySelector('img'));
      if (nodes.length) {
        aFrag.appendChild(document.createComment(' field:text '));
        nodes.forEach((n) => aFrag.appendChild(n));
      } else if (panel.textContent.trim()) {
        aFrag.appendChild(document.createComment(' field:text '));
        const p = document.createElement('p');
        p.textContent = panel.textContent.replace(/\s+/g, ' ').trim();
        aFrag.appendChild(p);
      }
    }

    cells.push([qFrag, aFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-load-more', cells });
  element.replaceWith(block);
}
