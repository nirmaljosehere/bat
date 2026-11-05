# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-block-collection, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/ue-tutorial)
1. [Creating Blocks](https://www.aem.live/developer/universal-editor-blocks) and [Content Modelling](https://www.aem.live/developer/component-model-definitions)
1. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
1. [Web Performance](https://www.aem.live/developer/keeping-it-100)
1. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)
1. [AEM Block Collection](https://www.aem.live/developer/block-collection#block-collection-1)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-block-collection` template and add a mountpoint in the `fstab.yaml`
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)

## Page Themes

The existing Vuse theme remains the default. Select **Vuse** or **VELO** in
the page-level **Theme** field in Universal Editor after deploying the
updated component models. Preview/publish the page to deliver the metadata.

AEM emits `<meta name="theme" content="velo">` for VELO pages. The existing
page decoration applies `body.velo` before content loads; pages without
theme metadata retain Vuse styling. The VELO overrides live in
`styles/brand.css` and reuse the existing blocks and button styles.

VELO uses teal navigation/footer, blue pill buttons, and local Velo WWangle
regular/bold fonts. An authored `papaya` section style adds an orange band
only on VELO pages. The fonts were sourced from VELO's published assets;
confirm usage rights before publishing. Logos, images, and copy remain
CMS-authored and must be selected separately for each brand.

Keep the AEM `/conf/vuse` Edge Delivery configuration pointing to this
`nirmaljosehere/bat` repository: it contains the site's custom blocks.
Do not replace it with the separate `vuse` boilerplate repository.

## Hero Layouts

The Hero block has **Image**, **Alt**, **Headline**, **Description**, and
**Layout** fields. Format the headline as a heading in the rich-text editor;
use H1 for the page's main hero and H2/H3 for subsequent sections.

Layout supports background images with left/center/right text, image left or
right of text, and image above or below text. Split layouts stack image-first
on mobile. Images remain uncropped outside background-image layouts.

The original `text` property is retained as Headline, so existing headings,
paragraphs, links, and authoring attributes are preserved. Existing heroes
default to the background-image layout. Image and description are optional.

With the local server running, preview the block at
`/drafts/hero-layouts.html?layout=image-left`. Other layout values are
`overlay`, `overlay-center`, `overlay-right`, `image-right`, `image-top`, and
`image-bottom`. Add `&theme=vuse` to check the original brand styling.
These query parameters are draft-only; production uses authored block classes.
The draft image is loaded from the reference site's CDN for preview only.