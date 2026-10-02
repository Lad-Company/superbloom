import type {CreateEmailOptions} from 'resend'

// Best-effort email send shared by API endpoints whose primary write has
// already succeeded: a missing RESEND_API_KEY or a send failure only logs
// (the error message plus caller-supplied non-PII context, never recipient
// data) and never throws.
export async function sendBestEffortEmail(
  label: string,
  options: CreateEmailOptions,
  context: Record<string, unknown> = {},
): Promise<void> {
  const resendKey = import.meta.env.RESEND_API_KEY

  if (!resendKey) {
    console.error(`RESEND_API_KEY not configured; ${label} skipped`, context)
    return
  }

  try {
    const {Resend} = await import('resend')
    await new Resend(resendKey).emails.send(options)
  } catch (caughtError) {
    // Log the error message only — never recipient PII.
    const message = caughtError instanceof Error ? caughtError.message : 'Unknown failure'
    console.error(`${label} failed`, {...context, message})
  }
}
