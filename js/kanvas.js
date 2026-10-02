/* [6.1] Kanvas. Isi: gambar objek, magnet, hit-test, dispatcher mouse. Bukan di sini: panel, alat, transformasi. */
const gs=()=>{if(V.z>=8)return 1;let s=10;while(s*V.z<10)s*=2;return s;};
function trace(g,s){
	g.beginPath();
	if(s.type==='rect'||s.type==='frame'){
		const cap=Math.min(s.w/2,s.h/2),r=s.radii||[s.r,s.r,s.r,s.r];g.roundRect(s.x,s.y,s.w,s.h,r.map(v=>Math.max(0,Math.min(v||0,cap))));
	}else if(s.type==='ellipse')g.ellipse(s.x+s.w/2,s.y+s.h/2,Math.abs(s.w/2),Math.abs(s.h/2),0,0,Math.PI*2);
	else{const P=s.type==='path'?s.pts:geo(s),cl=s.type!=='path'||s.closed;P.forEach((p,i)=>i?seg(g,P[i-1],p):g.moveTo(p.x,p.y));if(cl){if(s.type==='path'&&P.length>2)seg(g,P[P.length-1],P[0]);g.closePath();}}
}
function body(g,s,op){
	if(s.type==='image'){
		const img=imageFor(s.src);if(img&&img.complete&&img.naturalWidth){g.globalAlpha=op;g.drawImage(img,s.x,s.y,s.w,s.h);}return;
	}
	if(s.type==='text'){
		if(s.fillOn&&s.fv!==false){
			g.globalAlpha=op*(s.fo??100)/100;g.font=fontCss(s);g.textBaseline='top';g.fillStyle=s.fill;g.textAlign=s.textAlign||'left';
			const rows=s._lines||[s.text],lh=s.fs*(s.lineHeight||125)/100,native='letterSpacing' in g,old=native?g.letterSpacing:'';
			if(native)g.letterSpacing=(s.letterSpacing||0)+'px';
			rows.forEach((line,i)=>{
				const x=s.textAlign==='center'?s.x+s.w/2:s.textAlign==='right'?s.x+s.w:s.x,y=s.y+i*lh;
				if(native||!s.letterSpacing)g.fillText(line,x,y);
				else{
					const chars=Array.from(line),widths=chars.map(c=>g.measureText(c).width),total=widths.reduce((a,b)=>a+b,0)+(chars.length-1)*s.letterSpacing;
					let cursor=x-(s.textAlign==='center'?total/2:s.textAlign==='right'?total:0);chars.forEach((c,j)=>{g.fillText(c,cursor,y);cursor+=widths[j]+s.letterSpacing;});
				}
				if(s.underline&&line){
					const width=s._lineWidths&&s._lineWidths[i]||textWidth(s,line,g),start=x-(s.textAlign==='center'?width/2:s.textAlign==='right'?width:0);
					g.beginPath();g.moveTo(start,y+s.fs*1.08);g.lineTo(start+width,y+s.fs*1.08);g.lineWidth=Math.max(1,s.fs/16);g.strokeStyle=s.fill;g.stroke();
				}
			});
			if(native)g.letterSpacing=old;
		}
		return;
	}
	trace(g,s);
	if(s.fillOn&&s.fv!==false&&(s.type!=='path'||s.pts.length>2)){g.globalAlpha=op*(s.fo??100)/100;g.fillStyle=s.fill;g.fill();}
	if(s.sw>0&&s.sv!==false){g.globalAlpha=op*(s.so??100)/100;g.strokeStyle=s.stroke;g.lineWidth=s.sw;g.lineJoin='round';g.stroke();}
}
function paint(g,s){
	if(s.hid)return;
	const pv=pvt(s),op=(s.op??100)/100,th=(s.rot||0)*Math.PI/180,fx=(s.fx||[]).filter(e=>e.on!==false&&EFX[e.t]);
	g.save();g.translate(pv[0],pv[1]);g.rotate(th);g.scale(s.flipX?-1:1,s.flipY?-1:1);g.translate(-pv[0],-pv[1]);
	const m=g.getTransform(),k=Math.hypot(m.a,m.b)||1;g.globalCompositeOperation=s.bm&&s.bm!=='normal'?s.bm:'source-over';
	fx.filter(e=>e.t==='background_blur'&&s.type!=='text'&&s.type!=='image').forEach(e=>{g.save();trace(g,s);g.clip();g.setTransform(1,0,0,1,0,0);g.filter=`blur(${e.b*k}px)`;g.drawImage(g.canvas,0,0);g.restore();});
	fx.filter(e=>e.t==='drop_shadow'||e.t==='glow').forEach(e=>{
		const OFF=20000;g.save();g.translate(-OFF/k*Math.cos(th),OFF/k*Math.sin(th));g.shadowColor=rgba(e.c,e.o);g.shadowBlur=(e.b||0)*k;
		g.shadowOffsetX=OFF+(e.x||0)*k;g.shadowOffsetY=(e.y||0)*k;body(g,s,op);g.restore();
	});
	const flt=fx.filter(e=>FLT[e.t]).map(e=>FLT[e.t](e.t==='layer_blur'?e.b:e.v,k)).join(' ');if(flt)g.filter=flt;body(g,s,op);g.filter='none';
	if(s.type!=='text'&&s.type!=='image')fx.filter(e=>e.t==='inner_shadow').forEach(e=>{
		const b=bbox(s);g.save();trace(g,s);g.clip();trace(g,s);g.rect(b.x-5000,b.y-5000,b.w+10000,b.h+10000);
		g.shadowColor=rgba(e.c,e.o);g.shadowBlur=(e.b||0)*k;g.shadowOffsetX=(e.x||0)*k;g.shadowOffsetY=(e.y||0)*k;g.globalAlpha=op;g.fillStyle='#000';g.fill('evenodd');g.restore();
	});
	g.restore();
}
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
	ctx.save();ctx.translate(V.x,V.y);ctx.scale(V.z,V.z);S.forEach(s=>{if(!editingText||s!==editingText.layer)paint(ctx,s);});ctx.restore();
	ctx.font='11px '+FF;ctx.fillStyle='#9a9a9a';ctx.textBaseline='bottom';S.forEach(s=>{if(s.type==='frame'){const q=w2s(s.x,s.y);ctx.fillText(s.name,q[0],q[1]-4);}});
	ctx.strokeStyle='#f24822';ctx.lineWidth=1;G.forEach(g=>{ctx.beginPath();if(g.v==='x'){const q=w2s(g.t,0)[0];ctx.moveTo(q,0);ctx.lineTo(q,H);}else{const q=w2s(0,g.t)[1];ctx.moveTo(0,q);ctx.lineTo(W,q);}ctx.stroke();});
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
	[['x',[b.x,b.x+b.w/2,b.x+b.w],X],['y',[b.y,b.y+b.h/2,b.y+b.h],Y]].forEach(([a,vs,T],i)=>{
		let best=null;vs.forEach(v=>{T.forEach(t=>{const d=t-v;if(Math.abs(d)<th&&(!best||Math.abs(d)<Math.abs(best.d)))best={d,t};});if(gr){const t=Math.round(v/g)*g,d=t-v;if(Math.abs(d)<th&&(!best||Math.abs(d)<Math.abs(best.d)))best={d,t,gr:1};}});
		if(best){r[i]=best.d;if(!best.gr)G.push({v:a,t:best.t});}
	});return r;
}
function snapPt(x,y,ex){const r=snapRect({x,y,w:0,h:0},ex||[]);return [x+r[0],y+r[1]];}
function segDist(px,py,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;let t=l?((px-a.x)*dx+(py-a.y)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(a.x+t*dx),py-(a.y+t*dy));}
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++)if((P[i].y>y)!==(P[j].y>y)&&x<(P[j].x-P[i].x)*(y-P[i].y)/(P[j].y-P[i].y)+P[i].x)c=!c;return c;}
function hit(s,x,y){
	if(s.hid||s.lock)return false;[x,y]=rp(s,x,y,-1);
	if(s.type==='ellipse'){const rx=s.w/2||1,ry=s.h/2||1;return ((x-s.x-rx)/rx)**2+((y-s.y-ry)/ry)**2<=1;}
	if(s.type==='polygon'||s.type==='star')return inPoly(x,y,geo(s));
	if(s.type!=='path')return x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h;
	const Q=flat(s),n=Q.length,t=6/V.z+s.sw/2;for(let i=0;i<n-1;i++)if(segDist(x,y,Q[i],Q[i+1])<t)return true;
	return s.closed&&n>2&&s.fillOn&&inPoly(x,y,Q);
}
function fit(){
	if(!cv)return;const r=$('#wrap')[0].getBoundingClientRect();dpr=window.devicePixelRatio||1;cv.width=r.width*dpr;cv.height=r.height*dpr;cv.style.width=r.width+'px';cv.style.height=r.height+'px';draw();
}
function zoomBy(f){const w=cv.width/dpr/2,h=cv.height/dpr/2,[wx,wy]=s2w(w,h);V.z=Math.min(32,Math.max(.05,V.z*f));V.x=w-wx*V.z;V.y=h-wy*V.z;draw();}
function mouseContext(e){const r=cv.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top,[wx,wy]=s2w(sx,sy);return {sx,sy,wx,wy,rect:r};}
function dispatchDown(e){
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
	drag=null;G=[];refresh();save();
}
MF.init.push(function initCanvas(){
	cv=$('#cv')[0];ctx=cv.getContext('2d');
	$(cv).on('mousedown',dispatchDown);$(window).on('mousemove',dispatchMove).on('mouseup',dispatchUp).on('resize',fit);
	$('#wrap').on('wheel',e=>{
		e.preventDefault();const o=e.originalEvent,r=cv.getBoundingClientRect(),sx=o.clientX-r.left,sy=o.clientY-r.top;
		if(o.ctrlKey||o.metaKey){const [wx,wy]=s2w(sx,sy);V.z=Math.min(32,Math.max(.05,V.z*(o.deltaY<0?1.1:1/1.1)));V.x=sx-wx*V.z;V.y=sy-wy*V.z;}else{V.x-=o.deltaX;V.y-=o.deltaY;}draw();
	});
	$('#zin').on('click',()=>zoomBy(1.25));$('#zout').on('click',()=>zoomBy(.8));$('#zreset').on('click',()=>{V={x:200,y:120,z:1};draw();});$('#cg').on('change',draw);
	MF.down.push({p:10,fn(e,c){if(e.button===1||space){drag={k:'pan',sx:c.sx,sy:c.sy,vx:V.x,vy:V.y};return true;}return false;}});
	MF.move.pan=(e,c)=>{V.x=drag.vx+c.sx-drag.sx;V.y=drag.vy+c.sy-drag.sy;};
	MF.move.idle=(e,c)=>{if(typeof hoverCursor==='function')hoverCursor(c.sx,c.sy);};
	fit();
});
