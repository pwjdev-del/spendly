-- Migration Script: Check for data loss warnings first

-- 1. Transaction
UPDATE "Transaction" SET "amount" = CAST(ROUND("amount" * 100) AS INTEGER);

-- 2. Income
UPDATE "Income" SET "amount" = CAST(ROUND("amount" * 100) AS INTEGER);

-- 3. Card
UPDATE "Card" SET "limit" = CAST(ROUND("limit" * 100) AS INTEGER);
UPDATE "Card" SET "spent" = CAST(ROUND("spent" * 100) AS INTEGER);

-- 4. Trip
UPDATE "Trip" SET "budget" = CAST(ROUND("budget" * 100) AS INTEGER) WHERE "budget" IS NOT NULL;

-- 5. RecurringExpense
UPDATE "RecurringExpense" SET "amount" = CAST(ROUND("amount" * 100) AS INTEGER);

-- 6. User (monthlyLimit)
UPDATE "User" SET "monthlyLimit" = CAST(ROUND("monthlyLimit" * 100) AS INTEGER) WHERE "monthlyLimit" IS NOT NULL;
