/* [6.10] Ekspor kode. Isi: normalisasi node JSON dan markup Tailwind murni. */
const ExportCode=(()=>{
	const finite=(value,fallback=0)=>Number.isFinite(+value)?+value:fallback;
	const rounded=value=>Math.round(finite(value)*100)/100;
	const cleanHex=value=>{
		const color=String(value||'').trim();
		return /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(color)?color.toUpperCase():null;
	};
	const paintHex=paint=>{
		const color=cleanHex(paint&&paint.color);if(!color)return null;
		const baseAlpha=color.length===9?parseInt(color.slice(7),16):255,opacity=Math.max(0,Math.min(100,finite(paint.opacity,100)))/100,alpha=Math.round(baseAlpha*opacity);
		return color.length===9||alpha<255?color.slice(0,7)+alpha.toString(16).padStart(2,'0').toUpperCase():color;
	};
	const visiblePaint=items=>Array.isArray(items)?items.find(item=>item&&item.visible!==false)||null:null;
	function nodeFromLayer(layer,parent=null){
		if(!layer||layer.type==='group'||layer.type==='grup')return null;
		const setting=layer.setting||{},position=setting.position||{},layout=setting.layout||{},appearance=setting.appearance||{},fills=Array.isArray(setting.fills)?setting.fills:setting.fill&&setting.fill.enabled!==false?[setting.fill]:[],strokes=Array.isArray(setting.strokes)?setting.strokes:setting.stroke&&setting.stroke.enabled!==false?[setting.stroke]:[];
		const absX=finite(position.x),absY=finite(position.y),x=parent?absX-parent.absX:absX,y=parent?absY-parent.absY:absY;
		const node={
			id:layer.id,type:layer.type,name:layer.name||'',x:rounded(x),y:rounded(y),absX:rounded(absX),absY:rounded(absY),
			width:rounded(layout.width),height:rounded(layout.height),rotation:rounded(position.rotation),
			radius:rounded(appearance.corner_radius),radii:appearance.corner_radii,
			opacity:Math.max(0,Math.min(100,finite(appearance.opacity,100)))/100,
			visible:layer.visible!==false&&(!setting.export||setting.export.visible!==false),locked:layer.locked===true,
			fills,strokes,text:setting.text||null,path:setting.path||null,clipContent:layer.clip_content!==false,children:[]
		};
		node.children=flattenChildren(layer.children,node);
		return node;
	}
	function flattenChildren(layers,parent){
		const out=[];
		(Array.isArray(layers)?layers:[]).forEach(layer=>{
			if(!layer)return;
			if(layer.type==='group'||layer.type==='grup')out.push(...flattenChildren(layer.children,parent));
			else{
				const node=nodeFromLayer(layer,parent);
				if(node)out.push(node);
			}
		});
		return out;
	}
	function jsonToTree(json){
		if(!json||!Array.isArray(json.layers))return [];
		const all=flattenChildren(json.layers,null),ids=Array.isArray(json.selectedIds)?new Set(json.selectedIds.map(String)):null;
		const selectedInLayerOrder=nodes=>nodes.flatMap(node=>ids.has(String(node.id))?[node]:selectedInLayerOrder(node.children));
		const chosen=ids?selectedInLayerOrder(all):all;
		if(!chosen.length)return [];
		if(chosen.length===1&&chosen[0].type==='frame'){
			const frame=chosen[0];
			return [{...frame,x:0,y:0,absX:0,absY:0,root:true}];
		}
		const left=Math.min(...chosen.map(node=>node.absX)),top=Math.min(...chosen.map(node=>node.absY));
		const right=Math.max(...chosen.map(node=>node.absX+node.width)),bottom=Math.max(...chosen.map(node=>node.absY+node.height));
		return [{type:'root',x:0,y:0,absX:0,absY:0,width:rounded(right-left),height:rounded(bottom-top),rotation:0,radius:0,opacity:1,visible:true,children:chosen.map(node=>({...node,x:rounded(node.absX-left),y:rounded(node.absY-top)}))}];
	}
	function tw(...classes){
		return [...new Set(classes.flat(Infinity).filter(value=>typeof value==='string'&&value.trim()))].join(' ').replace(/\s+/g,' ').trim();
	}
	function arbitrary(value){return String(rounded(value)).replace(/ /g,'_');}
	function positionClass(node,mode,parentWidth,parentHeight){
		const dimension=(value,total)=>mode==='scale'?(total?arbitrary(value/total*100)+'%':'0%'):arbitrary(value)+'px';
		const left=node.x===0?'left-0':`left-[${dimension(node.x,parentWidth)}]`,top=node.y===0?'top-0':`top-[${dimension(node.y,parentHeight)}]`;
		return tw('absolute',left,top,`w-[${dimension(node.width,parentWidth)}]`,`h-[${dimension(node.height,parentHeight)}]`);
	}
	function paintClass(node){
		const fill=visiblePaint(node.fills),stroke=visiblePaint(node.strokes),classes=[],comments=[];
		if(fill){
			if(fill.type&&fill.type!=='solid'){classes.push('bg-gray-300');comments.push('<!-- belum didukung -->');}
			else{
				const color=paintHex(fill);
				if(color)classes.push(`bg-[${color}]`);
				else classes.push('bg-gray-300');
			}
		}
		if(stroke){
			const color=paintHex(stroke)||'#D9D9D9',weight=Math.max(.1,finite(stroke.weight,1)),width=rounded(weight);
			if(stroke.position==='outside')classes.push('outline',`outline-[${arbitrary(width)}px]`,`outline-[${color}]`);
			else classes.push(width===1?'border':`border-[${arbitrary(width)}px]`,`border-[${color}]`);
		}
		return {classes,comments};
	}
	function textClasses(node,mode,containerWidth){
		const text=node.text||{},fill=visiblePaint(node.fills),color=fill&&fill.type!=='solid'?null:paintHex(fill),fontSize=Math.max(1,finite(text.font_size,16)),weight=Math.max(100,Math.min(900,finite(text.font_weight,400))),line=finite(text.line_height,125),lineHeight=text.line_height==null?fontSize*1.25:fontSize*line/100;
		const classes=['m-0',`font-[${Math.round(weight)}]`,`leading-[${arbitrary(lineHeight)}px]`],comments=[];
		if(mode==='scale'){
			const ratio=containerWidth?fontSize/containerWidth*100:0;
			classes.push(`text-[${arbitrary(ratio)}cqw]`);
		}else classes.push(`text-[${arbitrary(fontSize)}px]`);
		if(color)classes.push(`text-[${color}]`);
		else if(fill&&fill.type!=='solid'){classes.push('text-gray-300');comments.push('<!-- belum didukung -->');}
		if(text.italic)classes.push('italic');
		if(text.decoration==='underline')classes.push('underline');
		else if(text.decoration==='strike')classes.push('line-through');
		if(text.align==='c')classes.push('text-center');else if(text.align==='r')classes.push('text-right');else if(text.align==='j')classes.push('text-justify');
		if(mode==='scale')comments.push(`<!-- fallback: text-[${arbitrary(fontSize)}px] -->`);
		return {classes,comments};
	}
	function escapeText(value){
		return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
	}
	function pathData(node){
		const points=node.path&&Array.isArray(node.path.points)?node.path.points:[];
		if(!points.length)return '';
		const commands=[`M ${rounded(points[0].x)} ${rounded(points[0].y)}`];
		for(let i=1;i<points.length;i++){
			const prev=points[i-1],point=points[i],out=prev.handle_out,inside=point.handle_in;
			commands.push(out||inside?`C ${rounded(prev.x+(out?out.x:0))} ${rounded(prev.y+(out?out.y:0))} ${rounded(point.x+(inside?inside.x:0))} ${rounded(point.y+(inside?inside.y:0))} ${rounded(point.x)} ${rounded(point.y)}`:`L ${rounded(point.x)} ${rounded(point.y)}`);
		}
		if(node.path.closed&&points.length>2){
			const prev=points[points.length-1],first=points[0],out=prev.handle_out,inside=first.handle_in;
			if(out||inside)commands.push(`C ${rounded(prev.x+(out?out.x:0))} ${rounded(prev.y+(out?out.y:0))} ${rounded(first.x+(inside?inside.x:0))} ${rounded(first.y+(inside?inside.y:0))} ${rounded(first.x)} ${rounded(first.y)}`);
			commands.push('Z');
		}
		return commands.join(' ');
	}
	function nodeMarkup(node,mode,parentWidth,parentHeight,isRoot=false,scaleRootWidth=parentWidth,fullPage=false){
		if(!node.visible)return '';
		const classes=isRoot?['relative',...(mode==='scale'?['w-full',`max-w-[${arbitrary(node.width)}px]`,`aspect-[${arbitrary(node.width)}/${arbitrary(node.height)}]`,'@container']:[`w-[${arbitrary(node.width)}px]`,`h-[${arbitrary(node.height)}px]`])]:positionClass(node,mode,parentWidth,parentHeight).split(' ');
		if(isRoot&&fullPage)classes.push('min-h-screen');
		const paint=['vector','line','text','image'].includes(node.type)?{classes:[],comments:[]}:paintClass(node);classes.push(...paint.classes);
		if(node.type==='image'){if(!classes.includes('bg-gray-300'))classes.push('bg-gray-300');if(!paint.comments.length)paint.comments.push('<!-- belum didukung -->');}
		if(node.type==='ellipse')classes.push('rounded-full');
		else if(node.radius>0)classes.push(`rounded-[${arbitrary(node.radius)}px]`);
		if(node.rotation)classes.push(`rotate-[${arbitrary(node.rotation)}deg]`);
		if(node.opacity!==1)classes.push(`opacity-[${arbitrary(node.opacity)}]`);
		if(node.type==='frame')classes.push('relative',node.clipContent?'overflow-hidden':'overflow-visible');
		const children=node.children.map(child=>nodeMarkup(child,mode,node.width,node.height,false,isRoot?node.width:scaleRootWidth,false)).filter(Boolean).join('\n');
		const comment=paint.comments.length?paint.comments.join(' '):'';
		if(node.type==='text'){
			const text=textClasses(node,mode,scaleRootWidth);classes.push(...text.classes,'whitespace-pre-wrap');
			const markup=`<p class="${tw(classes)}">${escapeText(node.text&&node.text.content)}</p>`;
			return `${comment?comment+'\n':''}${text.comments.length?text.comments.join(' ')+'\n':''}${markup}`;
		}
		if(node.type==='vector'||node.type==='line'){
			const fill=visiblePaint(node.fills),stroke=visiblePaint(node.strokes),svgClasses=[...classes],pathClasses=[],unsupported=fill&&fill.type!=='solid';
			if(fill&&fill.type==='solid'&&paintHex(fill))pathClasses.push(`fill-[${paintHex(fill)}]`);else pathClasses.push('fill-none');
			if(stroke){pathClasses.push('fill-none',`stroke-[${paintHex(stroke)||'#D9D9D9'}]`,`stroke-[${arbitrary(Math.max(.1,finite(stroke.weight,1)))}]`);}
			const d=pathData(node);
			return `${unsupported?'<!-- belum didukung -->\n':''}<svg class="${tw(svgClasses)}" viewBox="0 0 ${arbitrary(node.width)} ${arbitrary(node.height)}" xmlns="http://www.w3.org/2000/svg"><path d="${d}" class="${tw(pathClasses)}"${node.path&&node.path.closed?'':' fill="none"'}/></svg>`;
		}
		const tag=node.type==='text'?'p':'div';
		return `${comment?comment+'\n':''}<${tag} class="${tw(classes)}">${children}</${tag}>`;
	}
	function exportToTailwind(nodes,options={}){
		const mode=options.mode==='fixed'?'fixed':'scale',root=Array.isArray(nodes)?nodes[0]:null;
		if(!root||!root.width||!root.height)return {html:'',full:''};
		if(root.root){
			const html=nodeMarkup(root,mode,root.width,root.height,true,root.width,!!options.fullPage);
			const full=`<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<script src="https://cdn.tailwindcss.com"></script>\n<title>Mini Vector export</title>\n</head>\n<body class="m-0">\n${html}\n</body>\n</html>`;
			return {html,full};
		}
		const rootClasses=['relative'];
		if(mode==='scale')rootClasses.push('w-full',`max-w-[${arbitrary(root.width)}px]`,`aspect-[${arbitrary(root.width)}/${arbitrary(root.height)}]`,'@container');
		else rootClasses.push(`w-[${arbitrary(root.width)}px]`,`h-[${arbitrary(root.height)}px]`);
		if(options.fullPage)rootClasses.push('min-h-screen');
		const children=root.children.map(node=>nodeMarkup(node,mode,root.width,root.height,false,root.width)).filter(Boolean).join('\n');
		const html=`<div class="${tw(rootClasses)}">\n${children}\n</div>`;
		const full=`<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<script src="https://cdn.tailwindcss.com"></script>\n<title>Mini Vector export</title>\n</head>\n<body class="m-0">\n${html}\n</body>\n</html>`;
		return {html,full};
	}
	return {jsonToTree,exportToTailwind,tw};
})();
const jsonToTree=ExportCode.jsonToTree,exportToTailwind=ExportCode.exportToTailwind,tw=ExportCode.tw;
