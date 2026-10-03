/* [6.2] Alat gambar. Isi: toolbar, bentuk, pensil, shortcut alat, dispatcher keyboard. Bukan di sini: pena vektor, seleksi, layer. */
const NEWT={frame:'frame',rect:'rect',ellipse:'ellipse',polygon:'polygon',star:'star',line:'path'};
const SHI={rect:'rect',line:'line',ellipse:'ellipse',polygon:'polygon',star:'star'};
function setTool(t){
	if(draft&&t!=='pen')draft=null;tool=t;
	if(SH[t])$('#shapeBtn').data('t',t).html(I(t,18)).attr('title',SH[t]);
	$('.tool').each(function(){$(this).toggleClass('on',$(this).data('t')===t);});cv.style.cursor=t==='select'?'default':'crosshair';$('#hint').text(HINT[t]||'Seret di kanvas untuk menggambar.');
	if(typeof syncFramePanel==='function'){syncFramePanel();$('#empty').toggle(!selAll().length&&t!=='frame');}
}
MF.init.push(function initTools(){
	$('.tool,#shapeMore').addClass('px-3 py-1.5 rounded-lg hover:bg-neutral-700');
	$('[data-i]').addClass('inline-flex items-center justify-center').each(function(){$(this).html(I($(this).data('i'),$(this).is('.tool')?18:14));});
	$('#shapeMenu li').each(function(){$(this).html(`<span class="flex items-center gap-2">${I(SHI[$(this).data('s')],16)}${$(this).text()}</span>`);});
	$('#shapeMenu li').addClass('px-3 py-1.5 cursor-pointer hover:bg-neutral-700').on('click',function(){setTool($(this).data('s'));$('#shapeMenu').hide();});
	$('.tool').on('click',function(){setTool($(this).data('t'));});$('#shapeMore').on('click',()=>$('#shapeMenu').toggle());
	$(document).on('mousedown',e=>{if(!$(e.target).closest('#shapeMenu,#shapeMore').length)$('#shapeMenu').hide();});
	MF.down.push({p:40,fn(e,c){
		if(tool==='pencil'){const s=mk('path',c.wx,c.wy);s.name='Pensil '+s.id;s.pts=[{x:c.wx,y:c.wy}];S.push(s);setSel([s]);drag={k:'pencil',lastX:c.sx,lastY:c.sy};return true;}
		if(!NEWT[tool])return false;const [wx,wy]=snapPt(c.wx,c.wy),s=mk(NEWT[tool],wx,wy);setSel([s]);
		if(tool==='line'){s.name='Garis '+s.id;s.pts=[{x:wx,y:wy},{x:wx,y:wy}];}S.push(s);drag={k:'new',ox:wx,oy:wy};return true;
	}});
	MF.move.pencil=(e,c)=>{
		const s=sel;if(s&&Math.hypot(c.sx-drag.lastX,c.sy-drag.lastY)>=2){s.pts.push({x:c.wx,y:c.wy});drag.lastX=c.sx;drag.lastY=c.sy;}
	};
	MF.move.new=(e,c)=>{
		const [wx,wy]=snapPt(c.wx,c.wy,[sel]);if(sel.type==='path')sel.pts[1]={x:wx,y:wy};
		else{sel.x=Math.min(drag.ox,wx);sel.y=Math.min(drag.oy,wy);sel.w=Math.abs(wx-drag.ox);sel.h=Math.abs(wy-drag.oy);}syncProps();
	};
	MF.up.pencil=(e,c)=>{
		if(sel&&Math.hypot(c.sx-drag.lastX,c.sy-drag.lastY)>=2)sel.pts.push({x:c.wx,y:c.wy});
		if(sel&&sel.pts.length<2){S=S.filter(s=>s!==sel);setSel([]);}else setTool('select');
	};
	MF.up.new=(e,c)=>{
		if(sel.type==='path'){const a=sel.pts[0],b=sel.pts[1];if(Math.hypot(a.x-b.x,a.y-b.y)<2)b.x+=100;}
		else if(tool==='frame'&&Math.hypot(c.wx-drag.ox,c.wy-drag.oy)<4){const size=frameToolSize();sel.w=size.w;sel.h=size.h;}
		else if(sel.w<2&&sel.h<2)sel.w=sel.h=100;
		setFrameParent(sel,nearestFrameParent(sel));normalize();
		if(tool!=='select')setTool('select');
	};
	MF.keys.push((e,k)=>{
		const mod=e.ctrlKey||e.metaKey;
		if(mod&&e.altKey&&k==='g'){e.preventDefault();if(selAll().length)wrapSelectionInFrame();else note('Pilih objek yang akan dibungkus dengan frame.');return true;}
		if(e.code==='Space'){space=true;e.preventDefault();return true;}
		if(k==='a'&&mod){e.preventDefault();setSel([...S]);refresh();return true;}
		if(!mod&&!e.shiftKey){
			const map={v:'select',f:'frame',r:'rect',o:'ellipse',l:'line',p:'pen',t:'text'};
			if(map[k]){setTool(map[k]);return true;}if(k==='b'){setTool('pencil');return true;}
		}
		if(!mod&&e.shiftKey&&(k==='r'||k==='o')){setTool(k==='r'?'polygon':'star');return true;}
		if(k==='enter'||k==='escape'){if(draft)finishPen();else{setTool('select');setSel([]);refresh();}return true;}
		if((k==='delete'||k==='backspace')&&selAll().length){const selected=selAll(),a=[...selected,...kidsFor(selected)].filter((s,i,x)=>x.indexOf(s)===i);S=S.filter(s=>!a.includes(s));normalize();setSel([]);refresh();save();return true;}
		if(selAll().length&&k.startsWith('arrow')){
			const d=e.shiftKey?10:1,it=selAll(),dx=k==='arrowleft'?-d:k==='arrowright'?d:0,dy=k==='arrowup'?-d:k==='arrowdown'?d:0;
			[...it,...kidsFor(it)].forEach(s=>move(s,dx,dy));syncProps();draw();save();e.preventDefault();return true;
		}
		return false;
	});
	$(window).on('keydown',e=>{
		if($(e.target).is('input,textarea,select'))return;const k=e.key.toLowerCase();
		for(const fn of MF.keys)if(fn(e,k)===true)return;
	}).on('keyup',e=>{if(e.code==='Space')space=false;});
	$(window).on('keydown keyup',e=>{if(e.key==='Alt'){if(e.type==='keydown')e.preventDefault();altDown=e.type==='keydown';draw();}});
});
