/* [6.6] Panel properti. Isi: UI dan input properti kanan, warna, align, transform numerik. Bukan di sini: layer atau daftar efek. */
const ic=(v,p)=>{
	const L=[2,8,14][p],st=w=>p?(p===1?8-w/2:12-w):4;let s=v?`<rect x="1" y="${L-.5}" width="14" height="1"/>`:`<rect x="${L-.5}" y="1" width="1" height="14"/>`;
	[[10,4],[6,9]].forEach(([w,o])=>{s+=v?`<rect x="${o}" y="${st(w)}" width="3" height="${w}"/>`:`<rect x="${st(w)}" y="${o}" width="${w}" height="3"/>`;});
	return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">${s}</svg>`;
};
const each=fn=>{selAll().forEach(fn);draw();save();};
const one=fn=>()=>{if(sel){fn(sel);draw();save();}};
const hex=v=>{v=(v||'').trim();if(v[0]!=='#')v='#'+v;return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():null;};
const PALETTE_KEY='minifigma.palette',MAX_PALETTE=24;
let colorPick=null;
function basePaint(kind,color){
	return kind==='fill'?{type:'solid',color:color||'#d9d9d9',color2:'#ffffff',angle:0,opacity:100,visible:true}:
		{type:'solid',color:color||'#d9d9d9',color2:'#ffffff',angle:0,opacity:100,visible:true,weight:1,position:'center',dash:'solid',cap:'butt',join:'round',startArrow:'none',endArrow:'none'};
}
function gradientPreview(p){
	const c1=hex(p.color)||'#d9d9d9',c2=hex(p.color2)||c1,a=cl(p.angle,0,360,0);
	if(p.type==='radial')return `radial-gradient(circle,${c1} 0%,${c2} 100%)`;
	if(p.type==='angular')return `conic-gradient(from ${a}deg,${c1},${c2},${c1})`;
	return `linear-gradient(${a}deg,${c1} 0%,${c2} 100%)`;
}
function syncGradientPreview($card,p){
	if(p.type==='solid'){$card.find('[data-gradient-preview]').css('background','');return;}
	$card.find('[data-gradient-preview]').css('background',gradientPreview(p));
}
function updateGradientCard($card){
	const type=$card.find('[data-k="type"]').val(),p={
		type,color:$card.find('[data-k="color"]').val(),color2:$card.find('[data-k="color2"]').val(),
		angle:$card.find('[data-k="angle"]').val()
	};
	$card.find('[data-gradient]').toggleClass('hidden',type==='solid');
	$card.find('[data-start-label]').text(type==='solid'?'Warna':'Awal · 0%');
	syncGradientPreview($card,{...p,type});
}
function setPaintValue(kind,index,key,value){
	const selected=selAll(),source=selected.length?getPaintLayers(selected[0],kind)[index]:null,template=source||basePaint(kind);
	selected.forEach(s=>{
		const layers=ensurePaintLayers(s,kind);
		while(layers.length<=index)layers.push({...template});
		layers[index][key]=value;syncLegacyPaint(s,kind);
	});
	draw();save();
}
function addPaint(kind){
	const selected=selAll();if(!selected.length)return;
	selected.forEach(s=>{
		const layers=ensurePaintLayers(s,kind),first=layers[0],p=first?{...basePaint(kind,first.color),...first,type:'solid',visible:true,opacity:100}:basePaint(kind,kind==='fill'?s.fill:s.stroke);
		if(kind==='stroke')p.weight=p.weight||1;
		layers.push(p);syncLegacyPaint(s,kind);
	});refresh();save();
}
function removePaint(kind,index){
	selAll().forEach(s=>{const a=ensurePaintLayers(s,kind);a.splice(index,1);syncLegacyPaint(s,kind);});refresh();save();
}
function paintCard(kind,index,p){
	const stroke=kind==='stroke',gradient=p.type!=='solid',color=hex(p.color)||'#d9d9d9';
	const actions=`<button type="button" data-action="pick" class="p-1 rounded hover:bg-neutral-600" title="Pipet warna" aria-label="Pipet warna">${FAIcon('dropper')}</button><button type="button" data-action="visible" class="p-1 rounded hover:bg-neutral-600" title="${p.visible===false?'Tampilkan':'Sembunyikan'}" aria-label="${p.visible===false?'Tampilkan':'Sembunyikan'}">${FAIcon(p.visible===false?'eyeSlash':'eye')}</button><button type="button" data-action="delete" class="p-1 rounded hover:bg-neutral-600" title="Hapus lapisan" aria-label="Hapus lapisan">${FAIcon('trash')}</button>`;
	const gradients='<option value="solid">Solid</option><option value="linear">Linear</option><option value="radial">Radial</option><option value="angular">Angular</option>';
	return `<div class="rounded bg-[#383838] p-2 space-y-2" data-kind="${kind}" data-index="${index}">
		<div class="flex items-center justify-between"><span class="text-neutral-300">${stroke?'Garis':'Isi'} ${index+1}</span><div class="flex items-center">${actions}</div></div>
		<div class="flex items-center gap-1"><span data-start-label class="w-14 shrink-0 text-neutral-400">${gradient?'Awal · 0%':'Warna'}</span><input data-k="color" type="color" value="${color}" aria-label="Warna awal ${stroke?'garis':'isi'}"><input data-k="hex" value="${color}" maxlength="7" class="num !w-[72px] uppercase" aria-label="Kode warna awal"></div>
		<div class="grid items-center gap-2"><span class="text-neutral-400 w-8">Opasitas</span><input data-k="opacity" type="range" min="0" max="100" value="${cl(p.opacity,0,100,100)}" class="flex-1 accent-[#0d99ff]"><span data-value="opacity" class="w-8 text-right">${cl(p.opacity,0,100,100)}%</span></div>
		<label class="flex items-center gap-2"><span class="text-neutral-400 w-8">${stroke?'Jenis':'Isi'}</span><select data-k="type" class="num flex-1">${gradients}</select></label>
		<div data-gradient class="${gradient?'':'hidden'} space-y-2">
			<div data-gradient-preview role="img" aria-label="Pratinjau gradien" class="h-7 rounded border border-white/20" style="${gradient?`background:${gradientPreview(p)}`:''}"></div>
			<div class="flex items-center gap-1"><span class="w-14 shrink-0 text-neutral-400">Akhir · 100%</span><input data-k="color2" type="color" value="${hex(p.color2)||'#ffffff'}" aria-label="Warna akhir gradien"><input data-k="hex2" value="${hex(p.color2)||'#ffffff'}" maxlength="7" class="num !w-[72px] uppercase" aria-label="Kode warna akhir gradien"></div>
			<div class="flex items-center gap-2"><span class="text-neutral-400">Sudut</span><input data-k="angleRange" type="range" min="0" max="360" value="${cl(p.angle,0,360,0)}" class="flex-1 accent-[#0d99ff]"><input data-k="angle" type="number" min="0" max="360" class="num !w-16" value="${cl(p.angle,0,360,0)}" aria-label="Sudut gradien"></div>
		</div>
		${stroke?`<div class="grid grid-cols-2 gap-2"><label>Berat<input data-k="weight" type="number" min="0.1" max="200" step="0.5" class="num" value="${cl(p.weight,.1,200,1)}"></label><label>Posisi<select data-k="position" class="num"><option value="center">Tengah</option><option value="inside">Dalam</option><option value="outside">Luar</option></select></label><label>Garis<select data-k="dash" class="num"><option value="solid">Solid</option><option value="dash">Putus</option><option value="dot">Titik</option><option value="dashDot">Garis-titik</option></select></label><label>Ujung<select data-k="cap" class="num"><option value="butt">Rata</option><option value="round">Bulat</option><option value="square">Kotak</option></select></label><label>Sambungan<select data-k="join" class="num"><option value="round">Bulat</option><option value="miter">Tajam</option><option value="bevel">Miring</option></select></label><label>Awal<select data-k="startArrow" class="num"><option value="none">Tanpa panah</option><option value="arrow">Panah</option><option value="triangle">Segitiga</option><option value="line">Terbuka</option><option value="circle">Lingkaran</option><option value="square">Kotak</option><option value="diamond">Wajik</option></select></label><label class="col-span-2">Akhir<select data-k="endArrow" class="num"><option value="none">Tanpa panah</option><option value="arrow">Panah</option><option value="triangle">Segitiga</option><option value="line">Terbuka</option><option value="circle">Lingkaran</option><option value="square">Kotak</option><option value="diamond">Wajik</option></select></label></div>`:''}
	</div>`;
}
function renderPaint(kind){
	const selected=selAll(),layers=selected.length?getPaintLayers(selected[0],kind):[];
	const $list=$(kind==='fill'?'#frow':'#srow').empty();
	layers.forEach((p,i)=>$list.append(paintCard(kind,i,p)));
	$list.find('[data-k="type"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['solid','linear','radial','angular'].includes(p.type)?p.type:'solid');});
	$list.find('[data-k="position"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['center','inside','outside'].includes(p.position)?p.position:'center');});
	$list.find('[data-k="dash"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['solid','dash','dot','dashDot'].includes(p.dash)?p.dash:'solid');});
	$list.find('[data-k="cap"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['butt','round','square'].includes(p.cap)?p.cap:'butt');});
	$list.find('[data-k="join"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['miter','round','bevel'].includes(p.join)?p.join:'round');});
	['startArrow','endArrow'].forEach(k=>$list.find(`[data-k="${k}"]`).each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(p[k]||'none');}));
}
function readPalette(){
	try{const p=JSON.parse(localStorage.getItem(PALETTE_KEY)||'[]');return Array.isArray(p)?p.map(hex).filter(Boolean).slice(0,MAX_PALETTE):[];}
	catch(e){note('Palet warna lokal tidak dapat dibaca: '+e.message);return [];}
}
function renderPalette(){
	const colors=readPalette(),$list=$('#paletteList').empty();
	colors.forEach(c=>$list.append(`<button type="button" data-color="${c}" class="w-5 h-5 rounded border border-white/20" style="background:${c}" title="${c}" aria-label="Gunakan warna ${c}"></button>`));
}
function savePaletteColor(){
	const a=selAll(),p=a.length?getPaintLayers(a[0],'fill')[0]||getPaintLayers(a[0],'stroke')[0]:null,c=hex(p&&p.color);
	if(!c){note('Pilih objek dengan warna sebelum menyimpan warna.');return;}
	try{const colors=readPalette();localStorage.setItem(PALETTE_KEY,JSON.stringify([c,...colors.filter(x=>x!==c)].slice(0,MAX_PALETTE)));renderPalette();}
	catch(e){note('Palet warna tidak dapat disimpan: '+e.message);}
}
function align(k){
	const a=selAll();if(!a.length)return;let box;
	if(a.length>1)box=ubox(a);else{
		const p=[...S].reverse().find(f=>f.type==='frame'&&f!==a[0]&&inside(a[0],f));
		if(!p){$('#hint').text('Sejajarkan butuh Frame, atau pilih lebih dari satu objek.');return;}box=bbox(p);
	}
	a.forEach(s=>{const b=bbox(s);let dx=0,dy=0;
		if(k==='l')dx=box.x-b.x;if(k==='h')dx=box.x+box.w/2-b.x-b.w/2;if(k==='r')dx=box.x+box.w-b.x-b.w;
		if(k==='t')dy=box.y-b.y;if(k==='v')dy=box.y+box.h/2-b.y-b.h/2;if(k==='b')dy=box.y+box.h-b.y-b.h;moveWith(s,dx,dy);
	});refresh();save();
}
function distribute(axis){
	const a=selAll();if(a.length<3){note('Distribusi jarak membutuhkan minimal tiga objek terpilih.');return;}
	const key=axis==='x'?'x':'y',size=axis==='x'?'w':'h',sorted=[...a].sort((u,v)=>bbox(u)[key]-bbox(v)[key]),first=bbox(sorted[0]),last=bbox(sorted[sorted.length-1]);
	const total=sorted.reduce((n,s)=>n+bbox(s)[size],0),gap=(last[key]+last[size]-first[key]-total)/(sorted.length-1);let cursor=first[key];
	sorted.forEach((s,i)=>{const b=bbox(s);if(i>0&&i<sorted.length-1)moveWith(s,axis==='x'?cursor-b.x:0,axis==='y'?cursor-b.y:0);cursor+=b[size]+gap;});
	refresh();save();
}
function resizeSelectionTo(w,h){
	const selected=selAll();if(!selected.length)return;const source=selected.length===1?[selected[0]]:selected,box=selectionBox(),sx=w/(box.w||1),sy=h/(box.h||1);
	source.forEach(s=>{const b=bbox(s),src=JSON.parse(JSON.stringify(s));resizeLayer(s,src,{x:box.x+(b.x-box.x)*sx,y:box.y+(b.y-box.y)*sy,w:b.w*sx,h:b.h*sy},b);});draw();save();
}
function flipSelection(axis){
	const selected=selAll();if(!selected.length)return;const all=[...selected,...kidsFor(selected)].filter((s,i,a)=>a.indexOf(s)===i);
	if(all.length===1)all[0][axis==='x'?'flipX':'flipY']=!all[0][axis==='x'?'flipX':'flipY'];
	else{
		const b=ubox(all),center=axis==='x'?b.x+b.w/2:b.y+b.h/2;
		all.forEach(s=>{const o=bbox(s),delta=axis==='x'?2*center-(o.x+o.w)-o.x:2*center-(o.y+o.h)-o.y;move(s,axis==='x'?delta:0,axis==='y'?delta:0);s.rot=-(s.rot||0);const key=axis==='x'?'flipX':'flipY';s[key]=!s[key];});
	}
	refresh();save();
}
function syncProps(){
	const a=selAll();if(!a.length)return;const s=a[0],one=a.length===1,B=one?bbox(s):ubox(a),R=v=>Math.round(v*100)/100,t=s.type;
	const parentFrame=frameParentForSelection(a),position=parentFrame?frameLocalPoint(parentFrame,B.x,B.y):[B.x,B.y];
	$('#ptype').text(one?s.name.replace(/ \d+$/,''):(selG&&GR[selG]?GR[selG].name:a.length+' objek dipilih'));
	const fixedText=one&&t==='text'&&s.textBox;
	$('#px').val(R(position[0]));$('#py').val(R(position[1]));$('#px,#py').data('framePosition',{x:B.x,y:B.y}).attr('title',parentFrame?'Posisi relatif terhadap '+parentFrame.name:'Posisi di kanvas');$('#prot').val(one?s.rot:0).prop('disabled',!one);$('#ppx').val(Math.round((s.pvx??.5)*100)).prop('disabled',!one);$('#ppy').val(Math.round((s.pvy??.5)*100)).prop('disabled',!one);
	$('#pbm').val(s.bm||'normal');$('#fxsec').toggle(one);$('#pw').val(R(B.w)).prop('disabled',one&&t==='text'&&!s.textBox).attr({min:fixedText?100:1,max:fixedText?900:null});$('#pwlabel').text(fixedText?'Lebar kotak (100–900 px)':'Lebar');$('#ph').val(R(B.h)).prop('disabled',one&&t==='text');$('#par').prop('checked',!!s.ar).prop('disabled',!one);
	$('#rown').toggle(one&&(t==='polygon'||t==='star'));$('#pn').val(s.n);$('#rowtxt').toggle(one&&t==='text');$('#pfs').val(s.fs);renderFontOptions(s.type==='text'?s.fontFamily:null);
	if(one&&t==='text'){$('#pbold').toggleClass('on',(s.fontWeight??(s.bold?700:400))>=600);$('#pitalic').toggleClass('on',!!s.italic);$('#punderline').toggleClass('on',!!s.underline);$('#palign').val(s.textAlign||'left');$('#plh').val(s.lineHeight||125);$('#pls').val(s.letterSpacing||0);$('#ptextBox').prop('checked',!!s.textBox);renderFontWeightOptions(s.fontFamily,s.fontWeight??(s.bold?700:400));}
	$('#pop').val(s.op??100);$('#peye').html(FAIcon(s.hid?'eyeSlash':'eye'));
	const rr=a.find(x=>x.type==='rect'||x.type==='frame');$('#rowr').toggle(!!rr);$('#rowradii').toggle(!!rr);
	if(rr){const r=rr.radii||[rr.r,rr.r,rr.r,rr.r],uniform=r.every(v=>v===r[0]);$('#pr').val(uniform?r[0]:'');r.forEach((v,i)=>$('#pr'+i).val(v));}
	renderPaint('fill');renderPaint('stroke');renderPalette();$('#pexp').prop('checked',s.exp!==false);
}
MF.init.push(function initPanel(){
	$('#distx').html(FAIcon('distributeH'));$('#disty').html(FAIcon('distributeV'));$('#flipx').html(FAIcon('distributeH'));$('#flipy').html(FAIcon('distributeV'));$('#fadd,#sadd').html(FAIcon('plus'));$('#savecolor').html(FAIcon('palette'));
	const alignNames=['Rata kiri','Rata tengah horizontal','Rata kanan','Rata atas','Rata tengah vertikal','Rata bawah'];
	['l','h','r','t','v','b'].forEach((k,i)=>$('<button type="button" class="p-1.5 rounded bg-[#383838] hover:bg-neutral-600"></button>').attr({title:alignNames[i],'aria-label':alignNames[i]}).html(ic(i>2?1:0,i%3)).data('k',k).on('click',function(){align($(this).data('k'));}).appendTo('#al'));
	$('#distx').on('click',()=>distribute('x'));$('#disty').on('click',()=>distribute('y'));
	$('#frameCategory').on('change',renderFramePresets);
	$('#framePreset').on('change',function(){const p=selectedPreset();if(p){framePresetSize={w:p.w,h:p.h};$('#frameW').val(p.w);$('#frameH').val(p.h);}});
	$('#frameW,#frameH').on('input',function(){
		framePresetSize={w:cl($('#frameW').val(),1,10000,framePresetSize.w),h:cl($('#frameH').val(),1,10000,framePresetSize.h)};
		if(sel&&sel.type==='frame'){sel.w=framePresetSize.w;sel.h=framePresetSize.h;draw();save();}
	});
	$('#frameApply').on('click',applyPresetSize);$('#frameRotate').on('click',flipFrameOrientation);$('#frameSavePreset').on('click',saveFramePreset);
	$('#frameClip').on('change',function(){if(!sel||sel.type!=='frame')return;sel.clipContent=this.checked;refresh();save();});
	$('#frameWrap,#groupToFrame').on('click',wrapSelectionInFrame);$('#frameRelease').on('click',releaseSelectedFrame);$('#frameToGroup').on('click',frameToGroup);
	$('#frameSmooth').on('input',function(){
		const value=cl(this.value,0,100,0);selAll().forEach(s=>{if(s.type==='frame'||s.type==='rect')s.smooth=value;});
		$('#frameSmoothValue').text(value+'%');draw();save();
	});
	renderFramePresets();syncFramePanel();
	$('#flipx').on('click',()=>flipSelection('x'));$('#flipy').on('click',()=>flipSelection('y'));
	$('#px,#py').on('input',()=>{
		const a=selAll();if(!a.length)return;const b=a.length>1?ubox(a):bbox(a),parent=frameParentForSelection(a),nx=parseFloat($('#px').val()),ny=parseFloat($('#py').val());if(isNaN(nx)||isNaN(ny))return;
		const previous=$('#px').data('framePosition')||{x:b.x,y:b.y};
		const destination=parent?frameWorldPoint(parent,nx,ny):[nx,ny],dx=destination[0]-previous.x,dy=destination[1]-previous.y;
		if(!isFinite(dx)||!isFinite(dy)){note('Posisi relatif frame tidak valid.');return;}
		[...a,...kidsFor(a)].filter((s,i,items)=>items.indexOf(s)===i).forEach(s=>move(s,dx,dy));syncProps();draw();save();
	});
	$('#prot').on('input',one(s=>{const rotation=parseFloat($('#prot').val())||0;if(s.type==='frame')setFrameRotation(s,rotation);else s.rot=rotation;}));
	$('#pw').on('input',()=>{const b=selectionBox();if(!b)return;const w=sel&&sel.type==='text'&&sel.textBox?cl($('#pw').val(),100,900,100):Math.max(1,+$('#pw').val()||1);if(sel&&sel.type==='text'&&sel.textBox){sel.w=w;$('#pw').val(w);fitText(sel);refresh();save();return;}let h=b.h;if(sel&&sel.ar)h=w*(b.h/(b.w||1));$('#ph').val(Math.round(h*100)/100);resizeSelectionTo(w,h);});
	$('#ph').on('input',()=>{const b=selectionBox();if(!b)return;let h=Math.max(1,+$('#ph').val()||1),w=b.w;if(sel&&sel.ar)w=h*(b.w/(b.h||1));$('#pw').val(Math.round(w*100)/100);resizeSelectionTo(w,h);});
	$('#par').on('change',one(s=>{s.ar=chk('#par');}));
	$('#ppx,#ppy').on('input',()=>{if(!sel)return;setPivot(sel,cl($('#ppx').val(),-500,500,50)/100,cl($('#ppy').val(),-500,500,50)/100);draw();save();$('#px').val(rd(bbox(sel).x));$('#py').val(rd(bbox(sel).y));});
	$('#pbm').html(BM.map(b=>`<option value="${b}">${b}</option>`).join('')).on('change',()=>each(s=>{s.bm=$('#pbm').val();}));
	$('#pn').on('input',one(s=>{s.n=Math.round(cl($('#pn').val(),3,20,3));}));
	$('#pfs').on('input',()=>{if(!sel||sel.type!=='text')return;sel.fs=cl($('#pfs').val(),4,999,16);fitText(sel);refresh();save();});
	$('#pweight').on('input',function(){
		const raw=parseFloat(this.value),weight=Number.isFinite(raw)?FONT_WEIGHTS.reduce((best,[value])=>Math.abs(value-raw)<Math.abs(best-raw)?value:best,400):400;
		$('#pweightName').text(FONT_WEIGHTS.find(item=>item[0]===weight)[1]);
	}).on('change',()=>{if(!sel||sel.type!=='text')return;sel.fontWeight=renderFontWeightOptions(sel.fontFamily,cl($('#pweight').val(),100,900,400));sel.bold=sel.fontWeight>=600;fitText(sel);refresh();save();});
	$('#pbold,#pitalic,#punderline').on('click',function(){if(!sel||sel.type!=='text')return;const key={pbold:'bold',pitalic:'italic',punderline:'underline'}[this.id];if(key==='bold'){sel.fontWeight=(sel.fontWeight??(sel.bold?700:400))>=600?400:700;sel.bold=sel.fontWeight>=600;}else sel[key]=!sel[key];fitText(sel);refresh();save();});
	$('#palign').on('change',()=>{if(!sel||sel.type!=='text')return;sel.textAlign=$('#palign').val();fitText(sel);refresh();save();});
	$('#plh,#pls').on('input',()=>{if(!sel||sel.type!=='text')return;sel.lineHeight=cl($('#plh').val(),50,300,125);sel.letterSpacing=cl($('#pls').val(),-20,100,0);fitText(sel);refresh();save();});
	$('#ptextBox').on('change',()=>{if(!sel||sel.type!=='text')return;sel.textBox=chk('#ptextBox');if(sel.textBox)sel.w=cl(sel.w,100,900,100);fitText(sel);refresh();save();});
	$('#pfont').on('change',()=>{if(!sel||sel.type!=='text')return;const s=sel;s.fontFamily=$('#pfont').val();document.fonts.load(fontCss(s)).then(()=>{s.fontWeight=renderFontWeightOptions(s.fontFamily,s.fontWeight??(s.bold?700:400));s.bold=s.fontWeight>=600;fitText(s);refresh();save();}).catch(()=>note('Font gagal dimuat: '+s.fontFamily));});
	$('#pop').on('input',()=>each(s=>{s.op=cl($('#pop').val(),0,100,100);}));
	$('#pr').on('input',()=>each(s=>{if(s.type==='rect'||s.type==='frame'){s.r=Math.max(0,+$('#pr').val()||0);s.radii=[s.r,s.r,s.r,s.r];}}));
	$('#pr0,#pr1,#pr2,#pr3').on('input',function(){const i=+this.id.slice(2);selAll().forEach(s=>{if(s.type==='rect'||s.type==='frame'){s.radii=s.radii||[s.r,s.r,s.r,s.r];s.radii[i]=Math.max(0,+$('#pr'+i).val()||0);}});draw();save();});
	$('#peye').on('click',()=>{const v=!selAll()[0].hid;each(s=>{s.hid=v;});refresh();});
	$('#fadd').on('click',()=>addPaint('fill'));$('#sadd').on('click',()=>addPaint('stroke'));$('#savecolor').on('click',savePaletteColor);
	$('#frow,#srow').on('input change','[data-k]',function(e){
		const $input=$(this),$card=$input.closest('[data-kind]'),kind=$card.attr('data-kind'),index=+$card.attr('data-index'),rawKey=$input.attr('data-k'),key=rawKey==='angleRange'?'angle':rawKey;
		if(key==='hex'||key==='hex2'){
			const h=hex($input.val());if(!h){if(e.type==='change')note('Kode warna tidak valid. Gunakan format #RRGGBB.');return;}const target=key==='hex'?'color':'color2';$card.find(`[data-k="${target}"]`).val(h);updateGradientCard($card);setPaintValue(kind,index,target,h);return;
		}
		if(key==='color'||key==='color2'){const h=hex($input.val());if(h){$card.find(`[data-k="${key==='color'?'hex':'hex2'}"]`).val(h);updateGradientCard($card);setPaintValue(kind,index,key,h);}return;}
		const value=key==='opacity'||key==='weight'||key==='angle'?cl($input.val(),key==='weight'?.1:0,key==='weight'?200:360,key==='weight'?1:100):$input.val();
		if(key==='angle')$card.find('[data-k="angle"],[data-k="angleRange"]').val(value);
		if(key==='type'||key==='angle')updateGradientCard($card);
		if(key==='opacity')$card.find('[data-value="opacity"]').text(value+'%');
		setPaintValue(kind,index,key,value);
	});
	$('#frow,#srow').on('click','[data-action]',function(){
		const $card=$(this).closest('[data-kind]'),kind=$card.attr('data-kind'),index=+$card.attr('data-index'),action=$(this).attr('data-action'),p=getPaintLayers(selAll()[0],kind)[index];
		if(action==='delete'){removePaint(kind,index);return;}
		if(action==='visible'){setPaintValue(kind,index,'visible',p.visible===false);refresh();return;}
		colorPick={kind,index};note('Pipet aktif — klik warna di kanvas untuk mengambilnya.');
	});
	let paletteTarget={kind:'fill',index:0};
	$('#frow,#srow').on('focusin','[data-k]',function(){const $c=$(this).closest('[data-kind]');paletteTarget={kind:$c.attr('data-kind'),index:+$c.attr('data-index')};});
	$('#paletteList').on('click','[data-color]',function(){setPaintValue(paletteTarget.kind,paletteTarget.index,'color',$(this).attr('data-color'));refresh();});
	MF.down.push({p:1,fn:(e,c)=>{
		if(!colorPick)return false;
		try{
			const d=ctx.getImageData(Math.floor(c.sx*dpr),Math.floor(c.sy*dpr),1,1).data;
			if(d[3]===0){note('Piksel yang dipilih transparan; pilih warna lain.');return true;}
			const color='#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join(''),pick=colorPick;colorPick=null;
			setPaintValue(pick.kind,pick.index,'color',color);refresh();note('Warna diambil: '+color);
		}catch(e){colorPick=null;note('Tidak dapat mengambil warna dari kanvas: '+e.message);}
		return true;
	}});
	$('#pexp').on('change',()=>each(s=>{s.exp=chk('#pexp');}));
});
