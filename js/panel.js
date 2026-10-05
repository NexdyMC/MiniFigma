/* [6.6] Panel properti. Isi: UI dan input properti kanan, warna, align, transform numerik. Bukan di sini: layer atau daftar efek. */
const ic=(v,p)=>{
	const L=[2,8,14][p],st=w=>p?(p===1?8-w/2:12-w):4;let s=v?`<rect x="1" y="${L-.5}" width="14" height="1"/>`:`<rect x="${L-.5}" y="1" width="1" height="14"/>`;
	[[10,4],[6,9]].forEach(([w,o])=>{s+=v?`<rect x="${o}" y="${st(w)}" width="3" height="${w}"/>`:`<rect x="${st(w)}" y="${o}" width="${w}" height="3"/>`;});
	return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">${s}</svg>`;
};
const FONT_SIZES=[10,11,12,13,14,15,16,20,24,32,36,40,48,64,96,128].map(v=>({v,label:String(v)}));
const POP_VALUES=Array.from({length:11},(_,i)=>({v:i*10,label:String(i*10)}));
const RADIUS_VALUES=[0,2,4,6,8,12,16,24,32,64].map(v=>({v,label:String(v)}));
const STROKE_VALUES=[.5,1,2,3,4,5,6,8,10,12,16,20].map(v=>({v,label:String(v)}));
let comboPopup=null,comboActive=null,comboAnchor=null,comboOptions=[],comboHighlight=0,comboFiltering=false,paintSignatures={fill:'',stroke:''},fxSignature='',panelKind='';
function attrText(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function numberField(id,label,prefix='',unit='',min='',max='',step=''){
	return `<label class="mf-field mf-number"><span class="mf-label">${label}</span><span class="mf-control">${prefix?`<span class="mf-prefix" data-scrub="1">${prefix}</span>`:''}<input id="${id}" type="text" inputmode="decimal" autocomplete="off" class="mf-input" data-number="1" data-min="${min}" data-max="${max}" data-step="${step}" aria-label="${label}">${unit?`<span class="mf-suffix">${unit}</span>`:''}</span></label>`;
}
function comboField(id,label,options,prefix='',unit='',min='',max='',step='',mode='number'){
	const json=attrText(JSON.stringify(options));
	return `<label class="mf-field mf-number mf-combo"><span class="mf-label">${label}</span><span class="mf-control">${prefix?`<span class="mf-prefix" data-scrub="1">${prefix}</span>`:''}<input id="${id}" type="text" inputmode="${mode==='number'?'decimal':'text'}" autocomplete="off" class="mf-input" data-number="${mode==='number'?1:0}" data-mode="${mode}" data-mf-options="${json}" data-min="${min}" data-max="${max}" data-step="${step}" aria-label="${label}" ${mode==='select'?'readonly':''}><span class="mf-suffix">${unit}</span><button type="button" class="mf-combo-toggle" aria-label="Buka daftar ${label}" aria-expanded="false">${I('chevron-down',14)}</button></span></label>`;
}
function paintCombo(key,items,min,max,step,unit=''){
	const json=attrText(JSON.stringify({mode:'number',items,min,max,step}));
	return `<span class="mf-number mf-combo mf-inline-combo"><span class="mf-control"><input type="text" inputmode="decimal" autocomplete="off" class="mf-input" data-number="1" data-mode="number" data-mf-options="${json}" data-min="${min}" data-max="${max}" data-step="${step}" data-k="${key}" aria-label="${key==='opacity'?'Opasitas':key==='angle'?'Sudut gradien':'Berat'}"><span class="mf-suffix">${unit}</span><button type="button" class="mf-combo-toggle" aria-label="Buka daftar">${I('chevron-down',12)}</button></span></span>`;
}
function iconButton(id,icon,title,extra=''){
	return `<button id="${id}" type="button" class="mf-icon-btn ${extra}" title="${title}" aria-label="${title}">${I(icon,14)}</button>`;
}
function sectionHeader(title,section,actions=''){
	return `<div class="mf-section-head" data-head="${section}"><span>${title}</span><div class="mf-actions">${actions}</div>${I('chevron-down',14)}</div>`;
}
function buildSegments(id,key,items){
	$('#'+id).html(items.map(([value,label,title])=>`<button type="button" class="mf-icon-btn" data-text-key="${key}" data-value="${value}" title="${title}" aria-label="${title}">${label}</button>`).join(''));
}
function evalNumber(src){
	const text=String(src).trim().replace(/,/g,'.').replace(/%/g,'');let i=0;
	const ws=()=>{while(/\s/.test(text[i]||'')&&i<text.length)i++;};
	const expr=()=>{let n=term();while(true){ws();const op=text[i];if(op!=='+'&&op!=='-')break;i++;const r=term();n=op==='+'?n+r:n-r;}return n;};
	const term=()=>{let n=factor();while(true){ws();const op=text[i];if(op!=='*'&&op!=='/')break;i++;const r=factor();if(op==='/'&&r===0)throw new Error('Pembagian dengan nol');n=op==='*'?n*r:n/r;}return n;};
	const factor=()=>{ws();if(text[i]==='+'){i++;return factor();}if(text[i]==='-'){i++;return -factor();}if(text[i]==='('){i++;const n=expr();ws();if(text[i++]!==')')throw new Error('Kurung tidak lengkap');return n;}const m=text.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);if(!m)throw new Error('Angka tidak valid');i+=m[0].length;return +m[0];};
	if(!text)throw new Error('Nilai kosong');const value=expr();ws();if(i!==text.length||!Number.isFinite(value))throw new Error('Ekspresi tidak valid');return value;
}
function comboConfig(input){
	try{return JSON.parse(input.getAttribute('data-mf-options')||'{}');}catch(e){note('Daftar pilihan tidak valid: '+e.message);return {};}
}
function closeCombo(){
	if(!comboPopup||!comboActive)return;
	comboPopup.classList.remove('open');comboPopup.setAttribute('aria-hidden','true');
	if(comboAnchor&&comboAnchor.classList)comboAnchor.setAttribute('aria-expanded','false');
	comboActive=null;comboAnchor=null;comboOptions=[];comboHighlight=0;comboFiltering=false;
}
function renderComboOptions(){
	if(!comboPopup||!comboActive)return;
	const q=comboFiltering?comboActive.value.trim().toLocaleLowerCase():'',opts=comboOptions.filter(o=>!q||String(o.label).toLocaleLowerCase().includes(q)||String(o.v).toLocaleLowerCase().includes(q));
	if(!opts.length){comboPopup.innerHTML='<div class="mf-combo-empty">Tidak ada hasil</div>';comboHighlight=-1;return;}
	const value=comboActive.dataset.value??comboActive.value;
	comboHighlight=Math.min(Math.max(comboHighlight,0),opts.length-1);
	comboPopup.innerHTML=opts.map((o,i)=>`<button type="button" role="option" aria-selected="${i===comboHighlight}" class="mf-combo-item${i===comboHighlight?' active':''}" data-index="${i}"><span class="mf-combo-check">${String(o.v)===value?I('check',14):''}</span><span>${attrText(o.label)}</span></button>`).join('');
	$(comboPopup).find('.mf-combo-item').each((i,el)=>$(el).data('comboValue',opts[i].v));
}
function positionCombo(){
	if(!comboPopup||!comboActive)return;
	comboPopup.classList.add('open');comboPopup.setAttribute('aria-hidden','false');
	const r=comboAnchor.getBoundingClientRect(),w=Math.min(Math.max(180,r.width),innerWidth-16);
	comboPopup.style.width=w+'px';comboPopup.style.maxHeight=Math.min(innerHeight*.6,Math.max(120,innerHeight-16))+'px';
	const h=comboPopup.getBoundingClientRect().height,below=innerHeight-r.bottom-8,above=r.top-8;
	const top=below>=Math.min(h,240)||below>=above?r.bottom+4:Math.max(8,r.top-h-4);
	comboPopup.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';comboPopup.style.top=Math.max(8,Math.min(top,innerHeight-h-8))+'px';
}
function openCombo(input,anchor){
	closeCombo();if(!comboPopup||!input)return;
	comboActive=input;comboAnchor=anchor||input.closest('.mf-combo')?.querySelector('.mf-combo-toggle')||input;
	const opts=comboConfig(input);comboOptions=Array.isArray(opts.items)?opts.items:[];
	const active=comboOptions.findIndex(o=>String(o.v)===(input.dataset.value??input.value));comboHighlight=active>=0?active:0;comboFiltering=false;
	renderComboOptions();positionCombo();if(input.dataset.mode!=='select')input.focus({preventScroll:true});
}
function commitNumberField(input,notify=true){
	if(!input)return false;
	const raw=input.value,old=input.dataset.committed??'',wasMixed=input.dataset.mixed==='1';
	if(raw===''&&wasMixed){input.placeholder='Campuran';return false;}
	try{
		let value=evalNumber(raw),min=input.dataset.min===''?-Infinity:+input.dataset.min,max=input.dataset.max===''?Infinity:+input.dataset.max;
		if(Number.isFinite(min))value=Math.max(min,value);if(Number.isFinite(max))value=Math.min(max,value);
		value=Math.round(value*10000)/10000;const text=String(value);input.value=text;input.dataset.committed=text;input.dataset.mixed='0';input.placeholder='';
		if(notify&&text!==old)$(input).trigger('change');
		return true;
	}catch(e){input.value=old;input.dataset.mixed=wasMixed?'1':'0';input.placeholder=wasMixed?'Campuran':'';return false;}
}
function commitComboValue(input,value){
	const option=comboOptions.find(o=>String(o.v)===String(value));
	if(input.dataset.mode==='select'||input.dataset.mode==='text'&&option){input.dataset.value=String(value);input.value=option?option.label:String(value);}
	else{delete input.dataset.value;input.value=String(value);}
	if(input.dataset.number==='1')commitNumberField(input);else $(input).trigger('change');
	closeCombo();
}
function syncNumber(id,value,disabled=false,mixed=false){
	const input=document.getElementById(id);if(!input)return;
	input.disabled=!!disabled;
	if(document.activeElement===input)return;
	input.value=mixed?'':value==null?'':String(value);input.placeholder=mixed?'Campuran':'';
	input.dataset.mixed=mixed?'1':'0';input.dataset.committed=input.value;
}
function initPanelComponents(){
	$('#pxslot').html(numberField('px','X','X','px'));$('#pyslot').html(numberField('py','Y','Y','px'));
	$('#protslot').html(numberField('prot','Rotasi',I('rotate',14),'°',-3600,3600,1));
	$('#ppxslot').html(numberField('ppx','X','X','%'));$('#ppyslot').html(numberField('ppy','Y','Y','%'));
	$('#pwslot').html(numberField('pw','Lebar','W','px',1,10000,1));$('#phslot').html(numberField('ph','Tinggi','H','px',1,10000,1));
	$('#tffslot').html(comboField('tff','Font family',{mode:'text',items:FONT_OPTIONS.map(([label,v])=>({v,label})),allowCustom:true},'', '', '', '', '', 'text'));
	$('#tfwslot').html(comboField('tfw','Berat',{mode:'select',items:FONT_WEIGHTS.map(([v,label])=>({v,label:`${label} ${v}`}))},'', '', '', '', '', 'select'));
	$('#tfsslot').html(comboField('tfs','Ukuran',{mode:'number',items:FONT_SIZES,min:4,max:999,step:1},'T','px',4,999,1));
	$('#tlhslot').html(comboField('tlh','Tinggi baris',{mode:'text',items:[{v:'auto',label:'Otomatis'},...[100,110,120,130,140,150,160,200].map(v=>({v:String(v),label:v+'%'}))],allowCustom:true},'↕','%', '', '', '', 'text'));
	$('#tlsslot').html(comboField('tls','Jarak huruf',{mode:'number',items:[-5,-2,-1,0,1,2,5,10].map(v=>({v,label:v+'%'})),min:-100,max:100,step:1},'↔','%',-100,100,1));
	$('#popslot').html(comboField('pop','Opasitas',{mode:'number',items:POP_VALUES,min:0,max:100,step:1},I('opacity',14),'%',0,100,1));
	$('#prslot').html(comboField('pr','Radius sudut',{mode:'number',items:RADIUS_VALUES,min:0,max:1000,step:1},I('corner',14),'px',0,1000,1));
	$('#pbmslot').html(comboField('pbm','Mode campuran',{mode:'select',items:BM.map(v=>({v,label:v}))},'', '', '', '', '', 'select'));
	$('#pr0slot').html(numberField('pr0','Kiri atas','','px',0,1000,1));$('#pr1slot').html(numberField('pr1','Kanan atas','','px',0,1000,1));
	$('#pr2slot').html(numberField('pr2','Kanan bawah','','px',0,1000,1));$('#pr3slot').html(numberField('pr3','Kiri bawah','','px',0,1000,1));
	$('#pbm').closest('.mf-combo').addClass('mf-hidden');
	if(!comboPopup){comboPopup=document.createElement('div');comboPopup.id='mfComboPopup';comboPopup.className='mf-combo-popup';comboPopup.setAttribute('role','listbox');comboPopup.setAttribute('aria-hidden','true');document.body.appendChild(comboPopup);}
	$('.mf-number input[data-number="1"]').each(function(){this.dataset.committed=this.value;});
	$('#props [data-section="pivot"]').addClass('is-collapsed');
	try{const saved=JSON.parse(localStorage.getItem('minifigma.panel')||'{}');$('#props .mf-section[data-section]').each(function(){if(saved[this.dataset.section]===true)$(this).addClass('is-collapsed');else if(saved[this.dataset.section]===false)$(this).removeClass('is-collapsed');});}
	catch(e){note('Preferensi panel tidak dapat dibaca: '+e.message);}
}
function initPanelComponentEvents(){
	$(document).on('click','.mf-combo-toggle',function(){const input=$(this).closest('.mf-combo').find('.mf-input')[0];if(comboActive===input)closeCombo();else openCombo(input,this);})
	.on('click','#blendBtn',function(){openCombo($('#pbm')[0],this);})
	.on('click','.mf-combo-item',function(){if(!comboActive)return;commitComboValue(comboActive,$(this).data('comboValue'));})
	.on('mousedown',e=>{if(comboActive&&!$(e.target).closest('.mf-combo,#mfComboPopup,#blendBtn').length)closeCombo();})
	.on('click','.mf-section-head',function(e){
		e.stopPropagation();
		if($(e.target).closest('button').length)return;const $section=$(this).closest('.mf-section'),key=$section.data('section');$section.toggleClass('is-collapsed');
		try{const state=JSON.parse(localStorage.getItem('minifigma.panel')||'{}');state[key]=$section.hasClass('is-collapsed');localStorage.setItem('minifigma.panel',JSON.stringify(state));}catch(err){note('Preferensi panel tidak dapat disimpan: '+err.message);}
	}).on('keydown','.mf-number .mf-input',function(e){
		if(e.key==='ArrowDown'||e.key==='ArrowUp'){
			if(comboActive===this){comboFiltering=false;renderComboOptions();const n=comboPopup.querySelectorAll('.mf-combo-item').length;if(n){comboHighlight=Math.max(0,Math.min(n-1,comboHighlight+(e.key==='ArrowDown'?1:-1)));renderComboOptions();const el=comboPopup.querySelectorAll('.mf-combo-item')[comboHighlight];if(el)el.scrollIntoView({block:'nearest'});}e.preventDefault();return;}
			if(e.key==='ArrowDown'&&this.classList.contains('mf-input')&&this.closest('.mf-combo')){openCombo(this);e.preventDefault();return;}
			if(this.dataset.number==='1'){const opts=comboConfig(this),step=+(this.dataset.step||opts.step||1)*(e.altKey ? .1 : e.shiftKey ? 10 : 1);try{this.value=String(Math.round((evalNumber(this.value)+(e.key==='ArrowUp'?step:-step))*10000)/10000);commitNumberField(this);}catch(_){ }e.preventDefault();return;}
			if(this.dataset.mode==='select'){openCombo(this);e.preventDefault();return;}
		}
		if(e.key==='Enter'){e.preventDefault();if(comboActive===this&&!comboFiltering){const item=comboPopup.querySelectorAll('.mf-combo-item')[comboHighlight];if(item)commitComboValue(this,$(item).data('comboValue'));else closeCombo();}else if(this.dataset.number==='1')commitNumberField(this);else if(this.dataset.mode==='text')$(this).trigger('change');if(this.dataset.number==='1')this.blur();else closeCombo();}
		if(e.key==='Escape'){if(this.dataset.number==='1')this.value=this.dataset.committed||'';if(comboActive===this)closeCombo();if(this.dataset.number==='1')this.blur();e.preventDefault();}
		if(this.dataset.mode==='select'&&!['ArrowDown','ArrowUp','Enter','Escape','Tab'].includes(e.key))e.preventDefault();
	})	.on('input','.mf-combo .mf-input',function(){if(this.dataset.mode==='text')delete this.dataset.value;if(comboActive===this){comboFiltering=true;comboHighlight=0;renderComboOptions();}else if(this.dataset.mode==='text'){openCombo(this);comboFiltering=true;renderComboOptions();}})
	.on('blur','.mf-number .mf-input',function(){if(this.dataset.number==='1')commitNumberField(this);else if(this.dataset.mode==='text'&&this.value.trim())$(this).trigger('change');})
	.on('keydown',function(e){
		if(!comboActive||e.target===comboActive)return;
		if(e.key==='Escape'){closeCombo();e.preventDefault();return;}
		if(e.key==='ArrowDown'||e.key==='ArrowUp'){
			comboFiltering=false;renderComboOptions();const n=comboPopup.querySelectorAll('.mf-combo-item').length;
			if(n){comboHighlight=Math.max(0,Math.min(n-1,comboHighlight+(e.key==='ArrowDown'?1:-1)));renderComboOptions();comboPopup.querySelectorAll('.mf-combo-item')[comboHighlight]?.scrollIntoView({block:'nearest'});}
			e.preventDefault();return;
		}
		if(e.key==='Enter'){
			const item=comboPopup.querySelectorAll('.mf-combo-item')[comboHighlight];
			if(item)commitComboValue(comboActive,$(item).data('comboValue'));e.preventDefault();
		}
	});
	$(document).on('mousedown','.mf-prefix[data-scrub]',function(e){
		const input=$(this).closest('.mf-number').find('.mf-input')[0];if(!input||input.disabled||input.dataset.number!=='1')return;
		let base;try{base=evalNumber(input.value);}catch(_){return;}
		const start=e.clientX,step=+(input.dataset.step||1);e.preventDefault();
		const move=ev=>{const multiplier=ev.shiftKey?10:1;input.value=String(Math.round((base+(ev.clientX-start)*step*multiplier)*10000)/10000);commitNumberField(input);};
		const up=()=>{$(document).off('mousemove.mfScrub',move).off('mouseup.mfScrub',up);};
		$(document).on('mousemove.mfScrub',move).on('mouseup.mfScrub',up);
	});
	$(window).on('resize scroll',closeCombo);$('.props-scroll').on('scroll',closeCombo);
}
const each=fn=>{selAll().forEach(fn);draw();save();};
const one=fn=>()=>{if(sel){fn(sel);draw();save();}};
const hex=v=>{v=(v||'').trim();if(v[0]!=='#')v='#'+v;return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():null;};
const PALETTE_KEY='minifigma.palette',MAX_PALETTE=24;
let paletteSignature='';
function basePaint(kind,color){
	return kind==='fill'?{type:'solid',color:color||'#d9d9d9',color2:'#ffffff',angle:0,opacity:100,visible:true}:
		{type:'solid',color:color||'#d9d9d9',color2:'#ffffff',angle:0,opacity:100,visible:true,weight:1,position:'center',dash:'solid',cap:'butt',join:'round',startArrow:'none',endArrow:'none'};
}
function paintStops(p){
	const src=Array.isArray(p.stops)&&p.stops.length>=2?p.stops:[{pos:0,color:p.color||'#d9d9d9'},{pos:100,color:p.color2||p.color||'#d9d9d9'}];
	return src.slice(0,8).map((s,i)=>({pos:cl(s&&s.pos,0,100,i?100:0),color:hex(s&&s.color)||p.color||'#d9d9d9'})).sort((a,b)=>a.pos-b.pos);
}
function paintSelect(key,items){
	const json=attrText(JSON.stringify({mode:'select',items}));
	return `<span class="mf-number mf-combo mf-inline-combo"><span class="mf-control"><input type="text" readonly class="mf-input max-w-8" data-mode="select" data-mf-options="${json}" data-k="${key}" aria-label="${key==='type'?'Jenis isi':'Sudut gradien'}"><button type="button" class="mf-combo-toggle" aria-label="Buka daftar">${I('chevron-down',12)}</button></span></span>`;
}
function gradientPreview(p){
	const stops=paintStops(p).map(s=>`${s.color} ${s.pos}%`).join(','),a=cl(p.angle,0,360,0);
	if(p.type==='radial')return `radial-gradient(circle,${stops})`;
	if(p.type==='angular')return `conic-gradient(from ${a}deg,${stops})`;
	return `linear-gradient(${a}deg,${stops})`;
}
function syncGradientPreview($card,p){
	if(p.type==='solid'){$card.find('[data-gradient-preview]').css('background','');return;}
	$card.find('[data-gradient-preview]').css('background',gradientPreview(p));
}
function syncSwatch($card,key,color,opacity){
	$card.find('.mf-color').each(function(){
		const input=$(this).find('[data-k], [data-color-key]')[0];if(!input||(input.dataset.k||input.dataset.colorKey)!==key)return;
		$(this).attr('data-color',color).css('background-color',color).toggleClass('checker',opacity<100);
	});
}
function updateGradientCard($card){
	const type=$card.find('[data-k="type"]')[0]?.dataset.value||$card.find('[data-k="type"]').val(),p={
		type,color:$card.find('[data-k="color"]').val(),color2:$card.find('[data-k="color2"]').val(),
		angle:$card.find('[data-k="angle"]')[0]?.dataset.value||$card.find('[data-k="angle"]').val(),stops:[...$card.find('[data-stop]')].map(el=>({pos:+$(el).find('[data-k="stopPos"]').val()||0,color:hex(el.querySelector('[data-color-key="stopColor"]')?.dataset.color)||'#d9d9d9'}))
	};
	$card.find('[data-gradient]').toggleClass('hidden',type==='solid');
	$card.find('[data-start-label]').text(type==='solid'?'Warna':'Awal · 0%');
	syncGradientPreview($card,{...p,type});
}
function setPaintValue(kind,index,key,value,commit=true){
	const selected=selAll(),source=selected.length?getPaintLayers(selected[0],kind)[index]:null,template=source||basePaint(kind);
	selected.forEach(s=>{
		const layers=ensurePaintLayers(s,kind);
		while(layers.length<=index)layers.push({...template});
		layers[index][key]=value;syncLegacyPaint(s,kind);
	});
	draw();if(commit)save();
}
function setPaintStopValue(kind,index,stopIndex,key,value,commit=true){
	selAll().forEach(s=>{
		const layers=ensurePaintLayers(s,kind),p=layers[index]||(layers[index]=basePaint(kind)),stops=paintStops(p);
		while(stops.length<=stopIndex&&stops.length<8)stops.push({pos:100,color:p.color||'#d9d9d9'});
		if(!stops[stopIndex])return;
		stops[stopIndex][key]=key==='color'?hex(value)||stops[stopIndex].color:cl(value,0,100,stops[stopIndex].pos);
		p.stops=stops.sort((a,b)=>a.pos-b.pos);p.color=p.stops[0].color;p.color2=p.stops[p.stops.length-1].color;syncLegacyPaint(s,kind);
	});
	draw();if(commit)save();
}
function addGradientStop(kind,index){
	selAll().forEach(s=>{
		const p=ensurePaintLayers(s,kind)[index];if(!p)return;const stops=paintStops(p);if(stops.length>=8)return;
		let at=0,gap=-1;for(let i=0;i<stops.length-1;i++){const d=stops[i+1].pos-stops[i].pos;if(d>gap){gap=d;at=i;}}
		const left=stops[at],right=stops[at+1],pos=(left.pos+right.pos)/2,a=left.color.slice(1),b=right.color.slice(1);
		const color='#'+[0,2,4].map(i=>Math.round((parseInt(a.slice(i,i+2),16)+parseInt(b.slice(i,i+2),16))/2).toString(16).padStart(2,'0')).join('');
		stops.splice(at+1,0,{pos,color});p.stops=stops;p.color=stops[0].color;p.color2=stops[stops.length-1].color;syncLegacyPaint(s,kind);
	});refresh();save();
}
function removeGradientStop(kind,index,stopIndex){
	selAll().forEach(s=>{
		const p=ensurePaintLayers(s,kind)[index];if(!p)return;const stops=paintStops(p);if(stops.length<=2)return;
		stops.splice(stopIndex,1);p.stops=stops;p.color=stops[0].color;p.color2=stops[stops.length-1].color;syncLegacyPaint(s,kind);
	});refresh();save();
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
	const stroke=kind==='stroke',gradient=p.type!=='solid',color=hex(p.color)||'#d9d9d9',stops=paintStops(p);
	const typeItems=[['solid','Solid'],['linear','Gradien linear'],['radial','Gradien radial'],['angular','Gradien sudut']].map(([v,label])=>({v,label}));
	const angleItems=[0,45,90,135,180,225,270,315].map(v=>({v,label:v+'°'}));
	const stopRows=stops.map((s,i)=>`<div class="mf-paint-row" data-stop="${i}"><button type="button" class="mf-color checker" data-color-picker="paint" data-kind="${kind}" data-index="${index}" data-color-key="stopColor" data-stop-index="${i}" data-color="${s.color}" style="background-color:${s.color}" title="Pilih warna stop" aria-label="Warna stop ${i+1}"></button><input data-k="stopHex" value="${s.color.slice(1).toUpperCase()}" maxlength="6" class="mf-input mf-hex" aria-label="Kode warna stop ${i+1}"><label class="mf-number mf-combo mf-inline-combo"><span class="mf-control"><input data-k="stopPos" type="number" min="0" max="100" step="1" class="mf-input" value="${s.pos}" aria-label="Posisi stop ${i+1}"><span class="mf-suffix">%</span></span></label><button type="button" data-action="remove-stop" class="mf-icon-btn" title="Hapus stop" aria-label="Hapus stop" ${stops.length<=2?'disabled':''}>${I('minus',14)}</button></div>`).join('');
	return `<div class="mf-card space-y-2" data-kind="${kind}" data-index="${index}">
		<div class="mf-paint-row"><button type="button" class="mf-color" data-color-picker="paint" data-kind="${kind}" data-index="${index}" data-color-key="color" data-color="${color}" data-stop-index="${gradient?0:''}" style="background-color:${color}" title="Pilih warna" aria-label="Pilih warna"></button><input data-k="hex" value="${color.slice(1).toUpperCase()}" maxlength="6" class="mf-input mf-hex w-8" aria-label="Kode warna"><span data-start-label class="mf-paint-label">${gradient?'Awal':'Warna'}</span>
		${paintCombo('opacity',POP_VALUES,0,100,1,'%')}<button type="button" data-action="visible" class="mf-icon-btn" title="Sembunyikan" aria-label="Sembunyikan">${I(p.visible===false?'eyeoff':'eye',14)}</button><button type="button" data-action="delete" class="mf-icon-btn" title="Hapus" aria-label="Hapus">${I('minus',14)}</button></div>
		<label class="flex items-center gap-2"><span class="mf-label">${stroke?'Jenis':'Jenis isi'}</span>${paintSelect('type',typeItems)}</label>
		<div data-gradient class="${gradient?'':'hidden'} space-y-2">
			<div data-gradient-preview role="img" aria-label="Pratinjau gradien" class="h-7 rounded border border-white/20" style="${gradient?`background:${gradientPreview(p)}`:''}"></div>
			<div data-stop-list class="space-y-1">${stopRows}</div><button type="button" data-action="add-stop" class="mf-icon-btn" title="Tambah stop" aria-label="Tambah stop" ${stops.length>=8?'disabled':''}>${I('plus',14)}</button>
			<div class="flex items-center gap-2"><span class="mf-label">Sudut</span>${paintCombo('angle',angleItems,0,360,1,'°')}<input data-k="angleRange" type="range" min="0" max="360" value="${cl(p.angle,0,360,0)}" class="flex-1 accent-[#0d99ff]" aria-label="Sudut gradien"></div>
		</div>
		${stroke?`<div class="grid grid-cols-2 gap-2"><label class="mf-label">Berat ${paintCombo('weight',STROKE_VALUES,.5,200,.5,'px')}</label><label>Posisi<select data-k="position" class="num"><option value="center">Tengah</option><option value="inside">Dalam</option><option value="outside">Luar</option></select></label><label>Garis<select data-k="dash" class="num"><option value="solid">Solid</option><option value="dash">Putus</option><option value="dot">Titik</option><option value="dashDot">Garis-titik</option></select></label><label>Ujung<select data-k="cap" class="num"><option value="butt">Rata</option><option value="round">Bulat</option><option value="square">Kotak</option></select></label><label>Sambungan<select data-k="join" class="num"><option value="round">Bulat</option><option value="miter">Tajam</option><option value="bevel">Miring</option></select></label><label>Awal<select data-k="startArrow" class="num"><option value="none">Tanpa panah</option><option value="arrow">Panah</option><option value="triangle">Segitiga</option><option value="line">Terbuka</option><option value="circle">Lingkaran</option><option value="square">Kotak</option><option value="diamond">Wajik</option></select></label><label class="col-span-2">Akhir<select data-k="endArrow" class="num"><option value="none">Tanpa panah</option><option value="arrow">Panah</option><option value="triangle">Segitiga</option><option value="line">Terbuka</option><option value="circle">Lingkaran</option><option value="square">Kotak</option><option value="diamond">Wajik</option></select></label></div>`:''}
	</div>`;
}
function renderPaint(kind){
	const selected=selAll(),layers=selected.length?getPaintLayers(selected[0],kind):[];
	const $list=$(kind==='fill'?'#frow':'#srow'),signature=JSON.stringify(selected.map(s=>[S.indexOf(s),getPaintLayers(s,kind).map(p=>paintStops(p).length)]));
	if(paintSignatures[kind]!==signature){
		$list.empty();layers.forEach((p,i)=>$list.append(paintCard(kind,i,p)));paintSignatures[kind]=signature;
	}
	$list.find('[data-k="type"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(p.type==='linear'?'Gradien linear':p.type==='radial'?'Gradien radial':p.type==='angular'?'Gradien sudut':'Solid').attr('data-value',p.type);});
	$list.find('[data-k="angle"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(String(cl(p.angle,0,360,0)));});
	$list.find('[data-k="position"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['center','inside','outside'].includes(p.position)?p.position:'center');});
	$list.find('[data-k="dash"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['solid','dash','dot','dashDot'].includes(p.dash)?p.dash:'solid');});
	$list.find('[data-k="cap"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['butt','round','square'].includes(p.cap)?p.cap:'butt');});
	$list.find('[data-k="join"]').each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(['miter','round','bevel'].includes(p.join)?p.join:'round');});
	['startArrow','endArrow'].forEach(k=>$list.find(`[data-k="${k}"]`).each(function(){const p=layers[+$(this).closest('[data-index]').attr('data-index')];$(this).val(p[k]||'none');}));
	$list.find('[data-index]').each(function(){
		const i=+this.dataset.index,card=$(this),p=layers[i];if(!p)return;
		const controls={color:hex(p.color)||'#d9d9d9',hex:(hex(p.color)||'#d9d9d9').slice(1).toUpperCase(),color2:hex(p.color2)||'#ffffff',hex2:(hex(p.color2)||'#ffffff').slice(1).toUpperCase(),opacity:cl(p.opacity,0,100,100),weight:cl(p.weight,.5,200,1),angle:cl(p.angle,0,360,0),angleRange:cl(p.angle,0,360,0)};
		Object.entries(controls).forEach(([key,value])=>{
			const el=card.find(`[data-k="${key}"]`)[0];if(!el||document.activeElement===el)return;
			const property=key==='hex'?'color':key==='hex2'?'color2':key==='angleRange'?'angle':key;
			const mixed=selected.some(s=>{const item=getPaintLayers(s,kind)[i];return !item||item[property]!==p[property];});
			if(el.tagName==='SELECT'){
				let option=el.querySelector('[data-mixed-option]');if(mixed){if(!option){option=new Option('Campuran','__mixed');option.dataset.mixedOption='1';el.add(option);}el.value='__mixed';}
				else{if(option)option.remove();el.value=String(value);}
			}else{
				el.value=mixed?(el.type==='color'?'#383838':''):String(value);el.placeholder=mixed&&el.type!=='color'?'Campuran':'';
				if(el.dataset.number==='1'){el.dataset.committed=el.value;el.dataset.mixed=mixed?'1':'0';}
			}
		});
		card.find('[data-gradient]').toggleClass('hidden',p.type==='solid');
		card.find('[data-start-label]').first().text(p.type==='solid'?'Warna':'Awal');
		card.find('[data-action="visible"]').html(I(p.visible===false?'eyeoff':'eye',14)).toggleClass('on',p.visible===false);
		const stops=paintStops(p);card.find('[data-stop]').each(function(){
			const j=+this.dataset.stop,stop=stops[j];if(!stop)return;
			[['stopHex',stop.color.slice(1).toUpperCase()],['stopPos',stop.pos]].forEach(([key,value])=>{
				const input=$(this).find(`[data-k="${key}"]`)[0];if(input&&document.activeElement!==input)input.value=String(value);
			});
			syncSwatch($(this),'stopColor',stop.color,cl(p.opacity,0,100,100));
		});
		card.find('[data-action="add-stop"]').prop('disabled',stops.length>=8);
		card.find('[data-action="remove-stop"]').prop('disabled',stops.length<=2);
		const colorMixed=selected.some(s=>{const item=getPaintLayers(s,kind)[i];return !item||item.color!==p.color;});
		card.find('.mf-color').first().toggleClass('mixed',colorMixed);
		syncSwatch(card,'color',colorMixed?'#383838':controls.color,cl(p.opacity,0,100,100));syncSwatch(card,'color2',controls.color2,cl(p.opacity,0,100,100));
		syncGradientPreview(card,p);
	});
}
function readPalette(){
	try{const p=JSON.parse(localStorage.getItem(PALETTE_KEY)||'[]');return Array.isArray(p)?p.map(hex).filter(Boolean).slice(0,MAX_PALETTE):[];}
	catch(e){note('Palet warna lokal tidak dapat dibaca: '+e.message);return [];}
}
function renderPalette(){
	const colors=readPalette(),signature=JSON.stringify(colors),$list=$('#paletteList');if(signature===paletteSignature)return;
	paletteSignature=signature;$list.empty();
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
	const val=(fn)=>a.map(fn),isMixed=xs=>xs.some(v=>v!==xs[0]),values={x:R(position[0]),y:R(position[1]),w:R(B.w),h:R(B.h),rot:s.rot||0,op:s.op??100};
	syncNumber('px',values.x,false,isMixed(val(x=>R(frameParentForSelection([x])?frameLocalPoint(frameParentForSelection([x]),bbox(x).x,bbox(x).y)[0]:bbox(x).x))));
	syncNumber('py',values.y,false,isMixed(val(x=>R(frameParentForSelection([x])?frameLocalPoint(frameParentForSelection([x]),bbox(x).x,bbox(x).y)[1]:bbox(x).y))));
	$('#px,#py').data('framePosition',{x:B.x,y:B.y}).attr('title',parentFrame?'Posisi relatif terhadap '+parentFrame.name:'Posisi di kanvas');
	syncNumber('prot',one?s.rot||0:0,false,false);
	syncNumber('ppx',Math.round((s.pvx??.5)*100),!one,isMixed(val(x=>Math.round((x.pvx??.5)*100))));
	syncNumber('ppy',Math.round((s.pvy??.5)*100),!one,isMixed(val(x=>Math.round((x.pvy??.5)*100))));
	const mixedBlend=isMixed(val(x=>x.bm||'normal')),blend=s.bm||'normal';$('#pbm').val(mixedBlend?'':blend).attr({'placeholder':mixedBlend?'Campuran':'','data-value':mixedBlend?'':blend});$('#fxsec').toggle(one);
	syncNumber('pw',values.w,one&&t==='text'&&s.tm==='aw',isMixed(val(x=>R(bbox(x).w))));
	syncNumber('ph',values.h,one&&t==='text'&&s.tm!=='fx',isMixed(val(x=>R(bbox(x).h))));
	$('#pw').attr({'data-min':1,'data-max':10000});$('#ph').attr({'data-min':1,'data-max':10000});
	$('#par').prop('checked',!!s.ar).prop('disabled',!one);$('#parBtn').prop('disabled',!one).toggleClass('on',!!s.ar).html(I(s.ar?'lock':'unlock',14));
	$('#rown').toggle(one&&(t==='polygon'||t==='star'));$('#pn').val(s.n);$('#textsec').toggleClass('mf-hidden',!one||t!=='text');
	$('#distx,#disty').prop('disabled',a.length<3);
	if(one&&t==='text'){
		const weight=s.fw||400,weightLabel=FONT_WEIGHTS.find(([v])=>v===weight)?.[1]||'Regular';
		$('#tff').val(s.ff||'Inter').attr('data-value',s.ff||'Inter');$('#tfw').val(`${weightLabel} ${weight}`).attr('data-value',String(weight));syncNumber('tfs',s.fs);
		$('#tlh').val(s.lh==null?'Otomatis':String(s.lh));$('#tlh').attr('data-value',s.lh==null?'auto':String(s.lh));$('#tlh').closest('.mf-control').find('.mf-suffix').toggle(s.lh!=null);syncNumber('tls',s.ls||0);
		$('#tfi').toggleClass('on',!!s.fi).attr('aria-pressed',!!s.fi);
		[['#talign','ta',s.ta||'l'],['#tvalign','va',s.va||'top'],['#tdecoration','td',s.td||'none'],['#tcase','tc',s.tc||'none'],['#tmode','tm',s.tm||'aw']].forEach(([root,key,value])=>$(root+' [data-text-key="'+key+'"]').each(function(){$(this).toggleClass('on',this.dataset.value===value).attr('aria-pressed',this.dataset.value===value);}));
	}
	syncNumber('pop',values.op,false,isMixed(val(x=>x.op??100)));$('#peye').html(I(s.hid?'eyeoff':'eye',14));$('#blendIcon').html(I('drop',14));
	const rounded=a.filter(x=>x.type==='rect'||x.type==='frame');$('#rowradii').toggleClass('mf-hidden',!rounded.length);
	if(rounded.length){const radii=rounded.map(x=>x.radii||[x.r,x.r,x.r,x.r]),r=radii[0],mixedRadius=radii.some(q=>!q.every(v=>v===q[0]))||radii.some(q=>q[0]!==r[0]);syncNumber('pr',mixedRadius?'':r[0],false,mixedRadius);r.forEach((v,i)=>syncNumber('pr'+i,v,false,isMixed(radii.map(q=>q[i]))));}
	$('#prslot').toggle(rounded.length>0);
	renderPaint('fill');renderPaint('stroke');renderPalette();$('#pexp').prop('checked',s.exp!==false);
}
MF.init.push(function initPanel(){
	initPanelComponents();initPanelComponentEvents();
	$('#distx').html(FAIcon('distributeH'));$('#disty').html(FAIcon('distributeV'));$('#flipx').html(FAIcon('distributeH'));$('#flipy').html(FAIcon('distributeV'));$('#fadd,#sadd').html(FAIcon('plus'));$('#savecolor').html(FAIcon('palette'));
	buildSegments('talign','ta',[['l','≡','Rata kiri'],['c','≡','Rata tengah'],['r','≡','Rata kanan'],['j','☷','Rata penuh']]);
	buildSegments('tvalign','va',[['top','↑','Atas'],['middle','↕','Tengah'],['bottom','↓','Bawah']]);
	buildSegments('tdecoration','td',[['none','A','Tanpa dekorasi'],['underline','U','Garis bawah'],['strike','S̶','Coret']]);
	buildSegments('tcase','tc',[['none','Aa','Normal'],['upper','AA','Huruf besar'],['lower','aa','Huruf kecil'],['title','Aa','Awal Kata Besar']]);
	buildSegments('tmode','tm',[['aw','↔','Lebar otomatis'],['ah','↕','Tinggi otomatis'],['fx','▣','Ukuran tetap']]);
	const alignNames=['Rata kiri','Rata tengah horizontal','Rata kanan','Rata atas','Rata tengah vertikal','Rata bawah'],alignIcons=['align-left','align-center-h','align-right','align-top','align-center-v','align-bottom'];
	['l','h','r','t','v','b'].forEach((k,i)=>$('<button type="button" class="mf-icon-btn"></button>').attr({title:alignNames[i],'aria-label':alignNames[i]}).html(I(alignIcons[i],16)).data('k',k).on('click',function(){align($(this).data('k'));}).appendTo('#al'));
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
	$('#px,#py').on('change',()=>{
		const a=selAll();if(!a.length)return;const b=a.length>1?ubox(a):bbox(a),parent=frameParentForSelection(a),nx=parseFloat($('#px').val()),ny=parseFloat($('#py').val());if(isNaN(nx)||isNaN(ny))return;
		const previous=$('#px').data('framePosition')||{x:b.x,y:b.y};
		const destination=parent?frameWorldPoint(parent,nx,ny):[nx,ny],dx=destination[0]-previous.x,dy=destination[1]-previous.y;
		if(!isFinite(dx)||!isFinite(dy)){note('Posisi relatif frame tidak valid.');return;}
		[...a,...kidsFor(a)].filter((s,i,items)=>items.indexOf(s)===i).forEach(s=>move(s,dx,dy));syncProps();draw();save();
	});
	$('#prot').on('change',function(){
		const selected=selAll();if(!selected.length)return;
		const rotation=parseFloat($('#prot').val())||0,single=selected.length===1,items=rotationMembers(selected),box=ubox(selected),center=single?pvt(selected[0]):[box.x+box.w/2,box.y+box.h/2],states=rotationStates(items);
		rotateSet(items,center,single?rotation-(selected[0].rot||0):rotation,states);syncProps();draw();save();
	});
	$('#pw').on('change',()=>{
		const b=selectionBox();if(!b)return;
		const w=Math.max(1,+$('#pw').val()||1);
		if(sel&&sel.type==='text'){if(sel.tm==='aw')sel.tm='ah';sel.w=w;fitText(sel);refresh();save();return;}
		let h=b.h;
		if(sel&&sel.ar)h=w*(b.h/(b.w||1));
		$('#ph').val(Math.round(h*100)/100);
		if(sel&&!multi.length&&isResizeable(sel)){
			const start=JSON.parse(JSON.stringify(sel));
			const W0=anchorWorld(start,0,0);
			resizeAnchored(sel,start,w,h,0,0,W0);
			draw();save();
		}else{
			resizeSelectionTo(w,h);
		}
	});
	$('#ph').on('change',()=>{
		const b=selectionBox();if(!b)return;
		let h=Math.max(1,+$('#ph').val()||1),w=b.w;
		if(sel&&sel.type==='text'){sel.tm='fx';sel.h=h;sel.w=w;fitText(sel);refresh();save();return;}
		if(sel&&sel.ar)w=h*(b.w/(b.h||1));
		$('#pw').val(Math.round(w*100)/100);
		if(sel&&!multi.length&&isResizeable(sel)){
			const start=JSON.parse(JSON.stringify(sel));
			const W0=anchorWorld(start,0,0);
			resizeAnchored(sel,start,w,h,0,0,W0);
			draw();save();
		}else{
			resizeSelectionTo(w,h);
		}
	});
	$('#par').on('change',()=>{each(s=>{s.ar=chk('#par');});$('#parBtn').toggleClass('on',chk('#par')).html(I(chk('#par')?'lock':'unlock',14));});
	$('#parBtn').on('click',()=>{if(!sel)return;$('#par').prop('checked',!chk('#par')).trigger('change');});
	$('#ppx,#ppy').on('change',()=>{if(!sel)return;setPivot(sel,cl($('#ppx').val(),-500,500,50)/100,cl($('#ppy').val(),-500,500,50)/100);draw();save();$('#px').val(rd(bbox(sel).x));$('#py').val(rd(bbox(sel).y));});
	$('#pbm').on('change',()=>each(s=>{s.bm=$('#pbm').val();}));
	$('#pn').on('input',one(s=>{s.n=Math.round(cl($('#pn').val(),3,20,3));}));
	const textChanged=fn=>{if(!sel||sel.type!=='text')return;fn(sel);fitText(sel);if(editingText&&editingText.layer===sel)positionTextEditor();refresh();save();};
	$('#tff').on('change',function(){textChanged(s=>{s.ff=String(this.value||'Inter').slice(0,80);});});
	$('#tfw').on('change',function(){textChanged(s=>{s.fw=cl(this.dataset.value??this.value,100,900,400);});});
	$('#tfs').on('change',function(){textChanged(s=>{s.fs=cl(this.value,4,999,16);});});
	$('#tlh').on('change',function(){textChanged(s=>{const value=this.value.trim().toLowerCase();s.lh=value==='auto'||value==='otomatis'?null:cl(parseFloat(value.replace('%','')),50,300,125);});});
	$('#tls').on('change',function(){textChanged(s=>{s.ls=cl(this.value,-100,100,0);});});
	$('#tfi').on('click',()=>textChanged(s=>{s.fi=!s.fi;}));
	$('#textsec').on('click','[data-text-key]',function(){
		const key=this.dataset.textKey,value=this.dataset.value;
		textChanged(s=>{
			s[key]=key==='fw'?+value:value;
			if(key==='tm'&&value==='aw')s.w=1;
		});
	});
	$('#pop').on('change',()=>each(s=>{s.op=cl($('#pop').val(),0,100,100);}));
	$('#pr').on('change',()=>each(s=>{if(s.type==='rect'||s.type==='frame'){s.r=Math.max(0,+$('#pr').val()||0);s.radii=[s.r,s.r,s.r,s.r];}}));
	$('#pr0,#pr1,#pr2,#pr3').on('change',function(){const i=+this.id.slice(2);selAll().forEach(s=>{if(s.type==='rect'||s.type==='frame'){s.radii=s.radii||[s.r,s.r,s.r,s.r];s.radii[i]=Math.max(0,+$('#pr'+i).val()||0);}});draw();save();});
	$('#peye').on('click',()=>{const v=!selAll()[0].hid;each(s=>{s.hid=v;});refresh();});
	$('#fadd').on('click',()=>addPaint('fill'));$('#sadd').on('click',()=>addPaint('stroke'));$('#savecolor').on('click',savePaletteColor);
	$('#frow,#srow').on('input change','[data-k]',function(e){
		const $input=$(this),$card=$input.closest('[data-kind]'),kind=$card.attr('data-kind'),index=+$card.attr('data-index'),rawKey=$input.attr('data-k'),key=rawKey==='angleRange'?'angle':rawKey;
		if(this.dataset.number==='1'&&e.type==='input')return;
		if(key==='stopHex'){
			const h=hex($input.val()),stopIndex=+$input.closest('[data-stop]').attr('data-stop');if(!h){if(e.type==='change')note('Kode warna tidak valid. Gunakan enam digit heksadesimal.');return;}
			$input.val(h.slice(1).toUpperCase());$card.find(`[data-stop="${stopIndex}"] [data-k="stopColor"]`).val(h);syncSwatch($card.find(`[data-stop="${stopIndex}"]`),'stopColor',h,cl($card.find('[data-k="opacity"]').val(),0,100,100));updateGradientCard($card);setPaintStopValue(kind,index,stopIndex,'color',h);return;
		}
		if(key==='stopColor'){
			const h=hex($input.val()),stopIndex=+$input.closest('[data-stop]').attr('data-stop');if(h){$card.find(`[data-stop="${stopIndex}"] [data-k="stopHex"]`).val(h.slice(1).toUpperCase());syncSwatch($card.find(`[data-stop="${stopIndex}"]`),'stopColor',h,cl($card.find('[data-k="opacity"]').val(),0,100,100));updateGradientCard($card);setPaintStopValue(kind,index,stopIndex,'color',h);}return;
		}
		if(key==='hex'||key==='hex2'){
			const h=hex($input.val());if(!h){if(e.type==='change')note('Kode warna tidak valid. Gunakan enam digit heksadesimal.');return;}const target=key==='hex'?'color':'color2';$input.val(h.slice(1).toUpperCase());$card.find(`[data-k="${target}"]`).val(h);syncSwatch($card,target,h,cl($card.find('[data-k="opacity"]').val(),0,100,100));updateGradientCard($card);setPaintValue(kind,index,target,h);return;
		}
		if(key==='color'||key==='color2'){const h=hex($input.val());if(h){$card.find(`[data-k="${key==='color'?'hex':'hex2'}"]`).val(h.slice(1).toUpperCase());syncSwatch($card,key,h,cl($card.find('[data-k="opacity"]').val(),0,100,100));updateGradientCard($card);setPaintValue(kind,index,key,h);}return;}
		const value=key==='stopPos'?cl($input.val(),0,100,0):key==='type'?this.dataset.value||$input.val():key==='angle'||key==='opacity'||key==='weight'?cl($input.val(),key==='weight'?.1:0,key==='weight'?200:key==='angle'?360:100,key==='weight'?1:100):$input.val();
		if(key==='stopPos'){if(e.type==='change'){const stopIndex=+$input.closest('[data-stop]').attr('data-stop');$input.val(value);updateGradientCard($card);setPaintStopValue(kind,index,stopIndex,'pos',value);}return;}
		if(key==='angle')$card.find('[data-k="angle"],[data-k="angleRange"]').val(value);
		if(key==='type'||key==='angle')updateGradientCard($card);
		if(key==='opacity'||key==='weight'){$input[0].dataset.committed=String(value);$input.val(value);if(key==='opacity')syncSwatch($card,'color',hex($card.find('[data-k="color"]').val())||'#d9d9d9',value);}
		setPaintValue(kind,index,key,value);
	});
	$('#frow,#srow').on('click','[data-action]',function(){
		const $card=$(this).closest('[data-kind]'),kind=$card.attr('data-kind'),index=+$card.attr('data-index'),action=$(this).attr('data-action'),p=getPaintLayers(selAll()[0],kind)[index];
		if(action==='add-stop'){addGradientStop(kind,index);return;}
		if(action==='remove-stop'){removeGradientStop(kind,index,+$(this).closest('[data-stop]').attr('data-stop'));return;}
		if(action==='delete'){removePaint(kind,index);return;}
		if(action==='visible'){setPaintValue(kind,index,'visible',p.visible===false);refresh();return;}
	});
	let paletteTarget={kind:'fill',index:0};
	$('#frow,#srow').on('focusin','[data-k]',function(){const $c=$(this).closest('[data-kind]');paletteTarget={kind:$c.attr('data-kind'),index:+$c.attr('data-index')};});
	$('#paletteList').on('click','[data-color]',function(){setPaintValue(paletteTarget.kind,paletteTarget.index,'color',$(this).attr('data-color'));refresh();});
	$('#pexp').on('change',()=>each(s=>{s.exp=chk('#pexp');}));
});
