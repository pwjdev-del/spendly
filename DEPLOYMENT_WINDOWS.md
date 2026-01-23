# Windows Server Deployment Guide for Spendly

> [!IMPORTANT]
> This guide is for deploying Spendly to a **production Windows Server with IIS** while keeping your Mac development environment fully functional.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### On Windows Server (Technician will install)

#### Required Software
- [ ] Windows Server 2016/2019/2022
- [ ] IIS (Internet Information Services) 10.0+
- [ ] Node.js 18.x or 20.x LTS ([Download](https://nodejs.org))
- [ ] Database: PostgreSQL 14+ **OR** SQL Server Express 2019+

#### Required IIS Modules
- [ ] URL Rewrite 2.1 ([Download](https://www.iis.net/downloads/microsoft/url-rewrite))
- [ ] Application Request Routing (ARR) 3.0 ([Download](https://www.iis.net/downloads/microsoft/application-request-routing))

#### Required Global NPM Packages
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### On Your Mac (You already have)
- [x] Node.js 18+
- [x] Git
- [x] Spendly source code

---

## Architecture Overview

```
┌─────────────────────────┐
│     Internet/Users      │
└───────────┬─────────────┘
            │
            │ HTTPS (443)
            ▼
┌─────────────────────────┐
│   Windows Server IIS    │  ← Reverse Proxy
│   (Public-facing)       │
└───────────┬─────────────┘
            │
            │ HTTP (localhost:3000)
            ▼
┌─────────────────────────┐
│     PM2 Process Manager │  ← Auto-restart on crash
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Next.js (Spendly App)  │  ← Your application
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   PostgreSQL Database   │  ← Data persistence
└─────────────────────────┘
```

**Your Mac Dev Environment** (Unchanged):
```
npm run dev → localhost:3000 → SQLite
```

---

## Installation Steps

### Step 1: Install Node.js on Windows Server

1. Download Node.js LTS from [nodejs.org](https://nodejs.org)
2. Run installer with default options
3. Verify installation:
```powershell
node --version  # Should show v18.x.x or v20.x.x
npm --version   # Should show 9.x.x or 10.x.x
```

### Step 2: Install IIS and Required Modules

1. **Enable IIS** (PowerShell admin):
```powershell
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

2. **Install URL Rewrite Module**:
   - Download from [iis.net/downloads/microsoft/url-rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
   - Run `rewrite_amd64_en-US.msi`
   - Accept defaults and install

3. **Install Application Request Routing (ARR)**:
   - Download from [iis.net/downloads/microsoft/application-request-routing](https://www.iis.net/downloads/microsoft/application-request-routing)
   - Run `requestRouter_amd64.msi`
   - Accept defaults and install

4. **Enable ARR Proxy**:
   - Open IIS Manager
   - Click server name in left panel
   - Double-click "Application Request Routing Cache"
   - Click "Server Proxy Settings" in right panel
   - Check "Enable proxy"
   - Click "Apply"

### Step 3: Install PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# Setup PM2 to start on Windows boot
pm2-startup install
```

### Step 4: Install Database

**Option A: PostgreSQL (Recommended)**
```powershell
# Download from https://www.postgresql.org/download/windows/
# During installation:
# - Set password for 'postgres' user
# - Port: 5432 (default)
# - Create database 'spendly_prod'
```

**Option B: SQL Server Express**
```powershell
# Download from https://www.microsoft.com/en-us/sql-server/sql-server-downloads
# Choose "Express" edition
# Create database 'spendly_prod'
```

---

## Configuration

### Step 5: Prepare Production Build (On Your Mac)

1. **Create production build**:
```bash
cd "/Users/kathanpatel/Library/CloudStorage/GoogleDrive-patelkathan134@gmail.com/My Drive/SPENDLY"

# Build for production
npm run build

# Create deployment package (includes .next, node_modules, etc)
tar -czf spendly-production.tar.gz \
  .next \
  node_modules \
  public \
  prisma \
  package.json \
  package-lock.json \
  next.config.ts \
  web.config \
  ecosystem.config.js \
  .env.production.template
```

2. **Transfer to Windows Server**:
   - Use WinSCP, FileZilla, or Remote Desktop
   - Copy to `C:\inetpub\wwwroot\spendly`

### Step 6: Configure Environment Variables (On Windows Server)

1. Navigate to deployment folder:
```powershell
cd C:\inetpub\wwwroot\spendly
```

2. Copy and configure environment:
```powershell
copy .env.production.template .env.production
notepad .env.production
```

3. **CRITICAL**: Update these values in `.env.production`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/spendly_prod"
AUTH_SECRET="<Generate new: openssl rand -base64 32>"
ENCRYPTION_KEY="<Generate new: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
NEXTAUTH_URL="https://yourdomain.com"
GOOGLE_CLIENT_ID="<Production OAuth ID>"
GOOGLE_CLIENT_SECRET="<Production OAuth Secret>"
```

### Step 7: Run Database Migrations (On Windows Server)

```powershell
# Install dependencies if not transferred
npm install --production

# Run Prisma migrations
npx prisma generate
npx prisma migrate deploy
```

---

## Deployment

### Step 8: Start Application with PM2

```powershell
# Start Spendly
pm2 start ecosystem.config.js

# Save PM2 process list (survives reboots)
pm2 save

# Verify it's running
pm2 status
pm2 logs spendly --lines 50
```

### Step 9: Configure IIS Website

1. **Create IIS Site**:
   - Open IIS Manager
   - Right-click "Sites" → "Add Website"
   - Site name: `Spendly`
   - Physical path: `C:\inetpub\wwwroot\spendly`
   - Bindings:
     - Type: `http`
     - IP: `All Unassigned`
     - Port: `80`
     - Host name: `spendly.yourdomain.com`

2. **Add HTTPS Binding** (After SSL cert):
   - Right-click site → "Edit Bindings" → "Add"
   - Type: `https`
   - Port: `443`
   - SSL certificate: (Select your cert)

3. **Verify `web.config` exists** in site root (`C:\inetpub\wwwroot\spendly\web.config`)

4. **Restart IIS**:
```powershell
iisreset
```

### Step 10: Configure DNS

Point your domain to the Windows Server IP:
```
spendly.yourdomain.com → A Record → <Windows Server IP>
```

---

## Verification

### Health Check Checklist

- [ ] PM2 shows "online" status: `pm2 status`
- [ ] Next.js responding on localhost:3000: `curl http://localhost:3000`
- [ ] IIS site accessible via domain
- [ ] Database connection working (test login)
- [ ] SSL certificate installed and HTTPS working
- [ ] Logs show no errors: `pm2 logs spendly`

### Test Critical Paths

1. **User Registration**: Create new account
2. **Login**: Authenticate with Google OAuth
3. **Expense Creation**: Add test expense
4. **Database Persistence**: Verify data saved
5. **File Upload**: Test receipt upload

---

## Troubleshooting

### PM2 Won't Start

```powershell
# Check Node.js version
node --version  # Must be 18+

# Check logs
pm2 logs spendly --err

# Manually test Next.js
npm run start
```

### IIS Returns 502 Bad Gateway

**Cause**: PM2/Next.js not running or wrong port

**Solution**:
```powershell
# Verify PM2 running
pm2 status

# Check if port 3000 is listening
netstat -ano | findstr :3000

# Restart PM2
pm2 restart spendly
```

### Database Connection Failures

**Cause**: Wrong DATABASE_URL or database not running

**Solution**:
```powershell
# Test PostgreSQL connection
psql -h localhost -U postgres -d spendly_prod

# Check .env.production has correct credentials
notepad .env.production

# Restart application
pm2 restart spendly
```

### "Module not found" Errors

**Cause**: Missing dependencies

**Solution**:
```powershell
# Reinstall dependencies
npm install --production

# Rebuild Prisma client
npx prisma generate

# Restart
pm2 restart spendly
```

---

## Rollback Procedures

### If everything fails:

1. **Stop PM2**:
```powershell
pm2 stop spendly
pm2 delete spendly
```

2. **Remove IIS Site**:
   - IIS Manager → Right-click "Spendly" → Remove

3. **Restore database** (if needed):
```sql
DROP DATABASE spendly_prod;
-- Restore from backup
```

### Your Mac environment is safe:
```bash
npm run dev  # Works exactly as before
```

---

## Support Commands Reference

```powershell
# PM2 Management
pm2 status                    # View all processes
pm2 logs spendly              # View logs
pm2 restart spendly           # Restart app
pm2 stop spendly              # Stop app
pm2 monit                     # Real-time monitoring

# IIS Management
iisreset                      # Restart IIS
iisreset /stop                # Stop IIS
iisreset /start               # Start IIS

# Database (PostgreSQL)
psql -U postgres              # Connect to database
\l                            # List databases
\c spendly_prod               # Connect to Spendly DB
\dt                           # List tables
```

---

## Next Steps After Deployment

1. **Enable HTTPS Redirect** in `web.config` (set `enabled="true"`)
2. **Setup monitoring** (New Relic, Sentry, or PM2 Plus)
3. **Configure backups** (Database + file uploads)
4. **Setup CI/CD** for automated deployments

---

> [!NOTE]
> **Questions or Issues?**  
> Contact Kathan for assistance with deployment troubleshooting.
