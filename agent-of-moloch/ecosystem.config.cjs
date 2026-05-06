module.exports = {
  apps: [
    {
      name: "agent-of-moloch",
      script: "server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
