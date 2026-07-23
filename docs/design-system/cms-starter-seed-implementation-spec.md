# CMS starter-seed implementation specification

**Status:** Approved for implementation
**Decision date:** 2026-07-22
**Audience:** Engineers preparing the CMS dataset used to validate design fidelity and motion before content authoring begins.

## Implementation status, 2026-07-23

Commit `d52be9f` establishes a reviewable source baseline:

- `apps/studio/seed/source/content-master.md` is the committed tracker snapshot, tied to the canonical Google Doc by `source-metadata.json` and SHA-256 checksum `9c30c0571b2281819c3d1ebfea3ce62fed18bc48e4b4789625b298865526dcae`.
- `apps/studio/seed/generated/` contains the source outline, link and media inventories, retrieval diagnostics, and a schema-valid starter manifest.
- Media retrieval did not produce usable image, video, or PDF assets. The diagnostics preserve inaccessible and unsupported source links, so no fabricated asset references are present.

The committed manifest is a **structural review baseline**, not the complete Section 4 dataset. It currently contains the seven configured representative targets and must be expanded before planning or publishing to cover six Case Studies, six News articles, one Zine Issue, three Zine articles, and complete singleton content.

### Manual manifest-completion procedure

Until a configured manifest-generation endpoint exists, use a read-only chat subagent to inventory the tracker rather than fabricate an opaque output:

1. Give the subagent the committed snapshot and require exact source line ranges, source text, URLs, and explicit gaps for each candidate.
2. Use the inventory to author fields in `starter-manifest.json`. Mark direct text as `source`, structural reformatting as `derived`, and every newly invented value as `inferred` with rationale.
3. Do not assign a `mediaBox` field from a source URL alone. Use only a checksum from `retrieved-media-manifest.json`, or leave the required-media gap visible for the resolver to reject.
4. Validate the completed artifact with `validateStarterManifest` before marking it reviewed.

The initial inventory identified source material for the six named Case Studies, six News candidates, Issue No. 5 of the Zine, and the three Zine articles “Jealous Much?”, “Made to Bloom”, and “Who Gets the Light?”. It is planning evidence only until those records are added to the manifest with field-level provenance.

## 1. Purpose

Create a repeatable, intentionally destructive CMS seed pipeline that transforms the Superbloom Website Content Master Tracker into a complete, published starter dataset.

The starter dataset is a pre-authoring visual-validation environment. It exists to exercise the implemented site with realistic content density, a varied media inventory, and every important layout state. It is not client-approved content and must not be treated as a launch-ready CMS export.

The pipeline must:

1. use a local Markdown snapshot as deterministic source input;
2. extract source content and linked media into a reviewable normalized manifest;
3. use LLM-assisted inference to complete intentionally incomplete records;
4. download every linked media asset that can be retrieved successfully;
5. reuse downloaded project media for media fields with no source asset;
6. back up and delete every editable CMS document;
7. upload any newly downloaded assets without deleting existing Sanity assets;
8. publish a complete representative dataset; and
9. validate the resulting documents against the actual Sanity schema contracts.

## 2. Non-goals

This seed does not:

- establish a production content-authoring workflow;
- make inferred copy or media choices client-approved;
- scrape the text or images of arbitrary linked editorial pages;
- delete existing Sanity image or file assets;
- replace Mux-hosted video with native Sanity video storage;
- introduce a general-purpose page builder or alter CMS schemas solely to accommodate tracker ambiguities; or
- run safely against a CMS that has begun real editorial authoring.

It is deliberately nuclear. Run it only in a disposable, pre-authoring dataset.

## 3. Source authority and refresh model

### 3.1 Canonical import input

The importer reads a committed local Markdown snapshot, initially sourced from:

```text
~/Downloads/SUPERBLOOM WEBSITE CONTENT MASTER TRACKER.md
```

The implementation must copy this input into a repository-owned seed-source location before generating a manifest. Proposed location:

```text
apps/studio/seed/source/content-master.md
```

The seed command never reads a live Google Doc. This makes a seed run reproducible from a particular source revision.

### 3.2 Explicit source refresh

Provide a separate refresh command that updates the local snapshot from the Google Doc only when Google access is configured and succeeds. The refresh command must not mutate Sanity.

