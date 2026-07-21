import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inquiryTypes = new Set(['agency-partner', 'creator', 'press', 'other']);
const hearAboutUsOptions = new Set(['referral', 'instagram', 'linkedin', 'google', 'event', 'other']);
const minimumFillTimeMs = 750;
const maximumFillTimeMs = 86_400_000;

function error(message: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: FormData;

  try {
    body = await request.formData();
  } catch {
    return error('invalid', 400);
  }

  const inquiryType = body.get('inquiryType')?.toString() ?? '';
  const name = body.get('name')?.toString().trim() ?? '';
  const email = body.get('email')?.toString().trim().toLowerCase() ?? '';
  const hearAboutUs = body.get('hearAboutUs')?.toString() ?? '';
  const message = body.get('message')?.toString().trim() ?? '';
  const honeypot = body.get('website')?.toString() ?? '';
  const startedAt = Number(body.get('startedAt'));
  const elapsed = Date.now() - startedAt;

  if (
    honeypot ||
    !Number.isFinite(startedAt) ||
    elapsed < minimumFillTimeMs ||
    elapsed > maximumFillTimeMs ||
    !inquiryTypes.has(inquiryType) ||
    !hearAboutUsOptions.has(hearAboutUs) ||
    !name ||
    name.length > 200 ||
    !emailPattern.test(email) ||
    email.length > 254 ||
    !message ||
    message.length > 10_000
  ) {
    return error('invalid', 400);
  }

  const sanityToken = import.meta.env.SANITY_API_TOKEN;
  const apiKey = import.meta.env.MAILCHIMP_KEY;
  const audienceId = import.meta.env.MAILCHIMP_AUDIENCE_ID;
  const journeyId = import.meta.env.MAILCHIMP_CONTACT_JOURNEY_ID;
  const journeyStepId = import.meta.env.MAILCHIMP_CONTACT_JOURNEY_STEP_ID;
  const dataCenter = apiKey?.split('-').at(-1);

  if (!sanityToken || !apiKey || !audienceId || !journeyId || !journeyStepId || !dataCenter) {
    console.error('Contact form integration is not configured');
    return error('unavailable', 503);
  }

  let submissionId: string | undefined;

  try {
    const writeClient = createClient({
      projectId: 'l9mhqdtj',
      dataset: 'production',
      apiVersion: '2026-06-01',
      useCdn: false,
      token: sanityToken,
    });
    const submission = await writeClient.create({
      _type: 'formSubmission',
      inquiryType,
      name,
      email,
      hearAboutUs,
      message,
      submittedAt: new Date().toISOString(),
    });
    submissionId = submission._id;

    const authorization = `Basic ${Buffer.from(`mailchimp:${apiKey}`).toString('base64')}`;
    const subscriberHash = await crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(email))
      .then((hash) => Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(''));
    const memberUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;
    const memberResponse = await fetch(memberUrl, {
      method: 'PUT',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: 'transactional',
        merge_fields: {FNAME: name},
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!memberResponse.ok) {
      throw new Error(`Mailchimp member request failed: ${memberResponse.status}`);
    }

    const tagResponse = await fetch(`${memberUrl}/tags`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({tags: [{name: 'contact-form', status: 'active'}]}),
      signal: AbortSignal.timeout(10_000),
    });

    if (!tagResponse.ok) {
      throw new Error(`Mailchimp tag request failed: ${tagResponse.status}`);
    }

    const journeyResponse = await fetch(
      `https://${dataCenter}.api.mailchimp.com/3.0/customer-journeys/journeys/${journeyId}/steps/${journeyStepId}/actions/trigger`,
      {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email_address: email}),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!journeyResponse.ok) {
      throw new Error(`Mailchimp journey request failed: ${journeyResponse.status}`);
    }
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : 'Unknown failure';
    console.error('Contact form submission failed', {submissionId, message});
    return error('network', 502);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
