/* [6.10] Panel ekspor kode. Isi: UI preview, copy, unduh, dan resize. */
const initCodePanel=({getSelection,subscribe,mountTab,mountModalRoot})=>{
	const cleanups=[],panel=document.createElement('div'),panelTitle=document.createElement('strong'),modeLabel=document.createElement('label'),modeSelect=document.createElement('select'),snippet=document.createElement('pre'),note=document.createElement('small'),copyButton=document.createElement('button'),previewButton=document.createElement('button'),overlay=document.createElement('div'),modal=document.createElement('section'),modalHead=document.createElement('header'),modalTitle=document.createElement('strong'),closeButton=document.createElement('button'),columns=document.createElement('div'),left=document.createElement('div'),right=document.createElement('div'),toolbar=document.createElement('div'),presetRow=document.createElement('div'),widthLabel=document.createElement('label'),widthInput=document.createElement('input'),previewScroll=document.createElement('div'),iframe=document.createElement('iframe'),resizeHandle=document.createElement('button'),codeToolbar=document.createElement('div'),codePreview=document.createElement('pre'),modalCopy=document.createElement('button'),downloadButton=document.createElement('button'),copyStatus=document.createElement('span');
	let destroyed=false,active=false,latest={nodes:[],html:'',full:'',width:0,height:0},mode='scale',documentKey='',resizeDrag=null,debounceTimer=0,copiedTimer=0,returnFocus=null,unsubscribe=null;
	const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);cleanups.push(()=>target.removeEventListener(type,handler,options));};
	const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
	const button=(text,className)=>{const node=element('button',className,text);node.type='button';return node;};
	const rememberMode=doc=>{
		const name=doc&&typeof doc.name==='string'?doc.name:'Untitled',key='minivector.code-mode.'+name;
		if(key!==documentKey){documentKey=key;try{mode=localStorage.getItem(key)==='fixed'?'fixed':'scale';}catch(error){mode='scale';report('Preferensi mode tidak dapat dibaca: '+error.message);}}
	};
	const report=message=>{copyStatus.textContent=message;const hint=document.getElementById('hint');if(hint&&message)hint.textContent=message;};
	const copyText=async text=>{
		if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
			try{await navigator.clipboard.writeText(text);return;}catch(error){}
		}
		const textarea=document.createElement('textarea');textarea.value=text;textarea.setAttribute('readonly','');textarea.style.position='fixed';textarea.style.opacity='0';document.body.appendChild(textarea);textarea.select();
		let copied=false;try{copied=document.execCommand('copy');}finally{textarea.remove();}
		if(!copied)throw new Error('Browser tidak mengizinkan penyalinan clipboard.');
	};
	const setCopied=async source=>{
		if(!latest.html){report('Pilih elemen untuk melihat kode');return;}
		try{await copyText(source==='full'?latest.full:latest.html);copyStatus.textContent='Copied!';if(!active)report('Kode HTML disalin ke clipboard');clearTimeout(copiedTimer);copiedTimer=setTimeout(()=>{if(!destroyed)copyStatus.textContent='';},1500);}
		catch(error){report('Gagal menyalin kode: '+error.message);}
	};
	const setPreviewWidth=value=>{
		const width=Math.max(160,Math.min(2400,Math.round(Number(value)||0)));
		widthInput.value=String(width);iframe.style.width=width+'px';
		const aspect=latest.width&&latest.height?latest.height/latest.width:.75;
		iframe.style.height=Math.max(240,Math.min(1800,Math.round(width*(mode==='scale'?aspect:latest.height/width))))+'px';
	};
	const createPreset=(label,value)=>{
		const control=button(label,'mv-code-preset');control.dataset.width=String(value);presetRow.appendChild(control);return control;
	};
	const render=()=>{
		if(destroyed)return;
		const doc=getSelection();
		rememberMode(doc);
		const nodes=jsonToTree(doc),result=exportToTailwind(nodes,{mode,fullPage:false});
		latest={nodes,html:result.html,full:result.full,width:nodes[0]&&nodes[0].width||0,height:nodes[0]&&nodes[0].height||0};
		modeSelect.value=mode;
		const empty=!latest.html;
		snippet.textContent=empty?'Pilih elemen untuk melihat kode':latest.html.length>1500?latest.html.slice(0,1500)+'\n…':latest.html;
		codePreview.textContent=empty?'Pilih elemen untuk melihat kode':latest.html;
		copyButton.disabled=modalCopy.disabled=downloadButton.disabled=empty;
		previewButton.disabled=empty;
		note.hidden=false;
		if(active){
			if(latest.full)iframe.srcdoc=latest.full;
			else iframe.srcdoc='<!DOCTYPE html><html lang="id"><body style="margin:0;background:#202020;color:#ddd;font:14px system-ui;padding:16px">Pilih elemen untuk melihat kode</body></html>';
			if(!widthInput.value||document.activeElement!==widthInput)setPreviewWidth(widthInput.dataset.preset==='Frame'&&latest.width?latest.width:widthInput.value||latest.width||375);
		}
	};
	const scheduleRender=()=>{clearTimeout(debounceTimer);debounceTimer=setTimeout(render,150);};
	const openModal=trigger=>{
		if(destroyed)return;
		returnFocus=trigger||document.activeElement;active=true;overlay.hidden=false;render();closeButton.focus();
	};
	const closeModal=()=>{
		if(!active)return;
		active=false;overlay.hidden=true;resizeDrag=null;
		if(returnFocus&&typeof returnFocus.focus==='function')returnFocus.focus();
	};
	panel.className='mv-code-panel';panelTitle.className='mv-code-title';panelTitle.textContent='Code';modeLabel.className='mv-code-mode';modeLabel.append(document.createTextNode('Mode'));
	modeSelect.setAttribute('aria-label','Mode ekspor');modeSelect.className='mv-code-width';[['scale','Scale to fit'],['fixed','Fixed']].forEach(([value,label])=>{const option=element('option','',label);option.value=value;modeSelect.appendChild(option);});modeLabel.append(modeSelect);
	snippet.className='mv-code-snippet';note.className='mv-code-note';note.textContent='Blok HTML butuh Tailwind di project kamu. File lengkap sudah menyertakan CDN.';
	copyButton.className='mv-code-button';copyButton.textContent='Copy';previewButton.className='mv-code-button primary';previewButton.textContent='Buka Code Preview';
	const actions=element('div','mv-code-actions');actions.append(copyButton,previewButton);panel.append(panelTitle,modeLabel,snippet,actions,note);mountTab.appendChild(panel);
	overlay.className='mv-code-overlay';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
	modal.className='mv-code-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Code Preview');
	modalHead.className='mv-code-head';modalTitle.textContent='Code Preview';closeButton.className='mv-code-close';closeButton.setAttribute('aria-label','Tutup Code Preview');closeButton.textContent='×';modalHead.append(modalTitle,closeButton);
	columns.className='mv-code-columns';left.className=right.className='mv-code-side';toolbar.className='mv-code-toolbar';presetRow.className='mv-code-presets';
	createPreset('Frame',0);createPreset('375',375);createPreset('768',768);createPreset('1440',1440);createPreset('Custom',-1);
	widthLabel.className='mv-code-width-label';widthLabel.append(document.createTextNode('Lebar'));widthInput.className='mv-code-width';widthInput.type='number';widthInput.min='160';widthInput.max='2400';widthInput.value='375';widthInput.setAttribute('aria-label','Lebar preview');widthLabel.appendChild(widthInput);
	toolbar.append(presetRow,widthLabel);previewScroll.className='mv-code-viewport';iframe.className='mv-code-frame';iframe.setAttribute('title','Pratinjau HTML');iframe.setAttribute('sandbox','allow-scripts');previewScroll.appendChild(iframe);
	resizeHandle.className='mv-code-resize';resizeHandle.setAttribute('aria-label','Ubah lebar panel preview');resizeHandle.title='Seret untuk mengubah lebar preview';
	codeToolbar.className='mv-code-toolbar';codeToolbar.append(modalCopy,downloadButton,copyStatus);modalCopy.className=downloadButton.className='mv-code-button';modalCopy.textContent='Copy';downloadButton.textContent='Download .html';copyStatus.className='mv-code-status';codePreview.className='mv-code-preview';right.append(codeToolbar,codePreview);left.append(toolbar,previewScroll);columns.append(left,resizeHandle,right);modal.append(modalHead,columns);overlay.appendChild(modal);mountModalRoot.appendChild(overlay);
	listen(modeSelect,'change',()=>{
		mode=modeSelect.value==='fixed'?'fixed':'scale';
		try{localStorage.setItem(documentKey,mode);}catch(error){report('Preferensi mode tidak dapat disimpan: '+error.message);}
		scheduleRender();
	});
	listen(copyButton,'click',()=>setCopied('html'));listen(previewButton,'click',()=>openModal(previewButton));listen(closeButton,'click',closeModal);
	listen(overlay,'click',event=>{if(event.target===overlay)closeModal();});
	listen(modalCopy,'click',()=>setCopied('html'));
	listen(downloadButton,'click',()=>{
		if(!latest.full)return;
		let url='';
		try{
			url=URL.createObjectURL(new Blob([latest.full],{type:'text/html;charset=utf-8'}));
			const link=document.createElement('a');link.href=url;link.download='mini-vector-export.html';document.body.appendChild(link);
			try{link.click();}finally{link.remove();}
			setTimeout(()=>URL.revokeObjectURL(url),1000);
		}catch(error){if(url)URL.revokeObjectURL(url);report('Gagal mengunduh HTML: '+error.message);}
	});
	listen(presetRow,'click',event=>{
		const control=event.target.closest('[data-width]');if(!control)return;
		const preset=control.textContent;
		if(preset==='Custom'){widthInput.focus();widthInput.select();widthInput.dataset.preset='Custom';return;}
		widthInput.dataset.preset=preset;setPreviewWidth(preset==='Frame'?(latest.width||375):+control.dataset.width);
	});
	listen(widthInput,'input',()=>{widthInput.dataset.preset='Custom';setPreviewWidth(widthInput.value);});
	listen(widthInput,'change',()=>setPreviewWidth(widthInput.value));
	listen(resizeHandle,'pointerdown',event=>{
		const stacked=matchMedia('(max-width: 720px)').matches,rect=left.getBoundingClientRect();
		resizeDrag={x:event.clientX,y:event.clientY,size:stacked?rect.height:rect.width,stacked};resizeHandle.setPointerCapture(event.pointerId);event.preventDefault();
	});
	listen(resizeHandle,'pointermove',event=>{
		if(!resizeDrag)return;
		if(resizeDrag.stacked){const height=Math.max(180,Math.min(modal.clientHeight-210,resizeDrag.size+event.clientY-resizeDrag.y));columns.style.gridTemplateRows=`${height}px 8px minmax(160px,1fr)`;}
		else{const width=Math.max(220,Math.min(modal.clientWidth-300,resizeDrag.size+event.clientX-resizeDrag.x));columns.style.gridTemplateColumns=`${width}px 8px minmax(240px,1fr)`;}
	});
	listen(resizeHandle,'pointerup',()=>{resizeDrag=null;});
	listen(resizeHandle,'pointercancel',()=>{resizeDrag=null;});
	listen(document,'keydown',event=>{
		if(event.key==='Escape'&&active){event.preventDefault();event.stopPropagation();closeModal();return;}
		if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='c'&&!event.altKey){event.preventDefault();event.stopPropagation();openModal(document.activeElement);}
	},true);
	unsubscribe=subscribe(scheduleRender);
	render();
	return {destroy(){
		if(destroyed)return;
		destroyed=true;clearTimeout(debounceTimer);clearTimeout(copiedTimer);if(typeof unsubscribe==='function')unsubscribe();
		cleanups.forEach(cleanup=>cleanup());panel.remove();overlay.remove();
	}};
};
if(typeof MF!=='undefined'&&Array.isArray(MF.init))MF.init.push(function initCodeExport(){
	const section=document.querySelector('[data-section="export"]'),mountTab=elementForCodeExport(),mountModalRoot=document.createElement('div');
	if(!section)return;
	section.querySelector('.mf-section-body').appendChild(mountTab);document.body.appendChild(mountModalRoot);
	window.MiniVectorCodePanel=initCodePanel({
		getSelection:()=>({...toJSON(),selectedIds:selAll().map(item=>item.id)}),
		subscribe:callback=>{
			const cleanups=[],observer=new MutationObserver(()=>callback()),watched=['#layers','#ptype','#px','#py','#pw','#ph','#frow','#srow'];
			watched.forEach(selector=>{const target=document.querySelector(selector);if(target)observer.observe(target,{subtree:true,childList:true,attributes:true,characterData:true});});
			const props=document.getElementById('props'),canvas=document.getElementById('cv');
			const formChange=event=>{if(props&&props.contains(event.target)&&!mountTab.contains(event.target))callback();};
			const canvasMove=event=>{if(event.buttons)callback();};
			document.addEventListener('input',formChange,true);document.addEventListener('change',formChange,true);
			if(canvas){canvas.addEventListener('pointermove',canvasMove);canvas.addEventListener('pointerup',callback);}
			cleanups.push(()=>{observer.disconnect();document.removeEventListener('input',formChange,true);document.removeEventListener('change',formChange,true);if(canvas){canvas.removeEventListener('pointermove',canvasMove);canvas.removeEventListener('pointerup',callback);}});
			callback();return ()=>cleanups.forEach(cleanup=>cleanup());
		},
		mountTab,mountModalRoot
	});
});
function elementForCodeExport(){const root=document.createElement('div');root.setAttribute('data-code-tab','');return root;}
