#!/usr/bin/env node
/**
 * One-time script: upload the reviewed "WhatsApp Chat with Baba Jio" batch
 * (cleaned images + photo_slot coords in upload_manifest.json) to the
 * Supabase `cards` bucket and insert matching seed rows.
 *
 * Setup: add SUPABASE_SERVICE_KEY to .env (Supabase dashboard → Settings →
 * API → service_role) — required to write seed rows (created_by = NULL)
 * and upload into the admin-only `cards` bucket.
 *
 * Usage:
 *   node scripts/upload-baba-jio-cards.js           — dry run, no writes
 *   node scripts/upload-baba-jio-cards.js --commit   — actually upload + insert
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const COMMIT = process.argv.includes('--commit');

const IMAGE_DIR =
  '/private/tmp/claude-501/-Users-sawan-Zingo-quoteflow/53c9418d-6434-43b3-b806-2671e8959d2e/scratchpad/ready-for-upload';
const MANIFEST_PATH =
  '/private/tmp/claude-501/-Users-sawan-Zingo-quoteflow/53c9418d-6434-43b3-b806-2671e8959d2e/scratchpad/upload_manifest.json';

if (COMMIT && !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = COMMIT
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  console.log(`${manifest.length} cards to upload. COMMIT=${COMMIT}\n`);

  let uploaded = 0, failed = 0;

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    const storagePath = `seed/whatsapp-baba-jio/${entry.category}_${entry.file}`;
    const label = `[${i + 1}/${manifest.length}] ${entry.file} -> ${entry.category}${entry.supports_personalization ? ' (photo slot)' : ''}`;

    if (!COMMIT) {
      console.log(`[dry] ${label}`);
      continue;
    }

    try {
      const buffer = fs.readFileSync(path.join(IMAGE_DIR, entry.file));
      const { error: uploadErr } = await supabase.storage
        .from('cards')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: pub } = supabase.storage.from('cards').getPublicUrl(storagePath);

      const { error: insertErr } = await supabase.from('cards').insert({
        image_url: pub.publicUrl,
        category: entry.category,
        is_premium: entry.is_premium,
        is_public: entry.is_public,
        created_by: entry.created_by,
        supports_personalization: entry.supports_personalization,
        photo_slot: entry.photo_slot,
        name_slot: entry.name_slot,
        name_slot_reviewed: entry.name_slot_reviewed,
      });
      if (insertErr) throw insertErr;

      console.log(`✓ ${label}`);
      uploaded++;
    } catch (err) {
      console.log(`✗ ${label}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