Proposed interfaces:

```bash
pnpm --filter studio seed:refresh-source
pnpm --filter studio seed:build-manifest
pnpm --filter studio seed:validate
pnpm --filter studio seed:run -- --reset --confirm-reset
```

`seed:refresh-source` must:

1. fetch or export the configured source document;
2. write the result to the repository-owned Markdown snapshot;
3. record the source URL, retrieval time, and content checksum in a sidecar metadata file; and
4. fail without modifying the current snapshot when the retrieval is unavailable or invalid.

The first implementation may support a manually downloaded replacement snapshot if automated Google export credentials are not yet available. The command interface and metadata contract must remain the same so an authenticated exporter can replace that implementation later.

### 3.3 Linked-resource boundary

The extractor classifies links, but downloads only media that is successfully retrievable:

| Link category | Seed behavior |
| --- | --- |
| Direct image, video, or PDF file | Download, inspect, add to the media manifest, then upload if selected by a CMS record. |
| Google Drive file or folder | Attempt an authorized or public download. Include files that resolve to usable media; record failures without aborting the whole seed. |
| Vimeo video | Preserve the canonical URL as source provenance. Download an available poster or source only when Vimeo permits it; upload a successfully downloaded source through the existing Mux media workflow before assigning it to a `mediaBox`. |
| Figma, Google Docs, Google Slides, articles, press links, and social posts | Preserve as references where an applicable content field exists. Do not scrape page content or treat the page itself as a media asset. |
| Unreachable, restricted, unsupported, or non-media URL | Record the failure and continue. It cannot satisfy a required media field. |

No credentials, signed URLs, cookies, or downloaded source files may be committed.

## 4. Target coverage

The starter dataset must provide a complete visual and motion test surface with the following minimum coverage:

| Surface | Minimum seeded coverage |
| --- | --- |
| Singleton content | Homepage, Work Index, Who We Are, Zine Landing, Index Page, and Site Settings |
| Case Studies | Six published Case Studies derived from the tracker |
| News | Six published News Articles |
| Zine | One published Zine Issue with three published Zine Articles |
| Cards | Every allowed card width, media aspect ratio, and info position represented across list and detail contexts |
| Content Layout Rows | Text-only, media-only, two-column, narrow single-block alignment, portrait, landscape, square, and video layouts |
| Case Study Spine | Highlights, Challenge, Unexpected Insight, Big Idea, and Results populated on every Case Study |
| Media behavior | Image and video representations sufficient to test loading, crop, autoplay/visibility behavior, and reduced-motion behavior |

The importer should use the tracker’s named Case Studies as the initial six: Tyson, Silversea, Deel, Simon Malls, Voodoo Ranger, and Jimmy Dean. If a source record cannot be completed from extracted or inferred data, the manifest generator must complete it rather than silently omit it.

## 5. Pipeline architecture

The pipeline has four distinct phases. Only the final phase mutates Sanity.

```text
Markdown source
  -> link/media inventory
  -> LLM-normalized content manifest
  -> deterministic validation and seed plan
  -> backup, document reset, asset upload, document publish
```

### 5.1 Phase A: Source extraction

The extractor reads Markdown headings, lists, tables, links, and section labels. It must retain enough provenance to explain every generated field:

- source line range;
- source heading path;
- original text;
- original URL, where present; and
- extraction confidence or failure reason.

It produces:

1. a structured source outline;
2. a de-duplicated link inventory;
3. a downloadable-media inventory with MIME type, dimensions or duration when discoverable, checksum, and local cache path; and
4. a diagnostics report for invalid, inaccessible, or ambiguous source material.

### 5.2 Phase B: LLM-assisted manifest generation

An LLM converts the extracted source outline into a normalized manifest. This is the only inference phase. The deterministic seed code must not make content decisions.

The generated manifest must distinguish three provenance classes:

| Provenance | Meaning |
| --- | --- |
| `source` | Directly represented by tracker text or a linked asset. |
| `derived` | Reformatted, condensed, or structurally mapped from source material without introducing a new factual claim. |
| `inferred` | Created to complete the visual-validation dataset, including fabricated copy, dates, colors, metadata, or media assignment. |

