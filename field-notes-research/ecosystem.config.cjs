module.exports = {
  apps: [
    {
      name: "pinata-field-notes-research",
      script: "server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
