const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 RepoLens AI Backend Server Running!`);
      console.log(`📡 URL: http://localhost:${env.PORT}`);
      console.log(`🌐 Client Origin: ${env.CLIENT_URL}`);
      console.log(`🧠 AI Provider: ${env.AI_PROVIDER}`);
      console.log(`📐 Embedding Provider: ${env.EMBEDDING_PROVIDER}`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    const handleShutdown = () => {
      console.log('\nGracefully shutting down RepoLens AI server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

startServer();
