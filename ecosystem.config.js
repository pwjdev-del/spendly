module.exports = {
    apps: [{
        name: 'spendly',
        script: 'node_modules/next/dist/bin/next',
        args: 'start',
        cwd: './',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',

        // Environment variables for production
        env: {
            NODE_ENV: 'production',
            PORT: 3000,
            HOSTNAME: 'localhost'
        },

        // Logging configuration
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Restart behavior
        min_uptime: '10s',
        max_restarts: 10,
        restart_delay: 4000,

        // Windows-specific settings
        windowsHide: true,
        kill_timeout: 5000,

        // Advanced PM2 features
        listen_timeout: 10000,
        shutdown_with_message: false
    }],

    // PM2 deployment configuration (optional - for future automated deployments)
    deploy: {
        production: {
            user: 'Administrator',
            host: ['WINDOWS_SERVER_IP'],
            ref: 'origin/main',
            repo: 'git@github.com:yourusername/spendly.git',
            path: 'C:/inetpub/wwwroot/spendly',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
        }
    }
};
