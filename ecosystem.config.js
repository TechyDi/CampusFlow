module.exports = {
  apps: [
    {
      name: 'campusflow',
      script: 'server.js',
      instances: 'max', // Use all available CPUs for the Node cluster
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
