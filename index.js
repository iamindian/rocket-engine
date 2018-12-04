/* eslint-disable no-undef */
/* eslint-disable no-console */
let net = require('net');
let socks = require('./socks');
let server = net.createServer();
function info(tag, msg) {
	console.log(`${tag}:${JSON.stringify(msg)}`);
}
server.on('connection', client => {
	let state = 1;
	let remote1 = null;
	//let remote2 = null;
	let msg = null;
	//client.setTimeout(0);
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
			remote1 = net.createConnection(msg.DST_PORT,msg.DST_ADDR);
			remote1.on('connect',()=>{
				console.log(`connect to ${msg.DST_ADDR}:${msg.DST_PORT} successfully`);
				console.log('proxy address:' + remote1.localAddress + ':' + remote1.localPort);
				let localAddress = remote1.localAddress.split('.').reduce((a,b)=>{
					a.push(parseInt(b));
					return a;
				},[]);
				let localPort = remote1.localPort;
				// let remoteAddress = remote1.remoteAddress.split('.').reduce((a,b)=>{
				// 	a.push(parseInt(b));
				// 	return a;
				// },[]);
				// let remotePort = remote1.remotePort;
				switch(msg.CMD){
				case 1:
					//client.write(socks.replyRequest(0,1,localAddress,localPort));
					client.write(socks.replyRequest(0,1,localAddress,localPort));
					break;
				case 3:
					//connection.write(socks.replyRequest(0,msg.ATYP,remoteAddress,remotePort));
					break;
				case 4:

					break;

				}
				state = 3;
			});
			remote1.on('data',data=>{
				//console.log('received:'+ data.byteLength);
				client.write(data);
			});
			remote1.on('error',(error)=>{
				client.end();
				console.log(`connect to ${msg.DST_ADDR}:${msg.DST_PORT} failed. \n${error}`);
			});
			remote1.on('end',()=>{
				client.end();
				console.log(`connect to ${msg.DST_ADDR}:${msg.DST_PORT} end.`);
			});
			break;
		case 3:
			remote1.write(buffer);
			//console.log('sent:' + buffer.byteLength); 
			break;
		}

	});
	client.on('end', () => {
		remote1.end();
		console.log('received FIN packet');
	});
	client.on('timeout',()=>{
		console.log('client is timeout');
	});
	client.on('error',(error)=>{
		remote1.end();
		console.log('client error:'+ error);
	});
});
server.on('close',()=>{
	console.log('server closed');
});
server.on('error', (error) => {
	console.log(error.stack);
});
server.listen(parseInt(process.argv[2]), () => {
	console.log(`server started on ${server.address().port}`);
});
