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
	const $c=$('#fxlist').empty();if(!sel)return;
	(sel.fx||[]).forEach((e,i)=>{
		const d=EFX[e.t];if(!d)return;
		const opts=Object.keys(EFX).map(k=>`<option value="${k}"${k===e.t?' selected':''}>${EFX[k].n}</option>`).join('');
		let h=`<div class="fx rounded bg-[#383838] p-2 space-y-2" data-n="${i}"><div class="flex items-center gap-1"><select class="num !bg-[#2c2c2c]" data-k="t">${opts}</select><button class="px-1 rounded hover:bg-neutral-600" data-act="eye">${I(e.on===false?'eyeoff':'eye',14)}</button><button class="px-1 rounded hover:bg-neutral-600" data-act="del">${I('minus',14)}</button></div><div class="grid grid-cols-3 gap-1.5">`;
		d.p.forEach(p=>{h+=`<label>${p[1]}<input type="number" class="num" data-k="${p[0]}" min="${p[2]}" max="${p[3]}" value="${e[p[0]]}"></label>`;});h+='</div>';
		if(d.c)h+=`<div class="flex items-center gap-1.5"><input type="color" data-k="c" value="${e.c}"><input data-k="o" type="number" min="0" max="100" class="num !w-14" value="${e.o}"><span>%</span></div>`;
		$c.append(h+'</div>');
	});
}
MF.init.push(function initEffects(){
	$('#fxadd').on('click',()=>{if(!sel)return;(sel.fx=sel.fx||[]).push(newFx('drop_shadow'));renderFx();draw();save();});
	$('#fxlist').on('input change','[data-k]',function(ev){
		if(!sel)return;const i=+$(this).closest('.fx').data('n'),k=$(this).data('k'),fx=(sel.fx||[])[i];if(!fx)return;
		if(k==='t'){if(ev.type==='change'){sel.fx[i]=Object.assign(newFx($(this).val()),{on:fx.on});renderFx();draw();save();}return;}
		if(k==='c')fx.c=$(this).val();else{const v=parseFloat($(this).val());if(!isNaN(v))fx[k]=v;}draw();save();
	}).on('click','[data-act]',function(){
		if(!sel)return;const i=+$(this).closest('.fx').data('n');if($(this).data('act')==='del')sel.fx.splice(i,1);else sel.fx[i].on=sel.fx[i].on===false;
		renderFx();draw();save();
	});
});
