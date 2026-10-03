/* [6.6] Panel properti. Isi: UI dan input properti kanan, warna, align, transform numerik. Bukan di sini: layer atau daftar efek. */
const ic=(v,p)=>{
	const L=[2,8,14][p],st=w=>p?(p===1?8-w/2:12-w):4;let s=v?`<rect x="1" y="${L-.5}" width="14" height="1"/>`:`<rect x="${L-.5}" y="1" width="1" height="14"/>`;
	[[10,4],[6,9]].forEach(([w,o])=>{s+=v?`<rect x="${o}" y="${st(w)}" width="3" height="${w}"/>`:`<rect x="${st(w)}" y="${o}" width="${w}" height="3"/>`;});
	return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">${s}</svg>`;
};
const each=fn=>{selAll().forEach(fn);draw();save();};
const one=fn=>()=>{if(sel){fn(sel);draw();save();}};
const hex=v=>{v=(v||'').trim();if(v[0]!=='#')v='#'+v;return /^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():null;};
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
	$('#ptype').text(one?s.name.replace(/ \d+$/,''):(selG&&GR[selG]?GR[selG].name:a.length+' objek dipilih'));
	const fixedText=one&&t==='text'&&s.textBox;
	$('#px').val(R(B.x));$('#py').val(R(B.y));$('#prot').val(one?s.rot:0).prop('disabled',!one);$('#ppx').val(Math.round((s.pvx??.5)*100)).prop('disabled',!one);$('#ppy').val(Math.round((s.pvy??.5)*100)).prop('disabled',!one);
	$('#pbm').val(s.bm||'normal');$('#fxsec').toggle(one);$('#pw').val(R(B.w)).prop('disabled',one&&t==='text'&&!s.textBox).attr({min:fixedText?100:1,max:fixedText?900:null});$('#pwlabel').text(fixedText?'Lebar kotak (100–900 px)':'Lebar');$('#ph').val(R(B.h)).prop('disabled',one&&t==='text');$('#par').prop('checked',!!s.ar).prop('disabled',!one);
	$('#rown').toggle(one&&(t==='polygon'||t==='star'));$('#pn').val(s.n);$('#rowtxt').toggle(one&&t==='text');$('#pfs').val(s.fs);renderFontOptions(s.type==='text'?s.fontFamily:null);
	if(one&&t==='text'){$('#pbold').toggleClass('on',(s.fontWeight??(s.bold?700:400))>=600);$('#pitalic').toggleClass('on',!!s.italic);$('#punderline').toggleClass('on',!!s.underline);$('#palign').val(s.textAlign||'left');$('#plh').val(s.lineHeight||125);$('#pls').val(s.letterSpacing||0);$('#ptextBox').prop('checked',!!s.textBox);renderFontWeightOptions(s.fontFamily,s.fontWeight??(s.bold?700:400));}
	$('#pop').val(s.op??100);$('#peye').html(I(s.hid?'eyeoff':'eye',14));
	const rr=a.find(x=>x.type==='rect'||x.type==='frame');$('#rowr').toggle(!!rr);$('#rowradii').toggle(!!rr);
	if(rr){const r=rr.radii||[rr.r,rr.r,rr.r,rr.r],uniform=r.every(v=>v===r[0]);$('#pr').val(uniform?r[0]:'');r.forEach((v,i)=>$('#pr'+i).val(v));}
	$('#frow').toggle(!!s.fillOn);$('#pfill').val(s.fill);$('#pfhex').val(s.fill);$('#pfo').val(s.fo??100);$('#fvis').html(I(s.fv===false?'eyeoff':'eye',14));$('#pexp').prop('checked',s.exp!==false);
	$('#srow').toggle(s.sw>0);$('#pstroke').val(s.stroke);$('#pshex').val(s.stroke);$('#pso').val(s.so??100);$('#svis').html(I(s.sv===false?'eyeoff':'eye',14));$('#psw').val(s.sw);
}
MF.init.push(function initPanel(){
	['l','h','r','t','v','b'].forEach((k,i)=>$('<button class="p-1.5 rounded bg-[#383838] hover:bg-neutral-600"></button>').html(ic(i>2?1:0,i%3)).data('k',k).on('click',function(){align($(this).data('k'));}).appendTo('#al'));
	$('#flipx').on('click',()=>flipSelection('x'));$('#flipy').on('click',()=>flipSelection('y'));
	$('#px,#py').on('input',()=>{
		const a=selAll();if(!a.length)return;const b=a.length>1?ubox(a):bbox(a[0]),nx=parseFloat($('#px').val()),ny=parseFloat($('#py').val());if(isNaN(nx)||isNaN(ny))return;
		[...a,...kidsFor(a)].forEach(s=>move(s,nx-b.x,ny-b.y));draw();save();
	});
	$('#prot').on('input',one(s=>{s.rot=parseFloat($('#prot').val())||0;}));
	$('#pw').on('input',()=>{const b=selectionBox();if(!b)return;const w=sel&&sel.type==='text'&&sel.textBox?cl($('#pw').val(),100,900,100):Math.max(1,+$('#pw').val()||1);if(sel&&sel.type==='text'&&sel.textBox){sel.w=w;$('#pw').val(w);fitText(sel);refresh();save();return;}let h=b.h;if(sel&&sel.ar)h=w*(b.h/(b.w||1));$('#ph').val(Math.round(h*100)/100);resizeSelectionTo(w,h);});
	$('#ph').on('input',()=>{const b=selectionBox();if(!b)return;let h=Math.max(1,+$('#ph').val()||1),w=b.w;if(sel&&sel.ar)w=h*(b.w/(b.h||1));$('#pw').val(Math.round(w*100)/100);resizeSelectionTo(w,h);});
	$('#par').on('change',one(s=>{s.ar=chk('#par');}));
	$('#ppx,#ppy').on('input',()=>{if(!sel)return;setPivot(sel,cl($('#ppx').val(),-500,500,50)/100,cl($('#ppy').val(),-500,500,50)/100);draw();save();$('#px').val(rd(bbox(sel).x));$('#py').val(rd(bbox(sel).y));});
	$('#pbm').html(BM.map(b=>`<option value="${b}">${b}</option>`).join('')).on('change',()=>each(s=>{s.bm=$('#pbm').val();}));
	$('#pn').on('input',one(s=>{s.n=Math.round(cl($('#pn').val(),3,20,3));}));
	$('#pfs').on('input',()=>{if(!sel||sel.type!=='text')return;sel.fs=cl($('#pfs').val(),4,999,16);fitText(sel);refresh();save();});
	$('#pweight').on('change',()=>{if(!sel||sel.type!=='text')return;sel.fontWeight=cl($('#pweight').val(),100,900,400);sel.bold=sel.fontWeight>=600;fitText(sel);refresh();save();});
	$('#pbold,#pitalic,#punderline').on('click',function(){if(!sel||sel.type!=='text')return;const key={pbold:'bold',pitalic:'italic',punderline:'underline'}[this.id];if(key==='bold'){sel.fontWeight=(sel.fontWeight??(sel.bold?700:400))>=600?400:700;sel.bold=sel.fontWeight>=600;}else sel[key]=!sel[key];fitText(sel);refresh();save();});
	$('#palign').on('change',()=>{if(!sel||sel.type!=='text')return;sel.textAlign=$('#palign').val();fitText(sel);refresh();save();});
	$('#plh,#pls').on('input',()=>{if(!sel||sel.type!=='text')return;sel.lineHeight=cl($('#plh').val(),50,300,125);sel.letterSpacing=cl($('#pls').val(),-20,100,0);fitText(sel);refresh();save();});
	$('#ptextBox').on('change',()=>{if(!sel||sel.type!=='text')return;sel.textBox=chk('#ptextBox');if(sel.textBox)sel.w=cl(sel.w,100,900,100);fitText(sel);refresh();save();});
	$('#pfont').on('change',()=>{if(!sel||sel.type!=='text')return;const s=sel;s.fontFamily=$('#pfont').val();document.fonts.load(fontCss(s)).then(()=>{s.fontWeight=renderFontWeightOptions(s.fontFamily,s.fontWeight??(s.bold?700:400));s.bold=s.fontWeight>=600;fitText(s);refresh();save();}).catch(()=>note('Font gagal dimuat: '+s.fontFamily));});
	$('#pop').on('input',()=>each(s=>{s.op=cl($('#pop').val(),0,100,100);}));
	$('#pr').on('input',()=>each(s=>{if(s.type==='rect'||s.type==='frame'){s.r=Math.max(0,+$('#pr').val()||0);s.radii=[s.r,s.r,s.r,s.r];}}));
	$('#pr0,#pr1,#pr2,#pr3').on('input',function(){const i=+this.id.slice(2);selAll().forEach(s=>{if(s.type==='rect'||s.type==='frame'){s.radii=s.radii||[s.r,s.r,s.r,s.r];s.radii[i]=Math.max(0,+$('#pr'+i).val()||0);}});draw();save();});
	$('#peye').on('click',()=>{const v=!selAll()[0].hid;each(s=>{s.hid=v;});refresh();});
	$('#pfill').on('input',()=>{each(s=>{s.fill=$('#pfill').val();s.fillOn=true;s.fv=true;});syncProps();});
	$('#pfhex').on('input',()=>{const h=hex($('#pfhex').val());if(h){each(s=>{s.fill=h;s.fillOn=true;});$('#pfill').val(h);}});
	$('#pfo').on('input',()=>each(s=>{s.fo=cl($('#pfo').val(),0,100,100);}));
	$('#fvis').on('click',()=>{const v=selAll()[0].fv===false;each(s=>{s.fv=v;});syncProps();});$('#fdel').on('click',()=>{each(s=>{s.fillOn=false;});syncProps();});$('#fadd').on('click',()=>{each(s=>{s.fillOn=true;s.fv=true;});syncProps();});
	$('#pexp').on('change',()=>each(s=>{s.exp=chk('#pexp');}));
	$('#pstroke').on('input',()=>{each(s=>{s.stroke=$('#pstroke').val();if(!s.sw)s.sw=1;s.sv=true;});syncProps();});
	$('#pshex').on('input',()=>{const h=hex($('#pshex').val());if(h){each(s=>{s.stroke=h;if(!s.sw)s.sw=1;});$('#pstroke').val(h);}});
	$('#pso').on('input',()=>each(s=>{s.so=cl($('#pso').val(),0,100,100);}));$('#psw').on('input',()=>each(s=>{s.sw=cl($('#psw').val(),.1,200,1);}));
	$('#svis').on('click',()=>{const v=selAll()[0].sv===false;each(s=>{s.sv=v;});syncProps();});$('#sdel').on('click',()=>{each(s=>{s.sw=0;});syncProps();});$('#sadd').on('click',()=>{each(s=>{if(!s.sw)s.sw=1;s.sv=true;});syncProps();});
});
