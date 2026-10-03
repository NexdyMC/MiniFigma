/* [6.1] Inti bersama. Isi: state global, utilitas, registri hook, model umum. Bukan di sini: render, interaksi, panel, simpan. */
const MF={init:[],down:[],move:{},up:{},keys:[],overlay:[],beforeMove:[]};
const FF='Inter,system-ui,sans-serif';
let cv=null,ctx=null,S=[],sel=null,multi=[],altDown=false,GR={},gn=1,selG=0,selPt=null,tool='select',V={x:200,y:120,z:1},uid=1,drag=null,draft=null,mouse={x:0,y:0},space=false,dpr=1,G=[],imgLib=[],clip=null,editingText=null,activeFrameId=0;
const imageCache=new Map();
const FONT_KEY='minifigma.fonts',MAX_FONT=1024*1024,MAX_FONTS_TOTAL=2*1024*1024,MAX_FONTS=10;
const FONT_OPTIONS=[['Default (Inter / system)','Inter,system-ui,sans-serif'],['Arial','Arial'],['Helvetica','Helvetica'],['Times New Roman','Times New Roman'],['Georgia','Georgia'],['Courier New','Courier New'],['Monospace','monospace'],['Sans serif','sans-serif'],['Serif','serif'],['Poppins','Poppins'],['Atlas','Atlas']];
let localFonts=[],fontFaces=new Map();
const SH={rect:'Persegi',line:'Garis',ellipse:'Elips',polygon:'Poligon',star:'Bintang'};
const NAME={frame:'Frame',rect:'Persegi',ellipse:'Elips',polygon:'Poligon',star:'Bintang',text:'Teks',path:'Vektor',image:'Gambar'};
const FRAME_PRESETS=[
	{category:'Telepon',name:'iPhone 17',w:402,h:874},{category:'Telepon',name:'iPhone 16 Pro',w:402,h:874},{category:'Telepon',name:'iPhone 16',w:393,h:852},{category:'Telepon',name:'Android kecil',w:360,h:800},{category:'Telepon',name:'Android besar',w:412,h:915},
	{category:'Tablet',name:'iPad mini',w:744,h:1133},{category:'Tablet',name:'iPad',w:820,h:1180},{category:'Tablet',name:'Android tablet',w:800,h:1280},
	{category:'Desktop',name:'Desktop 1440 × 1024',w:1440,h:1024},{category:'Desktop',name:'Desktop 1366 × 768',w:1366,h:768},{category:'Desktop',name:'Laptop 1280 × 800',w:1280,h:800},{category:'Desktop',name:'Desktop 1920 × 1080',w:1920,h:1080},
	{category:'Presentasi',name:'Slide 16:9',w:1920,h:1080},{category:'Presentasi',name:'Slide 4:3',w:1440,h:1080},{category:'Presentasi',name:'Slide 16:10',w:1920,h:1200},
	{category:'Jam tangan',name:'Apple Watch 45 mm',w:396,h:484},{category:'Jam tangan',name:'Apple Watch 41 mm',w:352,h:430},{category:'Jam tangan',name:'Wear OS',w:384,h:384},
	{category:'Kertas',name:'A4',w:595,h:842},{category:'Kertas',name:'A3',w:842,h:1191},{category:'Kertas',name:'Letter',w:612,h:792},{category:'Kertas',name:'Legal',w:612,h:1008},
	{category:'Media sosial',name:'Instagram Post',w:1080,h:1080},{category:'Media sosial',name:'Instagram Portrait',w:1080,h:1350},{category:'Media sosial',name:'Instagram Story',w:1080,h:1920},{category:'Media sosial',name:'Facebook Cover',w:1640,h:924},{category:'Media sosial',name:'YouTube Thumbnail',w:1280,h:720},{category:'Media sosial',name:'LinkedIn Cover',w:1584,h:396}
];
const HINT={select:'Klik untuk memilih, seret di area kosong untuk memilih banyak objek (Shift = tambah/kurangi). Spasi + seret = geser, Ctrl + scroll = zoom. Klik dua kali teks untuk mengedit. Dekati sudut dari luar untuk memutar (Shift = 15°, Alt = pivot).',pen:'Klik = titik sudut, klik + seret = titik melengkung. Klik titik pertama untuk menutup. Enter / Esc selesai.',pencil:'Seret di kanvas untuk menggambar bebas.',text:'Klik di kanvas lalu ketik. Enter membuat baris baru, Ctrl+Enter simpan, Esc batalkan.'};
const s2w=(x,y)=>[(x-V.x)/V.z,(y-V.y)/V.z],w2s=(x,y)=>[x*V.z+V.x,y*V.z+V.y];
const chk=id=>$(id).is(':checked');
const P={
	select:'<path d="M4 3l7 17 2.5-7.5L21 10z"/>',frame:'<path d="M6 3v18M18 3v18M3 6h18M3 18h18"/>',rect:'<rect x="4" y="5" width="16" height="14" rx="1"/>',line:'<path d="M5 19L19 5"/>',ellipse:'<circle cx="12" cy="12" r="8"/>',polygon:'<path d="M12 3l9 7-3.5 11h-11L3 10z"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',pen:'<path d="M12 3l6 8-3 9H9l-3-9z"/><circle cx="12" cy="13" r="1.5"/>',pencil:'<path d="m4 20 4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20z"/><path d="m14.5 6.5 3 3"/>',text:'<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3 3.7M6.6 6.6A17 17 0 002 12s4 7 10 7a10 10 0 004.4-1M9.9 9.9a3 3 0 004.2 4.2"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 017.5-2"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',chevron:'<path d="M6 9l6 6 6-6"/>',group:'<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 3"/><rect x="9" y="9" width="6" height="6" rx="1"/>',image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 15l-5-5L5 20"/>',undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>'
};
const I=(n,z=16)=>`<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none">${P[n]}</svg>`;
const FA={
	plus:'<path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>',
	trash:'<path d="M135.2 17.7C140.6 7.1 151.5 0 163.5 0h89c12.1 0 23 7.1 28.3 17.7L296 32h80c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 80 0 69.3 0 56s10.7-24 24-24h80l31.2-14.3zM32 112h320l-18.9 339.6c-1.4 25.3-22.4 45.4-47.8 45.4H98.7c-25.4 0-46.4-20.1-47.8-45.4L32 112z"/>',
	dropper:'<path d="M341.6 29.2 240.1 130.8l-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4 101.5-101.6c39-39 39-102.2 0-141.1s-102.2-39-141.1 0zM55.4 323.3c-15 15-23.4 35.4-23.4 56.6v42.4L5.4 462.2c-8.5 12.7-6.8 29.6 4 40.4s27.7 12.5 40.4 4L89.7 480h42.4c21.2 0 41.6-8.4 56.6-23.4l120.7-120.7-45.3-45.3-120.7 120.7c-3 3-7.1 4.7-11.3 4.7H96v-36.1c0-4.2 1.7-8.3 4.7-11.3l120.7-120.7-45.3-45.3L55.4 323.3z"/>',
	palette:'<path d="M512 256c0 .9 0 1.8 0 2.7-.4 36.5-33.6 61.3-70.1 61.3H344c-26.5 0-48 21.5-48 48 0 3.4.4 6.7 1 9.9 2.1 10.2 6.5 20 10.8 29.9 6.1 13.8 12.1 27.5 12.1 42 0 31.8-21.6 60.7-53.4 62-3.5.1-7 .2-10.6.2C114.6 512 0 397.4 0 256S114.6 0 256 0s256 114.6 256 256zM128 288a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 0 0 0 64zm160-96a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 0 0 0 64z"/>',
	eye:'<path d="M288 32C155.7 32 59 120.1 7 243.7c-3.3 7.9-3.3 16.7 0 24.6C59 392 155.7 480 288 480s229-88.1 281-211.7c3.3-7.9 3.3-16.7 0-24.6C517 120.1 420.3 32 288 32zm0 352a128 128 0 1 1 0-256 128 128 0 1 1 0 256zm0-208a80 80 0 1 0 0 160 80 80 0 1 0 0-160z"/>',
	eyeSlash:'<path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144 0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3-11.1-41.5-47.8-69.4-88.6-71.1-5.8-.2-9.2 6.1-7.4 11.7 2.1 6.4 3.3 13.2 3.3 20.3 0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1-79.5 0-144-64.5-144-144 0-6.9.5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"/>',
	distributeH:'<path d="M406.6 374.6 502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l41.4 41.4H109.3l41.4-41.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288h293.5l-41.4 41.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z"/>',
	distributeV:'<path d="M182.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L128 109.3v293.5l-41.4-41.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 402.7V109.3l41.4 41.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-96-96z"/>'
};
const FAView={distributeV:'320 512',eye:'576 512',eyeSlash:'640 512'};
const FAIcon=(n,z=14)=>`<svg width="${z}" height="${z}" viewBox="0 0 ${FAView[n]||'512 512'}" fill="currentColor" aria-hidden="true" class="pointer-events-none">${FA[n]}</svg>`;

