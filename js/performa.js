/* [6.11] Performa. Isi: riwayat snapshot, undo/redo, autosave debounce. Bukan di sini: format JSON atau fitur IndexedDB baru. */
let hist=[],hp=-1;
const HIST_LIMIT=8*1024*1024;
const snap=()=>JSON.stringify({S,uid,GR,gn,guides});
function updHist(){$('#undo').toggleClass('opacity-40',hp<=0);$('#redo').toggleClass('opacity-40',hp>=hist.length-1);}
function commit(){
	const s=snap();if(hist[hp]===s)return;hist=hist.slice(0,hp+1);hist.push(s);hp=hist.length-1;
	let size=hist.reduce((n,x)=>n+x.length,0);while(hist.length>1&&(hist.length>100||size>HIST_LIMIT)){size-=hist.shift().length;hp--;}updHist();
}
function restore(str){
	if(typeof closeCombo==='function')closeCombo();
	if(document.activeElement&&document.activeElement.closest('#props'))document.activeElement.blur();
	if(svT){clearTimeout(svT);svT=null;}
	const d=JSON.parse(str),ids=selAll().map(x=>x.id);S=d.S;uid=d.uid;GR=d.GR||{};gn=d.gn||1;guides=Array.isArray(d.guides)?d.guides:[];draft=null;
	setSel(S.filter(x=>ids.includes(x.id)));refresh();persist();updHist();
}
function undo(){if(draft)return;flush();if(hp>0){hp--;restore(hist[hp]);}}
function redo(){if(draft)return;flush();if(hp<hist.length-1){hp++;restore(hist[hp]);}}
function persist(){try{localStorage.setItem(LS_KEY,JSON.stringify(toJSON()));}catch(e){}}
function doSave(){commit();persist();}
let svT=null;
function save(){clearTimeout(svT);svT=setTimeout(()=>{svT=null;doSave();},250);}
function flush(){if(svT){clearTimeout(svT);svT=null;doSave();}}
MF.init.push(function initHistory(){
	$('#undo').on('click',undo);$('#redo').on('click',redo);
	$(window).on('beforeunload pagehide',()=>{clearTimeout(svT);doSave();});
	MF.keys.push((e,k)=>{
		if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();e.shiftKey?redo():undo();return true;}
		if((e.ctrlKey||e.metaKey)&&k==='y'){e.preventDefault();redo();return true;}return false;
	});
});
