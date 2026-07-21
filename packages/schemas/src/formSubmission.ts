import {defineField, defineType} from 'sanity'

export const formSubmission = defineType({
  name: 'formSubmission',
  title: 'Form Submission',
  type: 'document',
  fields: [
    defineField({
      name: 'inquiryType',
      title: 'Inquiry Type',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hearAboutUs',
      title: 'How did you hear about us?',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'message',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'email'},
  },
})
