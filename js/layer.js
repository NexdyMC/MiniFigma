/* [6.5] Layer dan grup. Isi: perintah grup, panel layer, urutan, rename. Bukan di sini: state grup bersama atau properti kanan. */
function groupSel(){
	const a=selAll();if(a.length<2)return;const units=[],seen=new Set();
	a.forEach(s=>{let u={s},g=s.gid||0;while(g&&leavesOf(g).every(x=>a.includes(x))){u={g};g=gpid(g);}const key=u.g?'g'+u.g:'s'+s.id;if(!seen.has(key)){seen.add(key);units.push(u);}});
	const pids=new Set(units.map(u=>u.g?gpid(u.g):(u.s.gid||0))),id=gn++;GR[id]={id,name:'Grup '+id,pid:pids.size===1?[...pids][0]:0};
	units.forEach(u=>{if(u.g)GR[u.g].pid=id;else u.s.gid=id;});
	const mem=S.filter(x=>inGroup(x,id)),top=Math.max(...mem.map(x=>S.indexOf(x))),ix=S.slice(0,top+1).filter(x=>!mem.includes(x)).length;
	S=S.filter(x=>!mem.includes(x));S.splice(ix,0,...mem);normalize();setSel(mem);refresh();save();
}
function ungroupSel(){
	const a=selAll(),ids=selG?[selG]:[...new Set(a.filter(s=>s.gid).map(s=>s.gid))];if(!ids.length)return;
	ids.forEach(id=>{const pid=gpid(id);S.forEach(s=>{if((s.gid||0)===id)s.gid=pid;});Object.values(GR).forEach(r=>{if(r.pid===id)r.pid=pid;});delete GR[id];});
	normalize();setSel(a.filter(s=>S.includes(s)));refresh();save();
}
let dnd=null;
function reorder(src,tgt,up){
	const items=src.g?leavesOf(src.g):(selAll().includes(src.s)?selAll():[src.s]),its=S.filter(x=>items.includes(x)),rest=S.filter(x=>!its.includes(x));let anchor,gid,parentFrame=null,above=up;
	if(tgt.top){anchor=rest[rest.length-1];gid=0;above=true;}
	else if(tgt.g){const L=rest.filter(x=>inGroup(x,tgt.g));if(!L.length)return;anchor=L[L.length-1];gid=up?gpid(tgt.g):tgt.g;above=true;}
	else{
		if(its.includes(tgt.s))return;
		anchor=tgt.s;gid=tgt.s.gid||0;
		parentFrame=tgt.s.type==='frame'?tgt.s:frameParentOf(tgt.s);
	}
	if(!anchor)return;
	if(tgt.top)parentFrame=null;
	if(!tgt.g){
		if(its.some(s=>!canSetFrameParent(s,parentFrame))){note('Frame tidak dapat dipindahkan ke dalam dirinya sendiri atau turunannya.');return;}
		its.forEach(s=>setFrameParent(s,parentFrame));
	}
	if(src.g){if(gid&&(gid===src.g||groupIn(gid,src.g)))return;GR[src.g].pid=gid;}else its.forEach(x=>{x.gid=gid;});
	const i=rest.indexOf(anchor)+(above?1:0);S=[...rest.slice(0,i),...its,...rest.slice(i)];normalize();refreshHoverAtPointer(null);refresh();save();
}
function zmove(m,e){
	const a=selAll();if(!a.length)return;
	if(m==='front'||m==='back'){const it=S.filter(x=>a.includes(x)),rest=S.filter(x=>!a.includes(x));S=m==='front'?[...rest,...it]:[...it,...rest];}
	else{
		const A=[...S];if(m==='fwd'){for(let i=A.length-2;i>=0;i--)if(a.includes(A[i])&&!a.includes(A[i+1]))[A[i],A[i+1]]=[A[i+1],A[i]];}
		else{for(let i=1;i<A.length;i++)if(a.includes(A[i])&&!a.includes(A[i-1]))[A[i],A[i-1]]=[A[i-1],A[i]];}S=A;
	}
	normalize();refreshHoverAtPointer(e);refresh();save();
}
function rename(s){
	const $li=$('#layers li').filter((i,el)=>$(el).data('s')===s),$n=$li.find('.nm');if(!$n.length)return;
	const $i=$('<input class="num !py-0.5">').val(s.name);let fin=false;$n.replaceWith($i);$i.focus().select();
	const done=ok=>{if(fin)return;fin=true;if(ok&&$i.val().trim())s.name=$i.val().trim();save();refresh();};
	$i.on('keydown',e=>{e.stopPropagation();if(e.key==='Enter')done(true);else if(e.key==='Escape')done(false);}).on('blur',()=>done(true)).on('mousedown click dblclick dragstart',e=>e.stopPropagation());
}
function renderLayers(){
	const $l=$('#layers').empty(),done=new Set();
	const chain=s=>{const c=[];let g=s.gid||0;while(g){c.unshift(g);g=gpid(g);}return c;};
	function row(o,rw,depth,ico,isSel,hid,lock,tHid,tLock,onClick,chev){
		const $li=$('<li draggable="true" class="group flex items-center gap-1.5 pr-2 py-1.5 cursor-pointer hover:bg-neutral-700"></li>').css('padding-left',(8+depth*14)+'px').data('s',o).toggleClass('bg-[#0d99ff]/40',isSel).toggleClass('opacity-50',!!hid);
		const $c=$('<span class="w-3 flex justify-center text-neutral-400"></span>').appendTo($li);
		if(chev!==undefined)$c.html(I('chevron',12)).toggleClass('-rotate-90',chev).on('click mousedown dblclick',e=>{e.stopPropagation();if(e.type==='click'){o.c=!o.c;refresh();save();}});
		$('<span class="w-4 flex justify-center text-neutral-400"></span>').html(I(ico,14)).appendTo($li);$('<span class="nm flex-1 truncate"></span>').text(o.name).appendTo($li);
		const btn=(h,act,fn)=>$('<button class="px-0.5 rounded hover:bg-neutral-600"></button>').html(h).addClass(act?'':'opacity-0 group-hover:opacity-100').on('click mousedown dblclick',e=>{e.stopPropagation();if(e.type==='click'){fn();refresh();save();}}).appendTo($li);
		btn(I(lock?'lock':'unlock',14),lock,tLock);btn(I(hid?'eyeoff':'eye',14),hid,tHid);
		$li.on('click',onClick).on('dblclick',()=>rename(o))
			.on('dragstart',e=>{dnd=rw;e.originalEvent.dataTransfer.setData('text/plain','layer');e.originalEvent.dataTransfer.effectAllowed='move';})
			.on('dragover',e=>{e.preventDefault();const r=e.currentTarget.getBoundingClientRect(),up=e.originalEvent.clientY<r.top+r.height/2;$(e.currentTarget).css('box-shadow',up?'inset 0 2px 0 #0d99ff':'inset 0 -2px 0 #0d99ff').data('up',up);})
			.on('dragleave',e=>$(e.currentTarget).css('box-shadow',''))
			.on('drop',e=>{e.preventDefault();e.stopPropagation();const up=$(e.currentTarget).data('up');$(e.currentTarget).css('box-shadow','');if(dnd)reorder(dnd,rw,up);dnd=null;}).appendTo($l);
	}
	function renderScope(frameParent,depth){
		const scope=S.filter(s=>frameParentOf(s)===frameParent);
		[...scope].reverse().forEach(s=>{
			const groups=chain(s);let collapsed=false;
			groups.forEach((id,index)=>{
				const group=GR[id];if(!group)return;
				if(!done.has(id)){
					done.add(id);const members=leavesOf(id),direct=members.filter(item=>frameParentOf(item)===frameParent);
					row(group,{g:id},depth+index,'group',selG===id,direct.length>0&&direct.every(item=>frameEffectivelyHidden(item)),direct.length>0&&direct.every(item=>frameEffectivelyLocked(item)),
						()=>{const value=!direct.every(item=>item.hid);direct.forEach(item=>{item.hid=value;});},
						()=>{const value=!direct.every(item=>item.lock);direct.forEach(item=>{item.lock=value;});},
						ev=>{const selected=selAll(),chosen=direct.every(item=>selected.includes(item))?selected.filter(item=>!direct.includes(item)):[...selected,...direct.filter(item=>!selected.includes(item))];setSel(ev.shiftKey||ev.ctrlKey?chosen:direct);refresh();},!!group.c);
				}
				if(group.c)collapsed=true;
			});
			if(collapsed)return;
			row(s,{s},depth+groups.length,s.type==='path'?(s.pts.length===2&&!s.closed&&!s.pts.some(p=>p.ho||p.hi)?'line':'pen'):s.type,
				selAll().includes(s)&&!selG,frameEffectivelyHidden(s),frameEffectivelyLocked(s),
				()=>{s.hid=!s.hid;},()=>{s.lock=!s.lock;},
				ev=>{const selected=selAll();setSel(ev.shiftKey||ev.ctrlKey?(selected.includes(s)?selected.filter(x=>x!==s):[...selected,s]):[s]);refresh();},
				s.type==='frame'&&kidsOf(s).length?!!s.c:undefined);
			if(s.type==='frame'&&!s.c)renderScope(s,depth+groups.length+1);
		});
	}
	renderScope(null,0);
}
MF.init.push(function initLayers(){
	$('#layers').on('dragover',e=>e.preventDefault()).on('drop',e=>{if(e.target===e.currentTarget&&dnd&&S.length){e.preventDefault();reorder(dnd,{top:true},true);}dnd=null;});
	MF.keys.push((e,k)=>{
		if((e.ctrlKey||e.metaKey)&&(e.code==='BracketLeft'||e.code==='BracketRight')){e.preventDefault();zmove(e.code==='BracketRight'?(e.shiftKey?'front':'fwd'):(e.shiftKey?'back':'bwd'),e);return true;}
		if((e.ctrlKey||e.metaKey)&&k==='g'){e.preventDefault();e.shiftKey?ungroupSel():groupSel();return true;}
		if(e.key==='F2'&&sel){e.preventDefault();rename(sel);return true;}return false;
	});
});
