/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-foreground variant. Base: hero.
 * Source: https://www.vuse.com/en-gb/products/vuse-ultra-device-mclaren
 * Selector: .content-block-f content-block-f.content-block-f__wrapper
 * Model (xwalk): hero-foreground
 *  Row 1: background_image (+Alt) + background_video (link to .mp4)
 *  Row 2: content_image (+Alt) + content_text (heading + paragraphs)
 */
function absUrl(url) {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

function cloneImg(document, img, fallbackAlt) {
  const el = document.createElement('img');
  el.setAttribute('src', absUrl(img.getAttribute('src')));
  el.setAttribute('alt', img.getAttribute('alt') || fallbackAlt || '');
  return el;
}

export default function parse(element, { document }) {
  const cells = [];

  // Row 1: background image + optional video URL
  const bg = element.querySelector('.content-block-f__background');
  const bgFrag = document.createDocumentFragment();
  if (bg) {
    const video = bg.querySelector('video');
    const source = bg.querySelector('source[src]');
    const videoUrl = absUrl((source && source.getAttribute('src')) || (video && video.getAttribute('src')));
    const bgImg = bg.querySelector('img');
    let imageEl = null;
    if (bgImg) imageEl = cloneImg(document, bgImg, video && video.getAttribute('alt'));
    else if (video && video.getAttribute('poster')) {
      imageEl = document.createElement('img');
      imageEl.setAttribute('src', absUrl(video.getAttribute('poster')));
      imageEl.setAttribute('alt', video.getAttribute('alt') || '');
    }
    if (imageEl) {
      bgFrag.appendChild(document.createComment(' field:background_image '));
      bgFrag.appendChild(imageEl);
    }
    if (videoUrl) {
      bgFrag.appendChild(document.createComment(' field:background_video '));
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', videoUrl);
      a.textContent = videoUrl;
      p.appendChild(a);
      bgFrag.appendChild(p);
    }
  }
  cells.push([bgFrag]);

  // Row 2: foreground image + heading + text
  const contentFrag = document.createDocumentFragment();
  const content = element.querySelector('.content-block-f__content') || element;
  const fgImg = content.querySelector('img.content-block-f__foreground-image, picture img, img');
  if (fgImg) {
    contentFrag.appendChild(document.createComment(' field:content_image '));
    contentFrag.appendChild(cloneImg(document, fgImg));
  }
  const heading = content.querySelector('.content-block-f__heading h1, .content-block-f__heading h2, .content-block-f__heading h3, h1, h2, h3');
  const ledes = Array.from(content.querySelectorAll('.content-block-f__copy > *'));
  if (heading || ledes.length) {
    contentFrag.appendChild(document.createComment(' field:content_text '));
    if (heading) contentFrag.appendChild(heading);
    ledes.forEach((el) => {
      if (!el.textContent.trim()) return;
      if (el.tagName === 'P') {
        contentFrag.appendChild(el);
      } else {
        const p = document.createElement('p');
        p.innerHTML = el.innerHTML.trim();
        contentFrag.appendChild(p);
      }
    });
  }
  cells.push([contentFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-foreground', cells });
  element.replaceWith(block);
}
