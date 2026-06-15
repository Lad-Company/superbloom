import { defineQuery } from 'groq';

export const homepageQuery = defineQuery(`
  *[_type == "homepage"][0]{
    sections[]{
      _type,
      _type == "heroBlock" => {
        heading,
        subheading,
        "videoPlaybackId": video.asset->playbackId
      },
      _type == "capesBlock" => {
        headline,
        capabilities[]->{
          title,
          "slug": slug.current,
          "videoPlaybackId": video.asset->playbackId
        }
      }
    }
  }
`);

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
    year,
    industry,
    deliverables,
    creativeCollective,
    primaryColor,
    secondaryColor,
    "heroVideoPlaybackId": heroVideo.asset->playbackId,
    body[]{
      _type,
      _key,
      theme,
      eyebrow,
      _type == "highlightsSection" => {
        statement,
        stats[]{ _key, value, label }
      },
      _type == "textSection" => {
        body
      },
      _type == "mediaSection" => {
        layout,
        text,
        media[]{
          _type,
          _key,
          _type == "mux.video" => {
            "playbackId": asset->playbackId
          },
          _type == "image" => {
            "url": asset->url,
            "width": asset->metadata.dimensions.width,
            "height": asset->metadata.dimensions.height,
            "alt": asset->altText
          }
        }
      },
      _type == "statsSection" => {
        stats[]{ _key, value, label }
      }
    }
  }
`);
