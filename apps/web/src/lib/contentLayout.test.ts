import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {
  getContentLayoutRowClassNames,
  isContentLayoutFullBleed,
} from './contentLayout';
import {
  caseStudyBySlugQuery,
  contentLayoutRowsProjection,
  newsArticleBySlugQuery,
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
      'heading',
      'text',
      'playbackId',
      'altText',
      'decorative',
    ]) {
      expect(contentLayoutRowsProjection).toContain(field);
    }
    expect(newsArticleBySlugQuery).toContain('contentLayoutRow');
    expect(caseStudyBySlugQuery).toContain('mediaLayouts');
    expect(caseStudyBySlugQuery).toContain('blocks[]');
    expect(caseStudyBySlugQuery).toContain('supportingRows');
    expect(caseStudyBySlugQuery).not.toContain('caseStudyTextMedia');
    expect(caseStudyBySlugQuery).toContain('@->articleType == "news"');
  });

  it('stacks in source order below 1024px and keeps links keyboard accessible', () => {
    expect(componentSource).toContain('@media (max-width: 1023px)');
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
});
