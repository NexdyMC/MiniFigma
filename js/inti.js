/* [6.1] Inti bersama. Isi: state global, utilitas, registri hook, model umum. Bukan di sini: render, interaksi, panel, simpan. */
const MF={init:[],down:[],move:{},up:{},keys:[],overlay:[],beforeMove:[]};
const FF='Inter,system-ui,sans-serif';
let cv=null,ctx=null,S=[],sel=null,multi=[],altDown=false,GR={},gn=1,selG=0,selPt=null,tool='select',V={x:200,y:120,z:1},uid=1,drag=null,draft=null,mouse={x:0,y:0},space=false,dpr=1,G=[],imgLib=[],clip=null,editingText=null;
const imageCache=new Map();
const FONT_KEY='minifigma.fonts',MAX_FONT=1024*1024,MAX_FONTS_TOTAL=2*1024*1024,MAX_FONTS=10;
const FONT_OPTIONS=[['Default (Inter / system)','Inter,system-ui,sans-serif'],['Arial','Arial'],['Helvetica','Helvetica'],['Times New Roman','Times New Roman'],['Georgia','Georgia'],['Courier New','Courier New'],['Monospace','monospace'],['Sans serif','sans-serif'],['Serif','serif'],['Poppins','Poppins'],['Atlas','Atlas']];
let localFonts=[],fontFaces=new Map();
const SH={rect:'Persegi',line:'Garis',ellipse:'Elips',polygon:'Poligon',star:'Bintang'};
const NAME={frame:'Frame',rect:'Persegi',ellipse:'Elips',polygon:'Poligon',star:'Bintang',text:'Teks',path:'Vektor',image:'Gambar'};
const HINT={select:'Klik untuk memilih, seret di area kosong untuk memilih banyak objek (Shift = tambah/kurangi). Spasi + seret = geser, Ctrl + scroll = zoom. Klik dua kali teks untuk mengedit. Dekati sudut dari luar untuk memutar (Shift = 15°, Alt = pivot).',pen:'Klik = titik sudut, klik + seret = titik melengkung. Klik titik pertama untuk menutup. Enter / Esc selesai.',pencil:'Seret di kanvas untuk menggambar bebas.',text:'Klik di kanvas lalu ketik. Enter membuat baris baru, Ctrl+Enter simpan, Esc batalkan.'};
const s2w=(x,y)=>[(x-V.x)/V.z,(y-V.y)/V.z],w2s=(x,y)=>[x*V.z+V.x,y*V.z+V.y];
const chk=id=>$(id).is(':checked');
const P={
	select:'<path d="M4 3l7 17 2.5-7.5L21 10z"/>',frame:'<path d="M6 3v18M18 3v18M3 6h18M3 18h18"/>',rect:'<rect x="4" y="5" width="16" height="14" rx="1"/>',line:'<path d="M5 19L19 5"/>',ellipse:'<circle cx="12" cy="12" r="8"/>',polygon:'<path d="M12 3l9 7-3.5 11h-11L3 10z"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',pen:'<path d="M12 3l6 8-3 9H9l-3-9z"/><circle cx="12" cy="13" r="1.5"/>',pencil:'<path d="m4 20 4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20z"/><path d="m14.5 6.5 3 3"/>',text:'<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3 3.7M6.6 6.6A17 17 0 002 12s4 7 10 7a10 10 0 004.4-1M9.9 9.9a3 3 0 004.2 4.2"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 017.5-2"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',chevron:'<path d="M6 9l6 6 6-6"/>',group:'<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 3"/><rect x="9" y="9" width="6" height="6" rx="1"/>',image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 15l-5-5L5 20"/>',undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>'
};
const I=(n,z=16)=>`<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none">${P[n]}</svg>`;

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
function normalize(){Object.keys(GR).forEach(k=>{if(!S.some(s=>inGroup(s,+k)))delete GR[k];});S=arrange(S,0);}

function bbox(s){
	if(s.type!=='path')return {x:s.x,y:s.y,w:s.w,h:s.h};
	const Q=s.pts.some(p=>p.ho||p.hi)?flat(s):s.pts,xs=Q.map(p=>p.x),ys=Q.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);
	return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}
