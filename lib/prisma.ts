import { PrismaClient } from "@prisma/client"

const prismaClientSingleton = () => {
    console.log("Initializing Prisma Client...")
    return new PrismaClient().$extends({
        query: {
            expense: {
                async findMany({ args, query }) {
                    if (!args.where || Object.keys(args.where).length === 0) {
                        console.error("[Zero-Trust] BLOCKED: Blind 'Select All' on Expense table.");
                        throw new Error("Zero-Trust Violation: Blind queries are forbidden. You must filter by User ID.");
                    }
                    return query(args)
                }
            },
            trip: {
                async findMany({ args, query }) {
                    if (!args.where || Object.keys(args.where).length === 0) {
                        console.error("[Zero-Trust] BLOCKED: Blind 'Select All' on Trip table.");
                        throw new Error("Zero-Trust Violation: Blind queries are forbidden.");
                    }
                    return query(args)
                }
            },
            // Note: Transaction model might not exist or be named differently (e.g. ReconciliationTransaction), 
            // verifying names from schema: We have Expense, Trip. 
            // We'll stick to known sensitive models.
        }
    })
}

// Global declaration for singleton pattern (prevents hot-reload connection leaks)
type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: ExtendedPrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
