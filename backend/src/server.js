const http = require('http');
const app = require('./app');
const { setupSockets } = require('./sockets');
const env = require('./config/env');

const server = http.createServer(app);
setupSockets(server);

server.listen(env.port, () => {
  console.log(`🖨️  Paper Prints API running on port ${env.port} [${env.nodeEnv}]`);
});
