/* [6.13] Hierarki frame. Isi: relasi induk-anak dan inferensi kompatibel untuk dokumen lama. */
let hoveredFrame=null;
function nearestFrameParent(s){
	const b=bbox(s),cx=b.x+b.w/2,cy=b.y+b.h/2;
	return S.filter(f=>f.type==='frame'&&f!==s&&S.indexOf(f)<S.indexOf(s)&&
		cx>=f.x&&cx<=f.x+f.w&&cy>=f.y&&cy<=f.y+f.h)
		.sort((a,b)=>a.w*a.h-b.w*b.h)[0]||null;
}
function frameLayerDepth(s){return frameDepth(s);}
function frameParentForSelection(items){
	if(!items.length)return null;
	const parent=frameParentOf(items[0]);
	return items.every(item=>frameParentOf(item)===parent)?parent:null;
}
function frameLocalPoint(frame,x,y){
	const point=rp(frame,x,y,-1);
	return [point[0]-frame.x,point[1]-frame.y];
}
function frameWorldPoint(frame,x,y){return rp(frame,frame.x+x,frame.y+y);}
function setFrameRotation(frame,rotation){
	const previous=+frame.rot||0,next=+rotation||0,delta=next-previous;
	if(Math.abs(delta)>1e-9){
		const pivot=pvt(frame),angle=delta*Math.PI/180,c=Math.cos(angle),n=Math.sin(angle);
		kidsOf(frame).forEach(child=>{
			const childPivot=pvt(child),x=childPivot[0]-pivot[0],y=childPivot[1]-pivot[1];
			const dx=pivot[0]+x*c-y*n-childPivot[0],dy=pivot[1]+x*n+y*c-childPivot[1];
			if(child.type==='path'){
				child.pts.forEach(point=>{
					point.x+=dx;point.y+=dy;
				});
			}else{child.x+=dx;child.y+=dy;}
			child.rot=(+child.rot||0)+delta;
		});
	}
	frame.rot=next;
}
function frameParentState(s,key){
	let parent=frameParentOf(s),seen=new Set();
	while(parent&&!seen.has(parent.id)){
		if(parent[key])return true;
		seen.add(parent.id);parent=frameParentOf(parent);
	}
	return false;
}
function frameEffectivelyHidden(s){return !!s.hid||frameParentState(s,'hid');}
function frameEffectivelyLocked(s){return !!s.lock||frameParentState(s,'lock');}
function frameTitleAt(sx,sy){
	const [wx,wy]=s2w(sx,sy);
	for(let i=S.length-1;i>=0;i--){
		const frame=S[i];if(frame.type!=='frame'||frameEffectivelyHidden(frame))continue;
		if(wy<frame.y-18/V.z||wy>frame.y-1/V.z||wx<frame.x-2/V.z)continue;
		ctx.save();ctx.font='11px '+FF;const width=ctx.measureText(frame.name).width/V.z;ctx.restore();
		if(wx<=frame.x+width+2/V.z)return frame;
	}
	return null;
}
function updateFrameHover(c){
	const title=frameTitleAt(c.sx,c.sy),frame=title||S.slice().reverse().find(item=>item.type==='frame'&&hit(item,c.wx,c.wy))||null;
	if(frame!==hoveredFrame){hoveredFrame=frame;draw();}
	if(title){cv.style.cursor=frameEffectivelyLocked(title)?'not-allowed':'move';return true;}
	return false;
}
function editFrameTitle(frame){
	$('#frame-title-edit').remove();
	const point=w2s(frame.x,frame.y);
	ctx.save();ctx.font='11px '+FF;const width=Math.max(70,ctx.measureText(frame.name).width+14);ctx.restore();
	const $input=$('<input id="frame-title-edit" type="text" maxlength="80" autocomplete="off" aria-label="Nama frame">')
		.addClass('num !w-auto !h-5 !px-1')
		.css({position:'absolute',left:point[0],top:point[1]-20,width,zIndex:6,fontSize:'11px',lineHeight:'16px'})
		.val(frame.name).appendTo('#wrap');
	let finished=false;
	const finish=commit=>{
		if(finished)return;finished=true;
		const name=$input.val().trim();
		$input.remove();
		if(commit&&name&&name!==frame.name){frame.name=name.slice(0,80);refresh();save();}
		else draw();
		cv.focus();
	};
	$input.on('mousedown click dblclick',e=>e.stopPropagation())
		.on('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();finish(true);}else if(e.key==='Escape')finish(false);})
		.on('blur',()=>finish(true));
	$input.trigger('focus').trigger('select');
}
function drawFrameHierarchyOverlay(ctx){
	if(hoveredFrame&&!frameEffectivelyHidden(hoveredFrame)){
		const q=[[hoveredFrame.x,hoveredFrame.y],[hoveredFrame.x+hoveredFrame.w,hoveredFrame.y],[hoveredFrame.x+hoveredFrame.w,hoveredFrame.y+hoveredFrame.h],[hoveredFrame.x,hoveredFrame.y+hoveredFrame.h]].map(p=>w2s(...rp(hoveredFrame,...p)));
		ctx.save();ctx.strokeStyle='rgba(13,153,255,.8)';ctx.lineWidth=1;
		ctx.beginPath();
		q.forEach((point,i)=>ctx[i?'lineTo':'moveTo'](point[0],point[1]));
		ctx.closePath();
		ctx.stroke();
		kidsOf(hoveredFrame).filter(child=>!frameEffectivelyHidden(child)).forEach(child=>{
			const b=bbox(child),cs=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>w2s(...rp(child,...p)));
			ctx.beginPath();cs.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0],p[1]));ctx.closePath();ctx.stroke();
		});
		ctx.restore();
	}
}
function canSetFrameParent(s,parent){
	const seen=new Set();let current=parent;
	while(current&&!seen.has(current.id)){
		if(current===s)return false;
		seen.add(current.id);current=frameParentOf(current);
	}
	return true;
}
function frameSiblings(s){
	const parent=frameParentOf(s);
	return S.filter(item=>frameParentOf(item)===parent);
}
MF.init.push(function initFrameHierarchyCanvas(){
	MF.overlay.push(drawFrameHierarchyOverlay);
	$('#cv').on('dblclick',e=>{
		const c=mouseContext(e.originalEvent||e),frame=frameTitleAt(c.sx,c.sy);
		if(!frame||frameEffectivelyLocked(frame))return;
		e.preventDefault();e.stopImmediatePropagation();setSel([frame]);refresh();editFrameTitle(frame);
	});
	MF.down.push({p:40,fn(e,c){
		const frame=frameTitleAt(c.sx,c.sy);
		if(!frame)return false;
		if(!frameEffectivelyLocked(frame)){
			setSel([frame]);
			startMove(c.wx,c.wy);refresh();return true;
		}
		return true;
	}});
});
MF.init.push(function initFrameHierarchyKeys(){
	MF.keys.push((e,k)=>{
		if(e.ctrlKey||e.metaKey||e.altKey)return false;
		if(k==='enter'&&!e.shiftKey&&sel&&sel.type==='frame'){
			const child=S.find(item=>frameParentOf(item)===sel);
			if(child)setSel([child]);
			refresh();return true;
		}
		if(k==='enter'&&e.shiftKey&&sel){
			const parent=frameParentOf(sel);
			if(parent){setSel([parent]);refresh();return true;}
		}
		if(k==='tab'&&sel){
			const siblings=frameSiblings(sel),index=siblings.indexOf(sel);
			if(siblings.length>1&&index>=0){const delta=e.shiftKey?-1:1;setSel([siblings[(index+delta+siblings.length)%siblings.length]]);refresh();}
			e.preventDefault();return true;
		}
		return false;
	});
});