import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDEO_RE = /\.(mp4|webm|ogg|mov)(\?|#|$)/i;

function optimize(picture, eager, breakpoints) {
  const img = picture.querySelector('img');
  if (!img) return picture;
  const optimized = createOptimizedPicture(img.src, img.alt, eager, breakpoints);
  moveInstrumentation(img, optimized.querySelector('img'));
  picture.replaceWith(optimized);
  return optimized;
}

/** Pull a video URL out of a cell (video link, or plain-text URL) and remove its source element. */
function extractVideoUrl(cell) {
  const link = [...cell.querySelectorAll('a[href]')].find((a) => VIDEO_RE.test(a.href));
  if (link) {
    const url = link.href;
    (link.closest('p') || link).remove();
    return url;
  }
  const p = [...cell.querySelectorAll('p')].find((el) => !el.querySelector('picture')
    && VIDEO_RE.test(el.textContent.trim()));
  if (p) {
    const url = p.textContent.trim();
    p.remove();
    return url;
  }
  return null;
}

function buildBackgroundVideo(url, poster) {
  const video = document.createElement('video');
  video.className = 'hero-foreground-video';
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('aria-hidden', 'true');
  if (poster) video.poster = poster;
  const source = document.createElement('source');
  source.src = url;
  video.append(source);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.autoplay = false;
  }
  return video;
}

/**
 * Source design sets the last line of a multi-line heading in a heavier weight
 * ("Ultra<br>Exclusive."). Wrap the text after the last <br> so it can be styled,
 * unless the author already marked it up.
 */
function emphasizeLastLine(heading) {
  const brs = heading.querySelectorAll('br');
  if (!brs.length || heading.querySelector('strong, b, span')) return;
  const lastBr = brs[brs.length - 1];
  const trailing = [];
  let node = lastBr.nextSibling;
  while (node) {
    trailing.push(node);
    node = node.nextSibling;
  }
  if (!trailing.some((n) => n.textContent.trim())) return;
  const span = document.createElement('span');
  span.className = 'hero-foreground-heading-emphasis';
  span.append(...trailing);
  lastBr.after(span);
}

/**
 * Hero Foreground
 * Row 1: background image (optionally with a video URL; the image is the poster).
 * Row 2: foreground product image + heading/text overlaid on the background.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const bgRow = rows.length > 1 ? rows[0] : null;
  const contentRow = rows.length > 1 ? rows[1] : rows[0];

  if (bgRow) {
    bgRow.className = 'hero-foreground-background';
    const videoUrl = extractVideoUrl(bgRow);
    let picture = bgRow.querySelector('picture');
    if (picture) picture = optimize(picture, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]);
    if (videoUrl) {
      const img = picture && picture.querySelector('img');
      const video = buildBackgroundVideo(videoUrl, img && (img.currentSrc || img.src));
      (picture || bgRow.firstElementChild || bgRow).after(video);
      block.classList.add('hero-foreground-has-video');
    }
    // drop now-empty wrappers left behind by the extracted link
    bgRow.querySelectorAll('p').forEach((p) => {
      if (!p.children.length && !p.textContent.trim()) p.remove();
    });
  }

  if (contentRow) {
    contentRow.className = 'hero-foreground-content';
    const cell = contentRow.firstElementChild || contentRow;
    const fgPicture = cell.querySelector('picture');
    if (fgPicture) {
      const optimized = optimize(fgPicture, true, [{ media: '(min-width: 768px)', width: '1500' }, { width: '750' }]);
      const wrapper = document.createElement('div');
      wrapper.className = 'hero-foreground-image';
      const holder = optimized.parentElement;
      wrapper.append(optimized);
      if (holder && holder !== cell && holder.tagName === 'P' && !holder.textContent.trim()) {
        holder.replaceWith(wrapper);
      } else {
        cell.prepend(wrapper);
      }
    }
    const text = document.createElement('div');
    text.className = 'hero-foreground-text';
    const copy = document.createElement('div');
    copy.className = 'hero-foreground-copy';
    [...cell.children].filter((el) => !el.classList.contains('hero-foreground-image'))
      .forEach((el) => {
        if (/^H[1-6]$/.test(el.tagName) && !copy.children.length) {
          emphasizeLastLine(el);
          text.append(el);
        } else {
          copy.append(el);
        }
      });
    if (copy.children.length) text.append(copy);
    cell.append(text);
  }

  // any further rows are treated as additional copy
  rows.slice(2).forEach((row) => {
    const text = block.querySelector('.hero-foreground-text');
    if (text) {
      let copy = text.querySelector('.hero-foreground-copy');
      if (!copy) {
        copy = document.createElement('div');
        copy.className = 'hero-foreground-copy';
        text.append(copy);
      }
      copy.append(...row.querySelectorAll(':scope > div > *'));
    }
    row.remove();
  });
}
