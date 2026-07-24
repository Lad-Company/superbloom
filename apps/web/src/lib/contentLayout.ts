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
