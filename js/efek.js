/* [6.7] Efek. Isi: katalog efek, filter render, dan UI #fxlist. Bukan di sini: render objek umum atau panel properti lain. */
const EFX={
	drop_shadow:{n:'Bayangan luar',c:'#000000',o:25,p:[['x','X',-500,500,0],['y','Y',-500,500,4],['b','Blur',0,500,8]]},
	inner_shadow:{n:'Bayangan dalam',c:'#000000',o:25,p:[['x','X',-500,500,0],['y','Y',-500,500,4],['b','Blur',0,500,8]]},
	glow:{n:'Cahaya luar (glow)',c:'#0d99ff',o:60,p:[['b','Blur',0,500,12]]},
	layer_blur:{n:'Layer blur',p:[['b','Blur',0,500,4]]},
	background_blur:{n:'Background blur',p:[['b','Blur',0,500,8]]},
	brightness:{n:'Kecerahan',p:[['v','%',0,500,120]]},contrast:{n:'Kontras',p:[['v','%',0,500,120]]},
	saturate:{n:'Saturasi',p:[['v','%',0,500,150]]},hue_rotate:{n:'Rotasi warna',p:[['v','°',-360,360,90]]},
	grayscale:{n:'Abu-abu',p:[['v','%',0,100,100]]},sepia:{n:'Sepia',p:[['v','%',0,100,100]]},invert:{n:'Invert',p:[['v','%',0,100,100]]}
};
const JK={x:'x',y:'y',b:'blur',v:'value'};
const BM=['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'];
const newFx=t=>{const d=EFX[t],e={t,on:true};d.p.forEach(p=>{e[p[0]]=p[4];});if(d.c){e.c=d.c;e.o=d.o;}return e;};
const FLT={layer_blur:(v,k)=>`blur(${v*k}px)`,brightness:v=>`brightness(${v}%)`,contrast:v=>`contrast(${v}%)`,saturate:v=>`saturate(${v}%)`,hue_rotate:v=>`hue-rotate(${v}deg)`,grayscale:v=>`grayscale(${v}%)`,sepia:v=>`sepia(${v}%)`,invert:v=>`invert(${v}%)`};
const rgba=(h,o)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${o/100})`;};
function renderFx(){
	const $c=$('#fxlist'),effects=sel?(sel.fx||[]):[],signature=sel?JSON.stringify([S.indexOf(sel),effects.map(e=>e.t)]):'';
	if(fxSignature!==signature){
		$c.empty();fxSignature=signature;
		effects.forEach((e,i)=>{
			const d=EFX[e.t];if(!d)return;
			const items=Object.keys(EFX).map(k=>({v:k,label:EFX[k].n})),opts=attrText(JSON.stringify({mode:'select',items}));
			let h=`<div class="fx mf-card space-y-2" data-n="${i}"><div class="flex items-center gap-1"><span class="mf-number mf-combo flex-1"><span class="mf-control"><input type="text" readonly class="mf-input" data-number="0" data-mode="select" data-mf-options="${opts}" data-k="t" aria-label="Jenis efek"><button type="button" class="mf-combo-toggle" aria-label="Pilih jenis efek">${I('chevron-down',14)}</button></span></span><button type="button" class="mf-icon-btn" data-act="eye" title="Tampilkan/sembunyikan efek">${I(e.on===false?'eyeoff':'eye',14)}</button><button type="button" class="mf-icon-btn" data-act="del" title="Hapus efek">${I('minus',14)}</button></div><div class="grid grid-cols-2 gap-1.5">`;
			d.p.forEach(p=>{h+=`<label class="mf-field mf-number"><span class="mf-label">${p[1]}</span><span class="mf-control"><span class="mf-prefix" data-scrub="1">${p[0].toUpperCase()}</span><input type="text" inputmode="decimal" class="mf-input" data-number="1" data-min="${p[2]}" data-max="${p[3]}" data-step="1" data-k="${p[0]}" aria-label="${p[1]}"></span></label>`;});h+='</div>';
			if(d.c)h+=`<div class="mf-paint-row"><label class="mf-color"><input type="color" data-k="c" aria-label="Warna efek"></label><input data-k="hex" maxlength="6" class="mf-input mf-hex" aria-label="Kode warna efek"><span class="mf-number mf-combo mf-inline-combo"><span class="mf-control"><input data-k="o" type="text" inputmode="decimal" class="mf-input" data-number="1" data-min="0" data-max="100" data-step="1" data-mf-options="${attrText(JSON.stringify({mode:'number',items:Array.from({length:11},(_,n)=>({v:n*10,label:String(n*10)})),min:0,max:100,step:1}))}" aria-label="Opasitas efek"><span class="mf-suffix">%</span><button type="button" class="mf-combo-toggle" aria-label="Daftar opasitas">${I('chevron-down',12)}</button></span></span></div>`;
			$c.append(h+'</div>');
		});
	}
	effects.forEach((e,i)=>{
		const d=EFX[e.t],$card=$c.find(`.fx[data-n="${i}"]`);if(!d||!$card.length)return;
		$card.find('[data-k="t"]').val(d.n).attr('data-value',e.t);$card.find('[data-act="eye"]').html(I(e.on===false?'eyeoff':'eye',14)).toggleClass('on',e.on===false);
		d.p.forEach(p=>{const input=$card.find(`[data-k="${p[0]}"]`)[0];if(input&&document.activeElement!==input){input.value=String(e[p[0]]);input.dataset.committed=input.value;}});
		if(d.c){
			const color=hex(e.c)||d.c,swatch=$card.find('[data-k="c"]')[0],hexInput=$card.find('[data-k="hex"]')[0],opacity=$card.find('[data-k="o"]')[0];
			if(document.activeElement!==swatch)swatch.value=color;if(document.activeElement!==hexInput)hexInput.value=color.slice(1).toUpperCase();
			if(document.activeElement!==opacity){opacity.value=String(e.o);opacity.dataset.committed=opacity.value;}
			$(swatch).closest('.mf-color').css('background-color',color).toggleClass('checker',e.o<100);
		}
	});
}
MF.init.push(function initEffects(){
	$('#fxadd').on('click',()=>{if(!sel)return;(sel.fx=sel.fx||[]).push(newFx('drop_shadow'));renderFx();draw();save();});
	$('#fxlist').on('input change','[data-k]',function(ev){
		if(!sel)return;const i=+$(this).closest('.fx').data('n'),k=$(this).data('k'),fx=(sel.fx||[])[i];if(!fx)return;
		if(this.dataset.number==='1'&&ev.type==='input')return;
		if(k==='t'){if(ev.type==='change'){sel.fx[i]=Object.assign(newFx(this.dataset.value||$(this).val()),{on:fx.on});renderFx();draw();save();}return;}
		if(k==='hex'){const c=hex($(this).val());if(!c){if(ev.type==='change')note('Kode warna efek harus enam digit heksadesimal.');return;}fx.c=c;$(this).val(c.slice(1).toUpperCase());const $swatch=$(this).closest('.fx').find('[data-k="c"]');$swatch.val(c).closest('.mf-color').css('background-color',c).toggleClass('checker',fx.o<100);}
		else if(k==='c'){fx.c=$(this).val();$(this).closest('.fx').find('[data-k="hex"]').val(fx.c.slice(1).toUpperCase());$(this).closest('.mf-color').css('background-color',fx.c);}
		else{const v=parseFloat($(this).val());if(Number.isFinite(v)){fx[k]=v;this.dataset.committed=String(v);$(this).val(v);if(k==='o')$(this).closest('.fx').find('.mf-color').toggleClass('checker',v<100);}}
		draw();save();
	}).on('click','[data-act]',function(){
		if(!sel)return;const i=+$(this).closest('.fx').data('n');if($(this).data('act')==='del')sel.fx.splice(i,1);else sel.fx[i].on=sel.fx[i].on===false;
		renderFx();draw();save();
	});
});