The manifest generator may fabricate content and choose reusable downloaded media where needed. It must preserve the provenance and rationale for every inferred field so authors can replace it later.

The manifest is an input artifact, not an opaque runtime output. Save it in a repository-owned generated location, for example:

```text
apps/studio/seed/generated/content-manifest.json
apps/studio/seed/generated/media-manifest.json
apps/studio/seed/generated/diagnostics.json
```

Generated artifacts should be reviewed before a destructive run. Whether they are committed or ignored is an implementation decision, but the implementation must make their exact source checksum and generation time inspectable.

### 5.3 Phase C: Deterministic seed planning and validation

The planner reads the manifests and builds fully resolved Sanity documents and upload operations. It must:

- assign stable IDs and array `_key` values;
- resolve all references before publishing documents;
- choose only retrieved project media for media fallbacks;
- retain Vimeo URLs as source metadata and use a successfully downloaded/uploaded Mux asset, or another retrieved project asset, for a `mediaBox`;
- build valid Portable Text;
- build valid `contentLayoutRow` values;
- calculate or declare supported image aspect ratios;
- generate valid slugs, dates, tags, colors, card settings, and required singleton fields;
- verify the required Zine Issue to Zine Article cardinality and membership rules; and
- fail before mutation if a document cannot satisfy schema validation.

The planner must also emit a human-readable dry-run report that lists:

- documents to create by type;
- documents to delete by type;
- assets to upload, reuse, or leave unreferenced;
- source media failures;
- every inferred field grouped by document;
- field-level validation failures; and
- schema coverage achieved against Section 4.

### 5.4 Phase D: Sanity mutation

The mutation command is the only command allowed to alter CMS data. It must run in this order:

1. validate manifests and resolved documents;
2. create a timestamped JSON backup of all editable documents;
3. require explicit confirmation flags;
4. delete all editable documents;
5. upload only required new image and file assets;
6. create reference-independent documents such as Tags and Capabilities;
7. create Articles and Case Studies;
8. create reference-owning singletons, indices, and Zine Issues;
9. fetch and validate the published result; and
10. write a mutation report containing document IDs, asset IDs, and verification status.

Use Sanity transactions for document deletion and creation where transaction limits allow. Batch operations must be deterministic and report their batch boundaries.

## 6. Nuclear reset contract

### 6.1 Reset scope

`--reset --confirm-reset` deletes every editable CMS document in the configured dataset before publishing the starter set. This includes existing singleton documents, Case Studies, Articles, Zine Issues, Tags, Capabilities, and Form Submissions. It excludes:

- Sanity system documents;
- image assets;
- file assets;
- Mux media assets managed outside standard document deletion;
- users, roles, datasets, project configuration, and Studio configuration.

The implementation must derive the document inventory from the Studio schema registration rather than maintain an unreviewed hardcoded type list. It must explicitly report the discovered types before deletion.

### 6.2 Asset policy

The reset never deletes assets. Existing Sanity assets remain available, even if they become unreferenced. The seed uploads newly retrieved assets only when the resolved starter documents use them.

The import manifest must record:

- source URL;
- local checksum;
- Sanity asset ID after upload;
- MIME type;
- dimensions/duration where available;
- selected CMS uses; and
- whether the use is source-backed or inferred.

The uploader must deduplicate by checksum within a run and reuse a previously uploaded asset when the media manifest has a known matching Sanity asset ID. It must not attempt a global asset purge.

### 6.3 Required operator acknowledgement

The mutation command must refuse to run unless both explicit flags are present:

```bash
pnpm --filter studio seed:run -- --reset --confirm-reset
```

It must print the target Sanity project and dataset, the backup path, the editable-document count, and the asset retention policy before performing a mutation.

`--dry-run` must exercise all extraction, manifest, resolution, validation, and deletion planning logic without uploading assets, deleting documents, or committing transactions.

## 7. Content mapping contract

The exact manifest shape may evolve, but it must express the following concepts independently of Sanity’s wire format:

