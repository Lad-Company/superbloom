// The 192 rung exists for fixed 96px slots (zine Past Issues thumbnails):
// 96 CSS px × DPR 2 = 192, and without it the smallest candidate is 320 —
// one rung too large, which Lighthouse flags as image-delivery waste.
//
// Own module, not an imageCropping.ts export to import: imageCropping
// builds a Sanity image-url client at module scope, so any client-side
// importer (the shop Load More template path) would drag the Sanity client
// into the browser bundle just to read eight numbers.
export const IMAGE_LADDER = [192, 320, 640, 960, 1280, 1600, 1920, 2560] as const
