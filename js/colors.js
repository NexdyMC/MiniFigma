/* [6.6] Warna. Isi: utilitas warna, kontras, dan picker bersama. Bukan di sini: model paint atau renderer. */
const ColorUtils={
	clamp:(v,a,b)=>Math.max(a,Math.min(b,+v||0)),
	parse(value){
		if(value&&typeof value==='object'&&Number.isFinite(value.r)&&Number.isFinite(value.g)&&Number.isFinite(value.b))return {r:this.clamp(value.r,0,255),g:this.clamp(value.g,0,255),b:this.clamp(value.b,0,255),a:this.clamp(value.a==null?1:value.a,0,1)};
		let s=String(value||'').trim(),m;
		if((m=s.match(/^#?([0-9a-f]{3,8})$/i))){
			let h=m[1];if(h.length===3||h.length===4)h=[...h].map(c=>c+c).join('');
			if(h.length===6||h.length===8)return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:h.length===8?parseInt(h.slice(6,8),16)/255:1};
			return null;
		}
		if((m=s.match(/^rgba?\(\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?(?:\s*[,/]\s*([\d.]+)%?)?\s*\)$/i))){
			const perc=/%/.test(s.slice(0,s.lastIndexOf(')')));return {r:this.clamp(+m[1]*(perc?2.55:1),0,255),g:this.clamp(+m[2]*(perc?2.55:1),0,255),b:this.clamp(+m[3]*(perc?2.55:1),0,255),a:this.clamp(m[4]==null?1:+m[4]*(s.includes(`${m[4]}%`)?0.01:1),0,1)};
		}
		if((m=s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+)%?)?\s*\)$/i)))return {...this.hslToRgb(+m[1],+m[2],+m[3]),a:this.clamp(m[4]==null?1:+m[4]*(s.includes(`${m[4]}%`)?0.01:1),0,1)};
		if((m=s.match(/^hsv\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+))?\s*\)$/i)))return {...this.hsvToRgb(+m[1],+m[2],+m[3]),a:this.clamp(m[4]==null?1:+m[4],0,1)};
		if((m=s.match(/^cmyk\(\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*\)$/i)))return {...this.cmykToRgb(+m[1],+m[2],+m[3],+m[4]),a:1};
		if(typeof document!=='undefined'&&s){
			const canvas=document.createElement('canvas'),g=canvas.getContext('2d');if(!g)return null;
			g.fillStyle='#010203';try{g.fillStyle=s;}catch(e){return null;}
			if(g.fillStyle==='#010203'&&s.toLowerCase()!=='#010203')return null;
			const out=g.fillStyle;if(/^#[\da-f]{6}$/i.test(out))return this.parse(out);
			const rgb=out.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);if(rgb)return {r:+rgb[1],g:+rgb[2],b:+rgb[3],a:rgb[4]==null?1:+rgb[4]};
		}
		return null;
	},
	hex(c,alpha=false){c=this.parse(c);if(!c)return null;const h=[c.r,c.g,c.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');return '#'+h+(alpha?Math.round(c.a*255).toString(16).padStart(2,'0'):'');},
	rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));switch(max){case r:h=((g-b)/d)%6;break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h*=60;if(h<0)h+=360;}return {h,s:s*100,l:l*100};},
	hslToRgb(h,s,l){h=((h%360)+360)%360/360;s=this.clamp(s,0,100)/100;l=this.clamp(l,0,100)/100;const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);return 255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)));};return {r:f(0),g:f(8),b:f(4)};},
	rgbToHsv(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360;}return {h,s:max?d/max*100:0,v:max*100};},
	hsvToRgb(h,s,v){h=((h%360)+360)%360;s=this.clamp(s,0,100)/100;v=this.clamp(v,0,100)/100;const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;let a,b,d;if(h<60){a=c;b=x;d=0;}else if(h<120){a=x;b=c;d=0;}else if(h<180){a=0;b=c;d=x;}else if(h<240){a=0;b=x;d=c;}else if(h<300){a=x;b=0;d=c;}else{a=c;b=0;d=x;}return {r:(a+m)*255,g:(b+m)*255,b:(d+m)*255};},
	rgbToCmyk(r,g,b){r/=255;g/=255;b/=255;const k=1-Math.max(r,g,b);return {c:k===1?0:(1-r-k)/(1-k)*100,m:k===1?0:(1-g-k)/(1-k)*100,y:k===1?0:(1-b-k)/(1-k)*100,k:k*100};},
	cmykToRgb(c,m,y,k){c=this.clamp(c,0,100)/100;m=this.clamp(m,0,100)/100;y=this.clamp(y,0,100)/100;k=this.clamp(k,0,100)/100;return {r:255*(1-c)*(1-k),g:255*(1-m)*(1-k),b:255*(1-y)*(1-k)};},
	format(c,format){c=this.parse(c);if(!c)return '';if(format==='RGB')return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;if(format==='CSS')return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Math.round(c.a*100)/100})`;if(format==='HSL'){const h=this.rgbToHsl(c.r,c.g,c.b);return `hsl(${Math.round(h.h)}, ${Math.round(h.s)}%, ${Math.round(h.l)}%)`;}if(format==='CMYK'){const k=this.rgbToCmyk(c.r,c.g,c.b);return `cmyk(${Math.round(k.c)}%, ${Math.round(k.m)}%, ${Math.round(k.y)}%, ${Math.round(k.k)}%)`;}return this.hex(c);},
	parseFormat(value,format){const c=this.parse(value);if(c)return c;const m=String(value).match(/^[\s]*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s]+([\d.]+))?[\s]*$/);if(!m)return null;if(format==='RGB')return this.parse(`rgb(${m[1]},${m[2]},${m[3]})`);if(format==='HSL')return this.parse(`hsl(${m[1]},${m[2]}%,${m[3]}%)`);if(format==='CMYK')return this.parse(`cmyk(${m[1]}%,${m[2]}%,${m[3]}%,${m[4]||0}%)`);return null;}
};
const ContrastUtils={
	linear(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;},
	luminance(color){const c=ColorUtils.parse(color);return .2126*this.linear(c.r)+.7152*this.linear(c.g)+.0722*this.linear(c.b);},
	composite(foreground,background,opacity=1){const fg=ColorUtils.parse(foreground),bg=ColorUtils.parse(background),a=ColorUtils.clamp(opacity,0,1);return {r:fg.r*a+bg.r*(1-a),g:fg.g*a+bg.g*(1-a),b:fg.b*a+bg.b*(1-a),a:1};},
	ratio(foreground,background,opacity=1){const a=this.luminance(this.composite(foreground,background,opacity)),b=this.luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);},
	threshold(standard,size){return standard==='AAA'?(size==='large'?4.5:7):(size==='large'?3:4.5);},
	passes(color,background,opacity,threshold){return this.ratio(color,background,opacity)>=threshold;}
};
const COLOR_BLEND_MODES=[
	['normal','Normal','source-over'],['multiply','Multiply','multiply'],['screen','Screen','screen'],['overlay','Overlay','overlay'],
	['darken','Darken','darken'],['lighten','Lighten','lighten'],['color-dodge','Color Dodge','color-dodge'],['color-burn','Color Burn','color-burn'],
	['hard-light','Hard Light','hard-light'],['soft-light','Soft Light','soft-light'],['difference','Difference','difference'],['exclusion','Exclusion','exclusion'],
	['hue','Hue','hue'],['saturation','Saturation','saturation'],['color','Color','color'],['luminosity','Luminosity','luminosity']
];
class ColorPicker{
	constructor(){
		this.changeCb=null;this.commitCb=null;this.blendCb=null;this.anchor=null;this.current={r:217,g:217,b:217,a:1};this.hsv={h:0,s:0,v:85};this.background='#ffffff';this.contrastOn=false;this.standard='AA';this.textSize='normal';this.opened=false;this.dirty=false;this.overlayKey='';this.ignoreSampleClickUntil=0;this.sampleHandler=null;this.sampleBlocker=null;
		this.dragState=null;this.positionMoved=false;
		const blends=COLOR_BLEND_MODES.map(([v,label])=>`<option value="${v}">${label}</option>`).join('');
		this.el=document.createElement('div');this.el.id='mfColorPicker';this.el.className='mf-color-picker';this.el.hidden=true;this.el.innerHTML=`<div class="mfc-head"><div class="mfc-tabs"><button type="button" class="active" data-tab="custom">Custom</button><button type="button" data-tab="libraries">Libraries</button></div><button type="button" class="mfc-icon" data-save title="Simpan warna">+</button><button type="button" class="mfc-icon" data-close title="Tutup">×</button></div><div class="mfc-body" data-view="custom"><div class="mfc-types"><button type="button" class="active" aria-label="Solid">●</button><button type="button" disabled title="Segera hadir" aria-label="Gradien">▧</button><button type="button" disabled title="Segera hadir" aria-label="Pattern">▦</button><button type="button" disabled title="Segera hadir" aria-label="Gambar">▣</button><button type="button" disabled title="Segera hadir" aria-label="Video">▶</button><button type="button" disabled title="Segera hadir" aria-label="Shader">◉</button></div><div class="mfc-paint-tools"><select data-blend aria-label="Blend mode">${blends}</select><button type="button" data-contrast-toggle aria-pressed="false" title="Periksa kontras warna" aria-label="Periksa kontras warna">◐</button></div><div class="mfc-contrast" data-contrast hidden><div class="mfc-contrast-row"><span class="mfc-contrast-swatch" data-contrast-fg title="Warna depan"></span><span>vs</span><span class="mfc-contrast-swatch" data-contrast-bg title="Warna latar"></span><strong data-contrast-ratio>1.00 : 1</strong><button type="button" data-contrast-settings title="Pengaturan kontras" aria-label="Pengaturan kontras">⚙</button></div><div class="mfc-contrast-badges"><button type="button" data-standard="AA" title="Klik untuk menyesuaikan warna ke standar AA">AA ×</button><button type="button" data-standard="AAA" title="Klik untuk menyesuaikan warna ke standar AAA">AAA ×</button></div><div class="mfc-contrast-settings" data-contrast-settings-panel hidden><label>Standar<select data-standard-select><option>AA</option><option>AAA</option></select></label><label>Teks<select data-size-select><option value="normal">Normal</option><option value="large">Besar</option></select></label><label>Latar<select data-background-select><option value="custom">Manual</option><option value="#ffffff">Putih</option><option value="#000000">Hitam</option><option value="#1e1e1e">Kanvas</option></select></label><input data-background type="color" value="#ffffff" aria-label="Warna latar manual"></div></div><div class="mfc-field-wrap"><canvas class="mfc-field" width="208" height="208" role="group" aria-roledescription="2D Slider" tabindex="0" aria-label="Saturasi dan kecerahan"></canvas><canvas class="mfc-contrast-overlay" width="208" height="208" aria-hidden="true"></canvas></div><div class="mfc-slider-row"><button type="button" data-eyedropper title="Pipet warna" aria-label="Pipet warna">⌖</button><input data-hue type="range" min="0" max="359" aria-label="Hue"></div><div class="mfc-opacity"><input data-opacity type="range" min="0" max="100" aria-label="Opasitas"></div><div class="mfc-code"><select data-format aria-label="Format warna"><option>Hex</option><option>RGB</option><option>CSS</option><option>HSL</option><option>CMYK</option></select><input data-value aria-label="Nilai warna"><input data-alpha type="number" min="0" max="100" aria-label="Opasitas persen"><span>%</span></div></div><div class="mfc-body" data-view="libraries" hidden><p>Library warna akan tersedia pada tahap berikutnya.</p></div>`;
		document.body.appendChild(this.el);this.field=this.el.querySelector('.mfc-field');this.ctx=this.field.getContext('2d');this.overlay=this.el.querySelector('.mfc-contrast-overlay');this.overlayCtx=this.overlay.getContext('2d');const components=document.createElement('div');components.dataset.components='';components.hidden=true;this.el.querySelector('.mfc-code').insertBefore(components,this.el.querySelector('[data-value]'));this.bind();this.setupDragging();
		const eyedropper=this.el.querySelector('[data-eyedropper]'),dropperIcon=document.createElementNS('http://www.w3.org/2000/svg','svg'),dropperPath=document.createElementNS('http://www.w3.org/2000/svg','path');
		dropperIcon.setAttribute('width','14');dropperIcon.setAttribute('height','14');dropperIcon.setAttribute('viewBox','0 0 512 512');dropperIcon.setAttribute('fill','currentColor');dropperPath.setAttribute('d',FA.dropper);dropperIcon.appendChild(dropperPath);eyedropper.replaceChildren(dropperIcon);
		eyedropper.title='Ambil warna dari layar, gambar, atau kanvas';eyedropper.setAttribute('aria-label','Ambil warna dari layar, gambar, atau kanvas');
		this.el.querySelector('[data-view="libraries"]').innerHTML='<p class="mfc-library-title">Warna tersimpan</p><div class="mfc-library-grid" data-library-grid></div><p class="mfc-library-empty" data-library-empty hidden>Belum ada warna. Tekan + untuk menyimpan warna aktif.</p>';
	}
	onChange(cb){this.changeCb=cb;return this;}
	onCommit(cb){this.commitCb=cb;return this;}
	open(anchorEl,initialPaint={},options={}){
		if(this.opened)this.finish();
		this.anchor=anchorEl;this.positionMoved=false;this.changeCb=options.onChange||null;this.commitCb=options.onCommit||null;this.blendCb=options.onBlendChange||null;this.background=ColorUtils.hex(options.background||'#ffffff')||'#ffffff';const c=ColorUtils.parse(initialPaint.color||initialPaint)||{r:217,g:217,b:217,a:1};c.a=initialPaint.opacity==null?c.a:ColorUtils.clamp(initialPaint.opacity/100,0,1);this.current=c;this.hsv=ColorUtils.rgbToHsv(c.r,c.g,c.b);
		this.opened=true;this.dirty=false;this.el.hidden=false;this.el.querySelector('[data-view="custom"]').hidden=false;this.el.querySelector('[data-view="libraries"]').hidden=true;this.el.querySelector('[data-tab="custom"]').classList.add('active');this.el.querySelector('[data-tab="libraries"]').classList.remove('active');this.el.querySelector('[data-blend]').value=initialPaint.blendMode||'normal';this.el.querySelector('[data-background]').value=this.background;this.render();this.position();return this;
	}
	close(){if(!this.opened)return;this.finish();if(this.sampleHandler)cv.removeEventListener('pointerdown',this.sampleHandler,true);if(this.sampleBlocker)cv.removeEventListener('mousedown',this.sampleBlocker,true);this.sampleHandler=this.sampleBlocker=null;this.el.hidden=true;this.opened=false;this.anchor=null;}
	finish(){if(this.dirty&&this.commitCb)this.commitCb(this.value());this.dirty=false;}
	destroy(){this.close();this.dragHandle.removeEventListener('pointerdown',this.onDragStart);window.removeEventListener('pointermove',this.onDragMove);window.removeEventListener('pointerup',this.onDragEnd);window.removeEventListener('pointercancel',this.onDragEnd);this.el.remove();$(document).off('.mfColorPicker');$(window).off('.mfColorPicker');}
	value(){return {color:ColorUtils.hex(this.current),opacity:Math.round(this.current.a*100)};}
	setColor(c,emit=true){this.current=ColorUtils.parse(c)||this.current;this.hsv=ColorUtils.rgbToHsv(this.current.r,this.current.g,this.current.b);this.render();if(emit){this.dirty=true;if(this.changeCb)this.changeCb(this.value());}}
	setupDragging(){
		this.dragHandle=this.el.querySelector('.mfc-head');
		this.dragHandle.title='Seret untuk memindahkan panel';
		this.onDragStart=e=>{
			if(e.button!==0||e.target.closest('button,select,input'))return;
			const r=this.el.getBoundingClientRect();
			this.dragState={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,left:r.left,top:r.top,moved:false};
			this.dragHandle.setPointerCapture(e.pointerId);
		};
		this.onDragMove=e=>{
			const drag=this.dragState;if(!drag||e.pointerId!==drag.pointerId)return;
			const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
			if(!drag.moved&&Math.hypot(dx,dy)<3)return;
			drag.moved=true;this.positionMoved=true;this.el.classList.add('is-dragging');e.preventDefault();
			const r=this.el.getBoundingClientRect(),maxLeft=Math.max(0,innerWidth-r.width),maxTop=Math.max(0,innerHeight-r.height);
			this.el.style.left=Math.max(0,Math.min(drag.left+dx,maxLeft))+'px';
			this.el.style.top=Math.max(0,Math.min(drag.top+dy,maxTop))+'px';
		};
		this.onDragEnd=e=>{
			if(!this.dragState||e.pointerId!==this.dragState.pointerId)return;
			this.dragState=null;this.el.classList.remove('is-dragging');
		};
		this.dragHandle.addEventListener('pointerdown',this.onDragStart);
		window.addEventListener('pointermove',this.onDragMove);
		window.addEventListener('pointerup',this.onDragEnd);
		window.addEventListener('pointercancel',this.onDragEnd);
	}
	render(){
		const g=this.ctx,w=this.field.width,h=this.field.height;g.clearRect(0,0,w,h);g.fillStyle=`hsl(${this.hsv.h} 100% 50%)`;g.fillRect(0,0,w,h);let grad=g.createLinearGradient(0,0,w,0);grad.addColorStop(0,'#fff');grad.addColorStop(1,'transparent');g.fillStyle=grad;g.fillRect(0,0,w,h);grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,'transparent');grad.addColorStop(1,'#000');g.fillStyle=grad;g.fillRect(0,0,w,h);
		const x=this.hsv.s/100*this.field.width,y=(1-this.hsv.v/100)*this.field.height;g.beginPath();g.arc(x,y,7,0,Math.PI*2);g.strokeStyle='#111';g.lineWidth=3;g.stroke();g.beginPath();g.arc(x,y,6,0,Math.PI*2);g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
		this.el.querySelector('[data-hue]').value=this.hsv.h;this.el.querySelector('[data-opacity]').value=Math.round(this.current.a*100);this.el.querySelector('[data-opacity]').style.backgroundImage=`linear-gradient(90deg,transparent,${ColorUtils.hex(this.current)}),linear-gradient(45deg,#555 25%,transparent 25%,transparent 75%,#555 75%),linear-gradient(45deg,#555 25%,#383838 25%,#383838 75%,#555 75%)`;this.el.querySelector('[data-opacity]').style.backgroundSize='100% 100%,8px 8px,8px 8px';this.el.querySelector('[data-opacity]').style.backgroundPosition='0 0,0 0,4px 4px';
		const format=this.el.querySelector('[data-format]').value,componentBox=this.el.querySelector('[data-components]'),valueInput=this.el.querySelector('[data-value]'),parts=format==='RGB'?[Math.round(this.current.r),Math.round(this.current.g),Math.round(this.current.b)]:format==='HSL'?Object.values(this.rgbToHsl(this.current.r,this.current.g,this.current.b)).map(Math.round):format==='CMYK'?Object.values(ColorUtils.rgbToCmyk(this.current.r,this.current.g,this.current.b)).map(Math.round):null;
		componentBox.hidden=!parts;valueInput.hidden=!!parts;
		if(parts){const labels=format==='RGB'?['R','G','B']:format==='HSL'?['H','S','L']:['C','M','Y','K'];componentBox.style.gridTemplateColumns=`repeat(${parts.length},minmax(0,1fr))`;if(componentBox.children.length!==parts.length){componentBox.innerHTML=parts.map((_,i)=>`<input type="number" data-component="${i}" aria-label="${format} ${labels[i]}">`).join('');}parts.forEach((part,i)=>{const input=componentBox.children[i];input.value=part;input.title=labels[i];input.min=format==='RGB'?0:0;input.max=format==='RGB'?255:format==='HSL'&&i===0?359:100;});}
		else valueInput.value=ColorUtils.format(this.current,format);
		this.el.querySelector('[data-alpha]').value=Math.round(this.current.a*100);this.field.setAttribute('aria-valuetext',`Saturation: ${Math.round(this.hsv.s)}%, Brightness: ${Math.round(this.hsv.v)}%`);this.updateContrast();
	}
	rgbToHsl(r,g,b){const hsl=ColorUtils.rgbToHsl(r,g,b);return [hsl.h,hsl.s,hsl.l];}
	commitComponents(){
		const format=this.el.querySelector('[data-format]').value,values=[...this.el.querySelectorAll('[data-component]')].map(input=>+input.value);if(values.some(value=>!Number.isFinite(value))){this.render();return;}
		let color;if(format==='RGB')color={r:ColorUtils.clamp(values[0],0,255),g:ColorUtils.clamp(values[1],0,255),b:ColorUtils.clamp(values[2],0,255),a:this.current.a};
		else if(format==='HSL')color={...ColorUtils.hslToRgb(values[0],values[1],values[2]),a:this.current.a};
		else if(format==='CMYK')color={...ColorUtils.cmykToRgb(values[0],values[1],values[2],values[3]),a:this.current.a};
		if(color){this.setColor(color);this.finish();}
	}
	updateContrast(){
		const opacity=this.current.a,ratio=ContrastUtils.ratio(this.current,this.background,opacity),threshold=(s)=>ContrastUtils.threshold(s,this.textSize);
		this.el.querySelector('[data-contrast-fg]').style.backgroundColor=ColorUtils.hex(this.current);this.el.querySelector('[data-contrast-bg]').style.backgroundColor=this.background;this.el.querySelector('[data-contrast-ratio]').textContent=`${ratio.toFixed(2)} : 1`;
		this.el.querySelectorAll('[data-standard]').forEach(button=>{const standard=button.dataset.standard,pass=ContrastUtils.passes(this.current,this.background,opacity,threshold(standard));button.textContent=standard+(pass?' ✓':' ×');button.classList.toggle('pass',pass);button.setAttribute('aria-label',`${standard}: ${pass?'lolos':'tidak lolos'}, rasio ${ratio.toFixed(2)} banding 1`);});
		this.overlay.hidden=!this.contrastOn;
		if(!this.contrastOn)return;
		const key=[this.hsv.h,Math.round(opacity*100),this.background,this.standard,this.textSize].join(':');if(key===this.overlayKey)return;this.overlayKey=key;
		const ctx=this.overlayCtx,w=this.overlay.width,h=this.overlay.height,limit=threshold(this.standard),bad=[],curves=[];
		ctx.clearRect(0,0,w,h);
		for(let x=0;x<w;x++){
			let previous=null,crossIndex=0;
			for(let row=0;row<=h;row++){
				const v=(1-row/h)*100,color=ColorUtils.hsvToRgb(this.hsv.h,x/w*100,v),pass=ContrastUtils.passes(color,this.background,opacity,limit);
				if(!pass&&x%7===0&&row%7===0)bad.push([x,row]);
				if(previous&&previous.pass!==pass){
					let lo=v,hi=previous.v;
					for(let i=0;i<8;i++){const mid=(lo+hi)/2,c=ColorUtils.hsvToRgb(this.hsv.h,x/w*100,mid),midPass=ContrastUtils.passes(c,this.background,opacity,limit);if(midPass===previous.pass)hi=mid;else lo=mid;}
					(curves[crossIndex]||(curves[crossIndex]=[])).push([x,h-(lo+hi)/2/100*h]);crossIndex++;
				}
				previous={pass,v};
			}
		}
		ctx.fillStyle='rgba(0,0,0,.34)';bad.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();});
		ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;ctx.shadowColor='#000';ctx.shadowBlur=3;
		curves.forEach(points=>{if(!points.length)return;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);points.slice(1).forEach(([x,y])=>ctx.lineTo(x,y));ctx.stroke();});ctx.shadowBlur=0;
	}
	autoCorrect(standard){
		const limit=ContrastUtils.threshold(standard,this.textSize),source=this.hsv;let best=null,bestDistance=Infinity;
		for(let s=0;s<=100;s+=2)for(let v=0;v<=100;v+=2){
			const color=ColorUtils.hsvToRgb(source.h,s,v);if(!ContrastUtils.passes(color,this.background,this.current.a,limit))continue;
			const distance=(s-source.s)**2+(v-source.v)**2;if(distance<bestDistance){best={...color,a:this.current.a};bestDistance=distance;}
		}
		if(!best){note('Tidak ditemukan warna yang memenuhi rasio kontras.');return;}
		this.setColor(best);this.finish();
	}
	renderLibraries(){
		const colors=readPalette(),grid=this.el.querySelector('[data-library-grid]'),empty=this.el.querySelector('[data-library-empty]');
		grid.innerHTML=colors.map(color=>`<button type="button" data-library-color="${color}" style="background-color:${color}" title="${color}" aria-label="Gunakan warna ${color}"></button>`).join('');empty.hidden=colors.length>0;
	}
	saveCurrentColor(){
		const color=ColorUtils.hex(this.current);if(!color)return;
		try{
			const colors=readPalette();if(colors.includes(color)){note('Warna ini sudah ada di palet.');return;}
			localStorage.setItem(PALETTE_KEY,JSON.stringify([color,...colors].slice(0,MAX_PALETTE)));renderPalette();this.renderLibraries();note('Warna disimpan ke palet.');
		}catch(error){note('Warna tidak dapat disimpan: '+error.message);}
	}
	sampleCanvas(){
		if(!cv||!ctx){note('Kanvas editor tidak tersedia untuk mengambil warna.');return;}
		this.el.hidden=true;note('Pilih titik piksel di kanvas editor untuk mengambil warna.');
		const sample=e=>{
			e.preventDefault();e.stopImmediatePropagation();
			this.sampleHandler=null;
			try{const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*dpr),y=Math.floor((e.clientY-r.top)*dpr);if(x<0||y<0||x>=cv.width||y>=cv.height)throw new Error('Pilih titik di dalam kanvas.');const pixel=ctx.getImageData(x,y,1,1).data;if(pixel[3]===0)throw new Error('Piksel transparan.');this.el.hidden=false;this.setColor({r:pixel[0],g:pixel[1],b:pixel[2],a:this.current.a});this.finish();note('Warna diambil dari kanvas.');}
			catch(error){this.el.hidden=false;note('Tidak dapat mengambil warna dari kanvas: '+error.message);}
		};
		this.ignoreSampleClickUntil=Date.now()+500;setTimeout(()=>{this.ignoreSampleClickUntil=0;},500);
		this.sampleHandler=sample;this.sampleBlocker=e=>{this.sampleBlocker=null;if(Date.now()<=this.ignoreSampleClickUntil){e.preventDefault();e.stopImmediatePropagation();}};
		cv.addEventListener('pointerdown',sample,{capture:true,once:true});
		cv.addEventListener('mousedown',this.sampleBlocker,{capture:true,once:true});
	}
	position(){
		const w=Math.min(240,Math.max(0,innerWidth-16));this.el.style.width=w+'px';
		if(this.positionMoved){const r=this.el.getBoundingClientRect();this.el.style.left=Math.max(0,Math.min(r.left,Math.max(0,innerWidth-r.width)))+'px';this.el.style.top=Math.max(0,Math.min(r.top,Math.max(0,innerHeight-r.height)))+'px';return;}
		if(!this.anchor)return;const r=this.anchor.getBoundingClientRect();this.el.style.left='0px';this.el.style.top='0px';const h=this.el.getBoundingClientRect().height,top=r.bottom+h+8<innerHeight?r.bottom+6:Math.max(8,r.top-h-6),left=Math.max(8,Math.min(r.left,innerWidth-w-8));this.el.style.left=left+'px';this.el.style.top=top+'px';
	}
	updateFromPoint(e){const r=this.field.getBoundingClientRect();this.hsv.s=ColorUtils.clamp((e.clientX-r.left)/r.width*100,0,100);this.hsv.v=ColorUtils.clamp((1-(e.clientY-r.top)/r.height)*100,0,100);this.current={...ColorUtils.hsvToRgb(this.hsv.h,this.hsv.s,this.hsv.v),a:this.current.a};this.setColor(this.current);}
	bind(){
		this.field.addEventListener('pointerdown',e=>{this.field.setPointerCapture(e.pointerId);this.updateFromPoint(e);});
		this.field.addEventListener('pointermove',e=>{if(e.buttons)this.updateFromPoint(e);});
		this.field.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?10:1;this.hsv.s=ColorUtils.clamp(this.hsv.s+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),0,100);this.hsv.v=ColorUtils.clamp(this.hsv.v+(e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0),0,100);this.current={...ColorUtils.hsvToRgb(this.hsv.h,this.hsv.s,this.hsv.v),a:this.current.a};this.setColor(this.current);});
		this.el.addEventListener('input',e=>{
			if(e.target.matches('[data-hue]')){this.hsv.h=+e.target.value;this.current={...ColorUtils.hsvToRgb(this.hsv.h,this.hsv.s,this.hsv.v),a:this.current.a};this.setColor(this.current);}
			else if(e.target.matches('[data-opacity],[data-alpha]')){this.current.a=ColorUtils.clamp(e.target.value,0,100)/100;this.setColor(this.current);}
			else if(e.target.matches('[data-value]')){const parsed=ColorUtils.parseFormat(e.target.value,this.el.querySelector('[data-format]').value);if(parsed)this.setColor({...parsed,a:this.current.a});}
		});
		this.el.addEventListener('change',e=>{
			if(e.target.matches('[data-format]'))this.render();
			if(e.target.matches('[data-value]')){const parsed=ColorUtils.parseFormat(e.target.value,this.el.querySelector('[data-format]').value);if(parsed)this.setColor({...parsed,a:this.current.a});else this.render();}
			if(e.target.matches('[data-alpha]')){this.current.a=ColorUtils.clamp(e.target.value,0,100)/100;this.setColor(this.current);this.finish();}
			if(e.target.matches('[data-blend]')){if(this.blendCb)this.blendCb(e.target.value);this.dirty=true;this.finish();}
			if(e.target.matches('[data-standard-select]')){this.standard=e.target.value;this.updateContrast();}
			if(e.target.matches('[data-size-select]')){this.textSize=e.target.value;this.updateContrast();}
			if(e.target.matches('[data-background-select]')){if(e.target.value!=='custom')this.background=e.target.value;this.overlayKey='';this.updateContrast();}
			if(e.target.matches('[data-background]')){this.background=e.target.value;this.el.querySelector('[data-background-select]').value='custom';this.overlayKey='';this.updateContrast();}
			if(e.target.matches('[data-component]'))this.commitComponents();
		});
		this.el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(e.target.matches('[data-component]'))this.commitComponents();else this.finish();}if(e.key==='Escape'){e.preventDefault();this.close();}});
		this.el.addEventListener('pointerup',e=>{if(e.target===this.field||e.target.matches('[data-hue],[data-opacity]'))this.finish();});
		this.el.addEventListener('click',async e=>{
			const tab=e.target.closest('[data-tab]');if(tab){this.el.querySelector('[data-tab].active')?.classList.remove('active');tab.classList.add('active');const libraries=tab.dataset.tab==='libraries';this.el.querySelector('[data-view="custom"]').hidden=libraries;this.el.querySelector('[data-view="libraries"]').hidden=!libraries;if(libraries)this.renderLibraries();return;}
			if(e.target.closest('[data-close]')){this.close();return;}
			if(e.target.closest('[data-save]')){this.finish();this.saveCurrentColor();return;}
			const savedColor=e.target.closest('[data-library-color]');if(savedColor){this.setColor(savedColor.dataset.libraryColor);this.el.querySelector('[data-tab="custom"]').click();return;}
			if(e.target.closest('[data-contrast-toggle]')){this.contrastOn=!this.contrastOn;const button=this.el.querySelector('[data-contrast-toggle]');button.setAttribute('aria-pressed',String(this.contrastOn));this.el.querySelector('[data-contrast]').hidden=!this.contrastOn;this.overlayKey='';this.updateContrast();return;}
			if(e.target.closest('[data-contrast-settings]')){const settings=this.el.querySelector('[data-contrast-settings-panel]');settings.hidden=!settings.hidden;return;}
			const badge=e.target.closest('[data-standard]');if(badge){this.autoCorrect(badge.dataset.standard);return;}
			if(e.target.closest('[data-eyedropper]')){
				if(!window.EyeDropper){this.sampleCanvas();return;}
				try{const picked=await new EyeDropper().open();this.setColor(picked.sRGBHex);this.finish();}catch(error){if(error.name!=='AbortError')note('Pipet warna gagal: '+error.message);}
			}
		});
		$(document).on('mousedown.mfColorPicker',e=>{if(this.opened&&Date.now()<=this.ignoreSampleClickUntil&&e.target===cv)return;if(this.opened&&!this.el.contains(e.target)&&e.target!==this.anchor&&!this.anchor?.contains(e.target))this.close();});
		$(document).on('keydown.mfColorPicker',e=>{if(this.opened&&e.key==='Escape'&&!this.el.contains(e.target))this.close();});
		$(window).on('resize.mfColorPicker scroll.mfColorPicker',()=>{if(this.opened)this.position();});
	}
}
let colorPicker=null;
function openColorPickerForPaint(anchor,kind,index,key,stopIndex=null){
	const selected=selAll(),first=selected[0],paint=first&&getPaintLayers(first,kind)[index];if(!paint)return;
	const color=stopIndex==null?(key==='color2'?paint.color2:paint.color):paintStops(paint)[stopIndex]?.color||paint.color;
	colorPicker.open(anchor,{color,opacity:paint.opacity,blendMode:paint.blendMode},{background:first.type==='text'?textContrastBackground(first):'#ffffff',onChange:value=>{
		if(stopIndex==null)setPaintValue(kind,index,key,value.color,false);else setPaintStopValue(kind,index,stopIndex,'color',value.color,false);
		setPaintValue(kind,index,'opacity',value.opacity,false);refreshColorSwatch(anchor,value);refresh();
	},onBlendChange:value=>{setPaintValue(kind,index,'blendMode',value,false);},onCommit:()=>save()});
}
function textContrastBackground(layer){
	for(let frame=frameParentOf(layer);frame;frame=frameParentOf(frame)){
		const fill=getPaintLayers(frame,'fill').find(p=>p.visible!==false);if(!fill)continue;
		const color=fill.type==='solid'?fill.color:paintStops(fill)[0]?.color||fill.color;
		return ColorUtils.hex(ContrastUtils.composite(color,'#ffffff',(frame.op??100)/100*(fill.opacity??100)/100))||'#ffffff';
	}
	return '#ffffff';
}
function refreshColorSwatch(button,value){button.dataset.color=value.color;button.style.backgroundColor=value.color;button.classList.toggle('checker',value.opacity<100);}
MF.init.push(function initColorPicker(){
	colorPicker=new ColorPicker();
	$(document).on('click','[data-color-picker="paint"]',function(){openColorPickerForPaint(this,this.dataset.kind,+this.dataset.index,this.dataset.colorKey,this.dataset.stopIndex===''?null:this.dataset.stopIndex==null?null:+this.dataset.stopIndex);});
	$(document).on('click','[data-color-picker="effect"]',function(){
		const effectIndex=+this.dataset.effectIndex,owner=sel,fx=owner&&(owner.fx||[])[effectIndex];if(!fx)return;
		colorPicker.open(this,{color:fx.c,opacity:fx.o},{onChange:value=>{fx.c=value.color;fx.o=value.opacity;draw();renderFx();},onCommit:()=>save()});
	});
});