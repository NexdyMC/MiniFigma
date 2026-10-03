/* [6.10] Clipboard dan gambar. Isi: copy/paste/cut/duplikat, library gambar, paste/import gambar. Bukan di sini: simpan JSON atau render. */
function copySelection(){
	const selected=selAll();if(!selected.length)return false;const items=[...selected],queue=[...selected];
	while(queue.length){const s=queue.pop();if(s.type==='frame')kidsOf(s).forEach(k=>{if(!items.includes(k)){items.push(k);queue.push(k);}});}
	const groups=Object.values(GR).filter(g=>{const L=leavesOf(g.id);return L.length&&L.every(s=>items.includes(s));});
	clip={items:JSON.parse(JSON.stringify(items)),groups:groups.map(g=>({...g}))};return true;
}
function pasteClip(offset=20){
	if(!clip||!clip.items.length)return;const gm=new Map();clip.groups.forEach(g=>gm.set(g.id,gn++));
	clip.groups.forEach(g=>{const id=gm.get(g.id);GR[id]={id,name:g.name,pid:gm.get(g.pid)||0,c:!!g.c};});
	const ids=new Map(clip.items.map(src=>[src.id,uid++]));
	const copies=clip.items.map(src=>{const s=JSON.parse(JSON.stringify(src));s.id=ids.get(src.id);s.gid=gm.get(src.gid)||0;s.fid=ids.get(src.fid)||src.fid||0;move(s,offset,offset);return s;});
	S.push(...copies);normalize();setSel(copies);refresh();save();
}
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
	$(window).on('paste',e=>{
		if($(e.target).is('input,textarea,select'))return;const o=e.originalEvent,items=[...(o.clipboardData&&o.clipboardData.items||[])],file=items.map(i=>i.kind==='file'&&i.getAsFile()).find(Boolean);
		if(file&&file.type.startsWith('image/')){e.preventDefault();addImageFiles([file],null,true);return;}if(clip&&clip.items.length){e.preventDefault();pasteClip(o.shiftKey?0:20);}
	});
	MF.keys.push((e,k)=>{
		const mod=e.ctrlKey||e.metaKey;
		if(mod&&e.shiftKey&&k==='v'&&clip){e.preventDefault();pasteClip(0);return true;}
		if(mod&&!e.shiftKey&&k==='v'&&clip){let handled=false;$(window).one('paste',()=>{handled=true;});setTimeout(()=>{if(!handled&&clip)pasteClip(20);},0);return true;}
		if(mod&&k==='c'){if(copySelection())e.preventDefault();return true;}
		if(mod&&k==='x'&&selAll().length){e.preventDefault();copySelection();const ids=new Set(clip.items.map(s=>s.id));S=S.filter(s=>!ids.has(s.id));normalize();setSel([]);refresh();save();return true;}
		if(mod&&k==='d'&&copySelection()){e.preventDefault();pasteClip(20);return true;}return false;
	});
	MF.beforeMove.push(()=>{if(!copySelection())return false;pasteClip(0);return true;});
});
