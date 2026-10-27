import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

const VIDEO_RE = /\.(mp4|webm|ogg|mov)(\?|#|$)/i;

/**
 * Find a video URL inside a cell: either a link whose href is a video file,
 * or a plain-text paragraph holding a video URL (UE text field).
 * The source element is removed from the cell.
 */
function extractVideoUrl(cell) {
  const link = [...cell.querySelectorAll('a[href]')].find((a) => VIDEO_RE.test(a.href));
  if (link) {
    const url = link.href;
    const wrapper = link.closest('p') || link;
    wrapper.remove();
    return url;
  }
  const textEl = [...cell.querySelectorAll('p')].find((p) => !p.querySelector('picture')
    && VIDEO_RE.test(p.textContent.trim()));
  if (textEl) {
    const url = textEl.textContent.trim();
    textEl.remove();
    return url;
  }
  return null;
}

function buildVideo(url, picture) {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('muted', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  const img = picture && picture.querySelector('img');
  if (img) {
    video.poster = img.currentSrc || img.src;
    if (img.alt) video.setAttribute('aria-label', img.alt);
  }
  const source = document.createElement('source');
  source.src = url;
  video.append(source);
  return video;
}

function createSlide(row, idx, galleryId) {
  const slide = document.createElement('li');
  slide.className = 'carousel-gallery-slide';
  slide.dataset.slideIndex = idx;
  slide.id = `carousel-gallery-${galleryId}-slide-${idx}`;
  moveInstrumentation(row, slide);

  const cells = [...row.children];
  const media = cells[0];
  if (media) {
    media.className = 'carousel-gallery-slide-media';
    const videoUrl = extractVideoUrl(row);
    media.querySelectorAll('picture > img').forEach((img) => {
      const optimized = createOptimizedPicture(img.src, img.alt, idx === 0, [{ width: '750' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      img.closest('picture').replaceWith(optimized);
    });
    if (videoUrl) {
      const picture = media.querySelector('picture');
      const video = buildVideo(videoUrl, picture);
      if (picture) picture.replaceWith(video);
      else media.append(video);
      slide.classList.add('carousel-gallery-slide-video');
    }
    slide.append(media);
  }

  const content = cells[1];
  if (content && content.textContent.trim()) {
    content.className = 'carousel-gallery-slide-content';
    slide.append(content);
  }
  return slide;
}

const ARROW_SVG = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8.33331 20H31.6666M31.6666 20L20 8.33331M31.6666 20L20 31.6666" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`;

function getStep(track) {
  const slide = track.querySelector('.carousel-gallery-slide');
  if (!slide) return 0;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  return slide.offsetWidth + gap;
}

function updateState(block) {
  const track = block.querySelector('.carousel-gallery-slides');
  if (!track) return;
  const maxScroll = track.scrollWidth - track.clientWidth - 1;
  const prev = block.querySelector('.carousel-gallery-prev');
  const next = block.querySelector('.carousel-gallery-next');
  if (prev) prev.disabled = track.scrollLeft <= 0;
  if (next) next.disabled = track.scrollLeft >= maxScroll;

  const bullets = [...block.querySelectorAll('.carousel-gallery-bullet')];
  if (!bullets.length) return;
  const step = getStep(track);
  let active = step ? Math.round(track.scrollLeft / step) : 0;
  if (track.scrollLeft >= maxScroll && maxScroll > 0) active = bullets.length - 1;
  active = Math.min(Math.max(active, 0), bullets.length - 1);
  bullets.forEach((bullet, i) => {
    const isActive = i === active;
    bullet.classList.toggle('active', isActive);
    bullet.classList.toggle('visible', Math.abs(i - active) <= 1);
    if (isActive) bullet.setAttribute('aria-current', 'true');
    else bullet.removeAttribute('aria-current');
  });
}

function scrollToIndex(track, index) {
  track.scrollTo({ left: index * getStep(track), behavior: 'smooth' });
}

function scrollByStep(track, direction) {
  track.scrollBy({ left: direction * getStep(track), behavior: 'smooth' });
}

function buildNavButton(cls, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = cls;
  button.setAttribute('aria-label', label);
  button.innerHTML = `<span class="carousel-gallery-icon"><span>${ARROW_SVG}</span><span>${ARROW_SVG}</span></span>`;
  return button;
}

let galleryCount = 0;

export default async function decorate(block) {
  galleryCount += 1;
  const galleryId = galleryCount;
  block.id = `carousel-gallery-${galleryId}`;

  const placeholders = await fetchPlaceholders();
  block.setAttribute('role', 'region');
  const { carousel: roleDescription } = placeholders;
  block.setAttribute('aria-roledescription', roleDescription || 'Carousel');

  const rows = [...block.children];
  const container = document.createElement('div');
  container.className = 'carousel-gallery-slides-container';
  const track = document.createElement('ul');
  track.className = 'carousel-gallery-slides';

  rows.forEach((row, idx) => {
    track.append(createSlide(row, idx, galleryId));
    row.remove();
  });
  container.append(track);
  block.append(container);

  if (rows.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'carousel-gallery-navigation';
    const prev = buildNavButton('carousel-gallery-prev', placeholders.previousSlide || 'Previous Slide');
    const next = buildNavButton('carousel-gallery-next', placeholders.nextSlide || 'Next Slide');
    nav.append(prev, next);
    container.append(nav);

    const pagination = document.createElement('div');
    pagination.className = 'carousel-gallery-pagination';
    rows.forEach((row, idx) => {
      const bullet = document.createElement('button');
      bullet.type = 'button';
      bullet.className = 'carousel-gallery-bullet';
      bullet.dataset.slideIndex = idx;
      bullet.setAttribute('aria-label', `${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}`);
      bullet.setAttribute('aria-controls', `carousel-gallery-${galleryId}-slide-${idx}`);
      pagination.append(bullet);
    });
    block.append(pagination);

    nav.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      scrollByStep(track, button === prev ? -1 : 1);
    });
    pagination.addEventListener('click', (e) => {
      const bullet = e.target.closest('.carousel-gallery-bullet');
      if (bullet) scrollToIndex(track, Number(bullet.dataset.slideIndex));
    });
    track.addEventListener('scroll', () => updateState(block), { passive: true });
    // section is hidden until loaded; recompute once the track has real dimensions
    new ResizeObserver(() => updateState(block)).observe(track);
  }

  updateState(block);
}
