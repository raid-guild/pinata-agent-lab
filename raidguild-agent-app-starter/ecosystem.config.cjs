module.exports = {
  apps: [
    {
      name: "raidguild-agent-app-starter",
      script: "server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