```ts
type StarterManifest = {
  source: {
    path: string
    checksum: string
    refreshedAt?: string
    sourceUrl?: string
  }
  media: MediaSource[]
  documents: StarterDocument[]
  diagnostics: Diagnostic[]
}

type StarterDocument = {
  id: string
  type: string
  provenance: 'source' | 'derived' | 'inferred'
  sourceRefs: SourceRef[]
  fields: Record<string, unknown>
  inferredFields: Array<{path: string; rationale: string}>
}
```

The normalized document layer must map to current schema contracts, not assumptions about frontend rendering.

### 7.1 Case Studies

Every seeded Case Study must satisfy `packages/schemas/src/caseStudy.ts`:

- `title`, `slug`, `client`, `publicationDate`, and `summary`;
- valid capability references;
- required card media and card settings;
- primary brand color and any required secondary color;
- all five Case Study Spine sections;
- Results stats and Results section requirements;
- optional source-backed or inferred press references; and
- an optional Next Project reference that never self-references.

The seed must use the Case Study Spine exactly as defined. It must not treat tracker modules as arbitrary reorderable page sections.

### 7.2 Articles and News

News and Zine records are stored as `article` documents in `packages/schemas/src/article.ts`.

Each seeded Article must provide:

- `articleType`;
- title, slug, publication date, overview, card media, lead media, and valid card settings;
- valid Portable Text and Content Layout Rows;
- source-backed external coverage for tracker press links when applicable; and
- exactly three unique related Articles when `relatedItems` is populated.

News may use inferred internal body content for visual coverage. External links remain source provenance and are not scraped.

### 7.3 Zine

The starter Zine must use one `zineIssue` and exactly three `articleType: "zine"` records. The issue must:

- contain required card and hero media;
- contain a non-empty editor letter;
- reference the three articles in intended display order;
- supply valid list defaults and overrides; and
- satisfy the existing unique-membership validation.

Every seeded Zine Article belongs to this one Issue. No seeded Zine Article may be left unattached or attached to more than one Issue.

### 7.4 Singletons, taxonomy, and references

The manifest must populate all fields needed by the Homepage, Work Index, Who We Are, Zine Landing, Index Page, and Site Settings schemas. It must create taxonomy documents before documents that reference them.

The seed must use the domain terminology and contracts in `CONTEXT.md`, including:

- Work is composed of Case Studies;
- News, Editorial Articles, and Zine Articles retain their separate editorial identities through `articleType`;
- Tags are distinct from Capabilities; and
- media uses existing `mediaBox` and Mux conventions.

## 8. Proposed implementation layout

```text
apps/studio/
  migrations/
    backup-cms-starter-seed.ts
    reset-cms-documents.ts
  seed/
    source/
      content-master.md
      source-metadata.json
    generated/
      content-manifest.json
      media-manifest.json
      diagnostics.json
    cache/
      media/
    src/
      refresh-source.ts
      extract-tracker.ts
      classify-links.ts
      download-media.ts
      generate-manifest.ts
      resolve-manifest.ts
      validate-manifest.ts
      upload-assets.ts
      reset-and-seed.ts
      portable-text.ts
      sanity-documents.ts
      types.ts
  package.json
```

This layout separates one-off migrations from reusable seed pipeline code. Exact names can change, but source snapshot, generated manifest, downloaded-media cache, pure document resolvers, and mutation entrypoints must remain separate concerns.

## 9. Validation and test strategy

### 9.1 Unit tests

Add focused Vitest coverage for:

- Markdown heading/list/link extraction;
- link classification and direct-download eligibility;
- deduplication and media fallback selection;
- provenance preservation;
- source-to-Portable-Text conversion;
- source-to-Content Layout Row conversion;
- stable ID and `_key` generation;
- field inference marking;
- Case Study Spine completion;
- Article type and Zine Issue membership construction;
- card-setting combinations; and
- rejection of unresolved required fields.

Pure mapping and validation helpers belong with schema-level test conventions in `packages/schemas/src` when they enforce a schema contract. Studio seed orchestration tests belong beside the seed code.

### 9.2 Integration validation

Before declaring the seed complete, run:

```bash
pnpm --filter @superbloom/schemas test
pnpm --filter studio typecheck
pnpm --filter studio build
pnpm --filter studio seed:run -- --dry-run
pnpm --filter studio audit:zine
```

