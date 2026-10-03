/* [6.12] Frame. Isi: preset ukuran, orientasi, dan sinkronisasi panel Frame. */
const CUSTOM_FRAME_KEY='minifigma.framePresets';
let framePresetSize={w:402,h:874};

function customFramePresets(){
	try{
		const value=JSON.parse(localStorage.getItem(CUSTOM_FRAME_KEY)||'[]');
		if(!Array.isArray(value))return [];
		return value.filter(p=>p&&typeof p.name==='string'&&typeof p.category==='string'&&
			Number.isFinite(+p.w)&&Number.isFinite(+p.h)&&+p.w>=1&&+p.h>=1&&+p.w<=10000&&+p.h<=10000)
			.slice(0,40).map(p=>({name:p.name.trim().slice(0,60),category:p.category,w:Math.round(+p.w),h:Math.round(+p.h)}));
	}catch(e){
		note('Preset frame lokal tidak dapat dibaca: '+e.message);
		return [];
	}
}
function selectedPreset(){
	const index=$('#framePreset').prop('selectedIndex');
	const presets=$('#framePreset').data('presets')||[];
	return presets[index]||null;
}
function renderFramePresets(){
	const category=$('#frameCategory').val()||'Telepon';
	const rows=FRAME_PRESETS.filter(p=>p.category===category).concat(customFramePresets().filter(p=>p.category===category));
	const $preset=$('#framePreset').empty();
	rows.forEach((p,i)=>$preset.append($('<option>').val(String(i)).text(`${p.name} — ${p.w} × ${p.h}`)));
	$preset.data('presets',rows);
	const current=rows.findIndex(p=>p.w===framePresetSize.w&&p.h===framePresetSize.h);
	if(current>=0)$preset.prop('selectedIndex',current);
	else if(rows.length){
		$preset.prop('selectedIndex',0);
		framePresetSize={w:rows[0].w,h:rows[0].h};
		$('#frameW').val(framePresetSize.w);$('#frameH').val(framePresetSize.h);
	}
	$preset.prop('disabled',!rows.length);
}
function frameToolSize(){
	return {
		w:cl($('#frameW').val(),1,10000,framePresetSize.w),
		h:cl($('#frameH').val(),1,10000,framePresetSize.h)
	};
}
function applyPresetSize(){
	const preset=selectedPreset();
	if(preset)framePresetSize={w:preset.w,h:preset.h};
	const size=frameToolSize();
	framePresetSize=size;
	$('#frameW').val(size.w);$('#frameH').val(size.h);
	const frames=selAll().filter(s=>s.type==='frame');
	if(frames.length){
		frames.forEach(s=>{s.w=size.w;s.h=size.h;});
		refresh();save();
	}
}
function flipFrameOrientation(){
	const frames=selAll().filter(s=>s.type==='frame');
	const current=frames.length===1?{w:frames[0].w,h:frames[0].h}:frameToolSize();
	framePresetSize={w:current.h,h:current.w};
	$('#frameW').val(framePresetSize.w);$('#frameH').val(framePresetSize.h);
	frames.forEach(s=>{s.w=framePresetSize.w;s.h=framePresetSize.h;});
	if(frames.length){refresh();save();}
}
function wrapSelectionInFrame(){
	const selected=selAll();
	if(!selected.length)return;
	const all=[...selected,...kidsFor(selected)].filter((s,i,a)=>a.indexOf(s)===i);
	const box=ubox(all),parents=[...new Set(selected.map(frameParentOf).filter(Boolean))];
	const outer=parents.length===1?parents[0]:null,frame=mk('frame',box.x,box.y);
	frame.w=Math.max(1,box.w);frame.h=Math.max(1,box.h);frame.name='Frame '+frame.id;
	const roots=all.filter(s=>{const p=frameParentOf(s);return !p||!all.includes(p);});
	const at=Math.min(...all.map(s=>S.indexOf(s)));
	S.splice(at,0,frame);setFrameParent(frame,outer);roots.forEach(s=>setFrameParent(s,frame));
	normalize();setSel([frame]);refresh();save();
}
function releaseSelectedFrame(){
	if(!sel||sel.type!=='frame')return;
	const frame=sel,outer=frameParentOf(frame),direct=S.filter(s=>frameParentOf(s)===frame);
	direct.forEach(s=>setFrameParent(s,outer));S=S.filter(s=>s!==frame);
	normalize();setSel(direct);refresh();save();
}
function frameToGroup(){
	if(!sel||sel.type!=='frame')return;
	const frame=sel,outer=frameParentOf(frame),direct=S.filter(s=>frameParentOf(s)===frame);
	if(!direct.length){note('Frame ini tidak memiliki isi untuk dijadikan grup.');return;}
	const id=gn++,existing=direct.map(s=>s.gid||0);
	const pid=existing.every(g=>g===existing[0])?existing[0]:0;
	GR[id]={id,name:frame.name.replace(/^Frame/,'Grup').trim()||'Grup '+id,pid};
	const groups=new Set(existing.filter(Boolean));
	direct.forEach(s=>{
		setFrameParent(s,outer);
		if(s.gid&&groups.has(s.gid)&&leavesOf(s.gid).every(x=>direct.includes(x)))GR[s.gid].pid=id;
		else s.gid=id;
	});
	S=S.filter(s=>s!==frame);normalize();setSel(direct);refresh();save();
}
function persistFramePreset(name){
	if(!sel||sel.type!=='frame'){note('Pilih satu frame untuk menyimpan ukurannya sebagai preset.');return;}
	if(!name||!name.trim()){note('Nama preset tidak boleh kosong.');return;}
	const category=$('#frameCategory').val()||'Kustom';
	const preset={name:name.trim().slice(0,60),category,w:Math.round(sel.w),h:Math.round(sel.h)};
	try{
		const rows=customFramePresets();
		if(rows.length>=40){note('Maksimal 40 preset buatan sendiri.');return;}
		localStorage.setItem(CUSTOM_FRAME_KEY,JSON.stringify([...rows,preset]));
		$('#frameCategory').val(category);renderFramePresets();note('Preset disimpan: '+preset.name);
	}catch(e){note('Preset frame tidak dapat disimpan: '+e.message);}
}
function saveFramePreset(){
	if(!sel||sel.type!=='frame'){note('Pilih satu frame untuk menyimpan ukurannya sebagai preset.');return;}
	$('#framePresetName').val(sel.name).trigger('focus').trigger('select');
	$('#framePresetDlg')[0].showModal();
}
function syncFramePanel(){
	const selected=selAll(),frames=selected.filter(s=>s.type==='frame');
	const show=tool==='frame'||frames.length>0;
	const selectedFrame=selected.length===1&&frames.length===1?frames[0]:null;
	$('#framepanel').toggleClass('hidden',!show);
	$('#frameSmoothRow').toggle(frames.length>0||selected.some(s=>s.type==='rect'));
	$('#frameClipRow').toggle(!!selectedFrame);
	$('#frameClip').prop('checked',selectedFrame?selectedFrame.clipContent!==false:true).prop('disabled',!selectedFrame);
	$('#frameWrap').prop('disabled',!selected.length);
	$('#groupToFrame').prop('disabled',!selected.length);
	$('#frameRelease,#frameToGroup,#frameSavePreset,#frameRotate').prop('disabled',!selectedFrame);
	if(selectedFrame){
		framePresetSize={w:Math.round(selectedFrame.w),h:Math.round(selectedFrame.h)};
		$('#frameW').val(framePresetSize.w);$('#frameH').val(framePresetSize.h);
		$('#frameSmooth').val(cl(selectedFrame.smooth,0,100,0));
		$('#frameSmoothValue').text(cl(selectedFrame.smooth,0,100,0)+'%');
	}else if(show){
		$('#frameW').val(framePresetSize.w);$('#frameH').val(framePresetSize.h);
		$('#frameSmooth').val(0);$('#frameSmoothValue').text('0%');
	}
}
MF.init.push(function initFramePresetDialog(){
	$('#framePresetConfirm').on('click',()=>{
		const name=$('#framePresetName').val();
		$('#framePresetDlg')[0].close();persistFramePreset(name);
	});
	$('#framePresetCancel').on('click',()=>$('#framePresetDlg')[0].close());
	$('#framePresetName').on('keydown',e=>{
		if(e.key==='Enter'){e.preventDefault();$('#framePresetConfirm').trigger('click');}
		if(e.key==='Escape')$('#framePresetDlg')[0].close();
	});
});