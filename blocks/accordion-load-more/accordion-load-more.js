/*
 * Accordion Load More
 * Expand/collapse Q&A items; only the first PAGE_SIZE items are shown and
 * each click on "Load More" reveals the next PAGE_SIZE items.
 */
import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

const PAGE_SIZE = 5;

const PLUS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 12H19M12 5V19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function createIcon(className) {
  const icon = document.createElement('span');
  icon.className = className;
  icon.innerHTML = PLUS_ICON;
  return icon;
}

/**
 * The section heading authored as "Line one<br>Line two" shows its second
 * line in a heavier weight on the source; wrap that line in a span so it can
 * be styled. Only touches the heading directly preceding this block.
 */
function decorateSectionHeading(block) {
  const wrapper = block.closest('.accordion-load-more-wrapper');
  const prev = wrapper && wrapper.previousElementSibling;
  if (!prev || !prev.classList.contains('default-content-wrapper')) return;
  const heading = prev.querySelector(':scope > h2:last-child');
  if (!heading || heading.querySelector('.accordion-load-more-heading-emphasis')) return;
  const breaks = heading.querySelectorAll(':scope > br');
  if (!breaks.length) return;
  const lastBreak = breaks[breaks.length - 1];
  const rest = [];
  let node = lastBreak.nextSibling;
  while (node) {
    rest.push(node);
    node = node.nextSibling;
  }
  if (!rest.some((n) => n.textContent.trim())) return;
  const span = document.createElement('span');
  span.className = 'accordion-load-more-heading-emphasis';
  span.append(...rest);
  heading.append(span);
}

export default async function decorate(block) {
  decorateSectionHeading(block);

  const items = [];
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const body = row.children[1] || document.createElement('div');
    if (!label) return;

    const summary = document.createElement('summary');
    summary.className = 'accordion-load-more-item-label';
    summary.append(...label.childNodes, createIcon('accordion-load-more-item-icon'));

    body.className = 'accordion-load-more-item-body';

    const details = document.createElement('details');
    moveInstrumentation(row, details);
    details.className = 'accordion-load-more-item';
    details.append(summary, body);
    row.replaceWith(details);
    items.push(details);
  });

  if (items.length <= PAGE_SIZE) return;

  // keep every item visible in the Universal Editor so authors can edit them
  const inEditor = !!block.closest('[data-aue-resource]') || document.documentElement.classList.contains('adobe-ue-edit');
  if (inEditor) return;

  const placeholders = await fetchPlaceholders();
  items.slice(PAGE_SIZE).forEach((item) => {
    item.hidden = true;
    item.classList.add('accordion-load-more-item-hidden');
  });

  const actions = document.createElement('div');
  actions.className = 'accordion-load-more-actions';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'accordion-load-more-button';
  const label = document.createElement('span');
  label.className = 'accordion-load-more-button-label';
  label.textContent = placeholders.loadMore || 'Load More';
  button.append(label, createIcon('accordion-load-more-button-icon'));
  button.addEventListener('click', () => {
    const hidden = [...block.querySelectorAll('.accordion-load-more-item-hidden')];
    hidden.slice(0, PAGE_SIZE).forEach((item) => {
      item.hidden = false;
      item.classList.remove('accordion-load-more-item-hidden');
    });
    if (hidden.length <= PAGE_SIZE) {
      // button goes away with the last batch; keep keyboard focus in the list
      hidden[0].querySelector('summary').focus();
      actions.remove();
    }
  });
  actions.append(button);
  block.append(actions);
}
