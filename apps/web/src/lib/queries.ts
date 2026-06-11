import { defineQuery } from 'groq';

export const caseStudiesQuery = defineQuery(`
  *[_type == "caseStudy"] | order(title asc) {
    title,
    "slug": slug.current,
    client
  }
`);

export const caseStudyBySlugQuery = defineQuery(`
  *[_type == "caseStudy" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    client,
    summary,
    "videoPlaybackId": heroVideo.asset->playbackId,
    capabilities[]->{
      title,
      "slug": slug.current
    }
  }
`);
