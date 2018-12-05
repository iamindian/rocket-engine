/* eslint-disable no-undef */
/* eslint-disable no-console */
let net = require('net');
let socks = require('./socks');
let server = net.createServer();
function info(tag, msg) {
	console.log(`${tag}:${JSON.stringify(msg)}`);
}
let count = 0;

server.on('connection', client => {
	console.log(`count:${++count}`);
	let state = 1;
	let remote = null;
	let msg = null;
	//client.setTimeout(0);
	const logicBuilder = (function () {

		return {
			connect: function () {
				console.log('building logic for connect');
				remote = net.createConnection(msg.DST_PORT, msg.DST_ADDR);
				remote.on('connect', () => {
					console.log(`connect to ${msg.DST_ADDR}:${msg.DST_PORT} successfully`);
					console.log('proxy address:' + remote.localAddress + ':' + remote.localPort);
					let localAddress = remote.localAddress.split('.').reduce((a, b) => {
						a.push(parseInt(b));
						return a;
					}, []);
					let localPort = remote.localPort;
					client.write(socks.replyRequest(0, 1, localAddress, localPort));
					state = 3;
				});
				remote.on('data', data => {
					//console.log('received:'+ buffer.byteLength + 'bytes');
					client.write(data);
				});
				remote.on('error', (error) => {
					client.end();
					console.error(`connect to ${msg.DST_ADDR}:${msg.DST_PORT} failed. \n${error}`);
				});
				remote.on('end', () => {
					client.end();
					console.log(`connect to ${msg.DST_ADDR}:${msg.DST_PORT} end.`);
				});
			},
			bind: function () {
				console.log('building logic for bind');
				remote = net.createServer((c) => {
					let remoteAddress = c.remoteAddress.split('.').reduce((a, b) => {
						a.push(parseInt(b));
						return a;
					}, []);
					let remotePort = c.remotePort;
					client.write(socks.replyRequest(0, 1, remoteAddress, remotePort));
				});
				remote.listen(msg.DST_PORT, msg.DST_ADDR);
				remote.on('data', data => {
					//console.log('received:'+ buffer.byteLength + 'bytes');
					client.write(data);
				});
				remote.on('error', (error) => {
					client.end();
					console.error(`connect to ${msg.DST_ADDR}:${msg.DST_PORT} failed. \n${error}`);
				});
				remote.on('end', () => {
					client.end();
					console.log(`connect to ${msg.DST_ADDR}:${msg.DST_PORT} end.`);
				});
				remote.on('listening', () => {
					let localAddress = remote.address().address.split('.').reduce((a, b) => {
						a.push(parseInt(b));
						return a;
					}, []);
					let localPort = remote.address().localPort;
					client.write(socks.replyRequest(0, 1, localAddress, localPort));
				});

			}
		};
	})();
	client.on('data', buffer => {
		switch (state) {
		case 1:
			msg = socks.versionMethod(buffer);
			info('received version method', msg);
			client.write(socks.versionMethodReply());
			state = 2;
			break;
		case 2:
			msg = socks.requestDetail(buffer);
			info('received client request',msg);
			switch (msg.CMD) {
			case 1:
				logicBuilder.connect();
				break;
			case 2:
				logicBuilder.bind();
				break;
			case 3:
				break;
			}

			break;
		case 3:
			//console.log('sent:' + buffer.byteLength + 'bytes'); 
			remote.write(buffer);
			break;
		}

	});
	client.on('end', () => {
		if(remote)
			remote.end();
		console.log('received FIN packet');
	});
	client.on('timeout', () => {
		if(remote)
			remote.end();
		console.log('client is timeout');
	});
	client.on('error', (error) => {
		if(remote)
			remote.end();
		console.log('client error:' + error);
	});
});
server.on('close', () => {
	console.log('server closed');
});
server.on('error', (error) => {
	console.log(error.stack);
});
server.on('listening', () => {
	console.log(`server started on ${JSON.stringify(server.address())}`);
});
server.listen(parseInt(process.argv[2]), process.argv[3]);
