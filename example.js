const IPCUnixSocket = require('./lib/IPCUnixSocket');

const socketLocation = '/tmp/unix.sock';
const unixSocket = new IPCUnixSocket(socketLocation);

// Usage:
// - for server => 'MODE=server node example.js'
// - for client => 'MODE=client node example.js'

const MODE = process.env["MODE"] || process.env["mode"];

if (MODE === 'server') {
	const server = unixSocket.startServer();

	server.on('connection', stream => {
		console.log(`stream is tagged with id:${stream.id}`);

		stream.on('data', pkg => {
			pkg = pkg.toString('utf8');
			console.log(`Received: ${pkg}`);
		});
	});

	server.on('error', err => {
		console.error(err);
	});

	// ping message
	setInterval(() => {
		let clients = Object.keys(unixSocket.connections);
		
		for (let client of clients) {
			let connection = unixSocket.connections[client];
			
			if (connection) {
				connection.write('ping')
				console.log(`Send to ${connection.id} ping`);
			}
		}

	}, 30 * 1000);

} else if (MODE === 'client') {
	const client = unixSocket.startClient();

	client.on('connect', () => {
		console.log('Connected');
	});

	client.on('data', pkg => {
		pkg = pkg.toString('utf8');
		console.log(`Received: ${pkg}`);

		if (pkg === 'ping') {
			console.log(`Send: pong`);
			client.write('pong');
		}
	});

	client.on('error', err => {
		console.log(err.stack);
		client.end();
	});

} else {
	console.error("MODE not set, use 'server' or 'client'");
	process.exit(1);
}
