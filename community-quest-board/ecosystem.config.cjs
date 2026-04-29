module.exports = {
  apps: [
    {
      name: "pinata-community-quest-board",
      script: "server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