const selAll=()=>sel?[sel]:multi;
const gpid=g=>(GR[g]&&GR[g].pid)||0;
function inGroup(s,g){let c=s.gid||0;while(c){if(c===g)return true;c=gpid(c);}return false;}
function groupIn(g,anc){let c=gpid(g);while(c){if(c===anc)return true;c=gpid(c);}return false;}
const leavesOf=g=>S.filter(s=>inGroup(s,g));
function childOf(s,g){let c=s.gid||0;if(c===g)return null;while(c&&gpid(c)!==g)c=gpid(c);return c||null;}
function rootOf(s){let c=s.gid||0;while(c&&gpid(c))c=gpid(c);return c;}
function inferG(a){let g=a[0].gid||0,best=0;while(g){const L=leavesOf(g);if(L.length===a.length&&L.every(x=>a.includes(x)))best=g;g=gpid(g);}return best;}
function setSel(a){multi=a.length>1?a:[];sel=a.length===1?a[0]:null;selG=a.length>1?inferG(a):0;selPt=null;}
function arrange(L,g){const out=[],seen=new Set();L.forEach(s=>{const c=childOf(s,g);if(c==null)out.push(s);else if(!seen.has(c)){seen.add(c);out.push(...arrange(L.filter(x=>childOf(x,g)===c),c));}});return out;}
function arrangeFrames(fid=0,seen=new Set()){
	if(seen.has(fid))return [];
	const next=new Set(seen);
	next.add(fid);
	const parent=fid?S.find(f=>f.id===fid&&f.type==='frame'):null;
	const scope=arrange(S.filter(s=>frameParentOf(s)===parent),0),out=[];
	scope.forEach(s=>{out.push(s);if(s.type==='frame')out.push(...arrangeFrames(s.id,next));});
	return out;
}
function normalize(){Object.keys(GR).forEach(k=>{if(!S.some(s=>inGroup(s,+k)))delete GR[k];});S=arrangeFrames(0);}

