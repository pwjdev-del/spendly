/**
 * Health Check Script for Spendly Deployment
 * 
 * Run on Windows Server to verify deployment health
 * Usage: node health-check.js
 */

const http = require('http');
const https = require('https');

const CONFIG = {
    appUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    timeout: 10000,
    expectedStatus: [200, 301, 302],
};

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { timeout: CONFIG.timeout }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function checkEndpoint(name, url, expectedContent = null) {
    try {
        log(`\n  Checking ${name}...`, colors.blue);
        log(`  URL: ${url}`);

        const result = await httpGet(url);

        if (CONFIG.expectedStatus.includes(result.statusCode)) {
            if (expectedContent && !result.data.includes(expectedContent)) {
                log(`  ✗ WARN: Unexpected content`, colors.yellow);
            } else {
                log(`  ✓ OK (Status: ${result.statusCode})`, colors.green);
            }
            return true;
        } else {
            log(`  ✗ FAIL (Status: ${result.statusCode})`, colors.red);
            return false;
        }
    } catch (error) {
        log(`  ✗ ERROR: ${error.message}`, colors.red);
        return false;
    }
}

async function runHealthChecks() {
    log('==========================================', colors.blue);
    log('  Spendly Health Check', colors.blue);
    log('==========================================', colors.blue);

    const checks = [];

    // Check 1: Application Homepage
    checks.push(await checkEndpoint(
        'Homepage',
        CONFIG.appUrl,
        'Spendly'
    ));

    // Check 2: API Health
    checks.push(await checkEndpoint(
        'API Health',
        `${CONFIG.appUrl}/api/auth/providers`,
        null
    ));

    // Check 3: Static Assets
    checks.push(await checkEndpoint(
        'Static Assets',
        `${CONFIG.appUrl}/favicon.ico`,
        null
    ));

    // Summary
    log('\n==========================================', colors.blue);
    const passedChecks = checks.filter(Boolean).length;
    const totalChecks = checks.length;

    if (passedChecks === totalChecks) {
        log(`✓ All checks passed (${passedChecks}/${totalChecks})`, colors.green);
        log('Deployment is healthy!', colors.green);
        process.exit(0);
    } else {
        log(`✗ ${totalChecks - passedChecks} check(s) failed`, colors.red);
        log(`  Passed: ${passedChecks}/${totalChecks}`, colors.yellow);
        process.exit(1);
    }
}

// Run health checks
runHealthChecks().catch((error) => {
    log(`\nFatal Error: ${error.message}`, colors.red);
    process.exit(1);
});
