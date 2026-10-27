/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-products.js
  var import_products_exports = {};
  __export(import_products_exports, {
    default: () => import_products_default
  });

  // tools/importer/parsers/carousel-gallery.js
  function absUrl(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    return url;
  }
  function parse(element, { document }) {
    const slides = Array.from(element.querySelectorAll(".carousel-a__image-slide")).filter((s) => !s.classList.contains("swiper-slide-duplicate"));
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    slides.forEach((slide) => {
      const keyEl = slide.querySelector("video source[src], img[src]");
      const key = keyEl ? keyEl.getAttribute("src").split("?")[0] : null;
      if (key) {
        if (seen.has(key)) return;
        seen.add(key);
      }
      const video = slide.querySelector("video");
      const source = slide.querySelector("video source[src], source[src]");
      let videoUrl = null;
      if (source) videoUrl = absUrl(source.getAttribute("src"));
      else if (video && video.getAttribute("src")) videoUrl = absUrl(video.getAttribute("src"));
      let img = slide.querySelector("img");
      if (!img && video && video.getAttribute("poster")) {
        img = document.createElement("img");
        img.setAttribute("src", absUrl(video.getAttribute("poster")));
        img.setAttribute("alt", video.getAttribute("aria-label") || "");
      }
      if (!img && !videoUrl) return;
      let imageEl = null;
      if (img) {
        imageEl = document.createElement("img");
        imageEl.setAttribute("src", img.getAttribute("src"));
        imageEl.setAttribute("alt", img.getAttribute("alt") || "");
      }
      const mediaFrag = document.createDocumentFragment();
      if (imageEl) {
        mediaFrag.appendChild(document.createComment(" field:media_image "));
        mediaFrag.appendChild(imageEl);
      }
      if (videoUrl) {
        mediaFrag.appendChild(document.createComment(" field:media_video "));
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", videoUrl);
        a.textContent = videoUrl;
        p.appendChild(a);
        mediaFrag.appendChild(p);
      }
      cells.push([mediaFrag, ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-product-info.js
  function textLines(el) {
    const lines = [];
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/\n+/).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean).forEach((t) => lines.push(t));
      }
    });
    return lines;
  }
  function parse2(element, { document }) {
    const left = [];
    const right = [];
    const rating = element.querySelector(".bat-reviews__review-count");
    if (rating && rating.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = rating.textContent.trim();
      left.push(p);
    }
    const titleEl = element.querySelector(".product-page__title, h1");
    if (titleEl) {
      const subtitleEl = titleEl.querySelector(".product-page__subtitle");
      const subtitle = subtitleEl ? subtitleEl.textContent.trim() : "";
      const h1 = document.createElement("h1");
      const clone = titleEl.cloneNode(true);
      const cs = clone.querySelector(".product-page__subtitle");
      if (cs) cs.remove();
      h1.textContent = clone.textContent.replace(/\s+/g, " ").trim();
      left.push(h1);
      if (subtitle) {
        const p = document.createElement("p");
        p.textContent = subtitle;
        left.push(p);
      }
    }
    const desc = element.querySelector(".product-page__description");
    if (desc) {
      textLines(desc).forEach((t) => {
        const p = document.createElement("p");
        p.textContent = t;
        left.push(p);
      });
      const more = desc.querySelector(".product-page__read-more-container");
      if (more) {
        const paras = Array.from(more.querySelectorAll("p"));
        if (paras.length) {
          paras.forEach((p) => {
            if (p.textContent.trim()) left.push(p);
          });
        } else {
          textLines(more).forEach((t) => {
            const p = document.createElement("p");
            p.textContent = t;
            left.push(p);
          });
        }
      }
    }
    const price = element.querySelector(".product-page__price-label, .product-page__price");
    if (price && price.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = price.textContent.replace(/\s+/g, " ").trim();
      right.push(p);
    }
    const cta = element.querySelector(".product-page__add-to-cart");
    if (cta) {
      const labelEl = cta.querySelector(".button__label") || cta;
      const label = labelEl.textContent.replace(/\s+/g, " ").trim() || "Add to basket";
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href") || "#add-to-basket");
      a.textContent = label;
      strong.appendChild(a);
      p.appendChild(strong);
      right.push(p);
    }
    element.querySelectorAll(".product-page__usp-item").forEach((item) => {
      const img = item.querySelector("img");
      const labelEl = item.querySelector("p") || item;
      const label = labelEl.textContent.replace(/\s+/g, " ").trim();
      if (!img && !label) return;
      const p = document.createElement("p");
      if (img) p.appendChild(img);
      if (label) p.appendChild(document.createTextNode(` ${label}`));
      right.push(p);
    });
    const cells = [[left, right]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-product-info", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-foreground.js
  function absUrl2(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    return url;
  }
  function cloneImg(document, img, fallbackAlt) {
    const el = document.createElement("img");
    el.setAttribute("src", absUrl2(img.getAttribute("src")));
    el.setAttribute("alt", img.getAttribute("alt") || fallbackAlt || "");
    return el;
  }
  function parse3(element, { document }) {
    const cells = [];
    const bg = element.querySelector(".content-block-f__background");
    const bgFrag = document.createDocumentFragment();
    if (bg) {
      const video = bg.querySelector("video");
      const source = bg.querySelector("source[src]");
      const videoUrl = absUrl2(source && source.getAttribute("src") || video && video.getAttribute("src"));
      const bgImg = bg.querySelector("img");
      let imageEl = null;
      if (bgImg) imageEl = cloneImg(document, bgImg, video && video.getAttribute("alt"));
      else if (video && video.getAttribute("poster")) {
        imageEl = document.createElement("img");
        imageEl.setAttribute("src", absUrl2(video.getAttribute("poster")));
        imageEl.setAttribute("alt", video.getAttribute("alt") || "");
      }
      if (imageEl) {
        bgFrag.appendChild(document.createComment(" field:background_image "));
        bgFrag.appendChild(imageEl);
      }
      if (videoUrl) {
        bgFrag.appendChild(document.createComment(" field:background_video "));
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", videoUrl);
        a.textContent = videoUrl;
        p.appendChild(a);
        bgFrag.appendChild(p);
      }
    }
    cells.push([bgFrag]);
    const contentFrag = document.createDocumentFragment();
    const content = element.querySelector(".content-block-f__content") || element;
    const fgImg = content.querySelector("img.content-block-f__foreground-image, picture img, img");
    if (fgImg) {
      contentFrag.appendChild(document.createComment(" field:content_image "));
      contentFrag.appendChild(cloneImg(document, fgImg));
    }
    const heading = content.querySelector(".content-block-f__heading h1, .content-block-f__heading h2, .content-block-f__heading h3, h1, h2, h3");
    const ledes = Array.from(content.querySelectorAll(".content-block-f__copy > *"));
    if (heading || ledes.length) {
      contentFrag.appendChild(document.createComment(" field:content_text "));
      if (heading) contentFrag.appendChild(heading);
      ledes.forEach((el) => {
        if (!el.textContent.trim()) return;
        if (el.tagName === "P") {
          contentFrag.appendChild(el);
        } else {
          const p = document.createElement("p");
          p.innerHTML = el.innerHTML.trim();
          contentFrag.appendChild(p);
        }
      });
    }
    cells.push([contentFrag]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-foreground", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-load-more.js
  function parse4(element, { document }) {
    const items = Array.from(element.querySelectorAll("site-accordion, .content-block-g-accordion")).filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)));
    const cells = [];
    items.forEach((item) => {
      const labelEl = item.querySelector(".accordion__label, .content-block-g-accordion__label, .accordion__button");
      const question = labelEl ? labelEl.textContent.replace(/\s+/g, " ").trim() : "";
      const panel = item.querySelector(".content-block-g-accordion__wrapper, .accordion__panel");
      if (!question && !panel) return;
      const qFrag = document.createDocumentFragment();
      if (question) {
        qFrag.appendChild(document.createComment(" field:summary "));
        qFrag.appendChild(document.createTextNode(question));
      }
      const aFrag = document.createDocumentFragment();
      if (panel) {
        const nodes = Array.from(panel.children).filter((c) => c.textContent.replace(/ /g, " ").trim() || c.querySelector("img"));
        if (nodes.length) {
          aFrag.appendChild(document.createComment(" field:text "));
          nodes.forEach((n) => aFrag.appendChild(n));
        } else if (panel.textContent.trim()) {
          aFrag.appendChild(document.createComment(" field:text "));
          const p = document.createElement("p");
          p.textContent = panel.textContent.replace(/\s+/g, " ").trim();
          aFrag.appendChild(p);
        }
      }
      cells.push([qFrag, aFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-load-more", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-tile-carousel.js
  function cleanHeading(document, src) {
    const h3 = document.createElement("h3");
    h3.innerHTML = src.innerHTML.replace(/\s+/g, " ").trim();
    return h3;
  }
  function textPara(document, el) {
    const text = el ? el.textContent.replace(/\s+/g, " ").trim() : "";
    if (!text) return null;
    const p = document.createElement("p");
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
  function itemRow(document, label, img, textNodes) {
    return [
      fieldCell(document, "title", [document.createTextNode(label)]),
      fieldCell(document, "image", img ? [img] : []),
      fieldCell(document, "text", textNodes)
    ];
  }
  function parse5(element, { document }) {
    const tabs = Array.from(element.querySelectorAll(".carousel-b__tab"));
    const groups = Array.from(element.querySelectorAll(".carousel-b__group"));
    const cells = [];
    groups.forEach((group, i) => {
      const tabEl = tabs[i];
      const label = tabEl ? (tabEl.querySelector(".carousel-b__tab-text") || tabEl).textContent.replace(/\s+/g, " ").trim() : `Tab ${i + 1}`;
      const items = [];
      let current = { img: null, nodes: [] };
      items.push(current);
      const nodes = { push: (n) => {
        if (n.tagName === "IMG") {
          current = { img: n, nodes: [] };
          items.push(current);
        } else {
          current.nodes.push(n);
        }
      } };
      const intro = group.querySelector(".carousel-b__tile--intro--static") || group.querySelector(".carousel-b__tile--intro");
      if (intro) {
        const h = intro.querySelector("h1, h2, h3, h4, h5, h6");
        if (h) nodes.push(cleanHeading(document, h));
        const p = textPara(document, intro.querySelector(".carousel-b__tile-text"));
        if (p) nodes.push(p);
      }
      const seen = /* @__PURE__ */ new Set();
      group.querySelectorAll(".carousel-b__tile:not(.carousel-b__tile--intro)").forEach((tile) => {
        if (tile.classList.contains("swiper-slide-duplicate")) return;
        const img = tile.querySelector(".carousel-b__tile-image img, img");
        const h = tile.querySelector(".carousel-b__tile-content-headings h1, .carousel-b__tile-content-headings h2, .carousel-b__tile-content-headings h3, .carousel-b__tile-content-headings h4, h3, h4");
        const key = img && img.getAttribute("src") || h && h.textContent.trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        if (img) {
          const pic = document.createElement("img");
          pic.setAttribute("src", img.getAttribute("src"));
          pic.setAttribute("alt", img.getAttribute("alt") || "");
          nodes.push(pic);
        }
        if (h) nodes.push(cleanHeading(document, h));
        const p = textPara(document, tile.querySelector(".carousel-b__tile-content-lede"));
        if (p) nodes.push(p);
      });
      items.filter((it) => it.img || it.nodes.length).forEach((it) => {
        cells.push(itemRow(document, label, it.img, it.nodes));
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-tile-carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-product-cards.js
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function para(document, text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }
  function linkPara(document, href, text) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.setAttribute("href", href);
    a.textContent = text;
    p.appendChild(a);
    return p;
  }
  function fieldCell2(document, field, nodes) {
    const frag = document.createDocumentFragment();
    if (nodes.length) {
      frag.appendChild(document.createComment(` field:${field} `));
      nodes.forEach((n) => frag.appendChild(n));
    }
    return frag;
  }
  function itemRow2(document, label, img, textNodes) {
    return [
      fieldCell2(document, "title", [document.createTextNode(label)]),
      fieldCell2(document, "image", img ? [img] : []),
      fieldCell2(document, "text", textNodes)
    ];
  }
  function parse6(element, { document }) {
    const tabs = Array.from(element.querySelectorAll(".product-card-carousel__tab"));
    const groups = Array.from(element.querySelectorAll(".product-card-carousel__group"));
    const cells = [];
    groups.forEach((group, i) => {
      const tabEl = tabs[i];
      const label = tabEl ? clean((tabEl.querySelector(".product-card-carousel__tab-text") || tabEl).textContent) : `Tab ${i + 1}`;
      const items = [];
      let current = { img: null, nodes: [] };
      items.push(current);
      const nodes = { push: (n) => {
        if (n.tagName === "IMG") {
          current = { img: n, nodes: [] };
          items.push(current);
        } else {
          current.nodes.push(n);
        }
      } };
      const viewAll = element.querySelector(`.product-card-carousel__button--tab-${i + 1} a[href]`);
      if (viewAll) {
        const text = clean((viewAll.querySelector(".button__label") || viewAll).textContent) || "View all";
        nodes.push(linkPara(document, viewAll.getAttribute("href"), text));
      }
      const seen = /* @__PURE__ */ new Set();
      group.querySelectorAll("product-card, .product-card").forEach((card) => {
        if (card.closest(".swiper-slide-duplicate")) return;
        const titleLink = card.querySelector(".product-card__title a[href]");
        const imageLink = card.querySelector(".product-card__image-link[href]");
        const href = titleLink && titleLink.getAttribute("href") || imageLink && imageLink.getAttribute("href");
        const img = card.querySelector(".product-card__image img, .product-card__image-container img");
        const key = href || img && img.getAttribute("src");
        if (!key || seen.has(key)) return;
        seen.add(key);
        if (img) {
          const pic = document.createElement("img");
          pic.setAttribute("src", img.getAttribute("src"));
          pic.setAttribute("alt", img.getAttribute("alt") || "");
          nodes.push(pic);
        }
        const badge = card.querySelector(".product-card__badge-container .badge");
        if (badge && clean(badge.textContent)) nodes.push(para(document, clean(badge.textContent)));
        const price = card.querySelector(".product-card__pricing-label");
        if (price && clean(price.textContent)) {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = clean(price.textContent);
          p.appendChild(strong);
          nodes.push(p);
        }
        const sub = card.querySelector(".product-card__pricing-subscription");
        if (sub && clean(sub.textContent)) nodes.push(para(document, clean(sub.textContent)));
        const titleEl = card.querySelector(".product-card__title");
        let name = "";
        let subtitle = "";
        if (titleEl) {
          const subEl = titleEl.querySelector(".product-card__subtitle-condensed");
          subtitle = subEl ? clean(subEl.textContent) : "";
          const clone = titleEl.cloneNode(true);
          const cs = clone.querySelector(".product-card__subtitle-condensed");
          if (cs) cs.remove();
          name = clean(clone.textContent);
        }
        if (name) {
          const h3 = document.createElement("h3");
          h3.textContent = name;
          nodes.push(h3);
        }
        if (subtitle) nodes.push(para(document, subtitle));
        if (href) {
          const ctaLabelEl = card.querySelector(".product-card__actions .button__label");
          const ctaText = ctaLabelEl && clean(ctaLabelEl.textContent) || "Shop now";
          nodes.push(linkPara(document, href, ctaText));
        }
      });
      items.filter((it) => it.img || it.nodes.length).forEach((it) => {
        cells.push(itemRow2(document, label, it.img, it.nodes));
      });
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-product-cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/vuse-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        // AI summary / skip link (non-authorable)
        "#ai-summary",
        ".skip-to-content-link",
        // Global header
        ".shopify-section-group-header-group",
        "site-header",
        // Footer group: newsletter signup + site footer
        "#shopify-section-sections--19268456710306__newsletter_signup_khyHcr",
        "#shopify-section-sections--19268456710306__footer",
        ".shopify-section-group-footer-group",
        "site-footer",
        // Global drawers (account, add-to-cart, cart, offers, mobile menu, newsletter popup, search)
        ".shopify-section-group-global_group",
        "site-drawer",
        "mobile-menu-drawer",
        "search-drawer",
        "#newsletterModal",
        // Age gate and maintenance modal
        "#shopify-section-age-gate-modal",
        "age-gate-modal",
        "#shopify-section-maintenance-modal",
        // OneTrust cookie consent
        "#onetrust-consent-sdk",
        // Pixels, misc widgets
        "#web-pixels-manager-sandbox-container",
        "#fb-root",
        // Qualtrics feedback intercept (injected at runtime)
        '[id^="QSI"]',
        '[class^="QSI"]',
        "#ZN_2lSnvmLTM0UPHoy",
        "shop-cart-sync",
        "#a11y-refresh-page-message",
        "#a11y-new-window-message",
        // Product page sticky add-to-cart bar
        "section.product-page__sticky-bar",
        // Technical elements
        "script",
        "style",
        "noscript",
        "iframe",
        "link"
      ]);
      element.querySelectorAll("ul").forEach((ul) => {
        if (!ul.closest("main") && !ul.textContent.trim() && !ul.querySelector("img")) ul.remove();
      });
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript",
        "iframe",
        "link",
        "source"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("on") || n.startsWith("data-track") || n.startsWith("data-analytics") || n === "data-gtm" || n.startsWith("data-ga")) {
            el.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/vuse-sections.js
  var MARKER = "data-excat-section-id";
  function findSection(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSection(element, section);
        if (!el) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        if (i === 0) hr.setAttribute("data-excat-first-section", "true");
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        if (!marker) continue;
        let last = marker;
        while (last.nextElementSibling && last.nextElementSibling.tagName !== "HR") {
          last = last.nextElementSibling;
        }
        const meta = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        last.after(meta);
        if (marker.hasAttribute("data-excat-first-section")) {
          marker.remove();
        } else {
          marker.removeAttribute(MARKER);
        }
      }
      element.querySelectorAll("hr[data-excat-first-section]").forEach((hr) => hr.remove());
    }
  }

  // tools/importer/import-products.js
  var PAGE_TEMPLATE = {
    "name": "products",
    "urls": [
      "https://www.vuse.com/en-gb/products/vuse-ultra-device-mclaren"
    ],
    "representativeUrl": "https://www.vuse.com/en-gb/products/vuse-ultra-device-mclaren",
    "description": "Vuse product detail pages: media gallery, product summary, promo banner, FAQ, features tabs and product card tabs",
    "blocks": [
      {
        "name": "carousel-gallery",
        "instances": [
          ".carousel-a-section .carousel-a",
          "#shopify-section-template--19268937547938__carousel_a_98bErk .carousel-a"
        ]
      },
      {
        "name": "columns-product-info",
        "instances": [
          "main-product section.product-page",
          "#shopify-section-template--19268937547938__main section.product-page"
        ]
      },
      {
        "name": "hero-foreground",
        "instances": [
          ".content-block-f content-block-f.content-block-f__wrapper",
          "#shopify-section-template--19268937547938__content_block_f_kDtVxq content-block-f"
        ]
      },
      {
        "name": "accordion-load-more",
        "instances": [
          ".content-block-g .content-block-g__block-table",
          "#shopify-section-template--19268937547938__content_block_g_CqhAnM .content-block-g__block-table"
        ]
      },
      {
        "name": "tabs-tile-carousel",
        "instances": [
          ".carousel-b carousel-b.carousel-b__wrapper",
          "#shopify-section-template--19268937547938__carousel_b_ybCUtb carousel-b"
        ]
      },
      {
        "name": "tabs-product-cards",
        "instances": [
          ".product-card-carousel product-card-carousel.product-card-carousel__wrapper",
          "#shopify-section-template--19268937547938__product_card_carousel_9a67xW product-card-carousel"
        ]
      }
    ],
    "urlPattern": "/en-gb/products/*",
    "sections": [
      {
        "id": "section-1",
        "name": "Product media gallery",
        "selector": [
          ".shopify-section.carousel-a-section",
          "#shopify-section-template--19268937547938__carousel_a_98bErk"
        ],
        "style": null,
        "blocks": [
          "carousel-gallery"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Product summary",
        "selector": [
          "#shopify-section-template--19268937547938__main",
          ".shopify-section:has(main-product)"
        ],
        "style": null,
        "blocks": [
          "columns-product-info"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Ultra Exclusive banner",
        "selector": [
          ".shopify-section.content-block-f",
          "#shopify-section-template--19268937547938__content_block_f_kDtVxq"
        ],
        "style": null,
        "blocks": [
          "hero-foreground"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "FAQ",
        "selector": [
          ".shopify-section.content-block-g",
          "#shopify-section-template--19268937547938__content_block_g_CqhAnM"
        ],
        "style": null,
        "blocks": [
          "accordion-load-more"
        ],
        "defaultContent": [
          ".content-block-g__block-heading h2"
        ]
      },
      {
        "id": "section-5",
        "name": "Features / In The Box tabs",
        "selector": [
          ".shopify-section.carousel-b",
          "#shopify-section-template--19268937547938__carousel_b_ybCUtb"
        ],
        "style": null,
        "blocks": [
          "tabs-tile-carousel"
        ],
        "defaultContent": []
      },
      {
        "id": "section-6",
        "name": "Find a Flavour / More from Vuse product carousel",
        "selector": [
          ".shopify-section.product-card-carousel",
          "#shopify-section-template--19268937547938__product_card_carousel_9a67xW"
        ],
        "style": null,
        "blocks": [
          "tabs-product-cards"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "carousel-gallery": parse,
    "columns-product-info": parse2,
    "hero-foreground": parse3,
    "accordion-load-more": parse4,
    "tabs-tile-carousel": parse5,
    "tabs-product-cards": parse6
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_products_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_products_exports);
})();