const hasH=h=>h&&(h.x||h.y);
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
	const id=uid++,s={id,type,x,y,w:0,h:0,r:0,rot:0,n:type==='star'?5:3,pts:[],closed:false,text:'Teks',fs:16,fontFamily:FF,bold:false,italic:false,underline:false,textAlign:'left',lineHeight:125,letterSpacing:0,textBox:false,fillOn:true,fill:'#d9d9d9',stroke:'#d9d9d9',sw:0,name:NAME[type]+' '+id};
	if(type==='frame')s.fill='#ffffff';if(type==='path'){s.fillOn=false;s.sw=2;}return s;
}
const pvt=s=>{const b=bbox(s);return [b.x+b.w*(s.pvx??.5),b.y+b.h*(s.pvy??.5)];};
const rp=(s,x,y,a=1)=>{
	const [cx,cy]=pvt(s),t=s.rot*Math.PI/180*a,c=Math.cos(t),n=Math.sin(t);let dx=x-cx,dy=y-cy;
	if(a===1){if(s.flipX)dx=-dx;if(s.flipY)dy=-dy;}
	const qx=dx*c-dy*n,qy=dx*n+dy*c;return a===1?[cx+qx,cy+qy]:[cx+(s.flipX?-qx:qx),cy+(s.flipY?-qy:qy)];
};
const inside=(s,f)=>{const b=bbox(s),a=bbox(f),cx=b.x+b.w/2,cy=b.y+b.h/2;return cx>=a.x&&cx<=a.x+a.w&&cy>=a.y&&cy<=a.y+a.h;};
const kidsOf=f=>S.filter(s=>s!==f&&S.indexOf(s)>S.indexOf(f)&&inside(s,f));
function move(s,dx,dy){if(s.type==='path')s.pts.forEach(p=>{p.x+=dx;p.y+=dy;});else{s.x+=dx;s.y+=dy;}}
function resizeLayer(s,src,dst,srcBox=bbox(src)){
	const sx=dst.w/(srcBox.w||1),sy=dst.h/(srcBox.h||1);
	if(s.type==='path')s.pts=src.pts.map(p=>({...p,x:dst.x+(p.x-srcBox.x)*sx,y:dst.y+(p.y-srcBox.y)*sy,...(p.ho?{ho:{x:p.ho.x*sx,y:p.ho.y*sy}}:{}),...(p.hi?{hi:{x:p.hi.x*sx,y:p.hi.y*sy}}:{})}));
	s.x=dst.x;s.y=dst.y;s.w=Math.max(1,dst.w);s.h=Math.max(1,dst.h);s.sw=(src.sw||0)*Math.sqrt(Math.abs(sx*sy));s.r=(src.r||0)*Math.min(Math.abs(sx),Math.abs(sy));
	if(src.radii)s.radii=src.radii.map(r=>r*Math.min(Math.abs(sx),Math.abs(sy)));
}
function moveWith(s,dx,dy,kids){(kids||(s.type==='frame'?kidsOf(s):[])).forEach(k=>move(k,dx,dy));move(s,dx,dy);}
function geo(s){const cx=s.x+s.w/2,cy=s.y+s.h/2,rx=s.w/2,ry=s.h/2,m=s.type==='star'?s.n*2:s.n,p=[];for(let i=0;i<m;i++){const a=-Math.PI/2+i*2*Math.PI/m,k=s.type==='star'&&i%2?.4:1;p.push({x:cx+Math.cos(a)*rx*k,y:cy+Math.sin(a)*ry*k});}return p;}
function ubox(a){const B=a.map(bbox),x0=Math.min(...B.map(b=>b.x)),y0=Math.min(...B.map(b=>b.y));return {x:x0,y:y0,w:Math.max(...B.map(b=>b.x+b.w))-x0,h:Math.max(...B.map(b=>b.y+b.h))-y0};}
function kidsFor(it){const k=[];it.forEach(f=>{if(f.type==='frame')kidsOf(f).forEach(c=>{if(!it.includes(c)&&!k.includes(c))k.push(c);});});return k;}
function boxHit(s,Rc){const b=bbox(s),c=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>rp(s,p[0],p[1])),xs=c.map(p=>p[0]),ys=c.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);if(s.type==='frame')return x0>=Rc.x&&x1<=Rc.x+Rc.w&&y0>=Rc.y&&y1<=Rc.y+Rc.h;return x1>=Rc.x&&x0<=Rc.x+Rc.w&&y1>=Rc.y&&y0<=Rc.y+Rc.h;}
function cl(v,a,b,d){v=parseFloat(v);return isNaN(v)?d:Math.min(b,Math.max(a,v));}
function refresh(){const n=selAll().length;$('#props').toggleClass('hidden',!n);$('#empty').toggle(!n);syncProps();renderFx();renderLayers();draw();}
function note(m){$('#hint').text(m);}
