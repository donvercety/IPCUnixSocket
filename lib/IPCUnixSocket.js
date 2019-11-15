const { createServer, createConnection } = require('net');
const { unlinkSync } = require('fs');

const uid = (prev => {
	return () => {
		let date = Date.now();

		if (date <= prev) {
			date = ++prev;
		} else {
			prev = date;
		}

		return date.toString(36);
	};
})(0);

module.exports = class IPCUnixSocket {

	constructor(socket) {
		if (!socket) {
			throw ('unix socket location is required');
		}

		console.log(`IPC Socket '${socket}'`);

		this._sigint = false;
		this._socket = socket;
		this._server = null;

		this.connections = {};
	}

	_createServer(socket) {
		console.log(`IPC Server pid:${process.pid}`);

		this._server = createServer(stream => {
			let id = uid();

			stream.id = id;
			this.connections[id] = stream;

			console.log(`IPC Client id:${id} connected`);

			stream.on('end', () => {
				console.log(`IPC Client id:${id} disconnected `);
				delete(this.connections[id]);
			});

		}).listen(socket)
	}

	startServer() {
		try {
			unlinkSync(this._socket);

		} catch (error) {

			// different error code should never happen
			if (error.code !== 'ENOENT') {
				console.error(error);
				process.exit(0);
			}
		}

		this._createServer(this._socket)

		const cleanup = () => {
			if (! this._sigint) {
				this._sigint = true;

				console.log('IPC terminating');

				let clients = Object.keys(this.connections);

				for (let client of clients) {
					if (this.connections[client]) {
						this.connections[client].end(); 
					}
				}

				// this will delete the unix socket file
				this._server.close();

				// skip this when other shutdown functionality is in place
				process.exit(0);
			}
		}

		process.on('SIGINT', cleanup);
		return this._server;
	}

	startClient() {
		console.log(`IPC Client pid:${process.pid}`);
		return createConnection(this._socket)
	}
}
