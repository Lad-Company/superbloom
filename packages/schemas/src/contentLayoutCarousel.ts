import {defineField, defineType} from 'sanity'

type CarouselVideo = {
  asset?: Array<{_type?: string}>
}

/**
 * Video Carousel Block — a full-width row of up to five videos. The centered
 * video renders at its intrinsic aspect ratio with playback controls while
 * the previous/next videos peek in at the edges. Carousels have no width
 * control: they always span the full row, so a carousel must be the only
 * block in its Content Layout Row (enforced in contentLayoutContract).
 */
export const contentLayoutCarousel = defineType({
  name: 'contentLayoutCarousel',
  title: 'Video Carousel Block',
  type: 'object',
  fields: [
    defineField({
      name: 'videos',
      title: 'Videos',
      type: 'array',
      of: [{type: 'mediaBox'}],
      validation: (rule) => [
        rule.required().min(1).max(5),
        rule.custom((videos) => {
          if (!Array.isArray(videos)) return true
          const hasNonVideo = (videos as CarouselVideo[]).some(
            (video) => video?.asset?.[0]?._type !== 'mux.video',
          )
          return hasNonVideo ? 'Every Video Carousel item must be a video.' : true
        }),
      ],
    }),
  ],
  preview: {
    select: {videos: 'videos'},
    prepare: ({videos}: {videos?: unknown[]}) => ({
      title: 'Video Carousel',
      subtitle: `${Array.isArray(videos) ? videos.length : 0} video(s) · full width`,
    }),
  },
})
