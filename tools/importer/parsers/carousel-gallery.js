/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-gallery variant. Base: carousel.
 * Source: https://www.vuse.com/en-gb/products/vuse-ultra-device-mclaren
 * Selector: .carousel-a-section .carousel-a
 * Model (xwalk): carousel-gallery-item -> media_image (+media_imageAlt), media_video, content_text.
 * Each row = one slide. Cell 1: image first, then optional link to .mp4 (image becomes poster).
 * Cell 2: optional caption (none in source, left empty).
 */
function absUrl(url) {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll('.carousel-a__image-slide'))
    .filter((s) => !s.classList.contains('swiper-slide-duplicate'));
  const cells = [];
  const seen = new Set();

  slides.forEach((slide) => {
    // Live swiper may render cloned slide sets; keep each unique media once
    const keyEl = slide.querySelector('video source[src], img[src]');
    const key = keyEl ? keyEl.getAttribute('src').split('?')[0] : null;
    if (key) {
      if (seen.has(key)) return;
      seen.add(key);
    }

    const video = slide.querySelector('video');
    const source = slide.querySelector('video source[src], source[src]');
    let videoUrl = null;
    if (source) videoUrl = absUrl(source.getAttribute('src'));
    else if (video && video.getAttribute('src')) videoUrl = absUrl(video.getAttribute('src'));

    let img = slide.querySelector('img');
    if (!img && video && video.getAttribute('poster')) {
      img = document.createElement('img');
      img.setAttribute('src', absUrl(video.getAttribute('poster')));
      img.setAttribute('alt', video.getAttribute('aria-label') || '');
    }
    if (!img && !videoUrl) return;

    // Detach image from the <video> (img inside video would be lost)
    let imageEl = null;
    if (img) {
      imageEl = document.createElement('img');
      imageEl.setAttribute('src', img.getAttribute('src'));
      imageEl.setAttribute('alt', img.getAttribute('alt') || '');
    }

    const mediaFrag = document.createDocumentFragment();
    if (imageEl) {
      mediaFrag.appendChild(document.createComment(' field:media_image '));
      mediaFrag.appendChild(imageEl);
    }
    if (videoUrl) {
      mediaFrag.appendChild(document.createComment(' field:media_video '));
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', videoUrl);
      a.textContent = videoUrl;
      p.appendChild(a);
      mediaFrag.appendChild(p);
    }

    // Caption cell: no caption in source -> empty cell (no field hint)
    cells.push([mediaFrag, '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-gallery', cells });
  element.replaceWith(block);
}
