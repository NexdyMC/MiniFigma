/* [6.4] Transformasi. Isi: pivot, resize, rotasi, seleksi kanvas, overlay. Bukan di sini: alat gambar, properti numerik. */
function setPivot(s,fx,fy){
	const P=pvt(s);s.pvx=fx;s.pvy=fy;const Q=pvt(s),ux=P[0]-Q[0],uy=P[1]-Q[1],t=(s.rot||0)*Math.PI/180,c=Math.cos(t),n=Math.sin(t),vx=s.flipX?-ux:ux,vy=s.flipY?-uy:uy;
	move(s,ux-(vx*c-vy*n),uy-(vx*n+vy*c));
}
function canvasSelectionUnit(h,e){
	if(!h.gid||e.ctrlKey||e.metaKey)return [h];
	const cg=sel&&sel.gid?sel.gid:0;
	if(cg&&inGroup(h,cg)){const child=childOf(h,cg);return child?leavesOf(child):[h];}
	return leavesOf(rootOf(h));
}
function pickAt(wx,wy,e){
	const [sx,sy]=w2s(wx,wy),title=typeof frameTitleAt==='function'?frameTitleAt(sx,sy):null;
	let h=title&&!frameEffectivelyLocked(title)?title:null;
	if(!h)for(let i=S.length-1;i>=0;i--)if(hit(S[i],wx,wy,true)){h=S[i];break;}
	return h?{hit:h,items:canvasSelectionUnit(h,e||{})}:null;
}
function selectCanvasAt(e,c){
	const target=pickAt(c.wx,c.wy,e),current=selAll();
	const h=target&&target.hit;
	if(!h)setSel([]);
	else if(!target.items.every(item=>current.includes(item))||current.length!==target.items.length)setSel(target.items);
	refresh();return h;
}
function sameHoverTarget(a,b){
	return !!a&&!!b&&a.items.length===b.items.length&&a.items.every((item,i)=>item===b.items[i]);
}
function setHoverTarget(target,redraw=true){
	if(sameHoverTarget(hov,target))return false;
	hov=target;
	if(tool==='select'){
		if(target)$('#hint').text(HINT.select);
		else if($('#hint').text()===HINT.select)$('#hint').text('');
	}
	if(redraw)draw();return true;
}
function clearHover(){return setHoverTarget(null);}
function updateCanvasHover(e,c){
	const r=c.rect;
	if(tool!=='select'||editingText||drag||draft||c.sx<0||c.sy<0||c.sx>r.width||c.sy>r.height){clearHover();return;}
	const target=pickAt(c.wx,c.wy,e);
	setHoverTarget(target);
}
function refreshHoverAtPointer(e){
	if(!cv)return;
	const [wx,wy]=s2w(mouse.x,mouse.y),rect=cv.getBoundingClientRect();
	if(tool!=='select'||editingText||drag||draft||mouse.x<0||mouse.y<0||mouse.x>rect.width||mouse.y>rect.height){clearHover();return;}
	setHoverTarget(pickAt(wx,wy,e),false);
}
function drawHoverOverlay(ctx){
	if(!hov||editingText||!S.includes(hov.hit)||frameEffectivelyHidden(hov.hit)||frameEffectivelyLocked(hov.hit))return;
	const selected=selAll();
	if(hov.items.length===selected.length&&hov.items.every(item=>selected.includes(item)))return;
	ctx.save();ctx.strokeStyle='#0d99ff';ctx.lineWidth=1;ctx.beginPath();
	if(hov.items.length===1){
		const points=corners(hov.items[0]);points.forEach((point,i)=>ctx[i?'lineTo':'moveTo'](point[0],point[1]));ctx.closePath();
	}else{
		const b=ubox(hov.items),a=w2s(b.x,b.y),z=w2s(b.x+b.w,b.y+b.h);ctx.rect(a[0],a[1],z[0]-a[0],z[1]-a[1]);
	}
	ctx.stroke();ctx.restore();
}
const pivShown=()=>sel&&(altDown||(sel.pvx!==undefined&&(sel.pvx!==.5||sel.pvy!==.5)));
function selectionCorners(){if(sel)return corners(sel);if(!multi.length)return [];const b=ubox(multi),a=w2s(b.x,b.y),z=w2s(b.x+b.w,b.y+b.h);return [[a[0],a[1]],[z[0],a[1]],[z[0],z[1]],[a[0],z[1]]];}
function rotZone(sx,sy,cs){if(!cs||cs.length<4)return false;if(!cs.some(q=>{const d=Math.hypot(q[0]-sx,q[1]-sy);return d>=8&&d<=26;}))return false;return !inPoly(sx,sy,cs.map(q=>({x:q[0],y:q[1]})));}
const ROT_CUR=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke-linecap='round' stroke-linejoin='round'><path d='M20 12a8 8 0 1 1-2.5-5.8M20 3.5v5h-5' stroke='white' stroke-width='4'/><path d='M20 12a8 8 0 1 1-2.5-5.8M20 3.5v5h-5' stroke='black' stroke-width='1.8'/></svg>") 12 12, alias`;
function hoverCursor(sx,sy){if(tool==='select')cv.style.cursor=rotZone(sx,sy,selectionCorners())?ROT_CUR:'default';}
const canRad=s=>s&&(s.type==='rect'||s.type==='frame')&&Math.min(s.w,s.h)*V.z>40;
function radH(s){const cap=Math.min(s.w,s.h)/2,r=(s.radii||[s.r,s.r,s.r,s.r]).map(v=>Math.min(Math.max(v||0,12/V.z),cap));return [[s.x+r[0],s.y+r[0]],[s.x+s.w-r[1],s.y+r[1]],[s.x+s.w-r[2],s.y+s.h-r[2]],[s.x+r[3],s.y+s.h-r[3]]].map(p=>w2s(...rp(s,p[0],p[1])));}
function corners(s){const b=bbox(s);return [[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>w2s(...rp(s,p[0],p[1])));}
function rotationMembers(items){return [...new Set([...items,...kidsFor(items)])];}
function rotationStates(members){return members.map(m=>({m,x:m.x,y:m.y,pts:m.type==='path'?JSON.parse(JSON.stringify(m.pts)):null,rot:m.rot||0}));}
function normalizeRotation(rotation){return Math.round((((rotation+180)%360+360)%360-180)*100)/100;}
function rotateSet(members,center,delta,startStates){
	const angle=delta*Math.PI/180,c=Math.cos(angle),n=Math.sin(angle);
	startStates.forEach(state=>{
		const m=state.m;m.x=state.x;m.y=state.y;if(state.pts)m.pts=JSON.parse(JSON.stringify(state.pts));
		m.rot=state.rot;const p=pvt(m),x=p[0]-center[0],y=p[1]-center[1],dx=center[0]+x*c-y*n-p[0],dy=center[1]+x*n+y*c-p[1];
		move(m,dx,dy);m.rot=normalizeRotation(state.rot+delta);
	});
}
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
	old.forEach(({live,src,box})=>{
		const target=drag.multi?{x:x+(box.x-b.x)*sx,y:y+(box.y-b.y)*sy,w:box.w*sx,h:box.h*sy}:dst;resizeLayer(live,src,target,box);
		if(live.type==='text'){live.tm=dir==='e'||dir==='w'?'ah':'fx';fitText(live);}
	});
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
	if(!editingText&&((drag&&drag.k==='rot')||(sel&&pivShown()))){
		const q=w2s(...(drag&&drag.k==='rot'?drag.center:pvt(sel)));ctx.strokeStyle='#f5a623';ctx.fillStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q[0],q[1],5,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(q[0],q[1],1.6,0,7);ctx.fillStyle='#f5a623';ctx.fill();
	}
	if(drag&&drag.k==='rot'){
		const txt=Math.round(drag.delta)+'°';ctx.font='11px '+FF;const w=ctx.measureText(txt).width+12;ctx.fillStyle='#0d99ff';ctx.beginPath();ctx.roundRect(mouse.x+14,mouse.y+14,w,18,4);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(txt,mouse.x+20,mouse.y+23);
	}
	const A=selAll();
	if(A.length&&!editingText&&!(drag&&drag.k==='box')){
		const b=A.length>1?ubox(A):bbox(A[0]);let X0=1e9,X1=-1e9,Y1=-1e9;A.forEach(s=>corners(s).forEach(q=>{X0=Math.min(X0,q[0]);X1=Math.max(X1,q[0]);Y1=Math.max(Y1,q[1]);}));
		const txt=Math.round(b.w)+' × '+Math.round(b.h),mx=(X0+X1)/2;ctx.font='11px '+FF;const w=ctx.measureText(txt).width+14;ctx.fillStyle='#0d99ff';ctx.beginPath();ctx.roundRect(mx-w/2,Y1+8,w,18,4);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,mx,Y1+17);ctx.textAlign='left';
	}
}
function startResizeAt(hi){
	if(hi<0)return false;const items=sel?[sel]:multi,b=selectionBox();
	drag={k:'resize',dir:HANDLE_DIRS[hi],box:{...b},multi:!sel,items:items.map(live=>({live,src:JSON.parse(JSON.stringify(live)),box:bbox(live)}))};return true;
}
MF.init.push(function initTransform(){
	MF.overlay.push(drawHoverOverlay);
	MF.overlay.push(drawSelectionOverlay);
	MF.down.push({p:50,fn(e,c){if(sel&&pivShown()){const q=w2s(...pvt(sel));if(Math.hypot(q[0]-c.sx,q[1]-c.sy)<8){drag={k:'piv'};return true;}}return false;}});
	MF.down.push({p:60,fn(e,c){if(canRad(sel)){const hs=radH(sel),i=hs.findIndex(q=>Math.hypot(q[0]-c.sx,q[1]-c.sy)<7);if(i>=0){drag={k:'rad',i};return true;}}return false;}});
	MF.down.push({p:45,fn(e,c){
		if(tool!=='select'||!e.shiftKey)return false;
		if(sel&&pivShown()){const q=w2s(...pvt(sel));if(Math.hypot(q[0]-c.sx,q[1]-c.sy)<5){drag={k:'piv'};return true;}}
		if(canRad(sel)){const i=radH(sel).findIndex(q=>Math.hypot(q[0]-c.sx,q[1]-c.sy)<5);if(i>=0){drag={k:'rad',i};return true;}}
		const hi=handlePoints().findIndex(q=>Math.abs(q[0]-c.sx)<=4&&Math.abs(q[1]-c.sy)<=4);
		if(startResizeAt(hi))return true;
		const target=pickAt(c.wx,c.wy,e),cur=selAll();
		if(!target){drag={k:'box',x0:c.sx,y0:c.sy,x1:c.sx,y1:c.sy,base:cur,pend:null};refresh();return true;}
		const selected=target.items.every(item=>cur.includes(item));
		setSel(selected?cur.filter(item=>!target.items.includes(item)):[...cur,...target.items.filter(item=>!cur.includes(item))]);
		refresh();return true;
	}});
	MF.down.push({p:75,fn(e,c){const hi=handlePoints().findIndex(q=>Math.hypot(q[0]-c.sx,q[1]-c.sy)<8);return startResizeAt(hi);}});
	MF.down.push({p:80,fn(e,c){const items=selAll(),cs=selectionCorners();if(items.length&&rotZone(c.sx,c.sy,cs)){const box=ubox(items),center=items.length===1?pvt(items[0]):[box.x+box.w/2,box.y+box.h/2],members=rotationMembers(items);drag={k:'rot',a0:Math.atan2(c.wy-center[1],c.wx-center[0]),center,items:members,states:rotationStates(members),delta:0};return true;}return false;}});
	MF.down.push({p:90,fn(e,c){
		const target=pickAt(c.wx,c.wy,e),h=target&&target.hit;
		const cur=selAll(),add=e.shiftKey;
		if(e.altKey&&h){if(!target.items.every(item=>cur.includes(item))||cur.length!==target.items.length)setSel(target.items);for(const fn of MF.beforeMove)if(fn(e,c,h)===true){startMove(c.wx,c.wy);refresh();return true;}}
		if(h&&add){const items=target.items,selected=items.every(item=>cur.includes(item));setSel(selected?cur.filter(item=>!items.includes(item)):[...cur,...items.filter(item=>!cur.includes(item))]);refresh();return true;}
		if(h&&h.type!=='frame'){if(!target.items.every(item=>cur.includes(item))||cur.length!==target.items.length)setSel(target.items);startMove(c.wx,c.wy);refresh();return true;}
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
	MF.move.rot=(e,c)=>{let delta=(Math.atan2(c.wy-drag.center[1],c.wx-drag.center[0])-drag.a0)*180/Math.PI;delta=((delta+180)%360+360)%360-180;if(e.shiftKey)delta=Math.round(delta/15)*15;drag.delta=Math.round(delta*100)/100;rotateSet(drag.items,drag.center,drag.delta,drag.states);syncProps();};
	MF.move.piv=(e,c)=>{const b=bbox(sel),q=rp(sel,c.wx,c.wy,-1);setPivot(sel,b.w?(q[0]-b.x)/b.w:.5,b.h?(q[1]-b.y)/b.h:.5);syncProps();};
	MF.move.rad=(e,c)=>{
		const q=rp(sel,c.wx,c.wy,-1),sg=[[1,1],[-1,1],[-1,-1],[1,-1]][drag.i],cx=[sel.x,sel.x+sel.w,sel.x+sel.w,sel.x][drag.i],cy=[sel.y,sel.y,sel.y+sel.h,sel.y+sel.h][drag.i];
		const rads=sel.radii||[sel.r,sel.r,sel.r,sel.r];rads[drag.i]=Math.round(Math.max(0,Math.min(Math.min(sel.w,sel.h)/2,((q[0]-cx)*sg[0]+(q[1]-cy)*sg[1])/2)));sel.radii=rads;syncProps();
	};
	MF.up.box=()=>{if(Math.abs(drag.x1-drag.x0)+Math.abs(drag.y1-drag.y0)<=3&&drag.pend)setSel([drag.pend]);};
	MF.up.move=(e,c)=>{
		if(e.ctrlKey||!drag.didMove)return;
		const roots=frameMoveRoots(drag.it),target=frameDropTarget(c.wx,c.wy,drag.it,false),changed=roots.filter(s=>frameParentOf(s)!==target);
		if(!changed.length)return;
		changed.forEach(s=>setFrameParent(s,target));
		S=S.filter(s=>!changed.includes(s)).concat(changed);
		normalize();
	};
});
