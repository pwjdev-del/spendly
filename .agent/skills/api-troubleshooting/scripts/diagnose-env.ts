import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color: string, message: string) {
    console.log(`${color}${message}${COLORS.reset}`);
}

async function checkDependencies() {
    log(COLORS.bold, "🔍 Starting API Environment Diagnostic...");

    // 1. Check Node Environment
    log(COLORS.reset, `\n[1/3] Checking Node.js Environment...`);
    log(COLORS.reset, `Current Platform: ${process.platform}`);
    log(COLORS.reset, `Current Arch: ${process.arch}`);
    log(COLORS.green, `✔ Node Version: ${process.version}`);

    // 2. Check Critical Binaries (Sharp)
    log(COLORS.reset, `\n[2/3] Checking Specific Dependencies...`);

    // Check sharp
    try {
        const sharp = require('sharp');
        log(COLORS.green, `✔ 'sharp' is loadable.`);

        // Check if linux binaries are present (heuristic)
        const nodeModulesPath = path.join(process.cwd(), 'node_modules', '@img');
        if (fs.existsSync(nodeModulesPath)) {
            log(COLORS.green, `✔ Native bindings appear to be installed.`);
        } else {
            if (process.platform === 'darwin') {
                log(COLORS.yellow, `⚠ Running on macOS. Ensure 'sharp' linux binaries are installed for AWS deployment.`);
                log(COLORS.yellow, `  Recommendation: run 'npm install --platform=linux --arch=x64 sharp' before deploy.`);
            }
        }

    } catch (e: any) {
        log(COLORS.red, `✖ 'sharp' failed to load: ${e.message}`);
        log(COLORS.red, `  This is a critical error for image processing.`);
    }

    // 3. Check API Keys (Env Vars)
    log(COLORS.reset, `\n[3/3] Scanning Environment Variables...`);
    const criticalKeys = [
        'NVIDIA_API_KEY',
        'OPENAI_API_KEY',
        'DATABASE_URL',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY'
    ];

    let missingKeys = 0;
    criticalKeys.forEach(key => {
        if (process.env[key]) {
            log(COLORS.green, `✔ ${key}`);
        } else {
            // Only warn, don't error, as not all might be required
            log(COLORS.yellow, `⚠ ${key} is NOT SET (Is this expected?)`);
            missingKeys++;
        }
    });

    console.log("\n" + "=".repeat(30));
    if (missingKeys > 0) {
        log(COLORS.yellow, "diagnostic completed with warnings.");
    } else {
        log(COLORS.green, "Diagnostic completed successfully. Environment looks healthy.");
    }
}

checkDependencies().catch(console.error);
