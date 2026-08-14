/**
 * Shared harness for document-validation tests: compiles the real schema
 * outside Studio and runs the real validation engine (validateDocument), so
 * tests assert the validation markers Studio actually renders — including
 * marker paths, which the Studio validation panel uses to deep-link an error
 * to its field.
 */
import {createSchema, validateDocument} from 'sanity'
import {schemaTypes} from './index'

// Stubs for plugin-registered types (color input, mux) so the schema compiles
// outside Studio. Their internals don't affect validation wiring.
const pluginStubs = [
  {
    name: 'color',
    title: 'Color',
    type: 'object',
    fields: [
      {name: 'hex', type: 'string'},
      {name: 'alpha', type: 'number'},
    ],
  },
  {
    name: 'mux.video',
    title: 'Video',
    type: 'object',
    fields: [{name: 'asset', type: 'reference', to: [{type: 'mux.videoAsset'}]}],
  },
  {
    name: 'mux.videoAsset',
    title: 'Mux Video Asset',
    type: 'document',
    fields: [{name: 'assetId', type: 'string'}],
  },
]

const schema = createSchema({name: 'test', types: [...schemaTypes, ...pluginStubs]})

// Minimal client stub: count() queries resolve 0 and everything else resolves
// empty, so uniqueness/membership checks pass; chained config calls return self.
const fakeClient: any = {
  fetch: async (query: unknown) =>
    typeof query === 'string' && query.trimStart().startsWith('count(') ? 0 : [],
}
fakeClient.withConfig = () => fakeClient
fakeClient.withOptions = () => fakeClient
fakeClient.clone = () => fakeClient
fakeClient.config = () => ({})

const workspace = {name: 'test', schema, client: fakeClient} as any

export const textBlock = (text: string) => ({
  _type: 'block',
  _key: 'b1',
  style: 'normal',
  markDefs: [],
  children: [{_type: 'span', _key: 'c1', text, marks: []}],
})

export const mediaBoxImage = () => ({
  _type: 'mediaBox',
  asset: [
    {
      _type: 'image',
      _key: 'img1',
      asset: {_type: 'reference', _ref: 'image-abc123-1000x1000-jpg'},
    },
  ],
  altText: 'Alt text',
})

/** Error-level validation markers for a document, as Studio would render them. */
export async function errorMarkers(doc: any) {
  const markers = await validateDocument({
    document: doc,
    workspace,
    getClient: () => fakeClient as any,
    getDocumentExists: async () => true,
  } as any)
  return markers
    .filter((m: any) => m.level === 'error')
    .map((m: any) => ({path: m.path, message: m.message ?? m.item?.message}))
}
