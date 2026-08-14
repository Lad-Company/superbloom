import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {
  contentLayoutSizes,
  getContentLayoutRowClassNames,
  isContentLayoutFullBleed,
} from './contentLayout';
import {
  caseStudyBySlugQuery,
  contentLayoutRowsProjection,
  editorialArticleBySlugQuery,
} from './queries';

const componentSource = readFileSync(
  new URL('../components/ContentLayoutRow.astro', import.meta.url),
  'utf8',
);
const articleRendererSource = readFileSync(
  new URL('../components/editorial/ArticleBodyRenderer.astro', import.meta.url),
  'utf8',
);
const caseStudyRendererSource = readFileSync(
  new URL('../components/case/CaseStudyNarrativeSection.astro', import.meta.url),
  'utf8',
);
const resultsRendererSource = readFileSync(
  new URL('../components/case/Results.astro', import.meta.url),
  'utf8',
);

describe('contentLayoutSizes', () => {
  it('uses 100vw on mobile and full widths correctly', () => {
    expect(contentLayoutSizes()).toBe('(max-width: 1023.98px) 100vw, 100vw')
    expect(contentLayoutSizes('full')).toBe('(max-width: 1023.98px) 100vw, 100vw')
  });

  it('translates col-spans into matching viewport percentages', () => {
    expect(contentLayoutSizes('1/4')).toBe('(max-width: 1023.98px) 100vw, 25vw')
    expect(contentLayoutSizes('1/3')).toBe('(max-width: 1023.98px) 100vw, 33vw')
    expect(contentLayoutSizes('1/2')).toBe('(max-width: 1023.98px) 100vw, 50vw')
    expect(contentLayoutSizes('2/3')).toBe('(max-width: 1023.98px) 100vw, 67vw')
    expect(contentLayoutSizes('3/4')).toBe('(max-width: 1023.98px) 100vw, 75vw')
  });
});

describe('Content Layout Row rendering contract', () => {
  it('maps every approved width and single-block alignment to independent layout classes', () => {
    expect(getContentLayoutRowClassNames({
      blocks: [{_type: 'contentLayoutText', width: '1/3'}],
      alignment: 'right',
    })).toEqual({
      row: ['content-layout-row', 'single', 'align-right'],
      blocks: [['content-layout-block', 'width-1-3']],
    });
  });

  it('maps a spacer to a grid block without visual or assistive content', () => {
    expect(getContentLayoutRowClassNames({
      blocks: [
        {_type: 'contentLayoutSpacer', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
        {_type: 'contentLayoutMedia', width: '1/3'},
      ],
    }).blocks).toEqual([
      ['content-layout-block', 'width-1-3'],
      ['content-layout-block', 'width-1-3'],
      ['content-layout-block', 'width-1-3'],
    ]);
    expect(componentSource).toContain("aria-hidden={block._type === 'contentLayoutSpacer' || undefined}");
  });

  it('allows full bleed only for qualifying Media', () => {
    expect(isContentLayoutFullBleed({
      blocks: [{_type: 'contentLayoutMedia', width: 'full'}],
      fullBleed: true,
    })).toBe(true);
    expect(isContentLayoutFullBleed({
      blocks: [{_type: 'contentLayoutText', width: 'full'}],
      fullBleed: true,
    })).toBe(false);
  });

  it('projects every authored row field and Media Asset field', () => {
    for (const field of [
      'alignment',
      'fullBleed',
      'width',
      'aspectRatio',
      'text',
      'videos',
      'playbackId',
      'altText',
      'decorative',
    ]) {
      expect(contentLayoutRowsProjection).toContain(field);
    }
    expect(contentLayoutRowsProjection).not.toContain('heading');
    expect(editorialArticleBySlugQuery).toContain('contentLayoutRow');
    expect(caseStudyBySlugQuery).toContain('mediaLayouts');
    expect(caseStudyBySlugQuery).toContain('blocks[]');
    expect(caseStudyBySlugQuery).toContain('supportingRows');
    expect(caseStudyBySlugQuery).not.toContain('caseStudyTextMedia');
    expect(caseStudyBySlugQuery).toContain('@->articleType == "news"');
  });

  it('stacks in source order below 1024px and keeps links keyboard accessible', () => {
    expect(componentSource).toContain('@media (--bp-below-desktop)');
    expect(componentSource).toContain('grid-template-columns: 1fr');
    expect(componentSource).not.toContain('order:');
    expect(componentSource).not.toContain('tabindex');
    expect(componentSource).not.toContain('onclick');
    expect(componentSource).toContain('a:focus-visible');
  });

  it('renders rows as the only Article and Case Study layout composition', () => {
    expect(articleRendererSource).toContain('<ContentLayoutRow');
    expect(caseStudyRendererSource).toContain('<ContentLayoutRow');
    expect(resultsRendererSource).toContain('<ContentLayoutRow');
    expect(articleRendererSource).not.toContain('articleTextSection');
    expect(caseStudyRendererSource).not.toContain('caseStudyTextMedia');
  });

  it('threads srcset / sizes attributes through media blocks', () => {
    expect(componentSource).toContain('sizes={sizesFor(block.width ?? undefined)}')
    expect(componentSource).toContain("'100vw'")
  });

  it('gives Case Study row videos the Presented control bar while articles stay Ambient', () => {
    expect(componentSource).toContain('mediaControls?: MediaPlaybackProfile');
    expect(componentSource).toContain(
      "controls={block.media?.asset?._type === 'mux.video' ? mediaControls : 'none'}",
    );
    expect(caseStudyRendererSource).toContain('mediaControls="full"');
    expect(resultsRendererSource).toContain('mediaControls="full"');
    expect(articleRendererSource).not.toContain('mediaControls');
  });
});
