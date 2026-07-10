const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

const env = {};
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the parsed-codes file
const codesPath = path.join(__dirname, 'src/lib/db/parsed-codes.ts');
const codesContent = fs.readFileSync(codesPath, 'utf8');

// Extract the generatedCodes array from the file
const match = codesContent.match(/export const generatedCodes: AccessCode\[\] = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Could not find generatedCodes in parsed-codes.ts');
  process.exit(1);
}

// Define the now function that the eval needs
const now = () => new Date().toISOString();

// Parse the array (simple eval for this specific case)
const generatedCodes = eval(match[1]);

async function seedActivationCodes() {
  console.log('Seeding activation codes to Supabase...');
  console.log(`Total codes to seed: ${generatedCodes.length}`);

  let successCount = 0;
  let failCount = 0;

  for (const code of generatedCodes) {
    const { error } = await supabase
      .from('activation_codes')
      .insert({
        code: code.code,
        tier: code.tier,
        duration_days: code.duration_days,
        is_used: false,
      });

    if (error) {
      console.error(`✗ Failed to insert code ${code.code}:`, error.message);
      failCount++;
    } else {
      console.log(`✓ Inserted code: ${code.code} (${code.tier})`);
      successCount++;
    }
  }

  console.log(`\nSeeding complete! Success: ${successCount}, Failed: ${failCount}`);
}

seedActivationCodes().catch(console.error);
