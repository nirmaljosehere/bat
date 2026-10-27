/* eslint-disable */
/* global WebImporter */

/**
 * Vuse (Shopify) cleanup transformer.
 * Removes non-authorable chrome: global header, footer, newsletter signup,
 * drawers, mobile menu, age gate, maintenance modal, OneTrust, pixels,
 * product sticky bar, scripts/styles/noscript/iframes.
 * Selectors verified against migration-work/cleaned.html.
 */
export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    WebImporter.DOMUtils.remove(element, [
      // AI summary / skip link (non-authorable)
      '#ai-summary',
      '.skip-to-content-link',
      // Global header
      '.shopify-section-group-header-group',
      'site-header',
      // Footer group: newsletter signup + site footer
      '#shopify-section-sections--19268456710306__newsletter_signup_khyHcr',
      '#shopify-section-sections--19268456710306__footer',
      '.shopify-section-group-footer-group',
      'site-footer',
      // Global drawers (account, add-to-cart, cart, offers, mobile menu, newsletter popup, search)
      '.shopify-section-group-global_group',
      'site-drawer',
      'mobile-menu-drawer',
      'search-drawer',
      '#newsletterModal',
      // Age gate and maintenance modal
      '#shopify-section-age-gate-modal',
      'age-gate-modal',
      '#shopify-section-maintenance-modal',
      // OneTrust cookie consent
      '#onetrust-consent-sdk',
      // Pixels, misc widgets
      '#web-pixels-manager-sandbox-container',
      '#fb-root',
      // Qualtrics feedback intercept (injected at runtime)
      '[id^="QSI"]',
      '[class^="QSI"]',
      '#ZN_2lSnvmLTM0UPHoy',
      'shop-cart-sync',
      '#a11y-refresh-page-message',
      '#a11y-new-window-message',
      // Product page sticky add-to-cart bar
      'section.product-page__sticky-bar',
      // Technical elements
      'script',
      'style',
      'noscript',
      'iframe',
      'link',
    ]);

    // Remove the now-empty a11y message list if present
    element.querySelectorAll('ul').forEach((ul) => {
      if (!ul.closest('main') && !ul.textContent.trim() && !ul.querySelector('img')) ul.remove();
    });
  }

  if (hookName === 'afterTransform') {
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'iframe',
      'link',
      'source',
    ]);

    // Strip tracking / event attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (n.startsWith('on') || n.startsWith('data-track') || n.startsWith('data-analytics')
          || n === 'data-gtm' || n.startsWith('data-ga')) {
          el.removeAttribute(n);
        }
      });
    });
  }
}
