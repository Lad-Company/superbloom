export type ContentLayoutWidth = '1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'full';
export type ContentLayoutAlignment = 'left' | 'center' | 'right';

export type ContentLayoutBlock = {
  _type: 'contentLayoutMedia' | 'contentLayoutText' | 'contentLayoutSpacer';
  width?: ContentLayoutWidth | null;
};

export type ContentLayoutRow = {
  blocks?: ContentLayoutBlock[] | null;
  alignment?: ContentLayoutAlignment | null;
  fullBleed?: boolean | null;
};

const widthClass = (width?: ContentLayoutWidth | null) =>
  `width-${(width ?? 'full').replace('/', '-')}`;

const WIDTH_COLUMNS: Record<ContentLayoutWidth, number> = {
  '1/4': 3,
  '1/3': 4,
  '1/2': 6,
  '2/3': 8,
  '3/4': 9,
  full: 12,
};

const FULL_COLUMNS = 12;

/**
 * Returns a `sizes` value matching how a content-layout block renders on the
 * site's 12-column grid. Below 1024px the layout collapses to a single column,
 * so any block always becomes 100vw; on wider viewports the block occupies the
 * fraction of the content area indicated by its width field.
 */
export const contentLayoutSizes = (width?: ContentLayoutWidth | null): string => {
  if (!width || width === 'full') return '(max-width: 1023px) 100vw, 100vw';
  const columns = WIDTH_COLUMNS[width];
  const fraction = Math.round((columns / FULL_COLUMNS) * 100);
  return `(max-width: 1023px) 100vw, ${fraction}vw`;
};

export const isContentLayoutFullBleed = (row: ContentLayoutRow): boolean =>
  row.fullBleed === true &&
  row.blocks?.length === 1 &&
  row.blocks[0]?._type === 'contentLayoutMedia' &&
  row.blocks[0]?.width === 'full';

export const getContentLayoutRowClassNames = (row: ContentLayoutRow) => {
  const blocks = row.blocks ?? [];
  const isSingle = blocks.length === 1;

  return {
    row: [
      'content-layout-row',
      ...(isSingle ? ['single', `align-${row.alignment ?? 'left'}`] : []),
    ],
    blocks: blocks.map((block) => ['content-layout-block', widthClass(block.width)]),
  };
};
