module.exports = {
  apps: [
    {
      name: "pinata-micro-crm",
      script: "server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
