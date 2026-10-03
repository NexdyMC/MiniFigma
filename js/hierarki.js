/* [6.13] Hierarki frame. Isi: relasi induk-anak dan inferensi kompatibel untuk dokumen lama. */
function nearestFrameParent(s){
	const b=bbox(s),cx=b.x+b.w/2,cy=b.y+b.h/2;
	return S.filter(f=>f.type==='frame'&&f!==s&&S.indexOf(f)<S.indexOf(s)&&
		cx>=f.x&&cx<=f.x+f.w&&cy>=f.y&&cy<=f.y+f.h)
		.sort((a,b)=>a.w*a.h-b.w*b.h)[0]||null;
}
function frameLayerDepth(s){return frameDepth(s);}
function canSetFrameParent(s,parent){
	const seen=new Set();let current=parent;
	while(current&&!seen.has(current.id)){
		if(current===s)return false;
		seen.add(current.id);current=frameParentOf(current);
	}
	return true;
}
function frameSiblings(s){
	const parent=frameParentOf(s);
	return S.filter(item=>frameParentOf(item)===parent);
}
MF.init.push(function initFrameHierarchyKeys(){
	MF.keys.push((e,k)=>{
		if(e.ctrlKey||e.metaKey||e.altKey)return false;
		if(k==='enter'&&!e.shiftKey&&sel&&sel.type==='frame'){
			const child=S.find(item=>frameParentOf(item)===sel);
			if(child)setSel([child]);
			refresh();return true;
		}
		if(k==='enter'&&e.shiftKey&&sel){
			const parent=frameParentOf(sel);
			if(parent){setSel([parent]);refresh();return true;}
		}
		if(k==='tab'&&sel){
			const siblings=frameSiblings(sel),index=siblings.indexOf(sel);
			if(siblings.length>1&&index>=0){const delta=e.shiftKey?-1:1;setSel([siblings[(index+delta+siblings.length)%siblings.length]]);refresh();}
			e.preventDefault();return true;
		}
		return false;
	});
});