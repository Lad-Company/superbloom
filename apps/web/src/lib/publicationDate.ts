const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export const formatPublicationDate = (value: string) => {
  const date = new Date(value)
  return {
    label: formatter.format(date),
    dateTime: date.toISOString(),
  }
}
