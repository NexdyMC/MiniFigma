/* [6.1] Kanvas. Isi: gambar objek, magnet, hit-test, dispatcher mouse. Bukan di sini: panel, alat, transformasi. */
const gs=()=>{if(V.z>=8)return 1;let s=10;while(s*V.z<10)s*=2;return s;};
function trace(g,s){
	if(g.beginPath)g.beginPath();
	if(s.type==='rect'||s.type==='frame'){
		const cap=Math.min(s.w/2,s.h/2),r=(s.radii||[s.r,s.r,s.r,s.r]).map(v=>Math.max(0,Math.min(v||0,cap))),sm=cl(s.smooth||0,0,100,0);
		if(!sm){g.roundRect(s.x,s.y,s.w,s.h,r);return;}
		const [tl,tr,br,bl]=r,pow=2/(2+sm*.06),corner=(cx,cy,rad,a0)=>{for(let i=1;i<=12;i++){const a=a0+i*Math.PI/24,c=Math.cos(a),n=Math.sin(a);g.lineTo(cx+Math.sign(c)*Math.pow(Math.abs(c),pow)*rad,cy+Math.sign(n)*Math.pow(Math.abs(n),pow)*rad);}};
		g.moveTo(s.x+tl,s.y);g.lineTo(s.x+s.w-tr,s.y);corner(s.x+s.w-tr,s.y+tr,tr,-Math.PI/2);g.lineTo(s.x+s.w,s.y+s.h-br);corner(s.x+s.w-br,s.y+s.h-br,br,0);g.lineTo(s.x+bl,s.y+s.h);corner(s.x+bl,s.y+s.h-bl,bl,Math.PI/2);g.lineTo(s.x,s.y+tl);corner(s.x+tl,s.y+tl,tl,Math.PI);g.closePath();
	}else if(s.type==='ellipse')g.ellipse(s.x+s.w/2,s.y+s.h/2,Math.abs(s.w/2),Math.abs(s.h/2),0,0,Math.PI*2);
	else{const P=s.type==='path'?s.pts:geo(s),cl=s.type!=='path'||s.closed;P.forEach((p,i)=>i?seg(g,P[i-1],p):g.moveTo(p.x,p.y));if(cl){if(s.type==='path'&&P.length>2)seg(g,P[P.length-1],P[0]);g.closePath();}}
}
function paintStyle(g,s,p){
	if(p.type==='solid')return p.color||'#d9d9d9';
	const b=bbox(s),cx=b.x+b.w/2,cy=b.y+b.h/2,r=Math.max(1,Math.hypot(b.w,b.h)/2),stops=Array.isArray(p.stops)&&p.stops.length>=2?p.stops:[{pos:0,color:p.color||'#d9d9d9'},{pos:100,color:p.color2||p.color||'#d9d9d9'}];
	let grad;
	if(p.type==='radial')grad=g.createRadialGradient(cx,cy,0,cx,cy,r);
	else if(p.type==='angular'&&g.createConicGradient)grad=g.createConicGradient((+(p.angle||0))*Math.PI/180,cx,cy);
	else{
		const a=(+(p.angle||0))*Math.PI/180,dx=Math.cos(a)*r,dy=Math.sin(a)*r;
		grad=g.createLinearGradient(cx-dx,cy-dy,cx+dx,cy+dy);
	}
	stops.slice().sort((a,b)=>(+a.pos||0)-(+b.pos||0)).forEach((stop,i)=>grad.addColorStop(cl((+stop.pos||0)/100,0,1,i/(stops.length-1)),stop.color||'#d9d9d9'));
	return grad;
}
function drawArrow(g,s,p,which){
	const type=p[which+'Arrow']||'none';if(type==='none'||s.type==='text')return;
	const q=flat(s);if(q.length<2)return;
	const start=which==='start',tip=start?q[0]:q[q.length-1],near=start?q[1]:q[q.length-2],a=Math.atan2(tip.y-near.y,tip.x-near.x)+(start?Math.PI:0),len=Math.max(8,(p.weight||1)*4),wide=len*.58,base={x:tip.x-Math.cos(a)*len,y:tip.y-Math.sin(a)*len};
	g.save();g.fillStyle=g.strokeStyle;
	if(type==='circle'){g.beginPath();g.arc(tip.x-Math.cos(a)*len/2,tip.y-Math.sin(a)*len/2,wide/2,0,Math.PI*2);g.fill();}
	else if(type==='square'){g.save();g.translate(tip.x,tip.y);g.rotate(a);g.fillRect(-len,-wide/2,len,wide);g.restore();}
	else{
		g.beginPath();g.moveTo(tip.x,tip.y);g.lineTo(base.x+Math.cos(a+Math.PI/2)*wide/2,base.y+Math.sin(a+Math.PI/2)*wide/2);
		if(type==='line'){g.lineTo(tip.x-Math.cos(a)*len*.65,tip.y-Math.sin(a)*len*.65);g.lineTo(base.x-Math.cos(a+Math.PI/2)*wide/2,base.y-Math.sin(a+Math.PI/2)*wide/2);g.stroke();}
		else if(type==='diamond'){g.lineTo(base.x,base.y);g.lineTo(base.x-Math.cos(a+Math.PI/2)*wide/2,base.y-Math.sin(a+Math.PI/2)*wide/2);g.closePath();g.fill();}
		else{g.lineTo(base.x-Math.cos(a+Math.PI/2)*wide/2,base.y-Math.sin(a+Math.PI/2)*wide/2);g.closePath();g.fill();}
	}
	g.restore();
}
function drawStroke(g,s,p,op){
	const weight=Math.max(.1,+p.weight||1),canAlign=s.type!=='path'||s.closed,position=canAlign&&['inside','outside'].includes(p.position)?p.position:'center';
	g.save();g.globalAlpha=op*(p.opacity??100)/100;g.strokeStyle=paintStyle(g,s,p);g.lineWidth=position==='center'?weight:weight*2;
	g.lineCap=['butt','round','square'].includes(p.cap)?p.cap:'butt';g.lineJoin=['miter','round','bevel'].includes(p.join)?p.join:'round';
	const dash={solid:[],dash:[weight*4,weight*2],dot:[weight,weight*2],dashDot:[weight*4,weight*2,weight,weight*2]}[p.dash]||[];g.setLineDash(dash);g.lineDashOffset=+(p.dashOffset||0);
	const path=new Path2D();trace(path,s);
	if(position==='inside')g.clip(path);
	if(position==='outside'&&(s.type!=='path'||s.closed)){
		const b=bbox(s),pad=Math.max(100000,b.w*10,b.h*10),outside=new Path2D();outside.rect(b.x-pad,b.y-pad,b.w+pad*2,b.h+pad*2);outside.addPath(path);g.clip(outside,'evenodd');
	}
	g.stroke(path);g.restore();
	g.save();g.globalAlpha=op*(p.opacity??100)/100;g.strokeStyle=paintStyle(g,s,p);drawArrow(g,s,p,'start');drawArrow(g,s,p,'end');g.restore();
}
function body(g,s,op){
	if(s.type==='image'){
		const img=imageFor(s.src);if(img&&img.complete&&img.naturalWidth){g.globalAlpha=op;g.drawImage(img,s.x,s.y,s.w,s.h);}return;
	}
	if(s.type==='text'){
		g.font=fontCss(s);g.textBaseline='top';
		getPaintLayers(s,'fill').filter(p=>p.visible!==false).forEach(p=>{
			g.globalAlpha=op*(p.opacity??100)/100;g.fillStyle=paintStyle(g,s,p);
			(s._lines||[displayText(s)]).forEach((line,i)=>drawTextRow(g,s,line,i,s._lineWidths&&s._lineWidths[i]||textWidth(s,line,g)));
		});
		getPaintLayers(s,'stroke').filter(p=>p.visible!==false).forEach(p=>{
			const weight=Math.max(.1,+p.weight||1);g.globalAlpha=op*(p.opacity??100)/100;g.strokeStyle=paintStyle(g,s,p);g.lineWidth=weight;g.lineJoin=p.join||'round';g.lineCap=p.cap||'butt';g.setLineDash(({solid:[],dash:[weight*4,weight*2],dot:[weight,weight*2],dashDot:[weight*4,weight*2,weight,weight*2]})[p.dash]||[]);
			(s._lines||[displayText(s)]).forEach((line,i)=>drawTextStrokeRow(g,s,line,i,s._lineWidths&&s._lineWidths[i]||textWidth(s,line,g)));
		});
		return;
	}
	const path=new Path2D();trace(path,s);
	if(s.type!=='path'||s.pts.length>2)getPaintLayers(s,'fill').filter(p=>p.visible!==false).forEach(p=>{g.globalAlpha=op*(p.opacity??100)/100;g.fillStyle=paintStyle(g,s,p);g.fill(path);});
	getPaintLayers(s,'stroke').filter(p=>p.visible!==false).forEach(p=>drawStroke(g,s,p,op));
}
let textEffectBuffers=null;
function textEffectCanvases(g){
	const w=g.canvas.width,h=g.canvas.height;
	if(!textEffectBuffers||textEffectBuffers.w!==w||textEffectBuffers.h!==h){
		const mask=document.createElement('canvas'),work=document.createElement('canvas');
		mask.width=work.width=w;mask.height=work.height=h;
		textEffectBuffers={mask,work,w,h};
	}
	return textEffectBuffers;
}
function drawTextMask(g,s,mask){
	const m=mask.getContext('2d');m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,mask.width,mask.height);
	const t=g.getTransform();m.setTransform(t.a,t.b,t.c,t.d,t.e,t.f);m.font=fontCss(s);m.textBaseline='top';m.fillStyle='#fff';
	const rows=s._lines||[displayText(s)],hasFill=getPaintLayers(s,'fill').some(p=>p.visible!==false);
	if(hasFill)rows.forEach((line,i)=>{
		drawTextRow(m,s,line,i,s._lineWidths&&s._lineWidths[i]||textWidth(s,line,m));
	});
	const strokes=getPaintLayers(s,'stroke').filter(p=>p.visible!==false);
	if(strokes.length){
		const width=Math.max(...strokes.map(p=>Math.max(.1,+p.weight||1)));m.lineWidth=width;m.lineJoin='round';m.lineCap='round';
		rows.forEach((line,i)=>drawTextStrokeRow(m,s,line,i,s._lineWidths&&s._lineWidths[i]||textWidth(s,line,m)));
	}
}
function drawTextBackgroundBlur(g,s,e,k){
	const {mask,work}=textEffectCanvases(g);drawTextMask(g,s,mask);
	const wctx=work.getContext('2d');wctx.setTransform(1,0,0,1,0,0);wctx.clearRect(0,0,work.width,work.height);
	wctx.filter=`blur(${e.b*k}px)`;wctx.drawImage(g.canvas,0,0);wctx.filter='none';
	wctx.globalCompositeOperation='destination-in';wctx.drawImage(mask,0,0);wctx.globalCompositeOperation='source-over';
	g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=(s.op??100)/100;g.drawImage(work,0,0);g.restore();
}
function drawTextInnerShadow(g,s,e,k){
	const {mask,work}=textEffectCanvases(g);drawTextMask(g,s,mask);
	const wctx=work.getContext('2d');wctx.setTransform(1,0,0,1,0,0);wctx.clearRect(0,0,work.width,work.height);
	wctx.shadowColor=rgba(e.c,e.o);wctx.shadowBlur=(e.b||0)*k;wctx.shadowOffsetX=(e.x||0)*k;wctx.shadowOffsetY=(e.y||0)*k;wctx.drawImage(mask,0,0);
	wctx.shadowColor='transparent';wctx.shadowBlur=0;wctx.shadowOffsetX=0;wctx.shadowOffsetY=0;
	wctx.globalCompositeOperation='destination-out';wctx.drawImage(mask,0,0);
	wctx.globalCompositeOperation='destination-in';wctx.drawImage(mask,0,0);wctx.globalCompositeOperation='source-over';
	g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=(s.op??100)/100;g.drawImage(work,0,0);g.restore();
}
function paint(g,s){
	if(frameEffectivelyHidden(s))return;
	const pv=pvt(s),op=(s.op??100)/100,th=(s.rot||0)*Math.PI/180,fx=(s.fx||[]).filter(e=>e.on!==false&&EFX[e.t]);
	g.save();g.translate(pv[0],pv[1]);g.rotate(th);g.scale(s.flipX?-1:1,s.flipY?-1:1);g.translate(-pv[0],-pv[1]);
	const m=g.getTransform(),k=Math.hypot(m.a,m.b)||1;g.globalCompositeOperation=s.bm&&s.bm!=='normal'?s.bm:'source-over';
	fx.filter(e=>e.t==='background_blur'&&s.type!=='image').forEach(e=>{
		if(s.type==='text'){drawTextBackgroundBlur(g,s,e,k);return;}
		g.save();trace(g,s);g.clip();g.setTransform(1,0,0,1,0,0);g.filter=`blur(${e.b*k}px)`;g.drawImage(g.canvas,0,0);g.restore();
	});
	fx.filter(e=>e.t==='drop_shadow'||e.t==='glow').forEach(e=>{
		const OFF=20000;g.save();g.translate(-OFF/k*Math.cos(th),OFF/k*Math.sin(th));g.shadowColor=rgba(e.c,e.o);g.shadowBlur=(e.b||0)*k;
		g.shadowOffsetX=OFF+(e.x||0)*k;g.shadowOffsetY=(e.y||0)*k;body(g,s,op);g.restore();
	});
	const flt=fx.filter(e=>FLT[e.t]).map(e=>FLT[e.t](e.t==='layer_blur'?e.b:e.v,k)).join(' ');if(flt)g.filter=flt;body(g,s,op);g.filter='none';
	fx.filter(e=>e.t==='inner_shadow'&&s.type!=='image').forEach(e=>{
		if(s.type==='text'){drawTextInnerShadow(g,s,e,k);return;}
		const b=bbox(s);g.save();trace(g,s);g.clip();trace(g,s);g.rect(b.x-5000,b.y-5000,b.w+10000,b.h+10000);
		g.shadowColor=rgba(e.c,e.o);g.shadowBlur=(e.b||0)*k;g.shadowOffsetX=(e.x||0)*k;g.shadowOffsetY=(e.y||0)*k;g.globalAlpha=op;g.fillStyle='#000';g.fill('evenodd');g.restore();
	});
	g.restore();
}
function withFrameClip(g,frame,render){
	const matrix=g.getTransform(),pv=pvt(frame);
	g.save();g.translate(pv[0],pv[1]);g.rotate((frame.rot||0)*Math.PI/180);g.scale(frame.flipX?-1:1,frame.flipY?-1:1);g.translate(-pv[0],-pv[1]);
	trace(g,frame);g.clip();g.setTransform(matrix);render();g.restore();
}
function paintHierarchy(g,parent=null,include=()=>true){
	S.filter(s=>frameParentOf(s)===parent).forEach(s=>{
		if(include(s)&&(!editingText||s!==editingText.layer))paint(g,s);
		const children=()=>paintHierarchy(g,s,include);
		if(s.type==='frame'&&s.clipContent!==false)withFrameClip(g,s,children);
		else if(s.type==='frame')children();
	});
}
function frameClipContains(frame,x,y){
	const path=new Path2D();trace(path,frame);const point=rp(frame,x,y,-1);
	ctx.save();ctx.setTransform(1,0,0,1,0,0);const visible=ctx.isPointInPath(path,point[0],point[1]);ctx.restore();
	return visible;
}
function pointVisibleThroughClips(s,x,y){
	let parent=frameParentOf(s),seen=new Set();
	while(parent&&!seen.has(parent.id)){
		if(parent.clipContent!==false&&!frameClipContains(parent,x,y))return false;
		seen.add(parent.id);parent=frameParentOf(parent);
	}
	return true;
}
const RULER=22,MINIMAP={w:176,h:116,pad:12};
const VIEW_KEY='minifigma.view';
let showMini=true,showRuler=true,miniMapLayout=null;
function loadNavigationView(){
	try{
		const value=JSON.parse(localStorage.getItem(VIEW_KEY)||'{}');
		showMini=value.minimap!==false;showRuler=value.ruler!==false;
	}catch(e){showMini=true;showRuler=true;note('Preferensi tampilan tidak dapat dibaca: '+e.message);}
}
function setNavigationView(key,value){
	if(key==='minimap')showMini=!!value;else if(key==='ruler')showRuler=!!value;
	miniMapLayout=null;
	try{localStorage.setItem(VIEW_KEY,JSON.stringify({minimap:showMini,ruler:showRuler}));}
	catch(e){note('Preferensi tampilan tidak dapat disimpan: '+e.message);}
	draw();
}
function navigationView(key){return key==='minimap'?showMini:showRuler;}
const viewInset=()=>showRuler?RULER:0;
function worldBounds(items){
	if(!items.length)return null;
	const points=[];
	items.forEach(s=>{const b=bbox(s);[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].forEach(p=>points.push(rp(s,p[0],p[1])));});
	const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1]));
	return {x,y,w:Math.max(1,Math.max(...points.map(p=>p[0]))-x),h:Math.max(1,Math.max(...points.map(p=>p[1]))-y)};
}
function zoomToBounds(b){
	if(!cv)return;
	const W=cv.width/dpr,H=cv.height/dpr,I=viewInset(),availW=Math.max(1,W-I-48),availH=Math.max(1,H-I-48);
	if(!b){V.z=1;V.x=(W+I)/2;V.y=(H+I)/2;draw();return;}
	V.z=Math.min(32,Math.max(.05,Math.min(availW/b.w,availH/b.h)));
	V.x=(W+I)/2-(b.x+b.w/2)*V.z;V.y=(H+I)/2-(b.y+b.h/2)*V.z;draw();
}
function zoomToFit(){zoomToBounds(worldBounds(S.filter(s=>!frameEffectivelyHidden(s))));}
function zoomToSelection(){
	const items=selAll();if(!items.length){zoomToFit();return;}
	const points=[];items.forEach(s=>{const b=bbox(s);[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].forEach(p=>points.push(rp(s,p[0],p[1])));});
	const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1]));
	zoomToBounds({x,y,w:Math.max(1,Math.max(...points.map(p=>p[0]))-x),h:Math.max(1,Math.max(...points.map(p=>p[1]))-y)});
}
function rulerStep(){
	const raw=48/V.z,pow=Math.pow(10,Math.floor(Math.log10(Math.max(raw,.0001))));
	return [1,2,5,10].map(n=>n*pow).find(n=>n>=raw)||10*pow;
}
function miniMapMetrics(W,H){
	const w=Math.min(MINIMAP.w,Math.max(100,W-2*MINIMAP.pad)),h=Math.min(MINIMAP.h,Math.max(72,H-2*MINIMAP.pad)),x=W-w-MINIMAP.pad,y=H-h-MINIMAP.pad;
	const I=viewInset(),viewA=s2w(I,I),viewB=s2w(W,H),view={x:viewA[0],y:viewA[1],w:viewB[0]-viewA[0],h:viewB[1]-viewA[1]};
	const all=worldBounds(S.filter(s=>!frameEffectivelyHidden(s)))||{x:view.x,y:view.y,w:view.w,h:view.h};
	const bounds={x:Math.min(all.x,view.x),y:Math.min(all.y,view.y),w:Math.max(all.x+all.w,view.x+view.w)-Math.min(all.x,view.x),h:Math.max(all.y+all.h,view.y+view.h)-Math.min(all.y,view.y)};
	const pad=8,scale=Math.min((w-pad*2)/Math.max(bounds.w,1),(h-pad*2)/Math.max(bounds.h,1));
	return {x,y,w,h,pad,scale,bounds,view,px:wx=>(x+pad)+(wx-bounds.x)*scale,py:wy=>(y+pad)+(wy-bounds.y)*scale,wx:px=>(px-x-pad)/scale+bounds.x,wy:py=>(py-y-pad)/scale+bounds.y};
}
function drawNavigationOverlay(g){
	const W=cv.width/dpr,H=cv.height/dpr;
	if(showRuler){
		const step=rulerStep();
		g.save();g.fillStyle='#292929';g.fillRect(RULER,0,W-RULER,RULER);g.fillRect(0,RULER,RULER,H-RULER);g.fillStyle='#353535';g.fillRect(0,0,RULER,RULER);
		g.strokeStyle='#555';g.lineWidth=1;g.beginPath();g.moveTo(RULER,RULER);g.lineTo(W,RULER);g.moveTo(RULER,RULER);g.lineTo(RULER,H);g.stroke();
		g.font='9px '+FF;g.fillStyle='#aaa';g.textBaseline='top';
		const x0=s2w(RULER,0)[0],x1=s2w(W,0)[0],firstX=Math.ceil(x0/step)*step;
		for(let v=firstX;v<=x1;v+=step){const x=w2s(v,0)[0];g.strokeStyle='#777';g.beginPath();g.moveTo(x,RULER);g.lineTo(x,RULER-6);g.stroke();g.fillText(String(Math.round(v)),x+2,2);}
		const y0=s2w(0,RULER)[1],y1=s2w(0,H)[1],firstY=Math.ceil(y0/step)*step;
		for(let v=firstY;v<=y1;v+=step){const y=w2s(0,v)[1];g.strokeStyle='#777';g.beginPath();g.moveTo(RULER,y);g.lineTo(RULER-6,y);g.stroke();g.save();g.translate(2,y-2);g.rotate(-Math.PI/2);g.fillText(String(Math.round(v)),0,0);g.restore();}
		g.save();g.beginPath();g.rect(RULER,RULER,W-RULER,H-RULER);g.clip();g.strokeStyle='rgba(13,153,255,.75)';g.lineWidth=1;
		guides.forEach(guide=>{g.beginPath();if(guide.v==='x'){const x=w2s(guide.t,0)[0];g.moveTo(x,RULER);g.lineTo(x,H);}else{const y=w2s(0,guide.t)[1];g.moveTo(RULER,y);g.lineTo(W,y);}g.stroke();});
		g.restore();g.restore();
	}
	if(showMini){
		const m=miniMapMetrics(W,H);miniMapLayout=m;g.fillStyle='rgba(30,30,30,.92)';g.strokeStyle='#111';g.lineWidth=1;g.beginPath();g.roundRect(m.x,m.y,m.w,m.h,6);g.fill();g.stroke();
		g.save();g.beginPath();g.rect(m.x+m.pad,m.y+m.pad,m.w-m.pad*2,m.h-m.pad*2);g.clip();
		S.filter(s=>!frameEffectivelyHidden(s)).forEach(s=>{
			const b=bbox(s),pts=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>rp(s,p[0],p[1]));
			g.beginPath();pts.forEach((p,i)=>g[i?'lineTo':'moveTo'](m.px(p[0]),m.py(p[1])));g.closePath();
			g.fillStyle=s.type==='frame'?'rgba(255,255,255,.08)':'rgba(190,190,190,.65)';g.fill();g.strokeStyle='rgba(210,210,210,.6)';g.lineWidth=1;g.stroke();
		});
		const vx=m.px(m.view.x),vy=m.py(m.view.y),vw=m.view.w*m.scale,vh=m.view.h*m.scale;
		g.fillStyle='rgba(13,153,255,.15)';g.strokeStyle='#0d99ff';g.lineWidth=1.5;g.fillRect(vx,vy,vw,vh);g.strokeRect(vx,vy,vw,vh);g.restore();
		g.restore();
	}else miniMapLayout=null;
}
function beginGuideDrag(c,axis,index=-1){
	const guide=index>=0?guides[index]:{v:axis,t:axis==='x'?c.wx:c.wy};
	if(index<0)guides.push(guide);
	drag={k:'guide',guide,index,created:index<0};cv.style.cursor=axis==='x'?'col-resize':'row-resize';return true;
}
function navigationPointerDown(c,e){
	const W=cv.width/dpr,H=cv.height/dpr,m=miniMapLayout;
	if(showMini&&m&&c.sx>=m.x&&c.sx<=m.x+m.w&&c.sy>=m.y&&c.sy<=m.y+m.h){
		const vx=m.px(m.view.x),vy=m.py(m.view.y),vw=m.view.w*m.scale,vh=m.view.h*m.scale;
		const inside=c.sx>=vx&&c.sx<=vx+vw&&c.sy>=vy&&c.sy<=vy+vh;
		if(inside)drag={k:'minimap',sx:c.sx,sy:c.sy,vx:V.x,vy:V.y};
		else{const I=viewInset();V.x=(W+I)/2-m.wx(c.sx)*V.z;V.y=(H+I)/2-m.wy(c.sy)*V.z;draw();}
		return true;
	}
	if(showRuler&&c.sy<=RULER&&c.sx>RULER&&c.sx<W)return beginGuideDrag(c,'x');
	if(showRuler&&c.sx<=RULER&&c.sy>RULER&&c.sy<H)return beginGuideDrag(c,'y');
	let best=-1,distance=6,axis=null;
	if(showRuler)guides.forEach((guide,i)=>{const d=Math.abs((guide.v==='x'?w2s(guide.t,0)[0]-c.sx:w2s(0,guide.t)[1]-c.sy));if(d<distance){best=i;distance=d;axis=guide.v;}});
	if(best>=0)return beginGuideDrag(c,axis,best);
	return false;
}
function updateDraggedGuide(c){
	const guide=drag.guide,axis=guide.v,raw=axis==='x'?c.wx:c.wy;
	guide.t=chk('#mg')?Math.round(raw/gs())*gs():raw;
}
MF.move.guide=(e,c)=>updateDraggedGuide(c);
MF.up.guide=(e,c)=>{
	const W=cv.width/dpr,H=cv.height/dpr,inside=drag.guide.v==='x'?c.sy>=RULER&&c.sy<=H:c.sx>=RULER&&c.sx<=W;
	if(!inside)guides=guides.filter(item=>item!==drag.guide);
};
MF.move.minimap=(e,c)=>{V.x=drag.vx+c.sx-drag.sx;V.y=drag.vy+c.sy-drag.sy;};
MF.move.hand=(e,c)=>{V.x=drag.vx+c.sx-drag.sx;V.y=drag.vy+c.sy-drag.sy;};
MF.move.pan=(e,c)=>{V.x=drag.vx+c.sx-drag.sx;V.y=drag.vy+c.sy-drag.sy;};
MF.init.push(function initCanvasNavigation(){
	MF.overlay.push(drawNavigationOverlay);
	MF.down.push({p:5,fn(e,c){return navigationPointerDown(c,e);}});
	MF.keys.push((e,k)=>{
		if(e.ctrlKey||e.metaKey||e.altKey)return false;
		if(e.shiftKey&&e.code==='Digit1'){e.preventDefault();zoomToFit();return true;}
		if(e.shiftKey&&e.code==='Digit2'){e.preventDefault();zoomToSelection();return true;}
		return false;
	});
});
function imageFor(src){
	if(!src)return null;
	if(!imageCache.has(src)){const img=new Image();img.onload=draw;img.onerror=draw;img.src=src;imageCache.set(src,img);}
	return imageCache.get(src);
}
function draw(){
	if(!ctx||!cv)return;
	const W=cv.width/dpr,H=cv.height/dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#1e1e1e';ctx.fillRect(0,0,W,H);
	if(chk('#cg')&&V.z>=8){
		const st=gs()*V.z;ctx.beginPath();for(let x=((V.x%st)+st)%st;x<W;x+=st){ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let y=((V.y%st)+st)%st;y<H;y+=st){ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.stroke();
	}
	ctx.save();ctx.translate(V.x,V.y);ctx.scale(V.z,V.z);paintHierarchy(ctx);ctx.restore();
	ctx.font='11px '+FF;ctx.fillStyle='#9a9a9a';ctx.textBaseline='bottom';S.forEach(s=>{if(s.type==='frame'&&!frameEffectivelyHidden(s)){const q=w2s(s.x,s.y);ctx.fillText(s.name,q[0],q[1]-4);}});
	ctx.strokeStyle='#f24822';ctx.lineWidth=1;G.forEach(g=>{ctx.beginPath();if(g.v==='x'){const q=w2s(g.t,0)[0];ctx.moveTo(q,0);ctx.lineTo(q,H);}else{const q=w2s(0,g.t)[1];ctx.moveTo(0,q);ctx.lineTo(W,q);}ctx.stroke();});
	ctx.strokeStyle='#0d99ff';
	if(draft&&draft.pts.length){
		const l=draft.pts[draft.pts.length-1],a=w2s(l.x,l.y);ctx.strokeStyle='#0d99ff';ctx.beginPath();ctx.moveTo(a[0],a[1]);
		if(hasH(l.ho)){const c1=w2s(l.x+l.ho.x,l.y+l.ho.y);ctx.bezierCurveTo(c1[0],c1[1],mouse.x,mouse.y,mouse.x,mouse.y);}else ctx.lineTo(mouse.x,mouse.y);ctx.stroke();
	}
	MF.overlay.forEach(fn=>fn(ctx));$('#zreset').text(Math.round(V.z*100)+'%');
	if(typeof positionTextEditor==='function')positionTextEditor();
}
function snapRect(b,ex){
	G=[];const X=[],Y=[],r=[0,0];if(chk('#mo'))S.forEach(s=>{if(ex.includes(s))return;const o=bbox(s);X.push(o.x,o.x+o.w/2,o.x+o.w);Y.push(o.y,o.y+o.h/2,o.y+o.h);});
	const gr=chk('#mg'),g=gs(),th=8/V.z;
	if(gr)guides.forEach(guide=>(guide.v==='x'?X:Y).push(guide.t));
	[['x',[b.x,b.x+b.w/2,b.x+b.w],X],['y',[b.y,b.y+b.h/2,b.y+b.h],Y]].forEach(([a,vs,T],i)=>{
		let best=null;vs.forEach(v=>{T.forEach(t=>{const d=t-v;if(Math.abs(d)<th&&(!best||Math.abs(d)<Math.abs(best.d)))best={d,t};});if(gr){const t=Math.round(v/g)*g,d=t-v;if(Math.abs(d)<th&&(!best||Math.abs(d)<Math.abs(best.d)))best={d,t,gr:1};}});
		if(best){r[i]=best.d;if(!best.gr)G.push({v:a,t:best.t});}
	});return r;
}
function snapPt(x,y,ex){const r=snapRect({x,y,w:0,h:0},ex||[]);return [x+r[0],y+r[1]];}
function segDist(px,py,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;let t=l?((px-a.x)*dx+(py-a.y)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(a.x+t*dx),py-(a.y+t*dy));}
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)if((P[i].y>y)!==(P[j].y>y)&&x<(P[j].x-P[i].x)*(y-P[i].y)/(P[j].y-P[i].y)+P[i].x)c=!c;return c;}
function hit(s,x,y,allowSelectedClipped=false){
	if(frameEffectivelyHidden(s)||frameEffectivelyLocked(s)||
		(!pointVisibleThroughClips(s,x,y)&&!(allowSelectedClipped&&selAll().includes(s))))return false;[x,y]=rp(s,x,y,-1);
	if(s.type==='ellipse'){const rx=s.w/2||1,ry=s.h/2||1;return ((x-s.x-rx)/rx)**2+((y-s.y-ry)/ry)**2<=1;}
	if(s.type==='polygon'||s.type==='star')return inPoly(x,y,geo(s));
	if(s.type!=='path')return x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h;
	const Q=flat(s),n=Q.length,sw=getPaintLayers(s,'stroke').reduce((m,p)=>Math.max(m,+p.weight||0),s.sw||0),t=6/V.z+sw/2;for(let i=0;i<n-1;i++)if(segDist(x,y,Q[i],Q[i+1])<t)return true;
	return s.closed&&n>2&&s.fillOn&&inPoly(x,y,Q);
}
function boxHitVisible(s,Rc){
	if(!boxHit(s,Rc))return false;
	let parent=frameParentOf(s),clipped=false;
	while(parent){if(parent.clipContent!==false){clipped=true;break;}parent=frameParentOf(parent);}
	if(!clipped)return true;
	const b=bbox(s),corners=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>rp(s,p[0],p[1]));
	const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),x0=Math.max(Rc.x,Math.min(...xs)),x1=Math.min(Rc.x+Rc.w,Math.max(...xs)),y0=Math.max(Rc.y,Math.min(...ys)),y1=Math.min(Rc.y+Rc.h,Math.max(...ys));
	for(let iy=0;iy<=6;iy++)for(let ix=0;ix<=6;ix++){
		const x=x0+(x1-x0)*ix/6,y=y0+(y1-y0)*iy/6;
		if(hit(s,x,y))return true;
	}
	return corners.some(p=>p[0]>=Rc.x&&p[0]<=Rc.x+Rc.w&&p[1]>=Rc.y&&p[1]<=Rc.y+Rc.h&&hit(s,p[0],p[1]));
}
function fit(){
	if(!cv)return;const r=$('#wrap')[0].getBoundingClientRect();dpr=window.devicePixelRatio||1;cv.width=r.width*dpr;cv.height=r.height*dpr;cv.style.width=r.width+'px';cv.style.height=r.height+'px';draw();
}
function zoomBy(f){const W=cv.width/dpr,H=cv.height/dpr,I=viewInset(),w=(W+I)/2,h=(H+I)/2,[wx,wy]=s2w(w,h);V.z=Math.min(32,Math.max(.05,V.z*f));V.x=w-wx*V.z;V.y=h-wy*V.z;draw();}
function mouseContext(e){const r=cv.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top,[wx,wy]=s2w(sx,sy);return {sx,sy,wx,wy,rect:r};}
function dispatchDown(e){
	if(typeof clearHover==='function')clearHover();
	if(e.button===2)return;
	const c={...mouseContext(e),e};mouse={x:c.sx,y:c.sy};
	for(const h of [...MF.down].sort((a,b)=>a.p-b.p))if(h.fn(e,c)===true)return;
}
function dispatchMove(e){
	if(!cv)return;const c={...mouseContext(e),e};mouse={x:c.sx,y:c.sy};
	if(drag&&MF.move[drag.k])MF.move[drag.k](e,c);else if(!drag&&MF.move.idle)MF.move.idle(e,c);
	if(drag||draft)draw();
}
function dispatchUp(e){
	if(!drag)return;const c={...mouseContext(e),e},k=drag.k;if(MF.up[k])MF.up[k](e,c);
	drag=null;G=[];if(tool==='hand')cv.style.cursor='grab';refresh();if(k!=='textCreate')save();
}
MF.init.push(function initCanvas(){
	cv=$('#cv')[0];ctx=cv.getContext('2d');
	loadNavigationView();
	$(cv).on('mousedown',dispatchDown);$(window).on('mousemove',dispatchMove).on('mouseup',dispatchUp).on('resize',fit);
	$(cv).on('mouseleave',()=>{if(typeof clearHover==='function')clearHover();});
	$(window).on('keydown keyup',e=>{if((e.key==='Control'||e.key==='Meta')&&!drag)refreshHoverAtPointer(e);});
	$('#wrap').on('wheel',e=>{
		e.preventDefault();const o=e.originalEvent,r=cv.getBoundingClientRect(),sx=o.clientX-r.left,sy=o.clientY-r.top;
		if(o.ctrlKey||o.metaKey){const [wx,wy]=s2w(sx,sy);V.z=Math.min(32,Math.max(.05,V.z*(o.deltaY<0?1.1:1/1.1)));V.x=sx-wx*V.z;V.y=sy-wy*V.z;}else{V.x-=o.deltaX;V.y-=o.deltaY;}draw();
	});
	$('#zin').on('click',()=>zoomBy(1.25));$('#zout').on('click',()=>zoomBy(.8));$('#zreset').on('click',()=>{V={x:200, y:120,z:1};draw();});$('#cg,#mg,#mo').on('change',()=>{draw();save();});
	MF.down.push({p:10,fn(e,c){if(e.button===1||space||tool==='hand'){drag={k:tool==='hand'?'hand':'pan',sx:c.sx,sy:c.sy,vx:V.x,vy:V.y};if(tool==='hand')cv.style.cursor='grabbing';return true;}return false;}});
	MF.move.idle=(e,c)=>{
		updateCanvasHover(e,c);
		if(typeof updateFrameHover==='function'&&updateFrameHover(c))return;
		if(c.sx>=0&&c.sy>=0&&c.sx<=c.rect.width&&c.sy<=c.rect.height&&typeof hoverCursor==='function')hoverCursor(c.sx,c.sy);
	};
	fit();
});
