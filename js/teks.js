/* [6.8] Teks. Isi: layout teks, editor kanvas, dan font lokal. Bukan di sini: panel umum, render objek, serialisasi. */
const FONT_WEIGHTS=[[100,'Thin'],[200,'Extra Light'],[300,'Light'],[400,'Regular'],[500,'Medium'],[600,'Semi Bold'],[700,'Bold'],[800,'Extra Bold'],[900,'Black']];
const textLayoutCache=new WeakMap();
const textAlignValue=s=>({l:'left',c:'center',r:'right',j:'justify'}[s.ta]||s.textAlign||'left');
const textLineHeight=s=>s.lh==null?s.fs*1.25:s.fs*Math.max(50,Math.min(300,+s.lh||125))/100;
const textSpacing=s=>s.fs*(+s.ls||0)/100;
const displayText=s=>{const t=String(s.text||'');if(s.tc==='upper')return t.toLocaleUpperCase();if(s.tc==='lower')return t.toLocaleLowerCase();if(s.tc==='title')return t.toLocaleLowerCase().replace(/(^|[\s([{])(\p{L})/gu,(_,a,b)=>a+b.toLocaleUpperCase());return t;};
function familyCss(f){
	f=String(f||FF).replace(/[\u0000-\u001f\u007f]/g,'').slice(0,80);
	if(f==='Inter')return 'Inter,system-ui,sans-serif';
	return /^(serif|sans-serif|monospace|system-ui)$/.test(f)?f:`"${f.replace(/["\\]/g,'\\$&')}",sans-serif`;
}
function fontCss(s){return `${s.fi?'italic ':''}${s.fw||400} ${s.fs}px ${familyCss(s.ff||'Inter')}`;}
function textWidth(s,text,g=ctx){
	g.font=fontCss(s);const native='letterSpacing' in g,old=native?g.letterSpacing:'';if(native)g.letterSpacing=textSpacing(s)+'px';
	const width=g.measureText(text).width;if(native)g.letterSpacing=old;
	return width+(!native?Math.max(0,Array.from(text).length-1)*textSpacing(s):0);
}
function layoutText(s){
	const text=displayText(s),wrap=s.tm==='ah'||s.tm==='fx',max=wrap?Math.max(1,s.w):Infinity,key=JSON.stringify([text,fontCss(s),max,s.ls,s.tm]);
	const cached=textLayoutCache.get(s);if(cached&&cached.key===key)return cached;
	const lines=[];
	text.replace(/\r\n?/g,'\n').split('\n').forEach(paragraph=>{
		let line='';
		(paragraph.match(/\s+|[^\s]+/gu)||['']).forEach(part=>{
			if(/^\s+$/u.test(part)){if(line&&textWidth(s,line+part)<=max)line+=part;else if(line){lines.push(line.trimEnd());line='';}return;}
			if(textWidth(s,line+part)<=max){line+=part;return;}
			if(line){lines.push(line.trimEnd());line='';}
			Array.from(part).forEach(char=>{if(line&&textWidth(s,line+char)>max){lines.push(line);line=char;}else line+=char;});
		});
		lines.push(line.trimEnd());
	});
	const rows=lines.length?lines:[''],result={key,lines:rows,widths:rows.map(line=>textWidth(s,line))};textLayoutCache.set(s,result);return result;
}
function fitText(s){
	if(s.type!=='text')return;ctx.save();const layout=layoutText(s);s._lines=layout.lines;s._lineWidths=layout.widths;
	if(s.tm==='aw')s.w=Math.max(1,...s._lineWidths);if(s.tm!=='fx')s.h=Math.max(textLineHeight(s),textLineHeight(s)*s._lines.length);ctx.restore();
}
function textRowX(s){return s.ta==='c'?s.x+s.w/2:s.ta==='r'?s.x+s.w:s.x;}
function textRowY(s,i){
	const total=textLineHeight(s)*(s._lines||[]).length,offset=s.va==='middle'?Math.max(0,(s.h-total)/2):s.va==='bottom'?Math.max(0,s.h-total):0;
	return s.y+offset+i*textLineHeight(s);
}
function textEditorFill(s){
	const p=getPaintLayers(s,'fill').find(x=>x.visible!==false);
	if(!p)return {color:'transparent',backgroundImage:'none',backgroundClip:'border-box',WebkitBackgroundClip:'border-box',WebkitTextFillColor:'transparent',opacity:(s.op??100)/100};
	if(p.type==='solid'){const color=hex(p.color)||s.fill||'#d9d9d9';return {color,backgroundImage:'none',backgroundClip:'border-box',WebkitBackgroundClip:'border-box',WebkitTextFillColor:color,opacity:(s.op??100)/100*(p.opacity??100)/100};}
	const stops=(Array.isArray(p.stops)&&p.stops.length>=2?p.stops:[{pos:0,color:p.color},{pos:100,color:p.color2||p.color}]).map(x=>`${hex(x.color)||'#d9d9d9'} ${cl(x.pos,0,100,0)}%`).join(',');
	const backgroundImage=p.type==='radial'?`radial-gradient(circle,${stops})`:p.type==='angular'?`conic-gradient(from ${+(p.angle||0)}deg,${stops})`:`linear-gradient(${+(p.angle||0)}deg,${stops})`;
	return {color:hex(p.color)||'#d9d9d9',backgroundImage,backgroundClip:'text',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundSize:'100% 100%',opacity:(s.op??100)/100*(p.opacity??100)/100};
}
function drawTextRun(g,s,text,x,y,stroke){
	const native='letterSpacing' in g,spacing=textSpacing(s),old=native?g.letterSpacing:'';
	g.textAlign='left';
	if(native){g.letterSpacing=spacing+'px';if(stroke)g.strokeText(text,x,y);else g.fillText(text,x,y);g.letterSpacing=old;return textWidth(s,text,g);}
	let cursor=x;Array.from(text).forEach((c,i,chars)=>{if(stroke)g.strokeText(c,cursor,y);else g.fillText(c,cursor,y);cursor+=g.measureText(c).width;if(i<chars.length-1)cursor+=spacing;});return cursor-x;
}
function drawTextLine(g,s,line,i,width,stroke=false){
	const align=textAlignValue(s),x=textRowX(s),y=textRowY(s,i),last=i===(s._lines||[]).length-1,justify=align==='justify'&&!last;
	if(justify){
		const words=line.trim().split(/\s+/u).filter(Boolean);
		if(words.length>1){
			const space=textWidth(s,' ',g),wordWidths=words.map(word=>textWidth(s,word,g)),gap=Math.max(0,(s.w-wordWidths.reduce((a,b)=>a+b,0)-space*(words.length-1))/(words.length-1));let cursor=x;
			words.forEach((word,j)=>{cursor+=drawTextRun(g,s,word,cursor,y,stroke);if(j<words.length-1)cursor+=space+gap;});
		}else drawTextRun(g,s,line,x,y,stroke);
	}else{
		const native='letterSpacing' in g;g.textAlign=align==='justify'?'left':align;
		if(native){const old=g.letterSpacing;g.letterSpacing=textSpacing(s)+'px';if(stroke)g.strokeText(line,x,y);else g.fillText(line,x,y);g.letterSpacing=old;}
		else{
			const chars=Array.from(line),widths=chars.map(c=>g.measureText(c).width),total=widths.reduce((a,b)=>a+b,0)+Math.max(0,chars.length-1)*textSpacing(s);let cursor=x-(align==='center'?total/2:align==='right'?total:0);
			g.textAlign='left';chars.forEach((c,j)=>{if(stroke)g.strokeText(c,cursor,y);else g.fillText(c,cursor,y);cursor+=widths[j]+textSpacing(s);});
		}
	}
	if(!stroke&&line&&s.td!=='none'){
		const decoWidth=justify?s.w:width,start=x-(align==='center'?width/2:align==='right'?width:0),th=Math.max(1,s.fs/16);
		g.fillRect(start,y+(s.td==='strike'?.58:1.08)*s.fs,decoWidth,th);
	}
}
function drawTextRow(g,s,line,i,width){drawTextLine(g,s,line,i,width,false);}
function drawTextStrokeRow(g,s,line,i,width){drawTextLine(g,s,line,i,width,true);}
function positionTextEditor(){
	if(!editingText)return;const s=editingText.layer,[x,y]=w2s(s.x,s.y),w=Math.max(4,s.w*V.z),h=Math.max(4,s.h*V.z);
	const natural=textLineHeight(s)*Math.max(1,s._lines.length),offset=s.va==='middle'?Math.max(0,(h-natural)/2):s.va==='bottom'?Math.max(0,h-natural):0;
	$('#textedit').css({display:'block',left:x,top:y,width:w+4,height:h+2,fontSize:s.fs*V.z,lineHeight:(textLineHeight(s)*V.z)+'px',
		fontFamily:familyCss(s.ff),fontWeight:s.fw,fontStyle:s.fi?'italic':'normal',textDecoration:s.td==='none'?'none':s.td==='strike'?'line-through':'underline',
		textTransform:s.tc==='upper'?'uppercase':s.tc==='lower'?'lowercase':s.tc==='title'?'capitalize':'none',textAlign:textAlignValue(s)==='justify'?'justify':textAlignValue(s),letterSpacing:textSpacing(s)*V.z+'px',paddingTop:offset*V.z+'px',
		whiteSpace:s.tm==='aw'?'pre':'pre-wrap',overflowWrap:s.tm==='aw'?'normal':'break-word',
		...textEditorFill(s),transformOrigin:`${(s.pvx??.5)*w}px ${(s.pvy??.5)*h}px`,transform:`rotate(${s.rot||0}deg) scale(${s.flipX?-1:1},${s.flipY?-1:1})`});
}
function paintSolidColor(s){const p=getPaintLayers(s,'fill').find(x=>x.visible!==false);return p&&p.type==='solid'?p.color:s.fill||'#d9d9d9';}
function startTextEdit(s,isNew=false){
	if(typeof clearHover==='function')clearHover();
	editingText={layer:s,original:s.text,isNew};const $editor=$('#textedit');$editor.val(s.text);positionTextEditor();$editor.trigger('focus');if(isNew)$editor.select();
}
function finishTextEdit(commit){
	if(!editingText)return;const {layer,original,isNew}=editingText,text=commit?$('#textedit').val():original;layer.text=text;
	if(isNew&&!text.trim()){S=S.filter(s=>s!==layer);setSel([]);}
	else fitText(layer);
	editingText=null;$('#textedit').hide();refresh();if(commit&&text!==original&&(!isNew||text.trim()))save();
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
			S.forEach(s=>{if(s.type==='text'&&s.ff===font.name){s.ff='Inter';fitText(s);changed=true;}});
			if(changed){refresh();save();}renderFontLibrary();
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
			renderFontLibrary();note('Font "'+name+'" berhasil dipasang dan disimpan di browser ini.');
		}catch(e){note('Gagal memasang font "'+name+'": '+e.message);}
	}
}
MF.init.push(function initText(){
	MF.down.push({p:30,fn(e,c){
		if(tool!=='text')return false;const target=pickAt(c.wx,c.wy,e);
		if(target&&target.hit.type==='text'){setSel(target.items);refresh();startTextEdit(target.hit);return true;}
		const [wx,wy]=snapPt(c.wx,c.wy),s=mk('text',wx,wy);s.text='';setSel([s]);S.push(s);drag={k:'textCreate',s,sx:wx,sy:wy,screenX:c.sx,screenY:c.sy};refresh();return true;
	}});
	MF.move.textCreate=(e,c)=>{
		const s=drag.s,w=Math.max(1,Math.abs(c.wx-drag.sx)),h=Math.max(1,Math.abs(c.wy-drag.sy));
		s.x=Math.min(drag.sx,c.wx);s.y=Math.min(drag.sy,c.wy);drag.moved=Math.hypot(c.sx-drag.screenX,c.sy-drag.screenY)>3;
		if(drag.moved){s.tm='ah';s.w=w;s.h=h;}else s.tm='aw';fitText(s);
	};
	MF.up.textCreate=()=>{
		const s=drag.s;if(drag.moved){s.tm='ah';fitText(s);}else{s.tm='aw';fitText(s);}
		startTextEdit(s,true);
	};
	$('#textedit').on('input',function(){if(!editingText)return;editingText.layer.text=this.value;fitText(editingText.layer);positionTextEditor();draw();}).on('keydown',e=>{
		e.stopPropagation();if(e.key==='Escape'){e.preventDefault();finishTextEdit(true);}
	}).on('blur',()=>finishTextEdit(true));
	$(cv).on('dblclick',e=>{
		const [wx,wy]=s2w(e.offsetX,e.offsetY),target=pickAt(wx,wy,e.originalEvent||e);
		if(target&&target.hit.type==='text'){setSel(target.items);refresh();startTextEdit(target.hit);}
	});
	$('#fontmanage').on('click',()=>{renderFontLibrary();$('#fontdlg')[0].showModal();});$('#fontclose').on('click',()=>$('#fontdlg')[0].close());
	$('#fontupload').on('click',()=>$('#fontfile').trigger('click'));$('#fontfile').on('change',function(){const files=[...this.files];this.value='';if(files.length)addFontFiles(files);});
});