If `typecheck` is not a Studio script, add or use the repository’s established equivalent rather than skipping static validation.

The real run must perform post-write GROQ checks for:

- required singleton count and uniqueness;
- six Case Studies;
- six News Articles;
- one Zine Issue and three Zine Articles;
- no missing references;
- no invalid required `mediaBox` values;
- full Case Study Spine presence;
- Zine membership integrity;
- expected card/layout coverage; and
- all documents published, not drafts.

### 9.3 Manual visual verification

After publishing, review the site in the staging environment at desktop and mobile sizes. Verify:

- card composition variants;
- image crops and alternate aspect ratios;
- video loading and playback visibility behavior;
- content-density behavior in the Case Study Spine and Article Body;
- singleton module population;
- route and list behavior for every seeded editorial identity; and
- reduced-motion behavior with video and layout-heavy content.

This manual pass verifies the actual goal of the seed: high-fidelity design and motion decisions against representative data.

## 10. Failure handling

| Failure | Required behavior |
| --- | --- |
| Google refresh fails | Preserve the existing local source snapshot and fail the refresh command. |
| A linked media download fails | Record the diagnostic, continue extraction, and select another retrieved project asset if the manifest needs a fallback. |
| No retrieved media exists for a required field | Fail manifest validation. Do not create a fake Sanity asset or write a broken reference. |
| LLM output is malformed | Reject it against the manifest schema; do not start reset or mutation. |
| Resolved document violates schema contract | Fail before backup/reset. |
| Backup fails | Do not delete documents. |
| Reset or publish partially fails | Preserve the operation report, stop further mutations, and restore from the backup through an explicit recovery command. |
| Post-write verification fails | Report all discrepancies and retain the backup for recovery. |

## 11. Ticket breakdown

Future implementation work should be split into independently verifiable tickets:

1. **Seed source and extraction:** repository-owned Markdown snapshot, refresh interface, parser, provenance, and link inventory.
2. **Media inventory and downloader:** link classification, Drive/direct-file retrieval, cache, inspection, checksum deduplication, and diagnostics.
3. **Normalized manifest contract:** types, JSON schema, LLM generation boundary, review output, and manifest validation.
4. **Content resolvers:** pure transformations from manifest records into current Case Study, Article, Zine, taxonomy, and singleton schemas.
5. **Asset upload and document seeder:** Sanity upload support, stable references, publishing order, dry-run behavior, and reports.
6. **Nuclear reset and recovery:** full editable-document backup, reset confirmation, deletion, recovery instructions, and post-write audit.
7. **Coverage and UI verification:** automated schema/coverage checks plus staging visual and motion verification.

Each ticket must preserve the phase boundary that no destructive Sanity operation occurs until a deterministic manifest has passed validation.

## 12. Acceptance criteria

The implementation is complete when:

1. a known Markdown snapshot can generate the same normalized manifest deterministically after LLM output is accepted;
2. every successfully downloadable linked media asset is represented in the media manifest;
3. inaccessible media is visible in diagnostics and never causes unrelated media extraction to fail;
4. the starter manifest has complete representative records for the coverage target in Section 4;
5. all inferred fields are explicitly marked with rationale;
6. `--dry-run` performs no Sanity mutation;
7. a real run backs up then removes every editable CMS document while retaining assets;
8. the new documents are published and satisfy all current schema contracts;
9. Zine membership audit succeeds;
10. all automated validators pass; and
11. staging renders each target page and the required design/motion variants with seeded content.

## 13. References

- Source snapshot: `apps/studio/seed/source/content-master.md` (to be added during implementation)
- CMS commands: `apps/studio/package.json`
- Existing dry-run migration precedent: `apps/studio/migrations/migrate-article-body.ts`
- Existing backup precedent: `apps/studio/migrations/backup-zine-data.ts`
- Case Study schema: `packages/schemas/src/caseStudy.ts`
- Article schema: `packages/schemas/src/article.ts`
- Zine Issue schema: `packages/schemas/src/zineIssue.ts`
- Shared CMS composition contract: `docs/design-system/cms-content-composition-spec.md`
- Project domain vocabulary: `CONTEXT.md`
