import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const admins = [
    "admin@newsicons.com",
    "admin@jejutime.com",
    "admin@jejuqq.com",
    "admin@jejujapan.com"
];

async function main() {
    for (const email of admins) {
        console.log(`Ensuring Supabase Auth user for ${email}...`);
        
        // Try to create user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: "admin123",
            email_confirm: true,
            user_metadata: { role: "admin" }
        });

        if (error) {
            if (error.message.includes("already exists")) {
                console.log(`User ${email} already exists. Updating password...`);
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                    // We need the ID. Let's find the user first.
                    (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === email)!.id,
                    { password: "admin123" }
                );
                if (updateError) {
                    console.error(`Failed to update ${email}: ${updateError.message}`);
                } else {
                    console.log(`Updated ${email} successfully.`);
                }
            } else {
                console.error(`Failed to create ${email}: ${error.message}`);
            }
        } else {
            console.log(`Created ${email} successfully.`);
        }
    }
}

main();
