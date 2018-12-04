/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable indent */
function b2a(buffer){
	let vmp = [];
				for (const v of buffer) {
					vmp.push(v);
				}
	return vmp;
}
function a2b(array){
	return Buffer.from(array);
}
function versionMethod(buffer){
    let a = b2a(buffer);
    res = {
        VER:a[0],
        MMETHODS:a[1],
        METHODS:a[2]
    };
    console.log(`version method:${JSON.stringify(res)}`);
    return res;
}
function versionMethodReply(){
    return a2b([5,0]);
}
function requestDetail(buffer){
    let a = b2a(buffer);
    let res = {
        VER:a[0],
        CMD:a[1],
        RSV:a[2],
        ATYP:a[3],
        DST_PORT:Buffer.from(a.slice(a.length-2)).readInt16BE(0)
    };
    switch(a[3]){
        case 1:
            res.DST_ADDR = a.slice(4,4+4).join('.');
        break;
        case 3:
        if(!a[4]){
            res.DST_ADDR = [];
        }else{
            res.DST_ADDR = Buffer.from(a.slice(5,5+a[4])).toString('utf8');
        }   
        break;
        case 4:
        if(!a[4]){
            res.DST_ADDR = [];
        }else{
            res.DST_ADDR = a.slice(5,5+16).join('.');
        }    
        break;
    }
    console.log(`requestDetail:${JSON.stringify(res)}`);
    return res;
}
function replyRequest(REP, ATYP, BND_ADDR, BND_PORT){
    let VER = 5;
    let RSV = 0;
    let resp = [
        VER,
        REP,
        RSV,
        ATYP
    ];
    let buf = Buffer.allocUnsafe(2);
    buf.writeUInt16BE(BND_PORT,0);
    resp = resp.concat(BND_ADDR);
    resp = resp.concat(b2a(buf));
    console.log(`reply request: ${resp}`);
    return a2b(resp);
}


module.exports = {
	versionMethod:versionMethod,
    versionMethodReply:versionMethodReply,
    requestDetail:requestDetail,
    replyRequest:replyRequest
};