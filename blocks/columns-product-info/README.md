# columns-product-info

Custom **columns** block. Purpose: Product summary shown beside the gallery: product copy on the left, price, add-to-basket CTA and icon feature pills on the right.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, two cells; cell 1: rating text, H1 product title, subtitle paragraph, description paragraphs; cell 2: price paragraph, CTA link (rendered as a full-width button), one paragraph per feature pill (icon image + label).

## Behavior

The first description paragraph after the subtitle stays visible; any further paragraphs are collapsed behind a "Read more" / "Read less" toggle (`aria-expanded`). A paragraph like `(0)` before the title renders as the review count with outline stars.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.
