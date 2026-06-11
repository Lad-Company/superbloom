import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'l9mhqdtj',
    dataset: 'production',
  },
  studioHost: 'superbloom',
  typegen: {
    path: '../web/src/**/*.{ts,tsx}',
    schema: './schema.json',
    generates: '../web/src/sanity.types.ts',
  },
})
