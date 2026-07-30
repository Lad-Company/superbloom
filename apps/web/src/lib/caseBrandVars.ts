import { fgForHex } from './luminance';
import type { CaseStudyBySlugQueryResult } from '../sanity.types';

type CaseStudy = NonNullable<CaseStudyBySlugQueryResult>;

// Case pages paint their surfaces from the CMS brand color pair. Applied to
// <body> so the Layout-rendered Navigation resolves case-primary tokens; every
// case surface below inherits them.
export const caseBrandVars = (caseStudy: CaseStudy): string => {
  const primaryColor = caseStudy.primaryColor ?? '#ffffff';
  const secondaryColor = caseStudy.secondaryColor ?? primaryColor;
  const primaryForeground = fgForHex(primaryColor);
  const secondaryForeground = fgForHex(secondaryColor);
  return [
    `--case-primary-bg: ${primaryColor}`,
    `--case-primary-fg: ${primaryForeground}`,
    `--case-secondary-bg: ${secondaryColor}`,
    `--case-secondary-fg: ${secondaryForeground}`,
  ].join('; ');
};
