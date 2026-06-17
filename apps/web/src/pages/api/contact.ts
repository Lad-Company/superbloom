import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.formData();
  const inquiryType = body.get('inquiryType')?.toString() ?? '';
  const name = body.get('name')?.toString().trim() ?? '';
  const email = body.get('email')?.toString().trim() ?? '';
  const hearAboutUs = body.get('hearAboutUs')?.toString() ?? '';
  const message = body.get('message')?.toString().trim() ?? '';

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Name, email, and message are required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const errors: string[] = [];

  // Write to Sanity
  const sanityToken = import.meta.env.SANITY_API_TOKEN;
  if (sanityToken) {
    try {
      const writeClient = createClient({
        projectId: 'l9mhqdtj',
        dataset: 'production',
        apiVersion: '2026-06-01',
        useCdn: false,
        token: sanityToken,
      });
      await writeClient.create({
        _type: 'formSubmission',
        inquiryType,
        name,
        email,
        hearAboutUs,
        message,
        submittedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Sanity write failed:', err);
      errors.push('sanity');
    }
  }

  // Subscribe to Mailchimp audience
  const mcKey = import.meta.env.MAILCHIMP_KEY;
  const mcListId = import.meta.env.MAILCHIMP_AUDIENCE_ID;
  if (mcKey && mcListId) {
    const dc = mcKey.split('-').pop();
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${mcListId}/members`;
    const auth = Buffer.from(`anystring:${mcKey}`).toString('base64');
    try {
      const mc = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: { FNAME: name },
        }),
      });
      if (!mc.ok) {
        const data = await mc.json() as { title?: string };
        // 'Member Exists' is not an error for our purposes
        if (data.title !== 'Member Exists') {
          console.error('Mailchimp error:', data);
          errors.push('mailchimp');
        }
      }
    } catch (err) {
      console.error('Mailchimp fetch failed:', err);
      errors.push('mailchimp');
    }
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Submission partially failed.', detail: errors.join(', ') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