function bbox(s){
	if(s.type!=='path')return {x:s.x,y:s.y,w:s.w,h:s.h};
	const Q=s.pts.some(p=>p.ho||p.hi)?flat(s):s.pts,xs=Q.map(p=>p.x),ys=Q.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);
	return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}
const hasH=h=>h&&(h.x||h.y);
function frameParentOf(s){
	if(Object.prototype.hasOwnProperty.call(s,'fid'))return +s.fid?S.find(x=>x.id===+s.fid&&x.type==='frame'&&x!==s)||null:null;
	return typeof nearestFrameParent==='function'?nearestFrameParent(s):null;
}
function setFrameParent(s,parent){
	if(!s||s.type==='frame'&&s===parent)return;
	if(!parent){s.fid=0;return;}
	let p=parent;while(p){if(p===s)return;p=frameParentOf(p);}
	s.fid=parent.id;
}
function frameDepth(s){
	let depth=0,p=frameParentOf(s),seen=new Set();while(p&&!seen.has(p.id)){seen.add(p.id);depth++;p=frameParentOf(p);}return depth;
}
function seg(g,a,b){if(hasH(a.ho)||hasH(b.hi))g.bezierCurveTo(a.x+(a.ho?a.ho.x:0),a.y+(a.ho?a.ho.y:0),b.x+(b.hi?b.hi.x:0),b.y+(b.hi?b.hi.y:0),b.x,b.y);else g.lineTo(b.x,b.y);}
function flat(s){
	const P=s.pts,out=[];if(!P.length)return out;out.push({x:P[0].x,y:P[0].y});
	const n=s.closed&&P.length>2?P.length:P.length-1;
	for(let i=0;i<n;i++){
		const a=P[i],b=P[(i+1)%P.length];
		if(hasH(a.ho)||hasH(b.hi)){
			const x1=a.x+(a.ho?a.ho.x:0),y1=a.y+(a.ho?a.ho.y:0),x2=b.x+(b.hi?b.hi.x:0),y2=b.y+(b.hi?b.hi.y:0);
			for(let k=1;k<=16;k++){const t=k/16,u=1-t;out.push({x:u*u*u*a.x+3*u*u*t*x1+3*u*t*t*x2+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*y1+3*u*t*t*y2+t*t*t*b.y});}
		}else out.push({x:b.x,y:b.y});
	}
	return out;
}
function mk(type,x,y){
	const id=uid++,s={id,type,x,y,w:0,h:0,r:0,smooth:0,fid:0,rot:0,n:type==='star'?5:3,pts:[],closed:false,text:'Teks',fs:16,fontFamily:FF,fontWeight:400,bold:false,italic:false,underline:false,textAlign:'left',lineHeight:125,letterSpacing:0,textBox:false,fillOn:true,fill:'#d9d9d9',stroke:'#d9d9d9',sw:0,name:NAME[type]+' '+id};
	if(type==='frame')s.fill='#ffffff';if(type==='path'){s.fillOn=false;s.sw=2;}return s;
}
function getPaintLayers(s,kind){
	const key=kind==='fill'?'fills':'strokes';
	if(Array.isArray(s[key]))return s[key];
	if(kind==='fill')return s.fillOn===false?[]:[{type:'solid',color:s.fill||'#d9d9d9',opacity:s.fo??100,visible:s.fv!==false}];
	return (s.sw||0)>0?[{type:'solid',color:s.stroke||'#d9d9d9',opacity:s.so??100,visible:s.sv!==false,weight:s.sw,position:'center',dash:'solid',cap:'butt',join:'round',startArrow:'none',endArrow:'none'}]:[];
}
function ensurePaintLayers(s,kind){
	const key=kind==='fill'?'fills':'strokes';
	if(!Array.isArray(s[key]))s[key]=getPaintLayers(s,kind).map(p=>({...p}));
	return s[key];
}
function syncLegacyPaint(s,kind){
	const p=getPaintLayers(s,kind)[0];
	if(kind==='fill'){s.fillOn=!!p;s.fill=p?p.color:'#d9d9d9';s.fo=p?p.opacity:100;s.fv=p?p.visible!==false:true;}
	else{s.sw=p?Math.max(0,+p.weight||1):0;s.stroke=p?p.color:'#d9d9d9';s.so=p?p.opacity:100;s.sv=p?p.visible!==false:true;}
}
const pvt=s=>{const b=bbox(s);return [b.x+b.w*(s.pvx??.5),b.y+b.h*(s.pvy??.5)];};
const rp=(s,x,y,a=1)=>{
	const [cx,cy]=pvt(s),t=s.rot*Math.PI/180*a,c=Math.cos(t),n=Math.sin(t);let dx=x-cx,dy=y-cy;
	if(a===1){if(s.flipX)dx=-dx;if(s.flipY)dy=-dy;}
	const qx=dx*c-dy*n,qy=dx*n+dy*c;return a===1?[cx+qx,cy+qy]:[cx+(s.flipX?-qx:qx),cy+(s.flipY?-qy:qy)];
};
const inside=(s,f)=>{const b=bbox(s),a=bbox(f),cx=b.x+b.w/2,cy=b.y+b.h/2;return cx>=a.x&&cx<=a.x+a.w&&cy>=a.y&&cy<=a.y+a.h;};
const kidsOf=f=>S.filter(s=>{if(s===f)return false;let p=frameParentOf(s),seen=new Set();while(p&&!seen.has(p.id)){if(p===f)return true;seen.add(p.id);p=frameParentOf(p);}return false;});
function move(s,dx,dy){if(s.type==='path')s.pts.forEach(p=>{p.x+=dx;p.y+=dy;});else{s.x+=dx;s.y+=dy;}}
function resizeLayer(s,src,dst,srcBox=bbox(src)){
	const sx=dst.w/(srcBox.w||1),sy=dst.h/(srcBox.h||1);
	if(s.type==='path')s.pts=src.pts.map(p=>({...p,x:dst.x+(p.x-srcBox.x)*sx,y:dst.y+(p.y-srcBox.y)*sy,...(p.ho?{ho:{x:p.ho.x*sx,y:p.ho.y*sy}}:{}),...(p.hi?{hi:{x:p.hi.x*sx,y:p.hi.y*sy}}:{})}));
	s.x=dst.x;s.y=dst.y;s.w=Math.max(1,dst.w);s.h=Math.max(1,dst.h);s.sw=(src.sw||0)*Math.sqrt(Math.abs(sx*sy));s.r=(src.r||0)*Math.min(Math.abs(sx),Math.abs(sy));
	if(Array.isArray(src.strokes)){const scale=Math.sqrt(Math.abs(sx*sy));s.strokes=src.strokes.map(p=>({...p,weight:Math.max(.1,(+p.weight||1)*scale)}));syncLegacyPaint(s,'stroke');}
	if(src.radii)s.radii=src.radii.map(r=>r*Math.min(Math.abs(sx),Math.abs(sy)));
}
function moveWith(s,dx,dy,kids){(kids||(s.type==='frame'?kidsOf(s):[])).forEach(k=>move(k,dx,dy));move(s,dx,dy);}
function geo(s){const cx=s.x+s.w/2,cy=s.y+s.h/2,rx=s.w/2,ry=s.h/2,m=s.type==='star'?s.n*2:s.n,p=[];for(let i=0;i<m;i++){const a=-Math.PI/2+i*2*Math.PI/m,k=s.type==='star'&&i%2?.4:1;p.push({x:cx+Math.cos(a)*rx*k,y:cy+Math.sin(a)*ry*k});}return p;}
function ubox(a){const B=a.map(bbox),x0=Math.min(...B.map(b=>b.x)),y0=Math.min(...B.map(b=>b.y));return {x:x0,y:y0,w:Math.max(...B.map(b=>b.x+b.w))-x0,h:Math.max(...B.map(b=>b.y+b.h))-y0};}
function kidsFor(it){const k=[];it.forEach(f=>{if(f.type==='frame')kidsOf(f).forEach(c=>{if(!it.includes(c)&&!k.includes(c))k.push(c);});});return k;}
function boxHit(s,Rc){const b=bbox(s),c=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>rp(s,p[0],p[1])),xs=c.map(p=>p[0]),ys=c.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);if(s.type==='frame')return x0>=Rc.x&&x1<=Rc.x+Rc.w&&y0>=Rc.y&&y1<=Rc.y+Rc.h;return x1>=Rc.x&&x0<=Rc.x+Rc.w&&y1>=Rc.y&&y0<=Rc.y+Rc.h;}
function cl(v,a,b,d){v=parseFloat(v);return isNaN(v)?d:Math.min(b,Math.max(a,v));}
function refresh(){const n=selAll().length;$('#props').toggleClass('hidden',!n);if(typeof syncFramePanel==='function')syncFramePanel();$('#empty').toggle(!n&&tool!=='frame');syncProps();renderFx();renderLayers();draw();}
function note(m){$('#hint').text(m);}
