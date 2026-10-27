/* eslint-disable */
/* global WebImporter */

import carouselGalleryParser from "./parsers/carousel-gallery.js";
import columnsProductInfoParser from "./parsers/columns-product-info.js";
import heroForegroundParser from "./parsers/hero-foreground.js";
import accordionLoadMoreParser from "./parsers/accordion-load-more.js";
import tabsTileCarouselParser from "./parsers/tabs-tile-carousel.js";
import tabsProductCardsParser from "./parsers/tabs-product-cards.js";
import vuseCleanupTransformer from "./transformers/vuse-cleanup.js";
import vuseSectionsTransformer from "./transformers/vuse-sections.js";

const PAGE_TEMPLATE = {
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

const parsers = {
  "carousel-gallery": carouselGalleryParser,
  "columns-product-info": columnsProductInfoParser,
  "hero-foreground": heroForegroundParser,
  "accordion-load-more": accordionLoadMoreParser,
  "tabs-tile-carousel": tabsTileCarouselParser,
  "tabs-product-cards": tabsProductCardsParser,
};
const transformers = [vuseCleanupTransformer, vuseSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers("beforeTransform", main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers("afterTransform", main, payload);

    main.appendChild(document.createElement("hr"));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, "")
      .replace(/\.html?$/, "");
    const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
