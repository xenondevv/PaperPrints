const http = require('http');
const app = require('./app');
const { setupSockets } = require('./sockets');
const env = require('./config/env');

// Catch uncaught errors so the server doesn't silently die
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const server = http.createServer(app);
setupSockets(server);

const port = env.port;
console.log(`Starting server on port ${port}...`);
server.listen(port, '0.0.0.0', () => {
  console.log(`🖨️  Paper Prints API running on port ${port} [${env.nodeEnv}]`);
});
