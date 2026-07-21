import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'l9mhqdtj',
    dataset: 'production',
  },
  studioHost: 'superbloom-cms',
  deployment: {
    appId: 'j0qgi6ycq5on9euxin542pro',
  },
  typegen: {
    path: '../web/src/**/*.{ts,tsx}',
    schema: './schema.json',
    generates: '../web/src/sanity.types.ts',
  },
})
