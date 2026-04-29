module.exports = {
  apps: [
    {
      name: "pinata-memory-garden",
      script: "server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
