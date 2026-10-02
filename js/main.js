                                                                                                                                                                                                                                                                                                                                                                                      /* [6.1] Runner aplikasi. Isi: menjalankan antrean MF.init setelah semua script termuat. Bukan di sini: deklarasi fitur atau handler. */
MF.init.push(function initProject(){
    loadFontLibrary().then(warning=>{
        load();hist=[snap()];hp=0;updHist();setTool('select');fit();refresh();if(warning)note(warning);
    });
});
MF.init.forEach(fn=>fn());
