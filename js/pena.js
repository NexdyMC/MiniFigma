/* [6.3] Pena vektor. Isi: pembuatan jalur, handle Bézier, edit titik, klik-ganda. Bukan di sini: seleksi umum atau toolbar. */
function togglePt(s,i){
	const p=s.pts[i];if(hasH(p.ho)||hasH(p.hi)){delete p.ho;delete p.hi;return;}
	const a=s.pts[i-1]||(s.closed?s.pts[s.pts.length-1]:null),b=s.pts[i+1]||(s.closed?s.pts[0]:null);if(!a&&!b)return;
	const tx=a&&b?b.x-a.x:a?p.x-a.x:b.x-p.x,ty=a&&b?b.y-a.y:a?p.y-a.y:b.y-p.y,l=Math.hypot(tx,ty)||1;
	const k=Math.min(a?Math.hypot(p.x-a.x,p.y-a.y):1e9,b?Math.hypot(b.x-p.x,b.y-p.y):1e9)/3/l;p.ho={x:tx*k,y:ty*k};p.hi={x:-tx*k,y:-ty*k};
}
function penClick(wx,wy,sx,sy){
	if(!draft){draft=mk('path',0,0);S.push(draft);setSel([draft]);}
	if(draft.pts.length>2){const q=w2s(draft.pts[0].x,draft.pts[0].y);if(Math.hypot(q[0]-sx,q[1]-sy)<8){draft.closed=true;return finishPen();}}
	draft.pts.push({x:wx,y:wy});selPt=draft.pts.length-1;drag={k:'penh',i:selPt,x0:sx,y0:sy};refresh();
}
function finishPen(){
	if(draft){if(draft.pts.length<2){S=S.filter(s=>s!==draft);setSel([]);}draft=null;}
	G=[];setTool('select');refresh();save();
}
MF.init.push(function initPen(){
	MF.down.push({p:20,fn(e,c){if(tool!=='pen')return false;const [wx,wy]=snapPt(c.wx,c.wy);penClick(wx,wy,c.sx,c.sy);return true;}});
	MF.down.push({p:70,fn(e,c){
		if(!sel||sel.type!=='path')return false;const p0=selPt!=null&&sel.pts[selPt];
		if(p0)for(const w of ['ho','hi']){const h=p0[w];if(hasH(h)){const q=w2s(...rp(sel,p0.x+h.x,p0.y+h.y));if(Math.hypot(q[0]-c.sx,q[1]-c.sy)<7){drag={k:'hd',i:selPt,w};return true;}}}
		const i=sel.pts.findIndex(p=>{const q=w2s(...rp(sel,p.x,p.y));return Math.hypot(q[0]-c.sx,q[1]-c.sy)<8;});
		if(i>=0){selPt=i;drag={k:'pt',i};draw();return true;}return false;
	}});
	MF.move.hd=(e,c)=>{
		const p=sel.pts[drag.i],q=rp(sel,c.wx,c.wy,-1),v={x:q[0]-p.x,y:q[1]-p.y};p[drag.w]=v;
		if(!e.altKey)p[drag.w==='ho'?'hi':'ho']={x:-v.x,y:-v.y};syncProps();
	};
	MF.move.pt=(e,c)=>{const [wx,wy]=snapPt(c.wx,c.wy,[sel]),q=rp(sel,wx,wy,-1);sel.pts[drag.i]={x:q[0],y:q[1]};syncProps();};
	MF.move.penh=(e,c)=>{
		const p=draft&&draft.pts[drag.i];if(p&&Math.hypot(c.sx-drag.x0,c.sy-drag.y0)>3){const vx=c.wx-p.x,vy=c.wy-p.y;p.ho={x:vx,y:vy};p.hi={x:-vx,y:-vy};}
	};
	$(cv).on('dblclick',e=>{
		const sx=e.offsetX,sy=e.offsetY,[wx,wy]=s2w(sx,sy);
		if(draft){draft.pts.pop();finishPen();return;}
		let topHit=null;for(let i=S.length-1;i>=0;i--)if(hit(S[i],wx,wy)){topHit=S[i];break;}
		if(topHit&&topHit.type==='text'){setSel([topHit]);refresh();startTextEdit(topHit);return;}
		if(sel&&sel.type==='path'){
			const i=sel.pts.findIndex(p=>{const q=w2s(...rp(sel,p.x,p.y));return Math.hypot(q[0]-sx,q[1]-sy)<8;});
			if(i>=0){togglePt(sel,i);selPt=i;draw();save();return;}
		}
		if(selG){let h=null;for(let i=S.length-1;i>=0;i--)if(hit(S[i],wx,wy)){h=S[i];break;}
			if(h&&inGroup(h,selG)){const c=childOf(h,selG);setSel(c?leavesOf(c):[h]);refresh();}
		}
	});
});
