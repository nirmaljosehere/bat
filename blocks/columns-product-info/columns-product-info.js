/**
 * Columns Product Info
 * Two-column product summary: product copy (rating, title, subtitle, description) in the
 * first column; price, call-to-action and icon feature pills in the second.
 * Description paragraphs after the first are collapsed behind a "Read more" toggle.
 */

let moreId = 0;

function decorateFeatures(col) {
  [...col.querySelectorAll(':scope > p')].forEach((p) => {
    const picture = p.querySelector('picture');
    // icon + label paragraph => feature pill
    if (picture && p.textContent.trim()) {
      p.classList.add('columns-product-info-feature');
      const label = document.createElement('span');
      label.className = 'columns-product-info-feature-label';
      [...p.childNodes].filter((n) => n !== picture && !n.contains?.(picture))
        .forEach((n) => label.append(n));
      label.textContent = label.textContent.trim();
      picture.classList.add('columns-product-info-feature-icon');
      p.append(label);
    }
  });

  // group feature pills into one list wrapper
  const features = [...col.querySelectorAll(':scope > .columns-product-info-feature')];
  if (features.length) {
    const list = document.createElement('div');
    list.className = 'columns-product-info-features';
    features[0].before(list);
    list.append(...features);
  }

  // price: first plain-text paragraph without links or images
  const price = [...col.querySelectorAll(':scope > p')]
    .find((p) => !p.querySelector('a, picture') && p.textContent.trim());
  if (price) price.classList.add('columns-product-info-price');
  const cta = col.querySelector(':scope > .button-container');
  if (cta) cta.classList.add('columns-product-info-actions');
}

function decorateDetails(col) {
  const heading = col.querySelector(':scope > h1, :scope > h2');
  if (!heading) return;

  const head = document.createElement('div');
  head.className = 'columns-product-info-heading';

  // rating count, e.g. "(0)", authored before the title
  const before = heading.previousElementSibling;
  if (before && before.tagName === 'P' && /^\(\d+\)$/.test(before.textContent.trim())) {
    before.classList.add('columns-product-info-rating');
  }

  const subtitle = heading.nextElementSibling?.tagName === 'P' ? heading.nextElementSibling : null;
  if (subtitle) subtitle.classList.add('columns-product-info-subtitle');
  heading.classList.add('columns-product-info-title');

  // move everything up to the subtitle into the heading wrapper
  const stop = subtitle || heading;
  const headItems = [];
  let node = col.firstElementChild;
  while (node) {
    headItems.push(node);
    if (node === stop) break;
    node = node.nextElementSibling;
  }
  col.prepend(head);
  head.append(...headItems);

  const rest = [...col.children].filter((el) => el !== head);
  if (!rest.length) return;

  const description = document.createElement('div');
  description.className = 'columns-product-info-description';
  head.after(description);
  description.append(...rest);

  const [, ...more] = rest;
  if (!more.length) return;

  moreId += 1;
  const moreBox = document.createElement('div');
  moreBox.className = 'columns-product-info-more';
  moreBox.id = `columns-product-info-more-${moreId}`;
  moreBox.hidden = true;
  moreBox.append(...more);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'columns-product-info-read-more';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', moreBox.id);
  const label = document.createElement('span');
  label.className = 'columns-product-info-read-more-label';
  label.textContent = 'Read more';
  toggle.append(label);

  description.append(moreBox, toggle);
}

export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  const cols = [...firstRow.children];
  block.classList.add(`columns-product-info-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col, colIdx) => {
      col.classList.add(colIdx === 0 ? 'columns-product-info-details' : 'columns-product-info-purchase');

      const pic = col.querySelector('picture');
      if (pic && col.children.length === 1 && col.firstElementChild.contains(pic)
        && !col.textContent.trim()) {
        // picture is the only content in this column
        col.classList.add('columns-product-info-img-col');
      }

      if (colIdx === 0) decorateDetails(col);
      else decorateFeatures(col);
    });
  });

  block.addEventListener('click', (e) => {
    const toggle = e.target.closest('.columns-product-info-read-more');
    if (!toggle) return;
    const moreBox = block.querySelector(`#${toggle.getAttribute('aria-controls')}`);
    if (!moreBox) return;
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    moreBox.hidden = expanded;
    toggle.querySelector('.columns-product-info-read-more-label').textContent = expanded ? 'Read more' : 'Read less';
  });
}
