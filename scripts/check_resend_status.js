const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' }); // Try .env.local first
require('dotenv').config(); // Fallback to .env

const key = process.env.RESEND_API_KEY;

if (!key) {
    console.error("❌ No RESEND_API_KEY found in .env or .env.local");
    process.exit(1);
}

const resend = new Resend(key);

async function checkStatus() {
    try {
        console.log("🔍 Checking Resend Account Configuration...");

        // 1. List Domains
        const domains = await resend.domains.list();
        console.log("DEBUG RESPONSE:", JSON.stringify(domains, null, 2));

        const domainList = domains.data || [];

        if (domainList.length === 0) {
            console.log("\n⚠️  No domains found on this account.");
        } else {
            console.log(`\n✅ Found ${domainList.length} domain(s):`);
            domainList.forEach(d => {
                console.log(`   - ${d.name} (ID: ${d.id}) | Status: ${d.status}`);
                if (d.status !== 'verified') {
                    console.log(`     👉 Region: ${d.region}`);
                }
            });
        }

        // 2. Send Test Email (to Ensure Keys work)
        console.log("\n📧 Attempting to send test email...");
        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev',
            subject: 'Kharcho Test',
            html: '<p>Test email from Kharcho Script</p>'
        });

        if (result.error) {
            console.error("❌ Send Failed:", result.error);
        } else {
            console.log("✅ API Key is working! Test email sent ID:", result?.data?.id);
        }

    } catch (error) {
        console.error("🔥 Fatal Error:", error.message);
        console.error(error);
    }
}

checkStatus();
