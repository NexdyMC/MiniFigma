/* [6.8] Teks. Isi: layout teks, editor kanvas, dan font lokal. Bukan di sini: panel umum, render objek, serialisasi. */
const FONT_WEIGHTS=[[100,'Thin'],[200,'Extra Light'],[300,'Light'],[400,'Regular'],[500,'Medium'],[600,'Semi Bold'],[700,'Bold'],[800,'Extra Bold'],[900,'Black']];
function familyCss(f){
	f=String(f||FF).replace(/[\u0000-\u001f\u007f]/g,'').slice(0,80);
	return f==='Inter,system-ui,sans-serif'?FF:/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/.test(f)?f:`"${f.replace(/["\\]/g,'\\$&')}"`;
}
function fontCss(s){return `${s.italic?'italic ':''}${s.fontWeight??(s.bold?700:400)} ${s.fs}px ${familyCss(s.fontFamily||FF)}`;}
function renderFontWeightOptions(family,current){
	const weight=FONT_WEIGHTS.reduce((best,[value])=>Math.abs(value-current)<Math.abs(best-current)?value:best,400);
	$('#pweight').val(weight);$('#pweightName').text(FONT_WEIGHTS.find(item=>item[0]===weight)[1]);
	return weight;
}
function textWidth(s,text,g=ctx){
	g.font=fontCss(s);const native='letterSpacing' in g,old=native?g.letterSpacing:'';if(native)g.letterSpacing=(s.letterSpacing||0)+'px';
	const width=g.measureText(text).width;if(native)g.letterSpacing=old;
	return width+(!native?Math.max(0,Array.from(text).length-1)*(s.letterSpacing||0):0);
}
function layoutText(s){
	const max=s.textBox?Math.max(1,s.w):Infinity,lines=[];
	String(s.text).replace(/\r\n?/g,'\n').split('\n').forEach(paragraph=>{
		let line='';
		(paragraph.match(/\s+|[^\s]+/gu)||['']).forEach(part=>{
			if(/^\s+$/u.test(part)){if(line&&textWidth(s,line+part)<=max)line+=part;else if(line){lines.push(line.trimEnd());line='';}return;}
			if(textWidth(s,line+part)<=max){line+=part;return;}
			if(line){lines.push(line.trimEnd());line='';}
			Array.from(part).forEach(char=>{if(line&&textWidth(s,line+char)>max){lines.push(line);line=char;}else line+=char;});
		});
		lines.push(line.trimEnd());
	});
	return lines.length?lines:[''];
}
function fitText(s){
	if(s.type!=='text')return;ctx.save();s._lines=layoutText(s);s._lineWidths=s._lines.map(line=>textWidth(s,line));
	if(!s.textBox)s.w=Math.max(0,...s._lineWidths);s.h=Math.max(s.fs*1.25,s.fs*(s.lineHeight||125)/100*s._lines.length);ctx.restore();
}
function positionTextEditor(){
	if(!editingText)return;const s=editingText.layer,[x,y]=w2s(s.x,s.y),w=Math.max(4,s.w*V.z),h=Math.max(4,s.h*V.z);
	$('#textedit').css({display:'block',left:x,top:y,width:w+4,height:h+2,fontSize:s.fs*V.z,lineHeight:(s.fs*(s.lineHeight||125)/100*V.z)+'px',
		fontFamily:familyCss(s.fontFamily||FF),fontWeight:s.fontWeight??(s.bold?700:400),fontStyle:s.italic?'italic':'normal',textDecoration:s.underline?'underline':'none',
		textAlign:s.textAlign||'left',letterSpacing:(s.letterSpacing||0)*V.z+'px',color:s.fill,opacity:(s.op??100)/100*(s.fo??100)/100,
		transformOrigin:`${(s.pvx??.5)*w}px ${(s.pvy??.5)*h}px`,transform:`rotate(${s.rot||0}deg) scale(${s.flipX?-1:1},${s.flipY?-1:1})`});
}
function startTextEdit(s){
	editingText={layer:s,original:s.text};const $editor=$('#textedit');$editor.val(s.text).attr('data-color',s.fill);positionTextEditor();
	requestAnimationFrame(()=>{if(editingText&&editingText.layer===s)$editor.trigger('focus').select();});
}
function finishTextEdit(commit){
	if(!editingText)return;const {layer,original}=editingText;if(commit)layer.text=$('#textedit').val();else layer.text=original;
	fitText(layer);editingText=null;$('#textedit').hide();refresh();if(commit)save();
}
function renderFontOptions(current){
	const $select=$('#pfont').empty(),options=[...FONT_OPTIONS,...localFonts.map(f=>[f.name,f.name])],seen=new Set();
	options.forEach(([label,value])=>{if(seen.has(value))return;seen.add(value);$select.append(new Option(label,value));});
	if(current&&!seen.has(current))$select.append(new Option(current+' (belum terpasang)',current));if(current)$select.val(current);
}
const fontPayload=data=>data.replace(/^data:font\/ttf;base64,/i,'');
function fromBase64(s){const raw=atob(s),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
function toBase64(bytes){let raw='';for(let i=0;i<bytes.length;i+=0x8000)raw+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(raw);}
async function activateFont(font){const face=new FontFace(font.name,fromBase64(fontPayload(font.data)));await face.load();document.fonts.add(face);fontFaces.set(font.name,face);}
async function loadFontLibrary(){
	try{
		const parsed=JSON.parse(localStorage.getItem(FONT_KEY)||'[]');if(!Array.isArray(parsed))throw new Error('Format library font tidak valid.');
		const seen=new Set();let used=0,count=0;
		localFonts=parsed.filter(f=>{
			if(!f||typeof f.name!=='string'||!/^[a-zA-Z0-9 _()-]{1,80}$/.test(f.name)||typeof f.data!=='string'||!/^data:font\/ttf;base64,[A-Za-z0-9+/]+=*$/i.test(f.data)||!Number.isFinite(+f.bytes)||+f.bytes<1||+f.bytes>MAX_FONT||fontPayload(f.data).length>4*Math.ceil(MAX_FONT/3)||seen.has(f.name.toLowerCase())||count>=MAX_FONTS||used+(+f.bytes)>MAX_FONTS_TOTAL)return false;
			seen.add(f.name.toLowerCase());used+=+f.bytes;count++;return true;
		});
		let warning=null;for(const font of localFonts){try{await activateFont(font);}catch(e){warning='Font lokal gagal dimuat: '+font.name;}}return warning;
	}catch(e){localFonts=[];return 'Library font lokal gagal dibaca: '+e.message;}
}
function saveFontLibrary(next){try{localStorage.setItem(FONT_KEY,JSON.stringify(next));localFonts=next;return true;}catch(e){note('Font tidak dapat disimpan: ruang localStorage penuh.');return false;}}
function renderFontLibrary(){
	const $list=$('#fontlist').empty();$('#fontcount').text(localFonts.length+' / '+MAX_FONTS);
	if(!localFonts.length)$list.append($('<p class="text-neutral-400">Belum ada font kustom. Pilih file TTF untuk menambah font.</p>'));
	localFonts.forEach(font=>{
		const $row=$('<div class="flex items-center gap-2 rounded bg-[#383838] px-3 py-2"></div>').appendTo($list);
		$('<span class="flex-1 truncate"></span>').text(font.name+' · '+Math.ceil(font.bytes/1024)+' KB').appendTo($row);
		$('<button class="px-2 py-1 rounded hover:bg-neutral-600">Hapus</button>').appendTo($row).on('click',()=>{
			const next=localFonts.filter(f=>f.name!==font.name);if(!saveFontLibrary(next))return;
			const face=fontFaces.get(font.name);if(face)document.fonts.delete(face);fontFaces.delete(font.name);let changed=false;
			S.forEach(s=>{if(s.type==='text'&&s.fontFamily===font.name){s.fontFamily=FF;fitText(s);changed=true;}});
			if(changed){refresh();save();}renderFontLibrary();renderFontOptions(sel&&sel.type==='text'?sel.fontFamily:null);
		});
	});
}
function fontMagic(bytes){return bytes.length>=4&&((bytes[0]===0&&bytes[1]===1&&bytes[2]===0&&bytes[3]===0)||String.fromCharCode(...bytes.subarray(0,4))==='true');}
async function addFontFiles(files){
	for(const file of [...files]){
		const name=file.name.replace(/\.ttf$/i,'').replace(/[^a-zA-Z0-9 _()-]/g,' ').trim();
		if(!/\.ttf$/i.test(file.name)){note('Pilih file font dengan ekstensi .ttf.');continue;}if(!name){note('Nama font tidak valid.');continue;}
		if(localFonts.length>=MAX_FONTS){note('Maksimal '+MAX_FONTS+' font lokal.');break;}if(file.size>MAX_FONT){note('Ukuran font maksimal 1 MB per file.');continue;}
		if(localFonts.some(f=>f.name.toLowerCase()===name.toLowerCase())){note('Font "'+name+'" sudah terpasang.');continue;}
		const used=localFonts.reduce((n,f)=>n+(+f.bytes||0),0);if(used+file.size>MAX_FONTS_TOTAL){note('Total font lokal dibatasi 2 MB.');break;}
		try{
			const bytes=new Uint8Array(await file.arrayBuffer());if(!fontMagic(bytes)){note('File tidak memiliki signature TrueType yang valid.');continue;}
			const font={name,data:'data:font/ttf;base64,'+toBase64(bytes),bytes:file.size};await activateFont(font);
			if(!saveFontLibrary([...localFonts,font])){const face=fontFaces.get(name);if(face)document.fonts.delete(face);fontFaces.delete(name);continue;}
			renderFontLibrary();renderFontOptions(sel&&sel.type==='text'?sel.fontFamily:null);note('Font "'+name+'" berhasil dipasang dan disimpan di browser ini.');
		}catch(e){note('Gagal memasang font "'+name+'": '+e.message);}
	}
}
MF.init.push(function initText(){
	MF.down.push({p:30,fn(e,c){
		if(tool!=='text')return false;const [wx,wy]=snapPt(c.wx,c.wy),s=mk('text',wx,wy);setSel([s]);fitText(s);S.push(s);setTool('select');refresh();save();startTextEdit(s);return true;
	}});
	$('#textedit').on('input',function(){if(!editingText)return;editingText.layer.text=this.value;fitText(editingText.layer);draw();}).on('keydown',e=>{
		e.stopPropagation();if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();finishTextEdit(true);}else if(e.key==='Escape'){e.preventDefault();finishTextEdit(false);}
	}).on('blur',()=>finishTextEdit(true));
	$('#fontmanage').on('click',()=>{renderFontLibrary();$('#fontdlg')[0].showModal();});$('#fontclose').on('click',()=>$('#fontdlg')[0].close());
	$('#fontupload').on('click',()=>$('#fontfile').trigger('click'));$('#fontfile').on('change',function(){const files=[...this.files];this.value='';if(files.length)addFontFiles(files);});
});
