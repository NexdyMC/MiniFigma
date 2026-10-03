/* [6.4] Transformasi. Isi: pivot, resize, rotasi, seleksi kanvas, overlay. Bukan di sini: alat gambar, properti numerik. */
function setPivot(s,fx,fy){
	const P=pvt(s);s.pvx=fx;s.pvy=fy;const Q=pvt(s),ux=P[0]-Q[0],uy=P[1]-Q[1],t=(s.rot||0)*Math.PI/180,c=Math.cos(t),n=Math.sin(t),vx=s.flipX?-ux:ux,vy=s.flipY?-uy:uy;
	move(s,ux-(vx*c-vy*n),uy-(vx*n+vy*c));
}
const pivShown=()=>sel&&(altDown||(sel.pvx!==undefined&&(sel.pvx!==.5||sel.pvy!==.5)));
function rotZone(sx,sy){if(!sel)return false;const cs=corners(sel);if(!cs.some(q=>{const d=Math.hypot(q[0]-sx,q[1]-sy);return d>=8&&d<=26;}))return false;return !inPoly(sx,sy,cs.map(q=>({x:q[0],y:q[1]})));}
const ROT_CUR=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke-linecap='round' stroke-linejoin='round'><path d='M20 12a8 8 0 1 1-2.5-5.8M20 3.5v5h-5' stroke='white' stroke-width='4'/><path d='M20 12a8 8 0 1 1-2.5-5.8M20 3.5v5h-5' stroke='black' stroke-width='1.8'/></svg>") 12 12, alias`;
function hoverCursor(sx,sy){if(tool==='select')cv.style.cursor=rotZone(sx,sy)?ROT_CUR:'default';}
const canRad=s=>s&&(s.type==='rect'||s.type==='frame')&&Math.min(s.w,s.h)*V.z>40;
function radH(s){const cap=Math.min(s.w,s.h)/2,r=(s.radii||[s.r,s.r,s.r,s.r]).map(v=>Math.min(Math.max(v||0,12/V.z),cap));return [[s.x+r[0],s.y+r[0]],[s.x+s.w-r[1],s.y+r[1]],[s.x+s.w-r[2],s.y+s.h-r[2]],[s.x+r[3],s.y+s.h-r[3]]].map(p=>w2s(...rp(s,p[0],p[1])));}
function corners(s){const b=bbox(s);return [[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>w2s(...rp(s,p[0],p[1])));}
const HANDLE_DIRS=['nw','n','ne','e','se','s','sw','w'];
function handlePoints(){
	if(sel){const b=bbox(sel),pts=[[b.x,b.y],[b.x+b.w/2,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h/2],[b.x+b.w,b.y+b.h],[b.x+b.w/2,b.y+b.h],[b.x,b.y+b.h],[b.x,b.y+b.h/2]];return pts.map(p=>w2s(...rp(sel,p[0],p[1])));}
	if(multi.length){const b=ubox(multi),x=b.x,y=b.y,w=b.w,h=b.h;return [[x,y],[x+w/2,y],[x+w,y],[x+w,y+h/2],[x+w,y+h],[x+w/2,y+h],[x,y+h],[x,y+h/2]].map(p=>w2s(...p));}
	return [];
}
function selectionBox(){return sel?bbox(sel):multi.length?ubox(multi):null;}
function setResizedSelection(drag,wx,wy,keepRatio){
	const b=drag.box,dir=drag.dir,old=drag.items,ratio=b.w/(b.h||1);let x=b.x,y=b.y,w=b.w,h=b.h;
	const local=drag.multi?[wx,wy]:rp(drag.items[0].src,wx,wy,-1),px=local[0],py=local[1];
	if(dir.includes('w')){w=Math.max(1,b.x+b.w-px);x=b.x+b.w-w;}if(dir.includes('e'))w=Math.max(1,px-b.x);
	if(dir.includes('n')){h=Math.max(1,b.y+b.h-py);y=b.y+b.h-h;}if(dir.includes('s'))h=Math.max(1,py-b.y);
	if(keepRatio){
		if(dir.length===2){if(Math.abs(w-b.w)>=Math.abs(h-b.h))h=w/(ratio||1);else w=h*ratio;if(dir.includes('n'))y=b.y+b.h-h;if(dir.includes('w'))x=b.x+b.w-w;}
		else if(dir==='e'||dir==='w'){h=w/(ratio||1);y=b.y+(b.h-h)/2;}else{w=h*ratio;x=b.x+(b.w-w)/2;}
	}
	const sx=w/(b.w||1),sy=h/(b.h||1),dst={x,y,w,h};
	old.forEach(({live,src,box})=>{const target=drag.multi?{x:x+(box.x-b.x)*sx,y:y+(box.y-b.y)*sy,w:box.w*sx,h:box.h*sy}:dst;resizeLayer(live,src,target,box);if(live.type==='text'&&live.textBox)fitText(live);});
}
function startMove(wx,wy){const it=selAll();drag={k:'move',sx:wx,sy:wy,it,kids:kidsFor(it),b0:ubox(it),frameTarget:null};}
function drawSelectionOverlay(ctx){
	if(sel&&!editingText){
		const cs=corners(sel);ctx.beginPath();cs.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.stroke();ctx.fillStyle='#fff';
		if(sel.type==='path'){
			const sp=selPt!=null&&sel.pts[selPt];
			if(sp){const c=w2s(...rp(sel,sp.x,sp.y));['ho','hi'].forEach(w=>{const h=sp[w];if(hasH(h)){const q=w2s(...rp(sel,sp.x+h.x,sp.y+h.y));ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.beginPath();ctx.arc(q[0],q[1],3.5,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();}});}
			sel.pts.forEach((p,i)=>{const q=w2s(...rp(sel,p.x,p.y));ctx.beginPath();ctx.arc(q[0],q[1],4,0,7);ctx.fillStyle=i===selPt?'#0d99ff':'#fff';ctx.fill();ctx.stroke();});
		}
	}
	if(multi.length){
		if(!selG)multi.forEach(s=>{const cs=corners(s);ctx.beginPath();cs.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.stroke();});
		const b=ubox(multi),a=w2s(b.x,b.y),c=w2s(b.x+b.w,b.y+b.h);ctx.strokeRect(a[0],a[1],c[0]-a[0],c[1]-a[1]);
	}
	if(!editingText)handlePoints().forEach(q=>{ctx.fillStyle='#fff';ctx.fillRect(q[0]-4,q[1]-4,8,8);ctx.strokeRect(q[0]-4,q[1]-4,8,8);});
	if(drag&&drag.k==='box'){ctx.fillStyle='rgba(13,153,255,.12)';ctx.fillRect(drag.x0,drag.y0,drag.x1-drag.x0,drag.y1-drag.y0);ctx.strokeRect(drag.x0,drag.y0,drag.x1-drag.x0,drag.y1-drag.y0);}
	if(!editingText&&canRad(sel))radH(sel).forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],4.5,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();});
	if(!editingText&&sel&&((drag&&drag.k==='rot')||pivShown())){
		const q=w2s(...pvt(sel));ctx.strokeStyle='#f5a623';ctx.fillStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q[0],q[1],5,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(q[0],q[1],1.6,0,7);ctx.fillStyle='#f5a623';ctx.fill();
	}
	if(drag&&drag.k==='rot'){
		const txt=Math.round(sel.rot)+'°';ctx.font='11px '+FF;const w=ctx.measureText(txt).width+12;ctx.fillStyle='#0d99ff';ctx.beginPath();ctx.roundRect(mouse.x+14,mouse.y+14,w,18,4);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(txt,mouse.x+20,mouse.y+23);
	}
	const A=selAll();
	if(A.length&&!editingText&&!(drag&&drag.k==='box')){
		const b=A.length>1?ubox(A):bbox(A[0]);let X0=1e9,X1=-1e9,Y1=-1e9;A.forEach(s=>corners(s).forEach(q=>{X0=Math.min(X0,q[0]);X1=Math.max(X1,q[0]);Y1=Math.max(Y1,q[1]);}));
		const txt=Math.round(b.w)+' × '+Math.round(b.h),mx=(X0+X1)/2;ctx.font='11px '+FF;const w=ctx.measureText(txt).width+14;ctx.fillStyle='#0d99ff';ctx.beginPath();ctx.roundRect(mx-w/2,Y1+8,w,18,4);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,mx,Y1+17);ctx.textAlign='left';
	}
}
MF.init.push(function initTransform(){
	MF.overlay.push(drawSelectionOverlay);
	MF.down.push({p:50,fn(e,c){if(sel&&pivShown()){const q=w2s(...pvt(sel));if(Math.hypot(q[0]-c.sx,q[1]-c.sy)<8){drag={k:'piv'};return true;}}return false;}});
	MF.down.push({p:60,fn(e,c){if(canRad(sel)){const hs=radH(sel),i=hs.findIndex(q=>Math.hypot(q[0]-c.sx,q[1]-c.sy)<7);if(i>=0){drag={k:'rad',i};return true;}}return false;}});
	MF.down.push({p:75,fn(e,c){const hi=handlePoints().findIndex(q=>Math.hypot(q[0]-c.sx,q[1]-c.sy)<8);if(hi<0)return false;const items=sel?[sel]:multi,b=selectionBox();drag={k:'resize',dir:HANDLE_DIRS[hi],box:{...b},multi:!sel,items:items.map(live=>({live,src:JSON.parse(JSON.stringify(live)),box:bbox(live)}))};return true;}});
	MF.down.push({p:80,fn(e,c){if(sel&&rotZone(c.sx,c.sy)){const pv=pvt(sel);drag={k:'rot',a0:Math.atan2(c.wy-pv[1],c.wx-pv[0]),r0:sel.rot||0};return true;}return false;}});
	MF.down.push({p:90,fn(e,c){
		let h=null;for(let i=S.length-1;i>=0;i--)if(hit(S[i],c.wx,c.wy,true)){h=S[i];break;}
		const cur=selAll(),add=e.shiftKey,unit=hh=>{
			if(!hh.gid||e.ctrlKey||e.metaKey)return [hh];const cg=sel&&sel.gid?sel.gid:0;
			if(cg&&inGroup(hh,cg)){const child=childOf(hh,cg);return child?leavesOf(child):[hh];}return leavesOf(rootOf(hh));
		};
		if(e.altKey&&h){if(!cur.includes(h))setSel(unit(h));for(const fn of MF.beforeMove)if(fn(e,c,h)===true){startMove(c.wx,c.wy);refresh();return true;}}
		if(h&&add){const ul=unit(h);setSel(cur.includes(h)?cur.filter(s=>!ul.includes(s)):[...cur,...ul.filter(s=>!cur.includes(s))]);refresh();return true;}
		if(h&&h.type!=='frame'){if(!cur.includes(h))setSel(unit(h));startMove(c.wx,c.wy);refresh();return true;}
		if(!add)setSel([]);drag={k:'box',x0:c.sx,y0:c.sy,x1:c.sx,y1:c.sy,base:add?cur:[],pend:h};refresh();return true;
	}});
	MF.move.resize=(e,c)=>{setResizedSelection(drag,c.wx,c.wy,e.shiftKey||(!drag.multi&&drag.items[0].src.ar));syncProps();};
	MF.move.move=(e,c)=>{
		const all=[...drag.it,...drag.kids],nx=drag.b0.x+c.wx-drag.sx,ny=drag.b0.y+c.wy-drag.sy,[dx,dy]=snapRect({x:nx,y:ny,w:drag.b0.w,h:drag.b0.h},all),b=ubox(drag.it);
		all.forEach(s=>move(s,nx+dx-b.x,ny+dy-b.y));drag.didMove=drag.didMove||Math.hypot((c.wx-drag.sx)*V.z,(c.wy-drag.sy)*V.z)>3;drag.frameTarget=frameDropTarget(c.wx,c.wy,drag.it,e.ctrlKey);syncProps();
	};
	MF.move.box=(e,c)=>{
		drag.x1=c.sx;drag.y1=c.sy;
		if(Math.abs(c.sx-drag.x0)+Math.abs(c.sy-drag.y0)>3){
			const a=s2w(Math.min(drag.x0,c.sx),Math.min(drag.y0,c.sy)),z=s2w(Math.max(drag.x0,c.sx),Math.max(drag.y0,c.sy)),Rc={x:a[0],y:a[1],w:z[0]-a[0],h:z[1]-a[1]};
			const hits=S.filter(s=>!frameEffectivelyHidden(s)&&!frameEffectivelyLocked(s)&&!drag.base.includes(s)&&boxHitVisible(s,Rc)),fr=hits.filter(s=>s.type==='frame');let nh=hits.filter(s=>!fr.some(f=>f!==s&&kidsOf(f).includes(s)));
			nh=[...new Set(nh.flatMap(s=>s.gid?leavesOf(rootOf(s)):[s]))].filter(s=>!drag.base.includes(s));setSel([...drag.base,...nh]);
		}
	};
	MF.move.rot=(e,c)=>{const pv=pvt(sel);let r=drag.r0+(Math.atan2(c.wy-pv[1],c.wx-pv[0])-drag.a0)*180/Math.PI;if(e.shiftKey)r=Math.round(r/15)*15;r=Math.round((((r+180)%360+360)%360-180)*100)/100;if(sel.type==='frame')setFrameRotation(sel,r);else sel.rot=r;syncProps();};
	MF.move.piv=(e,c)=>{const b=bbox(sel),q=rp(sel,c.wx,c.wy,-1);setPivot(sel,b.w?(q[0]-b.x)/b.w:.5,b.h?(q[1]-b.y)/b.h:.5);syncProps();};
	MF.move.rad=(e,c)=>{
		const q=rp(sel,c.wx,c.wy,-1),sg=[[1,1],[-1,1],[-1,-1],[1,-1]][drag.i],cx=[sel.x,sel.x+sel.w,sel.x+sel.w,sel.x][drag.i],cy=[sel.y,sel.y,sel.y+sel.h,sel.y+sel.h][drag.i];
		const rads=sel.radii||[sel.r,sel.r,sel.r,sel.r];rads[drag.i]=Math.round(Math.max(0,Math.min(Math.min(sel.w,sel.h)/2,((q[0]-cx)*sg[0]+(q[1]-cy)*sg[1])/2)));sel.radii=rads;syncProps();
	};
	MF.up.box=()=>{if(Math.abs(drag.x1-drag.x0)+Math.abs(drag.y1-drag.y0)<=3&&drag.pend)setSel([drag.pend]);};
	MF.up.move=(e,c)=>{
		if(e.ctrlKey||!drag.didMove)return;
		const roots=frameMoveRoots(drag.it),target=frameDropTarget(c.wx,c.wy,drag.it,false);
		roots.forEach(s=>setFrameParent(s,target));
		S=S.filter(s=>!roots.includes(s)).concat(roots);
		normalize();
	};
});
