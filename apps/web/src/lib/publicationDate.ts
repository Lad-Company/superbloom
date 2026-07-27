const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const pad = (n: number) => String(n).padStart(2, '0')

export const formatPublicationDate = (value: string) => {
  const date = new Date(value)
  return {
    label: formatter.format(date),
    dateTime: date.toISOString(),
  }
}

export const formatPublicationDateIndex = (value: string) => {
  const date = new Date(value)
  const month = pad(date.getUTCMonth() + 1)
  const day = pad(date.getUTCDate())
  const year = pad(date.getUTCFullYear() % 100)
  return {
    label: `${month}.${day}.${year}`,
    dateTime: date.toISOString(),
  }
}
