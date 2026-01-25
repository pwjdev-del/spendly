
import prisma from "./lib/prisma"

async function debugUserFetch(email: string) {
    console.log(`[DEBUG] Attempting to fetch user by email: ${email}`);

    // 1. Fetch by Email (Auth logic)
    const userByEmail = await prisma.user.findFirst({
        where: { email }
    });
    console.log(`[DEBUG] findFirst(email) result:`, userByEmail ? `Found ID: ${userByEmail.id}` : "NULL");

    if (!userByEmail) {
        console.error("CRITICAL: User not found strictly by email.");
        return;
    }

    // 2. Simulate Layout Fetch (ById)
    console.log(`[DEBUG] Attempting layout fetch with ID: ${userByEmail.id}`);
    const layoutUser = await prisma.user.findUnique({
        where: { id: userByEmail.id },
        select: {
            id: true,
            role: true,
            organizationId: true,
            organization: {
                select: { name: true }
            }
        }
    });

    console.log(`[DEBUG] findUnique(id) result:`, layoutUser);

    if (!layoutUser) {
        console.error("CRITICAL: User found by email but fetchUnique(id) returned NULL. This implies ID mismatch or DB corruption?");
    } else {
        console.log("SUCCESS: Layout fetch works as expected locally.");
    }
}

// Hardcoded email from layout logs or assumption
debugUserFetch("patelkathan134@gmail.com").catch(e => console.error(e));
