/** @format */

module.exports = {
  apps: [
    {
      name: "folen",
      script: "npm run start",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      port: 3091,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
