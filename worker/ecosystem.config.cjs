// pm2 process definition for the RPL WhatsApp worker.
//
// Usage (from the worker/ directory):
//   pm2 start ecosystem.config.cjs
//   pm2 save        # remember this process list
//   pm2 startup     # then run the one command it prints (start on boot)
//
// Secrets/config are NOT here — they come from worker/.env (loaded by
// dotenv in index.js), so this file is safe to commit.
//
// .cjs (not .js) on purpose: worker/package.json sets "type": "module",
// but pm2 loads ecosystem files as CommonJS.
module.exports = {
  apps: [
    {
      name: "rpl-bot",
      script: "index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      restart_delay: 3000, // matches the worker's own 3s reconnect backoff
      min_uptime: "30s", // must stay up 30s to count as a clean start
      max_restarts: 10, // within min_uptime before pm2 backs off
      max_memory_restart: "300M", // safety net; Baileys is light
      time: true, // timestamp each log line
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
