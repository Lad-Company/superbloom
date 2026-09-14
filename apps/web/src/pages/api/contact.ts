import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inquiryTypes = new Set([
  'agency-partner',
  'production-partner',
  'media-partner',
  'creative-partner',
  'collective',
]);
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

  if (!sanityToken) {
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
