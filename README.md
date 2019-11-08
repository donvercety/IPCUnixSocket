Simple [inter-process communication][1] proof of concept wrapper with an example.

Examples commands:
- `$ MODE=server node example.js` initialize server
- `$ MODE=client node example.js` initialize client

Include the helper library:
```js
const IPCUnixSocket = require('./lib/IPCUnixSocket');
```

Example Server:
```js
const socketLocation = '/tmp/unix.sock';
const unixSocket = new IPCUnixSocket(socketLocation);
const server = unixSocket.startServer();

server.on('connection', stream => {
	console.log(`stream id:${stream.id}`);

	stream.on('data', pkg => {
		pkg = pkg.toString('utf8');
		console.log(`Received: ${pkg}`);
	});
});

// example: ping message every 30 seconds
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
```

Example Client:
```js
const socketLocation = '/tmp/unix.sock';
const unixSocket = new IPCUnixSocket(socketLocation);
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
```

[1]:https://en.wikipedia.org/wiki/Inter-process_communication