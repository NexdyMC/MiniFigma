/* [6.9] Simpan dan ekspor. Isi: JSON v11, migrasi, buka/simpan proyek, ekspor PNG. Bukan di sini: riwayat atau autosave. */
const FMT_VERSION=11,LS_KEY='minifigma.project',IMG_KEY='minifigma.images',MAX_IMAGE=1024*1024,MAX_IMAGE_TOTAL=1400*1024;
let projName='Untitled';
const rd=v=>Math.round(v*100)/100;
const num=(v,d)=>(v===null||v===undefined||v===''||!isFinite(+v))?d:+v;
const pct=(v,d=100)=>Math.min(100,Math.max(0,num(v,d)));
const col=(v,d)=>{if(typeof v!=='string')return d;v=v.trim();if(/^#[0-9a-f]{3}$/i.test(v))v='#'+[...v.slice(1)].map(c=>c+c).join('');return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():d;};
const T_OUT={rect:'rectangle',path:'vector'};
function migrateV8FrameParents(d){
	const ordered=[];
	const walk=layers=>(Array.isArray(layers)?layers:[]).forEach(layer=>{
		if(layer&&(layer.type==='group'||layer.type==='grup'))walk(layer.children);
		else if(layer)ordered.push(layer);
	});
	walk(d.layers);
	const frames=[];
	ordered.forEach(layer=>{
		const st=layer.setting||{},pos=st.position||{},layout=st.layout||{};
		const x=num(pos.x,0),y=num(pos.y,0),w=Math.max(0,num(layout.width,100)),h=Math.max(0,num(layout.height,100));
		const cx=x+w/2,cy=y+h/2;
		const parent=frames.filter(frame=>cx>=frame.x&&cx<=frame.x+frame.w&&cy>=frame.y&&cy<=frame.y+frame.h)
			.sort((a,b)=>a.w*a.h-b.w*b.h)[0]||null;
		layer.fid=parent?parent.id:0;
		if(layer.type==='frame')frames.push({id:layer.id,x,y,w,h});
	});
	return d;
}
function migrateV9FrameClip(d){
	const walk=layers=>(Array.isArray(layers)?layers:[]).forEach(layer=>{
		if(!layer)return;
		if(layer.type==='frame'&&layer.clip_content===undefined)layer.clip_content=true;
		if(layer.type==='frame'||layer.type==='group'||layer.type==='grup')walk(layer.children);
	});
	walk(d.layers);return d;
}
function migrateV10Typography(d){
	const walk=layers=>(Array.isArray(layers)?layers:[]).forEach(layer=>{
		if(!layer)return;
		const st=layer.setting&&typeof layer.setting==='object'?layer.setting:{},fill=st.fill&&typeof st.fill==='object'?st.fill:{};
		if(fill.type===undefined)fill.type='solid';
		if(Array.isArray(st.fills))st.fills=st.fills.map(p=>{
			if(!p||typeof p!=='object')return p;
			const type=['solid','linear','radial','angular'].includes(p.type)?p.type:'solid';
			if(type==='solid')return {...p,type};
			const color=col(p.color,'#d9d9d9'),color2=col(p.color2,color);
			return {...p,type,stops:Array.isArray(p.stops)&&p.stops.length>=2?p.stops:[{pos:0,color},{pos:100,color:color2}]};
		});
		st.fill=fill;layer.setting=st;
		if(layer.type==='text'){
			const tx=st.text||{},fontSize=Math.min(999,Math.max(4,num(tx.font_size,16))),family=tx.font_family==='Inter,system-ui,sans-serif'?'Inter':typeof tx.font_family==='string'&&tx.font_family?tx.font_family:'Inter';
			tx.font_family=family;tx.font_weight=Math.round(cl(num(tx.font_weight,tx.bold?700:400),100,900,400)/100)*100;tx.italic=tx.italic===true;tx.font_size=fontSize;
			tx.line_height=Math.min(300,Math.max(50,num(tx.line_height,125)));tx.letter_spacing=Math.min(100,Math.max(-100,(num(tx.letter_spacing,0)/fontSize)*100));
			tx.align=({left:'l',center:'c',right:'r'}[tx.alignment]||'l');tx.v_align='top';tx.resize=tx.fixed_width?'auto_height':'auto_width';
			tx.decoration=tx.underline?'underline':'none';tx.case='none';st.text=tx;layer.setting=st;
		}
		if(layer.type==='frame'||layer.type==='group'||layer.type==='grup')walk(layer.children);
	});
	walk(d.layers);return d;
}
const MIGRATE={1:d=>d,2:d=>d,3:d=>d,4:d=>d,5:d=>d,6:d=>d,7:d=>d,8:migrateV8FrameParents,9:migrateV9FrameClip,10:migrateV10Typography};
function migrate(d){let v=Math.floor(num(d.version,1));d={...d};while(v<FMT_VERSION){if(MIGRATE[v])d=MIGRATE[v](d);v++;}d.version=FMT_VERSION;return d;}
function tree(L,g,fid=0){
	const out=[],seen=new Set();
	const scope=L.filter(s=>(frameParentOf(s)?frameParentOf(s).id:0)===fid);
	scope.forEach(s=>{
		const c=childOf(s,g);
		if(c==null)out.push(ser(s));
		else if(!seen.has(c)){
			seen.add(c);const sub=scope.filter(x=>childOf(x,g)===c),r=GR[c]||{name:'Grup',c:false};
			out.push({id:c,type:'group',name:r.name,visible:!sub.every(x=>x.hid),locked:sub.every(x=>x.lock),collapsed:!!r.c,children:tree(L,c,fid)});
		}
	});
	return out;
}
function serFx(e){const d=EFX[e.t],o={type:e.t,visible:e.on!==false};d.p.forEach(p=>{o[JK[p[0]]]=e[p[0]];});if(d.c){o.color=e.c;o.opacity=e.o;}return o;}
function serPaint(p,kind){
	const o={type:['solid','linear','radial','angular'].includes(p.type)?p.type:'solid',color:col(p.color,'#d9d9d9'),opacity:pct(p.opacity),visible:p.visible!==false};
	if(o.type!=='solid'){
		o.color2=col(p.color2,o.color);o.angle=num(p.angle,0);
		const stops=Array.isArray(p.stops)?p.stops:[{pos:0,color:o.color},{pos:100,color:col(p.color2,o.color)}];
		o.stops=stops.slice(0,8).map((s,i)=>({pos:Math.min(100,Math.max(0,num(s&&s.pos,i?100:0))),color:col(s&&s.color,o.color)}));
		if(o.stops.length<2)o.stops=[{pos:0,color:o.color},{pos:100,color:o.color2}];
	}
	if(kind==='stroke')Object.assign(o,{weight:Math.max(.1,num(p.weight,1)),position:['center','inside','outside'].includes(p.position)?p.position:'center',dash:['solid','dash','dot','dashDot'].includes(p.dash)?p.dash:'solid',cap:['butt','round','square'].includes(p.cap)?p.cap:'butt',join:['miter','round','bevel'].includes(p.join)?p.join:'round',startArrow:['none','arrow','triangle','line','circle','square','diamond'].includes(p.startArrow)?p.startArrow:'none',endArrow:['none','arrow','triangle','line','circle','square','diamond'].includes(p.endArrow)?p.endArrow:'none'});
	return o;
}
function desPaint(p,kind,fallback){
	p=p&&typeof p==='object'?p:{};const type=['solid','linear','radial','angular'].includes(p.type)?p.type:'solid',o={type,color:col(p.color,fallback),opacity:pct(p.opacity),visible:p.visible!==false};
	if(type!=='solid'){
		o.color2=col(p.color2,o.color);o.angle=num(p.angle,0);
		const stops=Array.isArray(p.stops)?p.stops:[{pos:0,color:o.color},{pos:100,color:o.color2}];
		o.stops=stops.slice(0,8).map((s,i)=>({pos:Math.min(100,Math.max(0,num(s&&s.pos,i?100:0))),color:col(s&&s.color,o.color)}));
		if(o.stops.length<2)o.stops=[{pos:0,color:o.color},{pos:100,color:o.color2}];
		o.color=o.stops[0].color;o.color2=o.stops[o.stops.length-1].color;
	}
	if(kind==='stroke')Object.assign(o,{weight:Math.max(.1,num(p.weight,1)),position:['center','inside','outside'].includes(p.position)?p.position:'center',dash:['solid','dash','dot','dashDot'].includes(p.dash)?p.dash:'solid',cap:['butt','round','square'].includes(p.cap)?p.cap:'butt',join:['miter','round','bevel'].includes(p.join)?p.join:'round',startArrow:['none','arrow','triangle','line','circle','square','diamond'].includes(p.startArrow)?p.startArrow:'none',endArrow:['none','arrow','triangle','line','circle','square','diamond'].includes(p.endArrow)?p.endArrow:'none'});
	return o;
}
function desFx(o){
	const d=EFX[o&&o.type];if(!d)return null;const e=newFx(o.type);d.p.forEach(p=>{e[p[0]]=num(o[JK[p[0]]],e[p[0]]);});if(d.c){e.c=col(o.color,e.c);e.o=pct(o.opacity,e.o);}e.on=o.visible!==false;return e;
}
const T_IN={frame:'frame',rectangle:'rect',rect:'rect',ellipse:'ellipse',oval:'ellipse',polygon:'polygon',star:'star',text:'text',line:'line',vector:'path',path:'path',image:'image'};
function ser(s){
	const b=bbox(s),sw=s.sw||0,isLine=s.type==='path'&&s.pts.length===2&&!s.closed&&!s.pts.some(p=>p.ho||p.hi);
	const parentFrame=frameParentOf(s);
	const st={
		position:{x:rd(b.x),y:rd(b.y),rotation:s.rot||0,pivot:{x:s.pvx??.5,y:s.pvy??.5}},
		layout:{width:rd(b.w),height:rd(b.h),aspect_ratio:!!s.ar},
		appearance:{opacity:s.op??100,corner_radius:s.r||0,corner_smoothing:s.smooth||0,blend_mode:s.bm||'normal',flip_horizontal:!!s.flipX,flip_vertical:!!s.flipY},
		fill:{enabled:!!s.fillOn,color:s.fill,opacity:s.fo??100,visible:s.fv!==false},
		stroke:{enabled:sw>0,color:s.stroke,opacity:s.so??100,visible:s.sv!==false,position:'center',weight:sw,border_weight:{top:sw,right:sw,bottom:sw,left:sw}},
		fills:getPaintLayers(s,'fill').map(p=>serPaint(p,'fill')),
		strokes:getPaintLayers(s,'stroke').map(p=>serPaint(p,'stroke')),
		export:{visible:s.exp!==false},effects:(s.fx||[]).map(serFx)
	};
	const firstFill=st.fills[0];if(firstFill)Object.assign(st.fill,{type:firstFill.type,angle:firstFill.angle,stops:firstFill.stops});
	if(s.type==='polygon')st.polygon={sides:s.n};if(s.type==='star')st.star={points:s.n};
	if(s.type==='text')st.text={content:s.text,font_family:String(s.ff||'Inter').slice(0,80),font_weight:Math.round(cl(s.fw,100,900,400)/100)*100,italic:!!s.fi,font_size:Math.min(999,Math.max(4,num(s.fs,16))),line_height:s.lh==null?null:Math.min(300,Math.max(50,num(s.lh,125))),letter_spacing:cl(s.ls,-100,100,0),align:['l','c','r','j'].includes(s.ta)?s.ta:'l',v_align:['top','middle','bottom'].includes(s.va)?s.va:'top',resize:({aw:'auto_width',ah:'auto_height',fx:'fixed'})[s.tm]||'auto_width',decoration:['none','underline','strike'].includes(s.td)?s.td:'none',case:['none','upper','lower','title'].includes(s.tc)?s.tc:'none'};
	if(s.type==='image')st.image={data_url:s.src,asset_id:s.assetId||null,source_name:s.sourceName||'Gambar'};
	if(s.type==='rect'||s.type==='frame')st.appearance.corner_radii=(s.radii||[s.r,s.r,s.r,s.r]).map(rd);
	if(s.type==='path')st.path={closed:!!s.closed,points:s.pts.map(p=>{const o={x:rd(p.x-b.x),y:rd(p.y-b.y)};if(hasH(p.ho))o.handle_out={x:rd(p.ho.x),y:rd(p.ho.y)};if(hasH(p.hi))o.handle_in={x:rd(p.hi.x),y:rd(p.hi.y)};return o;})};
	const layer={id:s.id,type:isLine?'line':(T_OUT[s.type]||s.type),name:s.name,fid:parentFrame?parentFrame.id:0,visible:!s.hid,locked:!!s.lock,setting:st};
	if(s.type==='frame')layer.clip_content=s.clipContent!==false;
	if(s.type==='frame'){layer.collapsed=!!s.c;layer.children=tree(S,0,s.id);}
	return layer;
}
function des(l){
	const type=T_IN[l&&l.type];if(!type)return null;
	const st=l.setting||{},pos=st.position||{},lay=st.layout||{},ap=st.appearance||{},f=st.fill||{},sk=st.stroke||{};
	const isPath=type==='line'||type==='path',s=mk(isPath?'path':type,num(pos.x,0),num(pos.y,0));
	s.w=Math.max(0,num(lay.width,100));s.h=Math.max(0,num(lay.height,100));s.rot=num(pos.rotation,0);s.r=Math.max(0,num(ap.corner_radius,0));s.smooth=pct(ap.corner_smoothing,0);s.op=pct(ap.opacity);s.ar=!!lay.aspect_ratio;
	s.flipX=!!ap.flip_horizontal;s.flipY=!!ap.flip_vertical;
	if(Array.isArray(ap.corner_radii))s.radii=Array.from({length:4},(_,i)=>Math.max(0,num(ap.corner_radii[i],s.r)));
	const pvo=pos.pivot||{};s.pvx=num(pvo.x,.5);s.pvy=num(pvo.y,.5);s.bm=BM.includes(ap.blend_mode)?ap.blend_mode:'normal';s.fx=(Array.isArray(st.effects)?st.effects:[]).map(desFx).filter(Boolean);
	if(f.enabled!==undefined)s.fillOn=!!f.enabled;s.fill=col(f.color,s.fill);s.fo=pct(f.opacity);s.fv=f.visible!==false;
	const wt=num(sk.weight,num(sk.border_weight&&sk.border_weight.top,s.sw));s.sw=sk.enabled===false?0:Math.max(0,wt);s.stroke=col(sk.color,s.stroke);s.so=pct(sk.opacity);s.sv=sk.visible!==false;
	if(Array.isArray(st.fills)){s.fills=st.fills.map(p=>desPaint(p,'fill',s.fill));syncLegacyPaint(s,'fill');}
	else if(f.type==='linear'||f.type==='radial'){s.fills=[desPaint(f,'fill',s.fill)];syncLegacyPaint(s,'fill');}
	if(Array.isArray(st.strokes)){s.strokes=st.strokes.map(p=>desPaint(p,'stroke',s.stroke));syncLegacyPaint(s,'stroke');}
	s.hid=l.visible===false;s.lock=!!l.locked;if(st.export&&st.export.visible===false)s.exp=false;
	if(type==='frame')s.clipContent=l.clip_content!==false;
	if(typeof l.name==='string'&&l.name.trim())s.name=l.name.trim().slice(0,80);
	if(type==='polygon')s.n=Math.round(Math.min(20,Math.max(3,num(st.polygon&&st.polygon.sides,3))));
	if(type==='star')s.n=Math.round(Math.min(20,Math.max(3,num(st.star&&st.star.points,5))));
	if(type==='text'){
		const tx=st.text||{},resize={auto_width:'aw',auto_height:'ah',fixed:'fx'};
		s.text=String(tx.content??'Teks').slice(0,10000);s.ff=typeof tx.font_family==='string'&&tx.font_family.length<=80&&tx.font_family?tx.font_family:'Inter';
		s.fw=Math.round(cl(num(tx.font_weight,400),100,900,400)/100)*100;s.fi=tx.italic===true;s.fs=Math.min(999,Math.max(4,num(tx.font_size,16)));
		s.lh=tx.line_height===null?null:Math.min(300,Math.max(50,num(tx.line_height,125)));s.ls=Math.min(100,Math.max(-100,num(tx.letter_spacing,0)));
		s.ta=['l','c','r','j'].includes(tx.align)?tx.align:'l';s.va=['top','middle','bottom'].includes(tx.v_align)?tx.v_align:'top';s.tm=resize[tx.resize]||'aw';
		s.td=['none','underline','strike'].includes(tx.decoration)?tx.decoration:'none';s.tc=['none','upper','lower','title'].includes(tx.case)?tx.case:'none';fitText(s);
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
	if(!d||typeof d!=='object'||!Array.isArray(d.layers))throw new Error('Bukan file Mini Vector: properti "layers" tidak ditemukan.');
	const from=Math.floor(num(d.version,1));d=migrate(d);const keep=uid,items=[],groups={};let skipped=0,gc=0;
	const walk=(a,dep,pg,hid,lock)=>a.forEach(l=>{
		if(l&&(l.type==='group'||l.type==='grup')&&dep<20){const id=++gc;groups[id]={id,name:typeof l.name==='string'&&l.name.trim()?l.name.trim().slice(0,80):'Grup '+id,pid:pg,c:!!l.collapsed};walk(Array.isArray(l.children)?l.children:[],dep+1,id,hid||l.visible===false,lock||!!l.locked);return;}
		const s=des(l);if(!s){skipped++;return;}s.gid=pg;if(hid)s.hid=true;if(lock)s.lock=true;s.c=!!l.collapsed;items.push([s,l.id,l.fid]);
		if(s.type==='frame'&&dep<20)walk(Array.isArray(l.children)?l.children:[],dep+1,pg,hid||l.visible===false,lock||!!l.locked);
	});
	try{walk(d.layers,0,0,false,false);}catch(e){uid=keep;throw e;}
	const used=new Set();items.forEach(([s,w])=>{if(Number.isInteger(w)&&w>0&&!used.has(w)){s.id=w;used.add(w);}else s.id=0;});
	let nx=Math.max(0,...used)+1;items.forEach(([s])=>{if(!s.id)s.id=nx++;});
	const byId=new Map(items.map(([s])=>[s.id,s]));
	items.forEach(([s,,parentId])=>{
		if(!Number.isInteger(parentId)){delete s.fid;return;}
		const parent=byId.get(parentId);s.fid=parent&&parent.type==='frame'&&parent!==s?parent.id:0;
	});
	items.forEach(([s,,parentId])=>{
		if(!Number.isInteger(parentId)||!s.fid)return;
		const seen=new Set([s.id]);let parent=s,valid=true;
		while(parent&&parent.fid){
			if(seen.has(parent.fid)){valid=false;break;}
			seen.add(parent.fid);parent=byId.get(parent.fid);
		}
		if(!valid)s.fid=0;
	});
	uid=nx;
	const loadedGuides=Array.isArray(d.guides)?d.guides.filter(g=>g&&['x','y'].includes(g.v)&&Number.isFinite(+g.t)).slice(0,1000).map(g=>({v:g.v,t:+g.t})):[];
	return {S:items.map(i=>i[0]),GR:groups,GN:gc+1,skipped,from,name:typeof d.name==='string'&&d.name.trim()?d.name.trim().slice(0,100):'Tanpa judul',view:d.view,settings:d.settings,guides:loadedGuides};
}
const toJSON=()=>({app:'Mini Vector',version:FMT_VERSION,name:projName,view:{x:rd(V.x),y:rd(V.y),zoom:Math.round(V.z*1000)/1000},settings:{grid:chk('#cg'),snap_grid:chk('#mg'),snap_objects:chk('#mo')},guides:guides.map(g=>({v:g.v,t:rd(g.t)})),layers:tree(S,0,0)});
function applyProject(r){
	S=r.S;GR=r.GR||{};gn=r.GN||1;guides=r.guides||[];normalize();projName=r.name;$('#pname').val(projName);
	const v=r.view;if(v&&isFinite(+v.x)&&isFinite(+v.y)&&+v.zoom>0)V={x:+v.x,y:+v.y,z:Math.min(32,Math.max(.05,+v.zoom))};
	const g=r.settings;if(g&&typeof g==='object'){if('grid' in g)$('#cg').prop('checked',!!g.grid);if('snap_grid' in g)$('#mg').prop('checked',!!g.snap_grid);if('snap_objects' in g)$('#mo').prop('checked',!!g.snap_objects);}setSel([]);
}
function load(){
	try{const raw=localStorage.getItem(LS_KEY);if(raw){applyProject(fromJSON(JSON.parse(raw)));return;}}catch(e){}
	try{const d=JSON.parse(localStorage.getItem('minifigma2'));if(d&&Array.isArray(d.S)){S=d.S;uid=d.uid||S.length+1;}}catch(e){}
}
function exportDescendants(frame){
	const out=[frame],seen=new Set([frame.id]);
	let changed=true;
	while(changed){
		changed=false;
		S.forEach(s=>{const p=frameParentOf(s);if(p&&seen.has(p.id)&&!seen.has(s.id)){seen.add(s.id);out.push(s);changed=true;}});
	}
	return out;
}
function exportItems(scope,frameId){
	let chosen=[];
	if(scope==='all')chosen=S.filter(s=>s.exp!==false&&!frameEffectivelyHidden(s));
	else if(scope==='frame'){
		const frame=S.find(s=>s.type==='frame'&&s.id===+frameId);
		if(frame)chosen=exportDescendants(frame);
	}else{
		chosen=selAll().filter(s=>!frameEffectivelyHidden(s));
		chosen.flatMap(s=>s.type==='frame'?exportDescendants(s).slice(1):[]).forEach(s=>{if(!chosen.includes(s))chosen.push(s);});
	}
	return chosen.filter(s=>s.exp!==false&&!frameEffectivelyHidden(s));
}
function exportBounds(items){
	const pts=[];
	const rectFor=(s,pad=0)=>{
		const b=bbox(s),corners=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>rp(s,p[0],p[1]));
		const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
		return {x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,x2:Math.max(...xs)+pad,y2:Math.max(...ys)+pad};
	};
	items.forEach(s=>{
		const strokes=getPaintLayers(s,'stroke').filter(p=>p.visible!==false);
		let pad=strokes.reduce((m,p)=>Math.max(m,(+p.weight||0)*(p.startArrow!=='none'||p.endArrow!=='none'?4:p.position==='center'?.5:1)),s.sw/2);
		(s.fx||[]).filter(e=>e.on!==false&&['drop_shadow','glow','layer_blur'].includes(e.t)).forEach(e=>{pad+=Math.abs(e.x||0)+Math.abs(e.y||0)+(e.b||0)*2;});
		let bounds=rectFor(s,pad),parent=frameParentOf(s),seen=new Set();
		while(parent&&!seen.has(parent.id)){
			if(parent.clipContent!==false){
				const clip=rectFor(parent);
				bounds={x:Math.max(bounds.x,clip.x),y:Math.max(bounds.y,clip.y),x2:Math.min(bounds.x2,clip.x2),y2:Math.min(bounds.y2,clip.y2)};
				if(bounds.x2<bounds.x||bounds.y2<bounds.y)return;
			}
			seen.add(parent.id);parent=frameParentOf(parent);
		}
		pts.push([bounds.x,bounds.y],[bounds.x2,bounds.y2]);
	});
	if(!pts.length)return {x:0,y:0,w:1,h:1};
	const x=Math.min(...pts.map(p=>p[0])),y=Math.min(...pts.map(p=>p[1]));
	return {x,y,w:Math.max(1,Math.max(...pts.map(p=>p[0]))-x),h:Math.max(1,Math.max(...pts.map(p=>p[1]))-y)};
}
function exportBaseName(scope,frameId){
	const base=(projName.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'desain');
	const frame=scope==='frame'?S.find(s=>s.id===+frameId):null;
	const suffix=frame?'-'+(frame.name||'frame').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-'):scope==='selection'?'-seleksi':'';
	return base+suffix;
}
function loadExportImages(items){
	return Promise.all(items.filter(s=>s.type==='image').map(s=>{
		const img=imageFor(s.src);if(!img)return Promise.reject(new Error('Gambar ekspor tidak dapat dimuat.'));
		if(img.complete&&img.naturalWidth)return Promise.resolve();
		return new Promise((resolve,reject)=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',()=>reject(new Error('Gagal memuat gambar untuk ekspor.')),{once:true});});
	}));
}
function exportCanvasBlob(canvas,type,quality){
	return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Browser gagal membuat berkas ekspor.')),type,quality));
}
async function renderPNG(items,scale=1,bg=null){
	if(!items.length)throw new Error('Tidak ada objek terlihat untuk diekspor.');
	await loadExportImages(items);
	const b=exportBounds(items),w=Math.ceil(b.w*scale),h=Math.ceil(b.h*scale);
	if(w>32767||h>32767||w*h>25000000)throw new Error('Ukuran ekspor terlalu besar. Pilih skala lebih kecil atau area yang lebih sempit.');
	const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
	const g=canvas.getContext('2d');if(!g)throw new Error('Canvas ekspor tidak tersedia.');
	if(bg){g.fillStyle=bg;g.fillRect(0,0,w,h);}
	g.scale(scale,scale);g.translate(-b.x,-b.y);paintHierarchy(g,null,s=>items.includes(s));
	return canvas;
}
async function buildExportBlob(scope,frameId,format,scale){
	const items=exportItems(scope,frameId);
	if(!items.length)throw new Error(scope==='selection'?'Pilih objek terlebih dahulu untuk diekspor.':'Tidak ada objek terlihat untuk diekspor.');
	const canvas=await renderPNG(items,scale,format==='png'?null:'#fff'),w=canvas.width,h=canvas.height;
	if(format==='jpg')return {blob:await exportCanvasBlob(canvas,'image/jpeg',.92),extension:'jpg'};
	if(format==='pdf'){
		const jpeg=await exportCanvasBlob(canvas,'image/jpeg',.92),data=new Uint8Array(await jpeg.arrayBuffer()),enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
		const push=part=>{parts.push(part);length+=part.length;},text=value=>enc.encode(value);
		push(text('%PDF-1.4\n%Mini Vector\n'));
		const object=(id,head,stream)=>{offsets[id]=length;push(text(`${id} 0 obj\n${head}`));if(stream){push(text('\nstream\n'));push(stream);push(text('\nendstream'));}push(text('\nendobj\n'));};
		const content=text(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`);
		object(1,'<< /Type /Catalog /Pages 2 0 R >>');
		object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
		object(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
		object(4,`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${data.length} >>`,data);
		object(5,`<< /Length ${content.length} >>`,content);
		const xref=length;push(text('xref\n0 6\n0000000000 65535 f \n'));
		for(let i=1;i<=5;i++)push(text(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`));
		push(text(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
		const bytes=new Uint8Array(length);let at=0;parts.forEach(part=>{bytes.set(part,at);at+=part.length;});
		return {blob:new Blob([bytes],{type:'application/pdf'}),extension:'pdf'};
	}
	const png=await exportCanvasBlob(canvas,'image/png');
	if(format==='png')return {blob:png,extension:'png'};
	if(format==='svg'){
		const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Gagal membaca PNG untuk SVG.'));reader.readAsDataURL(png);});
		const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image width="${w}" height="${h}" href="${data}"/></svg>`;
		return {blob:new Blob([svg],{type:'image/svg+xml'}),extension:'svg'};
	}
	throw new Error('Format ekspor tidak dikenal.');
}
function downloadExport(blob,name,extension){
	const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${name}.${extension}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function copyPNG(){
	const scope=selAll().length?'selection':'all',result=await buildExportBlob(scope,0,'png',1);
	try{
		if(!navigator.clipboard||!window.ClipboardItem)throw new Error('Clipboard gambar tidak didukung.');
		await navigator.clipboard.write([new ClipboardItem({'image/png':result.blob})]);
		note('PNG disalin ke clipboard');
	}catch(e){downloadExport(result.blob,'desain','png');note('Browser tidak mengizinkan salin gambar, PNG diunduh');}
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
		S=[];uid=1;GR={};gn=1;guides=[];projName='Tanpa judul';$('#pname').val(projName);setSel([]);refresh();save();
	});
	$('#pname').on('input',()=>{projName=$('#pname').val();save();});
	$('#exp').on('click',()=>{
		const frames=S.filter(s=>s.type==='frame'&&!frameEffectivelyHidden(s)),$frame=$('#exportFrame').empty();
		frames.forEach(s=>$frame.append($('<option>').val(s.id).text(`${s.name} · ${Math.round(s.w)} × ${Math.round(s.h)}`)));
		$('#exportScope option[value="frame"]').prop('disabled',!frames.length);
		$('#exportScope').val(selAll().length?'selection':'all');$('#exportFrameRow').toggleClass('hidden',$('#exportScope').val()!=='frame');
		$('#exportScale').val('1');$('#exportFormat').val('png');
		$('#exportdlg')[0].showModal();
	});
	$('#exportScope').on('change',function(){$('#exportFrameRow').toggleClass('hidden',this.value!=='frame');});
	$('#exportclose,#exportcancel').on('click',()=>$('#exportdlg')[0].close());
	$('#exportform').on('submit',async e=>{
		e.preventDefault();const $button=$('#exportconfirm');$button.prop('disabled',true).text('Mengekspor…');
		try{
			const scope=$('#exportScope').val(),format=$('#exportFormat').val(),scale=+$('#exportScale').val(),frameId=$('#exportFrame').val();
			const result=await buildExportBlob(scope,frameId,format,scale);downloadExport(result.blob,exportBaseName(scope,frameId),result.extension);
			$('#exportdlg')[0].close();note(`Ekspor ${result.extension.toUpperCase()} selesai (${scale}×).`);
		}catch(err){note('Ekspor gagal: '+err.message);}
		finally{$button.prop('disabled',false).text('Ekspor');}
	});
	$('#expcopy').on('click',()=>copyPNG().catch(err=>note('Gagal menyalin PNG: '+err.message)));
});
