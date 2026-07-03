#!/usr/bin/env node
/**
 * One-time script: auto-detect photo placeholder coordinates for all seed cards
 * using Google Gemini Vision (free tier), then store results in photo_slot.
 *
 * Setup:
 *   1. Get a free Gemini API key: https://aistudio.google.com/app/apikey
 *   2. Add to .env: GEMINI_API_KEY=...  and  SUPABASE_SERVICE_KEY=...
 *
 * Usage:
 *   node scripts/detect-photo-slots.js           — process all seed cards
 *   node scripts/detect-photo-slots.js --dry-run — print detections, no DB writes
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const DRY_RUN = process.argv.includes('--dry-run');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PROMPT = `This is a card design for a social media app. It has a blank placeholder area where a user's profile photo will be placed. The placeholder might look like: an empty circle/oval frame, a silhouette cutout, a portrait frame, or a decorative ring.

Find that placeholder and return ONLY valid JSON — no markdown, no explanation:
{"top": <number>, "left": <number>, "width": <number>, "height": <number>, "style": "circle" | "portrait", "borderRadius": <9999 for circle/oval, 0 for rectangle>}

Coordinates must be in canvas units where the full image width = 400. Scale your pixel coordinates by (400 / actual_image_width).

If there is no photo placeholder, return: {"no_placeholder": true}`;

function fetchImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function detectSlot(imageUrl) {
  const base64 = await fetchImageAsBase64(imageUrl);
  const result = await model.generateContent([
    { inlineData: { mimeType: 'image/png', data: base64 } },
    PROMPT,
  ]);
  const raw = result.response.text().trim();
  const json = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(json);
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY in .env');
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  const { data: cards, error } = await supabase
    .from('cards')
    .select('id, image_url')
    .is('created_by', null)
    .eq('supports_personalization', true)
    .not('image_url', 'is', null);

  if (error) throw error;

  console.log(`Found ${cards.length} seed cards. DRY_RUN=${DRY_RUN}\n`);

  let updated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const name = card.image_url.split('/').pop();
    process.stdout.write(`[${i + 1}/${cards.length}] ${name} ... `);

    try {
      const slot = await detectSlot(card.image_url);

      if (slot.no_placeholder) {
        console.log('no placeholder — skipped');
        skipped++;
      } else {
        const rounded = {
          style: slot.style,
          top: Math.round(slot.top),
          left: Math.round(slot.left),
          width: Math.round(slot.width),
          height: Math.round(slot.height),
          borderRadius: slot.borderRadius ?? (slot.style === 'circle' ? 9999 : 0),
        };
        const summary = `${rounded.style} top:${rounded.top} left:${rounded.left} ${rounded.width}x${rounded.height}`;

        if (DRY_RUN) {
          console.log(`[dry] ${summary}`);
        } else {
          const { error: rpcErr } = await supabase.rpc('admin_update_photo_slot', {
            card_id: card.id,
            slot_value: rounded,
          });
          if (rpcErr) throw rpcErr;
          console.log(`✓ ${summary}`);
        }
        updated++;
      }
    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed++;
    }

    // Respect Gemini free tier rate limit (15 req/min)
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (no placeholder), ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
