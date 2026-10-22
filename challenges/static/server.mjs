import http from 'node:http';
import { readFile } from 'node:fs/promises';
const root=new URL('./evidence/',import.meta.url);
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',png:'image/png',pcap:'application/vnd.tcpdump.pcap',txt:'text/plain; charset=utf-8',log:'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{try{const raw=new URL(req.url,'http://lab').pathname.slice(1);if(!/^\d{3}\/[a-z0-9.-]+$/.test(raw))throw Error();res.setHeader('Content-Type',types[raw.split('.').pop()]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.end(await readFile(new URL(raw,root)));}catch{res.statusCode=404;res.end('Not found');}}).listen(8081,'0.0.0.0');
