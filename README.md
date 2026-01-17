# Kharcho - Enterprise Expense Management

Kharcho is a modern, full-stack expense management platform built with Next.js 16, Prisma, and Tailwind CSS. It features powerful search capabilities, collaboration tools, and automated workflows.

## 🚀 Key Features

### 1. Power Search & Filters
- **Advanced Query Syntax**: Search using natural language-like queries (e.g., `amount>100 status:pending merchant:"Uber"`).
- **Saved Searches**: Save complex filters for quick access, with pinning and sharing capabilities.
- **Autocomplete**: Intelligent suggestions for fields and values as you type.

### 2. Collaboration
- **Discussion Threads**: Contextual comments on expenses, trips, and reports.
- **@Mentions**: Tag team members to notify them immediately.
- **Notifications**: Real-time alerts for approvals, mentions, and comments.

### 3. Smart To-do List
- **Unified Inland**: Aggregates all actionable items (approvals, receipt fixes, reconciliations) in one place.
- **Quick Actions**: Approve, reject, or reconcile directly from the to-do list.
- **Prioritization**: Intelligent sorting based on urgency and item age.

### 4. Expense Calendar
- **Visual Timeline**: View expenses in a monthly calendar view.
- **Daily Summaries**: Quick insight into daily spending volume.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (Dev) / PostgreSQL (Prod) with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js v5
- **Testing**: Playwright (E2E)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kharcho.git
   cd kharcho
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and configure your database URL and NextAuth secret.

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## 🧪 Running Tests

We use Playwright for End-to-End testing.

1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Run E2E tests:
   ```bash
   npx playwright test
   ```

## 📝 Query Syntax Guide

The search bar supports specific operators to refine your results:

- **Comparison**: `amount>50`, `amount<=200`
- **Field Match**: `merchant:Uber`, `category:Travel`
- **Exact Match**: `status:"Pending Approval"`
- **Dates**: `date:today`, `date:last-month`, `date>2024-01-01`
- **Logic**: Use space for AND (implicit).
