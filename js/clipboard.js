/* [6.10] Clipboard dan gambar. Isi: copy/paste/cut/duplikat, library gambar, paste/import gambar. Bukan di sini: simpan JSON atau render. */
function clipboardSnapshot(items){
	const all=[...items],queue=[...items];
	while(queue.length){const s=queue.pop();if(s.type==='frame')kidsOf(s).forEach(child=>{if(!all.includes(child)){all.push(child);queue.push(child);}});}
	const ordered=S.filter(s=>all.includes(s)),ids=new Set(ordered.map(s=>s.id));
	const groups=Object.values(GR).filter(g=>leavesOf(g.id).some(s=>ids.has(s.id)))
		.map(g=>({id:g.id,pid:g.pid||0,name:g.name,c:!!g.c}));
	const layers=ordered.map(s=>{const layer=ser(s);delete layer.children;layer.group_id=s.gid||0;return layer;});
	const bounds=ubox(ordered);
	return {items:layers,groups,origin:{x:bounds.x,y:bounds.y}};
}
function doCopy(){
	const selected=selAll();if(!selected.length)return false;
	clip={data:clipboardSnapshot(selected),n:0};return true;
}
function saveClipboardStep(){save();flush();}
function doCut(){
	if(!doCopy())return false;
	flush();
	const removed=[...selAll(),...kidsFor(selAll())],set=new Set(removed);
	S=S.filter(s=>!set.has(s));normalize();setSel([]);refresh();saveClipboardStep();return true;
}
function clipboardDataValid(data){
	if(!data||typeof data!=='object'||!Array.isArray(data.items)||!data.items.length||data.items.length>5000||
		!Array.isArray(data.groups)||data.groups.length>1000||!data.origin||typeof data.origin!=='object')return false;
	const ids=new Set(),groupIds=new Set();let points=0;
	for(const g of data.groups){
		if(!g||!Number.isInteger(g.id)||g.id<1||groupIds.has(g.id)||!Number.isInteger(g.pid)||g.pid<0||typeof g.name!=='string'||g.name.length>80)return false;
		groupIds.add(g.id);
	}
	for(const layer of data.items){
		if(!layer||!Number.isInteger(layer.id)||layer.id<1||ids.has(layer.id)||!Object.prototype.hasOwnProperty.call(T_IN,layer.type)||
			!layer.setting||typeof layer.setting!=='object'||Array.isArray(layer.setting)||
			!Number.isInteger(layer.fid)||layer.fid<0||!Number.isInteger(layer.group_id)||layer.group_id<0||
			Object.prototype.hasOwnProperty.call(layer,'children'))return false;
		ids.add(layer.id);
		const pos=layer.setting.position||{},layout=layer.setting.layout||{};
		if(!Number.isFinite(+pos.x)||!Number.isFinite(+pos.y)||Math.abs(+pos.x)>1e7||Math.abs(+pos.y)>1e7||
			!Number.isFinite(+layout.width)||!Number.isFinite(+layout.height)||Math.abs(+layout.width)>1e7||Math.abs(+layout.height)>1e7)return false;
		const path=layer.setting.path;
		if(path){
			if(!Array.isArray(path.points)||path.points.length<2)return false;
			points+=path.points.length;if(points>20000)return false;
			if(path.points.some(p=>!p||!Number.isFinite(+p.x)||!Number.isFinite(+p.y)||Math.abs(+p.x)>1e7||Math.abs(+p.y)>1e7))return false;
		}
	}
	if(data.items.some(layer=>(layer.group_id&&!groupIds.has(layer.group_id))||(layer.fid&&ids.has(layer.fid)&&!data.items.some(parent=>parent.id===layer.fid&&parent.type==='frame'))))return false;
	if(data.groups.some(group=>group.pid&&!groupIds.has(group.pid)))return false;
	for(const group of data.groups){const seen=new Set([group.id]);let parent=group;while(parent.pid){if(seen.has(parent.pid))return false;seen.add(parent.pid);parent=data.groups.find(item=>item.id===parent.pid);}}
	for(const layer of data.items){const seen=new Set([layer.id]);let parent=data.items.find(item=>item.id===layer.fid);while(parent){if(seen.has(parent.id))return false;seen.add(parent.id);parent=data.items.find(item=>item.id===parent.fid);}}
	return Number.isFinite(+data.origin.x)&&Number.isFinite(+data.origin.y)&&Math.abs(+data.origin.x)<=1e7&&Math.abs(+data.origin.y)<=1e7;
}
function clipboardText(){
	if(!clip||!clipboardDataValid(clip.data))return '';
	return JSON.stringify({minifigma:1,version:FMT_VERSION,data:clip.data});
}
function copyClipboardText(e){
	if(isTextTarget(e.target))return false;
	if(!clip&&!doCopy())return false;
	const text=clipboardText();if(!text||text.length>5*1024*1024)return false;
	if(e.clipboardData){e.clipboardData.setData('text/plain',text);e.preventDefault();}
	return true;
}
function parseClipboardText(text){
	if(typeof text!=='string'||text.length>5*1024*1024)return null;
	try{
		const payload=JSON.parse(text);
		return payload&&payload.minifigma===1&&clipboardDataValid(payload.data)?payload.data:null;
	}catch(e){return null;}
}
function pasteData(data,inPlace=false,atPoint=null,targetClip=null){
	if(!clipboardDataValid(data))return false;
	flush();
	const oldUid=uid,oldGn=gn;let sources;
	try{sources=data.items.map(layer=>des(layer));}catch(e){uid=oldUid;gn=oldGn;return false;}
	if(sources.some(s=>!s)){uid=oldUid;gn=oldGn;return false;}
	const ids=new Map(data.items.map((layer,i)=>[layer.id,sources[i].id])),gm=new Map();
	data.groups.forEach(g=>gm.set(g.id,newGid()));
	data.groups.forEach(g=>{const id=gm.get(g.id);GR[id]={id,name:g.name,pid:gm.get(g.pid)||0,c:!!g.c};});
	const sourceBounds=ubox(sources),origin=data.origin||{x:sourceBounds.x,y:sourceBounds.y};
	let dx=0,dy=0;
	if(atPoint){dx=atPoint[0]-origin.x;dy=atPoint[1]-origin.y;}
	else if(!inPlace){const holder=targetClip||clip;holder.n=(holder.n||0)+1;dx=dy=holder.n*10;}
	const copies=sources.map((s,i)=>{
		const layer=data.items[i],sourceFid=layer.fid;
		s.gid=gm.get(layer.group_id)||0;
		s.fid=ids.get(sourceFid)||(S.some(parent=>parent.id===sourceFid&&parent.type==='frame')?sourceFid:0);
		move(s,dx,dy);return s;
	});
	S.push(...copies);reportIdRepairs(ensureUniqueIds());normalize();setSel(copies);refresh();saveClipboardStep();return true;
}
function doPaste(inPlace=false,atPoint=null){
	if(!clip||!clipboardDataValid(clip.data))return false;
	return pasteData(clip.data,inPlace,atPoint,clip);
}
function doDuplicate(){
	const selected=selAll();if(!selected.length)return false;
	const temp={data:clipboardSnapshot(selected),n:0};return pasteData(temp.data,false,null,temp);
}
function duplicateAtOrigin(){
	const selected=selAll();if(!selected.length)return false;
	const temp={data:clipboardSnapshot(selected),n:0};return pasteData(temp.data,true,null,temp);
}
function isTextTarget(target){return !!$(target).closest('input,textarea,select,[contenteditable="true"]').length;}
function cmRow(key,label,shortcut='',arrow=false,check=false){
	return `<button type="button" class="cm-action flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#0d99ff] hover:text-white" data-cm="${key}" tabindex="-1"><span class="cm-check w-4 shrink-0">${check?I('check',14):''}</span><span class="flex-1">${label}</span><span class="cm-shortcut text-neutral-400">${shortcut}</span>${arrow?`<span class="cm-arrow text-neutral-400">${I('chevron-right',14)}</span>`:''}</button>`;
}
function createContextMenu(){
	const menu=`<div id="mfContextMenu" class="fixed z-[100] hidden w-60 select-none rounded-lg border border-black bg-[#2c2c2c] py-1 text-xs text-neutral-200 shadow-xl">
		${cmRow('copy','Salin','Ctrl+C')}${cmRow('cut','Potong','Ctrl+X')}${cmRow('paste-here','Tempel di sini','Ctrl+V')}${cmRow('paste-place','Tempel di tempat','Ctrl+Shift+V')}${cmRow('duplicate','Duplikat','Ctrl+D')}
		<div class="cm-subwrap relative">${cmRow('submenu-copy','Salin sebagai','',true)}<div class="cm-submenu hidden w-48 rounded-lg border border-black bg-[#2c2c2c] py-1 shadow-xl">${cmRow('png','PNG','Ctrl+Shift+C')}</div></div>
		<div class="my-1 border-t border-neutral-700"></div>
		${cmRow('front','Ke paling depan','Ctrl+Shift+]')}${cmRow('forward','Maju satu lapis','Ctrl+]')}${cmRow('backward','Mundur satu lapis','Ctrl+[')}${cmRow('back','Ke paling belakang','Ctrl+Shift+[')}
		<div class="my-1 border-t border-neutral-700"></div>
		${cmRow('group','Kelompokkan seleksi','Ctrl+G')}${cmRow('ungroup','Pisahkan grup','Ctrl+Shift+G')}${cmRow('hide','Sembunyikan')}${cmRow('lock','Kunci')}${cmRow('delete','Hapus','Del')}
		<div class="my-1 border-t border-neutral-700"></div>
		${cmRow('save','Simpan sebagai JSON','Ctrl+S')}
		<div class="cm-subwrap relative">${cmRow('submenu-view','Tampilan','',true)}<div class="cm-submenu hidden w-52 rounded-lg border border-black bg-[#2c2c2c] py-1 shadow-xl">${cmRow('toggle-minimap','Minimap','',false,true)}${cmRow('toggle-ruler','Penggaris','Shift+R',false,true)}${cmRow('toggle-grid','Grid piksel','',false,true)}${cmRow('toggle-snap-grid','Magnet grid','',false,true)}${cmRow('toggle-snap-object','Magnet objek','',false,true)}</div></div>
	</div>`;
	$(document.body).append(menu);
	const $menu=$('#mfContextMenu');
	$menu.on('mousedown contextmenu',e=>{e.preventDefault();e.stopPropagation();});
	$menu.on('click','.cm-action',function(e){
		e.preventDefault();e.stopPropagation();const key=$(this).data('cm');
		if($(this).hasClass('is-disabled'))return;
		if(key==='submenu-copy'||key==='submenu-view'){openContextSubmenu(this);return;}
		closeContextMenu();
		const actions={
			copy:copyToSystemClipboard,cut:cutToSystemClipboard,
			'paste-here':()=>doPaste(false,contextWorldPoint),'paste-place':()=>doPaste(true),
			duplicate:doDuplicate,png:copyPNG,
			front:()=>zmove('front'),forward:()=>zmove('fwd'),backward:()=>zmove('bwd'),back:()=>zmove('back'),
			group:groupSel,ungroup:ungroupSel,hide:toggleSelectedVisibility,lock:toggleSelectedLock,delete:deleteSelection,
			save:()=>$('#jsave').trigger('click'),
			'toggle-minimap':()=>setNavigationView('minimap',!navigationView('minimap')),
			'toggle-ruler':()=>setNavigationView('ruler',!navigationView('ruler')),
			'toggle-grid':()=>$('#cg').prop('checked',!chk('#cg')).trigger('change'),
			'toggle-snap-grid':()=>$('#mg').prop('checked',!chk('#mg')).trigger('change'),
			'toggle-snap-object':()=>$('#mo').prop('checked',!chk('#mo')).trigger('change')
		};
		const action=actions[key];if(action){const result=action();if(result&&typeof result.catch==='function')result.catch(err=>note('Operasi gagal: '+err.message));}
	});
	$menu.on('mouseenter','.cm-subwrap',function(){clearTimeout(contextSubTimer);contextSubTimer=setTimeout(()=>openContextSubmenu($(this).children('.cm-action')[0]),150);})
		.on('mouseleave','.cm-subwrap',function(){clearTimeout(contextSubTimer);contextSubTimer=setTimeout(()=>$(this).children('.cm-submenu').addClass('hidden'),150);})
		.on('mouseenter','.cm-submenu',function(){clearTimeout(contextSubTimer);});
}
let contextWorldPoint=null,contextSubTimer=null,contextPasteRequest=null,contextMenuOpen=false;
function openContextSubmenu(trigger){
	const $row=$(trigger),$wrap=$row.closest('.cm-subwrap'),$submenu=$wrap.children('.cm-submenu');
	$('#mfContextMenu .cm-submenu').not($submenu).addClass('hidden');
	$submenu.removeClass('hidden').css({position:'fixed',left:0,top:0,right:'auto'});
	const r=$row[0].getBoundingClientRect(),s=$submenu[0].getBoundingClientRect(),gap=2;
	const left=r.right+s.width+gap<=window.innerWidth-4?r.right+gap:Math.max(4,r.left-s.width-gap);
	const top=Math.max(4,Math.min(r.top,window.innerHeight-s.height-4));
	$submenu.css({left,top});
}
function closeContextMenu(){
	clearTimeout(contextSubTimer);contextMenuOpen=false;contextPasteRequest=null;
	$('#mfContextMenu').addClass('hidden').find('.cm-submenu').addClass('hidden');
}
function contextMenuState(){
	const selected=selAll(),has=selected.length>0,hasGroup=!!selG||selected.some(s=>!!s.gid);
	const $menu=$('#mfContextMenu'),disable=['copy','cut','duplicate','front','forward','backward','back','hide','lock','delete'];
	disable.forEach(key=>$menu.find(`[data-cm="${key}"]`).toggleClass('is-disabled',!has));
	$menu.find('[data-cm="paste-here"],[data-cm="paste-place"]').toggleClass('is-disabled',!clip||!clipboardDataValid(clip.data));
	$menu.find('[data-cm="group"]').toggleClass('is-disabled',selected.length<2);
	$menu.find('[data-cm="ungroup"]').toggleClass('is-disabled',!hasGroup);
	const allHidden=has&&selected.every(s=>s.hid),allLocked=has&&selected.every(s=>s.lock);
	$menu.find('[data-cm="hide"] span.flex-1').text(allHidden?'Tampilkan':'Sembunyikan');
	$menu.find('[data-cm="lock"] span.flex-1').text(allLocked?'Buka kunci':'Kunci');
	$menu.find('[data-cm="toggle-minimap"] .cm-check').html(navigationView('minimap')?I('check',14):'');
	$menu.find('[data-cm="toggle-ruler"] .cm-check').html(navigationView('ruler')?I('check',14):'');
	$menu.find('[data-cm="toggle-grid"] .cm-check').html(chk('#cg')?I('check',14):'');
	$menu.find('[data-cm="toggle-snap-grid"] .cm-check').html(chk('#mg')?I('check',14):'');
	$menu.find('[data-cm="toggle-snap-object"] .cm-check').html(chk('#mo')?I('check',14):'');
}
function openContextMenu(x,y){
	const $menu=$('#mfContextMenu');contextMenuState();$menu.removeClass('hidden').css({left:0,top:0});
	const w=$menu.outerWidth(),h=$menu.outerHeight();
	$menu.css({left:Math.max(4,Math.min(x,window.innerWidth-w-4)),top:Math.max(4,Math.min(y,window.innerHeight-h-4))});
	contextMenuOpen=true;
}
function toggleSelectedVisibility(){
	const selected=selAll();if(!selected.length)return;
	const show=selected.every(s=>s.hid);selected.forEach(s=>{s.hid=!show;});refresh();save();
}
function toggleSelectedLock(){
	const selected=selAll();if(!selected.length)return;
	const unlock=selected.every(s=>s.lock);selected.forEach(s=>{s.lock=!unlock;});refresh();save();
}
function deleteSelection(){
	const selected=selAll();if(!selected.length)return false;
	const removed=new Set([...selected,...kidsFor(selected)]);S=S.filter(s=>!removed.has(s));normalize();setSel([]);refresh();save();return true;
}
function copyToSystemClipboard(){
	if(!doCopy())return false;
	try{document.execCommand('copy');}catch(e){}
	return true;
}
function cutToSystemClipboard(){
	if(!selAll().length)return false;
	doCopy();cutEventHandled=false;
	try{document.execCommand('cut');}catch(e){}
	if(!cutEventHandled)doCut();
	return true;
}
let cutEventHandled=false;
function saveImageLibrary(){try{localStorage.setItem(IMG_KEY,JSON.stringify(imgLib));return true;}catch(e){return false;}}
function loadImageLibrary(){
	try{const a=JSON.parse(localStorage.getItem(IMG_KEY)||'[]');if(Array.isArray(a))imgLib=a.filter(x=>x&&typeof x.src==='string'&&/^data:image\/(png|jpeg|webp|gif|bmp);base64,/i.test(x.src)).slice(0,6);}catch(e){imgLib=[];}
}
function insertImage(a,x,y){
	const scale=Math.min(1,500/a.w,500/a.h),s=mk('image',x,y);s.src=a.src;s.assetId=a.id;s.sourceName=a.name;s.name=(a.name.replace(/\.[^.]+$/,'')||'Gambar').slice(0,80);
	s.w=Math.max(1,Math.round(a.w*scale));s.h=Math.max(1,Math.round(a.h*scale));S.push(s);setSel([s]);refresh();save();
}
function renderImageLibrary(){
	const $lib=$('#imglib').empty();$('#imgcount').text(imgLib.length+' / 6');
	for(let i=0;i<6;i++){
		const a=imgLib[i],$tile=$('<div class="min-h-36 border border-neutral-700 rounded p-2 flex flex-col gap-2"></div>').appendTo($lib);
		if(!a){$tile.addClass('items-center justify-center text-neutral-500').text('Slot kosong');continue;}
		$('<img class="w-full h-20 object-contain bg-[#1e1e1e]">').attr('src',a.src).attr('alt',a.name).appendTo($tile);
		$('<span class="truncate" title="'+$('<span>').text(a.name).html()+'"></span>').text(a.name).appendTo($tile);
		const $actions=$('<div class="flex gap-1 mt-auto"></div>').appendTo($tile);
		$('<button class="flex-1 px-2 py-1 rounded bg-[#0d99ff] text-white">Pakai</button>').appendTo($actions).on('click',()=>{const p=s2w(cv.clientWidth/2,cv.clientHeight/2);insertImage(a,p[0],p[1]);$('#imgdlg')[0].close();});
		$('<button class="px-2 py-1 rounded hover:bg-neutral-700">Hapus</button>').appendTo($actions).on('click',()=>{imgLib=imgLib.filter(x=>x.id!==a.id);if(saveImageLibrary())renderImageLibrary();else note('Library tidak dapat disimpan: ruang penyimpanan penuh.');});
	}
}
function readImage(file){
	return new Promise((resolve,reject)=>{
		const reader=new FileReader();reader.onerror=()=>reject(new Error('Gagal membaca file gambar.'));
		reader.onload=()=>{const img=new Image();img.onload=()=>resolve({src:reader.result,w:img.naturalWidth,h:img.naturalHeight});img.onerror=()=>reject(new Error('File gambar tidak valid.'));img.src=reader.result;};reader.readAsDataURL(file);
	});
}
async function addImageFiles(files,point,insert){
	const list=[...files];let added=0;
	for(const file of list){
		if(!/^image\/(png|jpeg|webp|gif|bmp)$/i.test(file.type)){note('Format gambar harus PNG, JPEG, WebP, GIF, atau BMP.');continue;}
		if(imgLib.length>=6){note('Library penuh. Hapus gambar lama sebelum mengunggah lagi.');break;}if(file.size>MAX_IMAGE){note('Ukuran gambar maksimal 1 MB per file.');continue;}
		try{
			const im=await readImage(file),used=imgLib.reduce((n,a)=>n+(a.bytes||0),0);if(used+file.size>MAX_IMAGE_TOTAL){note('Total library dibatasi 1,4 MB agar muat di localStorage.');break;}
			const a={id:'img-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:file.name.slice(0,100)||'Gambar',src:im.src,w:im.w,h:im.h,bytes:file.size};imgLib.push(a);
			if(!saveImageLibrary()){imgLib.pop();note('Gagal menyimpan gambar: ruang localStorage penuh.');break;}
			if(insert){const p=point||s2w(cv.clientWidth/2,cv.clientHeight/2);insertImage(a,p[0]+added*20,p[1]+added*20);}added++;renderImageLibrary();
		}catch(e){note(e.message);}
	}
	if(added&&!insert)note('Gambar tersimpan di library lokal.');
}
MF.init.push(function initClipboard(){
	loadImageLibrary();renderImageLibrary();
	$('#imgopen').on('click',()=>{renderImageLibrary();$('#imgdlg')[0].showModal();});$('#imgclose').on('click',()=>$('#imgdlg')[0].close());
	$('#imgupload').on('click',()=>$('#imgfile').trigger('click'));$('#imgfile').on('change',function(){const files=this.files;this.value='';if(files.length)addImageFiles(files,null,false);});
	$('#wrap').on('dragover',e=>{if([...e.originalEvent.dataTransfer.items].some(i=>i.kind==='file'))e.preventDefault();}).on('drop',e=>{
		const files=[...e.originalEvent.dataTransfer.files].filter(f=>f.type.startsWith('image/'));if(!files.length)return;e.preventDefault();const r=cv.getBoundingClientRect(),p=s2w(e.originalEvent.clientX-r.left,e.originalEvent.clientY-r.top);addImageFiles(files,p,true);
	});
	createContextMenu();
	document.addEventListener('copy',e=>{copyClipboardText(e);});
	document.addEventListener('cut',e=>{
		if(isTextTarget(e.target)||!selAll().length)return;
		doCopy();const text=clipboardText();
		if(e.clipboardData&&text){e.clipboardData.setData('text/plain',text);e.preventDefault();}
		cutEventHandled=true;doCut();
	});
	document.addEventListener('paste',e=>{
		if(isTextTarget(e.target))return;
		const clipboard=e.clipboardData,files=clipboard&&clipboard.files?[...clipboard.files]:[];
		if(files.some(file=>file.type.startsWith('image/'))){contextPasteRequest=null;return;}
		const request=contextPasteRequest;contextPasteRequest=null;
		const text=clipboard&&clipboard.getData('text/plain'),data=parseClipboardText(text);
		if(data){
			if(clip&&text===clipboardText()){
				if(doPaste(request?request.inPlace:!!e.shiftKey))e.preventDefault();
				return;
			}
			const previous=clip,incoming={data,n:0};clip=incoming;
			if(pasteData(data,request?request.inPlace:!!e.shiftKey,null,incoming)){e.preventDefault();return;}
			clip=previous;
		}
		if(clip&&doPaste(request?request.inPlace:!!e.shiftKey))e.preventDefault();
	});
	$(window).on('paste',e=>{
		if(isTextTarget(e.target))return;
		const o=e.originalEvent,items=[...(o.clipboardData&&o.clipboardData.items||[])],file=items.map(i=>i.kind==='file'&&i.getAsFile()).find(Boolean);
		if(file&&file.type.startsWith('image/')){e.preventDefault();addImageFiles([file],null,true);}
	});
	$('#wrap').on('contextmenu',e=>{
		e.preventDefault();
		if(drag||draft)return;
		const original=e.originalEvent||e,c=mouseContext(original);
		contextWorldPoint=[c.wx,c.wy];selectCanvasAt(original,c);openContextMenu(original.clientX,original.clientY);
	});
	document.addEventListener('mousedown',e=>{
		if(!contextMenuOpen||$('#mfContextMenu')[0].contains(e.target))return;
		closeContextMenu();e.preventDefault();e.stopPropagation();
	},true);
	document.addEventListener('scroll',closeContextMenu,true);
	document.addEventListener('wheel',closeContextMenu,{capture:true,passive:true});
	$(window).on('resize blur',closeContextMenu);
	document.addEventListener('keydown',e=>{
		if(!contextMenuOpen)return;
		const $menu=$('#mfContextMenu');
		if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeContextMenu();return;}
		const $items=$menu.find('.cm-action:visible').not('.is-disabled');
		if(e.key==='ArrowDown'||e.key==='ArrowUp'){
			e.preventDefault();e.stopImmediatePropagation();let index=$items.index(document.activeElement);
			index=(index+(e.key==='ArrowDown'?1:-1)+$items.length)%$items.length;$items.eq(index).trigger('focus');return;
		}
		if(e.key==='ArrowRight'){
			const $active=$(document.activeElement);if($active.closest('.cm-subwrap').length){e.preventDefault();e.stopImmediatePropagation();openContextSubmenu($active[0]);const $first=$active.siblings('.cm-submenu').find('.cm-action:visible:not(.is-disabled)').first();$first.trigger('focus');}return;
		}
		if(e.key==='ArrowLeft'){
			const $active=$(document.activeElement),$sub=$active.closest('.cm-submenu');
			if($sub.length){e.preventDefault();e.stopImmediatePropagation();const $trigger=$sub.siblings('.cm-action');$sub.addClass('hidden');$trigger.trigger('focus');}return;
		}
		if(e.key==='Enter'&&$(document.activeElement).is('.cm-action')){
			e.preventDefault();e.stopImmediatePropagation();$(document.activeElement).trigger('click');
		}
	},true);
	MF.keys.push((e,k)=>{
		const mod=e.ctrlKey||e.metaKey;
		if(mod&&e.shiftKey&&k==='c'){e.preventDefault();copyPNG();return true;}
		if(mod&&k==='c'&&!e.shiftKey){if(!selAll().length)return false;e.preventDefault();copyToSystemClipboard();return true;}
		if(mod&&k==='x'&&!e.shiftKey&&selAll().length){e.preventDefault();cutToSystemClipboard();return true;}
		if(mod&&k==='v'){
			contextPasteRequest={inPlace:!!e.shiftKey};
			const request=contextPasteRequest;
			setTimeout(()=>{if(contextPasteRequest===request){contextPasteRequest=null;if(clip)doPaste(request.inPlace);}},0);
			return true;
		}
		if(mod&&k==='d'&&!e.shiftKey&&selAll().length){e.preventDefault();doDuplicate();return true;}
		return false;
	});
	MF.beforeMove.push(()=>duplicateAtOrigin());
});
