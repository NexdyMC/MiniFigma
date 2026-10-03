/* [6.9] Simpan dan ekspor. Isi: JSON v7, migrasi, buka/simpan proyek, ekspor PNG. Bukan di sini: riwayat atau autosave. */
const FMT_VERSION=7,LS_KEY='minifigma.project',IMG_KEY='minifigma.images',MAX_IMAGE=1024*1024,MAX_IMAGE_TOTAL=1400*1024;
let projName='Tanpa judul';
const rd=v=>Math.round(v*100)/100;
const num=(v,d)=>(v===null||v===undefined||v===''||!isFinite(+v))?d:+v;
const pct=(v,d=100)=>Math.min(100,Math.max(0,num(v,d)));
const col=(v,d)=>{if(typeof v!=='string')return d;v=v.trim();if(/^#[0-9a-f]{3}$/i.test(v))v='#'+[...v.slice(1)].map(c=>c+c).join('');return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():d;};
const T_OUT={rect:'rectangle',path:'vector'};
const MIGRATE={1:d=>d,2:d=>d,3:d=>d,4:d=>d,5:d=>d,6:d=>d};
function migrate(d){let v=Math.floor(num(d.version,1));d={...d};while(v<FMT_VERSION){if(MIGRATE[v])d=MIGRATE[v](d);v++;}d.version=FMT_VERSION;return d;}
function tree(L,g){
	const out=[],seen=new Set();
	L.forEach(s=>{
		const c=childOf(s,g);
		if(c==null)out.push(ser(s));
		else if(!seen.has(c)){
			seen.add(c);const sub=L.filter(x=>childOf(x,g)===c),r=GR[c]||{name:'Grup',c:false};
			out.push({id:c,type:'group',name:r.name,visible:!sub.every(x=>x.hid),locked:sub.every(x=>x.lock),collapsed:!!r.c,children:tree(sub,c)});
		}
	});
	return out;
}
function serFx(e){const d=EFX[e.t],o={type:e.t,visible:e.on!==false};d.p.forEach(p=>{o[JK[p[0]]]=e[p[0]];});if(d.c){o.color=e.c;o.opacity=e.o;}return o;}
function desFx(o){
	const d=EFX[o&&o.type];if(!d)return null;const e=newFx(o.type);d.p.forEach(p=>{e[p[0]]=num(o[JK[p[0]]],e[p[0]]);});if(d.c){e.c=col(o.color,e.c);e.o=pct(o.opacity,e.o);}e.on=o.visible!==false;return e;
}
const T_IN={frame:'frame',rectangle:'rect',rect:'rect',ellipse:'ellipse',oval:'ellipse',polygon:'polygon',star:'star',text:'text',line:'line',vector:'path',path:'path',image:'image'};
function ser(s){
	const b=bbox(s),sw=s.sw||0,isLine=s.type==='path'&&s.pts.length===2&&!s.closed&&!s.pts.some(p=>p.ho||p.hi);
	const st={
		position:{x:rd(b.x),y:rd(b.y),rotation:s.rot||0,pivot:{x:s.pvx??.5,y:s.pvy??.5}},
		layout:{width:rd(b.w),height:rd(b.h),aspect_ratio:!!s.ar},
		appearance:{opacity:s.op??100,corner_radius:s.r||0,blend_mode:s.bm||'normal',flip_horizontal:!!s.flipX,flip_vertical:!!s.flipY},
		fill:{enabled:!!s.fillOn,color:s.fill,opacity:s.fo??100,visible:s.fv!==false},
		stroke:{enabled:sw>0,color:s.stroke,opacity:s.so??100,visible:s.sv!==false,position:'center',weight:sw,border_weight:{top:sw,right:sw,bottom:sw,left:sw}},
		export:{visible:s.exp!==false},effects:(s.fx||[]).map(serFx)
	};
	if(s.type==='polygon')st.polygon={sides:s.n};if(s.type==='star')st.star={points:s.n};
	if(s.type==='text')st.text={content:s.text,font_size:s.fs,font_family:s.fontFamily||FF,font_weight:s.fontWeight??(s.bold?700:400),bold:!!s.bold,italic:!!s.italic,underline:!!s.underline,alignment:s.textAlign||'left',line_height:s.lineHeight||125,letter_spacing:s.letterSpacing||0,fixed_width:!!s.textBox};
	if(s.type==='image')st.image={data_url:s.src,asset_id:s.assetId||null,source_name:s.sourceName||'Gambar'};
	if(s.type==='rect'||s.type==='frame')st.appearance.corner_radii=(s.radii||[s.r,s.r,s.r,s.r]).map(rd);
	if(s.type==='path')st.path={closed:!!s.closed,points:s.pts.map(p=>{const o={x:rd(p.x-b.x),y:rd(p.y-b.y)};if(hasH(p.ho))o.handle_out={x:rd(p.ho.x),y:rd(p.ho.y)};if(hasH(p.hi))o.handle_in={x:rd(p.hi.x),y:rd(p.hi.y)};return o;})};
	return {id:s.id,type:isLine?'line':(T_OUT[s.type]||s.type),name:s.name,visible:!s.hid,locked:!!s.lock,setting:st};
}
function des(l){
	const type=T_IN[l&&l.type];if(!type)return null;
	const st=l.setting||{},pos=st.position||{},lay=st.layout||{},ap=st.appearance||{},f=st.fill||{},sk=st.stroke||{};
	const isPath=type==='line'||type==='path',s=mk(isPath?'path':type,num(pos.x,0),num(pos.y,0));
	s.w=Math.max(0,num(lay.width,100));s.h=Math.max(0,num(lay.height,100));s.rot=num(pos.rotation,0);s.r=Math.max(0,num(ap.corner_radius,0));s.op=pct(ap.opacity);s.ar=!!lay.aspect_ratio;
	s.flipX=!!ap.flip_horizontal;s.flipY=!!ap.flip_vertical;
	if(Array.isArray(ap.corner_radii))s.radii=Array.from({length:4},(_,i)=>Math.max(0,num(ap.corner_radii[i],s.r)));
	const pvo=pos.pivot||{};s.pvx=num(pvo.x,.5);s.pvy=num(pvo.y,.5);s.bm=BM.includes(ap.blend_mode)?ap.blend_mode:'normal';s.fx=(Array.isArray(st.effects)?st.effects:[]).map(desFx).filter(Boolean);
	if(f.enabled!==undefined)s.fillOn=!!f.enabled;s.fill=col(f.color,s.fill);s.fo=pct(f.opacity);s.fv=f.visible!==false;
	const wt=num(sk.weight,num(sk.border_weight&&sk.border_weight.top,s.sw));s.sw=sk.enabled===false?0:Math.max(0,wt);s.stroke=col(sk.color,s.stroke);s.so=pct(sk.opacity);s.sv=sk.visible!==false;
	s.hid=l.visible===false;s.lock=!!l.locked;if(st.export&&st.export.visible===false)s.exp=false;
	if(typeof l.name==='string'&&l.name.trim())s.name=l.name.trim().slice(0,80);
	if(type==='polygon')s.n=Math.round(Math.min(20,Math.max(3,num(st.polygon&&st.polygon.sides,3))));
	if(type==='star')s.n=Math.round(Math.min(20,Math.max(3,num(st.star&&st.star.points,5))));
	if(type==='text'){
		const tx=st.text||{};s.text=String(tx.content??'Teks').slice(0,10000);s.fs=Math.min(999,Math.max(4,num(tx.font_size,16)));
		s.fontFamily=typeof tx.font_family==='string'&&tx.font_family.length<=80&&tx.font_family?tx.font_family:FF;
		s.fontWeight=Math.round(cl(num(tx.font_weight,tx.bold?700:400),100,900,400)/100)*100;s.bold=s.fontWeight>=600;s.italic=!!tx.italic;s.underline=!!tx.underline;s.textAlign=['left','center','right'].includes(tx.alignment)?tx.alignment:'left';
		s.lineHeight=Math.min(300,Math.max(50,num(tx.line_height,125)));s.letterSpacing=Math.min(100,Math.max(-20,num(tx.letter_spacing,0)));s.textBox=!!tx.fixed_width;fitText(s);
	}
	if(type==='image'){
		const im=st.image||{};if(typeof im.data_url!=='string'||!/^data:image\/(png|jpeg|webp|gif|bmp);base64,/i.test(im.data_url))return null;
		s.src=im.data_url;s.assetId=typeof im.asset_id==='string'?im.asset_id:null;s.sourceName=typeof im.source_name==='string'?im.source_name.slice(0,100):'Gambar';
	}
	if(isPath){
		const pp=st.path&&Array.isArray(st.path.points)?st.path.points:(type==='line'?[{x:0,y:0},{x:s.w,y:s.h}]:[]);
		s.pts=pp.map(p=>{const o={x:s.x+num(p&&p.x,0),y:s.y+num(p&&p.y,0)},hi=p&&p.handle_in,ho=p&&p.handle_out;
			if(ho&&(num(ho.x,0)||num(ho.y,0)))o.ho={x:num(ho.x,0),y:num(ho.y,0)};if(hi&&(num(hi.x,0)||num(hi.y,0)))o.hi={x:num(hi.x,0),y:num(hi.y,0)};return o;});
		s.closed=!!(st.path&&st.path.closed);if(s.pts.length<2)return null;
	}
	return s;
}
function fromJSON(d){
	if(!d||typeof d!=='object'||!Array.isArray(d.layers))throw new Error('Bukan file MiniFigma: properti "layers" tidak ditemukan.');
	const from=Math.floor(num(d.version,1));d=migrate(d);const keep=uid,items=[],groups={};let skipped=0,gc=0;
	const walk=(a,dep,pg,hid,lock)=>a.forEach(l=>{
		if(l&&(l.type==='group'||l.type==='grup')&&dep<20){const id=++gc;groups[id]={id,name:typeof l.name==='string'&&l.name.trim()?l.name.trim().slice(0,80):'Grup '+id,pid:pg,c:!!l.collapsed};walk(Array.isArray(l.children)?l.children:[],dep+1,id,hid||l.visible===false,lock||!!l.locked);return;}
		const s=des(l);if(!s){skipped++;return;}s.gid=pg;if(hid)s.hid=true;if(lock)s.lock=true;items.push([s,l.id]);
	});
	try{walk(d.layers,0,0,false,false);}catch(e){uid=keep;throw e;}
	const used=new Set();items.forEach(([s,w])=>{if(Number.isInteger(w)&&w>0&&!used.has(w)){s.id=w;used.add(w);}else s.id=0;});
	let nx=Math.max(0,...used)+1;items.forEach(([s])=>{if(!s.id)s.id=nx++;});uid=nx;
	return {S:items.map(i=>i[0]),GR:groups,GN:gc+1,skipped,from,name:typeof d.name==='string'&&d.name.trim()?d.name.trim().slice(0,100):'Tanpa judul',view:d.view,settings:d.settings};
}
const toJSON=()=>({app:'MiniFigma',version:FMT_VERSION,name:projName,view:{x:rd(V.x),y:rd(V.y),zoom:Math.round(V.z*1000)/1000},settings:{grid:chk('#cg'),snap_grid:chk('#mg'),snap_objects:chk('#mo')},layers:tree(S,0)});
function applyProject(r){
	S=r.S;GR=r.GR||{};gn=r.GN||1;projName=r.name;$('#pname').val(projName);
	const v=r.view;if(v&&isFinite(+v.x)&&isFinite(+v.y)&&+v.zoom>0)V={x:+v.x,y:+v.y,z:Math.min(32,Math.max(.05,+v.zoom))};
	const g=r.settings;if(g&&typeof g==='object'){if('grid' in g)$('#cg').prop('checked',!!g.grid);if('snap_grid' in g)$('#mg').prop('checked',!!g.snap_grid);if('snap_objects' in g)$('#mo').prop('checked',!!g.snap_objects);}setSel([]);
}
function load(){
	try{const raw=localStorage.getItem(LS_KEY);if(raw){applyProject(fromJSON(JSON.parse(raw)));return;}}catch(e){}
	try{const d=JSON.parse(localStorage.getItem('minifigma2'));if(d&&Array.isArray(d.S)){S=d.S;uid=d.uid||S.length+1;}}catch(e){}
}
MF.init.push(function initSaving(){
	MF.keys.push((e,k)=>{if((e.ctrlKey||e.metaKey)&&k==='s'){e.preventDefault();$('#jsave').trigger('click');return true;}return false;});
	$('#jsave').on('click',()=>{
		const url=URL.createObjectURL(new Blob([JSON.stringify(toJSON(),null,2)],{type:'application/json'})),fn=(projName.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'desain')+'.json';
		$('<a>').attr({href:url,download:fn})[0].click();setTimeout(()=>URL.revokeObjectURL(url),1000);note('Disimpan: '+fn);
	});
	$('#jopen').on('click',()=>$('#jfile').trigger('click'));
	$('#jfile').on('change',function(){
		const f=this.files[0];this.value='';if(!f)return;if(f.size>10*1024*1024){note('File terlalu besar (maksimal 10 MB).');return;}
		f.text().then(tx=>{const r=fromJSON(JSON.parse(tx));applyProject(r);refresh();save();note('Dibuka: '+r.name+' ('+r.S.length+' layer'+(r.skipped?', '+r.skipped+' dilewati':'')+')'+(r.from<FMT_VERSION?' · dimigrasi dari v'+r.from:r.from>FMT_VERSION?' · dibuat versi lebih baru (v'+r.from+'), properti baru diabaikan':''));})
			.catch(e=>note('Gagal membuka: '+(e instanceof SyntaxError?'bukan JSON yang valid.':e.message)));
	});
	$('#jnew').on('click',()=>{
		if(S.length&&!confirm('Mulai proyek baru? Perubahan yang belum disimpan ke JSON akan hilang.'))return;
		S=[];uid=1;GR={};gn=1;projName='Tanpa judul';$('#pname').val(projName);setSel([]);refresh();save();
	});
	$('#pname').on('input',()=>{projName=$('#pname').val();save();});
	$('#exp').on('click',()=>{
		const E=S.filter(s=>s.exp!==false&&!s.hid);if(!E.length)return;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
		E.forEach(s=>{const b=bbox(s),p=s.sw/2+(s.fx||[]).reduce((m,e)=>Math.max(m,Math.abs(e.x||0)+Math.abs(e.y||0)+(e.b||0)*2),0);
			[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].forEach(q=>{const r=rp(s,q[0],q[1]);x0=Math.min(x0,r[0]-p);y0=Math.min(y0,r[1]-p);x1=Math.max(x1,r[0]+p);y1=Math.max(y1,r[1]+p);});});
		const c=document.createElement('canvas');c.width=Math.ceil(x1-x0);c.height=Math.ceil(y1-y0);const g=c.getContext('2d');g.translate(-x0,-y0);E.forEach(s=>paint(g,s));
		$('<a>').attr({href:c.toDataURL('image/png'),download:'desain.png'})[0].click();
	});
});
