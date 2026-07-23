import {capability} from './capability'
import {caseStudy} from './caseStudy'
import {tag} from './tag'
import {article} from './article'
import {heroBlock} from './heroBlock'
import {capesBlock} from './capesBlock'
import {newsBlock} from './newsBlock'
import {homepage} from './homepage'
import {workIndex} from './workIndex'
import {whoWeAre} from './whoWeAre'
import {formSubmission} from './formSubmission'
import {contactBlock} from './contactBlock'
import {mediaBox} from './mediaBox'
import {caseStudyNarrativeSection} from './caseStudyNarrativeSection'
import {caseStudyResults} from './caseStudyResults'
import {zineIssue} from './zineIssue'
import {zineLanding} from './zineLanding'
import {homeZine} from './homeZine'
import {indexPage} from './indexPage'
import {siteSettings} from './siteSettings'
import {contentLayoutMedia} from './contentLayoutMedia'
import {contentLayoutText} from './contentLayoutText'
import {contentLayoutRow} from './contentLayoutRow'

export {migrateLegacyCaseStudyBlock} from './caseStudyMigration'
export type {LegacyCaseStudyBlock} from './caseStudyMigration'
export {migrateLegacyArticleBlock} from './articleMigration'
export type {LegacyArticleBlock} from './articleMigration'
export {migrateLegacyIndexPage} from './indexPageMigration'
export type {LegacyIndexPage} from './indexPageMigration'

export const schemaTypes = [
  capability,
  caseStudy,
  tag,
  article,
  heroBlock,
  capesBlock,
  newsBlock,
  homepage,
  workIndex,
  whoWeAre,
  formSubmission,
  contactBlock,
  mediaBox,
  caseStudyNarrativeSection,
  caseStudyResults,
  zineIssue,
  zineLanding,
  homeZine,
  indexPage,
  siteSettings,
  contentLayoutMedia,
  contentLayoutText,
  contentLayoutRow,
]
