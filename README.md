Kamu akan merapikan proyek "MiniFigma" dengan MEMECAH satu file HTML besar menjadi
index.html + beberapa file JavaScript, satu file per kelompok fitur.
Lampiran: (1) kode proyek (satu file HTML), (2) dokumentasi + checklist (Bagian 6.1 sampai 6.11).

TUJUAN
Developer harus langsung tahu file mana yang diubah untuk tiap fitur. Ini REFACTOR MURNI:
perilaku, tampilan, dan format JSON harus 100% sama. Jangan menambah fitur baru.
Aturan "tetap satu file HTML" di dokumentasi DIGANTI oleh tugas ini.

ATURAN TEKNIS (wajib)
1. Aplikasi dibuka dengan klik dua kali (file://) dan harus jalan OFFLINE.
   Dilarang memakai ES module (import/export), bundler, atau framework.
   Pakai script biasa: <script src="js/xxx.js"></script> di akhir <body>, berurutan.
2. Hapus pembungkus $(function(){ ... }). Semua deklarasi (let, const, function) ditaruh di
   tingkat atas file, sehingga dipakai bersama antar file. JANGAN ganti nama variabel/fungsi.
   Jangan mendeklarasikan nama yang sama di dua file (akan error).
3. Kode yang langsung DIJALANKAN saat dimuat (pasang event, panggilan awal) JANGAN ditaruh di
   tingkat atas. Daftarkan lewat MF.init(function(){ ... }). main.js menjalankan antrean itu
   berurutan setelah semua file termuat. Deklarasi tidak boleh memanggil fungsi file lain saat dimuat.
4. jQuery dan Tailwind tetap dipakai, dimuat dari lib/jquery.min.js dan lib/tailwind.js
   (file lokal, bukan CDN). Kelas Tailwind yang ada jangan diubah. <style> kecil tetap di index.html.
5. Satu file = satu kelompok. Baris pertama tiap file berupa komentar:
   /* [6.x] Nama kelompok. Isi: ... Bukan di sini: ... */
6. Bahasa komentar dan teks UI: Indonesia. Pertahankan gaya kode padat yang ada.

REGISTRI (dibuat di inti.js, objek global MF)
Fungsi besar yang dipakai banyak fitur dipecah memakai registri kecil berikut:
  MF.init        antrean fungsi awal, dijalankan main.js
  MF.down        daftar {p, fn(e, ctx)} untuk mousedown. Diurutkan p naik; fn yang
                 mengembalikan true menghentikan pemeriksaan berikutnya.
  MF.move[k]     fungsi mousemove untuk drag.k = k (pan, new, move, box, hd, penh, rot, piv, rad, pt, ...)
  MF.up[k]       fungsi mouseup untuk drag.k = k
  MF.keys        daftar fn(e, k) untuk keydown. Mengembalikan true bila tombol sudah dipakai.
  MF.overlay     daftar fn(ctx) yang digambar draw() di atas objek (seleksi, handle, pivot, marquee, dst.)
Handler mousedown/mousemove/mouseup/keydown yang asli dipecah ke registri ini dan dipasang SEKALI
(di kanvas.js untuk mouse, di alat.js untuk keyboard) hanya sebagai pengirim ke registri.

URUTAN PRIORITAS MF.down (urutan lama dalam satu fungsi besar, harus dipertahankan)
  10 geser kanvas (spasi / klik tengah)           -> kanvas.js
  20 pena aktif                                   -> pena.js
  30 teks aktif                                   -> teks.js
  40 alat bentuk aktif (frame, persegi, dst.)     -> alat.js
  50 pivot yang sudah digeser                     -> transformasi.js
  60 handle radius sudut                          -> transformasi.js
  70 titik dan handle jalur terpilih              -> pena.js
  75 handle resize sudut                          -> transformasi.js
  80 zona rotasi (di luar sudut)                  -> transformasi.js
  90 klik pilih / Shift / marquee / mulai geser   -> transformasi.js
Alt+seret untuk duplikat: clipboard.js menambah hook MF.beforeMove yang dipanggil di
langkah 90 sebelum startMove.

ATURAN KEPEMILIKAN (kalau ragu, pakai ini)
- Fungsi yang dipakai 3 kelompok atau lebih -> inti.js.
- Data grup (gpid, leavesOf, normalize, setSel, selAll) -> inti.js; perintah grup dan UI layer -> layer.js.
- refresh() -> inti.js, memanggil syncProps, renderFx, renderLayers, draw secara langsung.
- paint() tetap di kanvas.js; bagian efek di dalamnya dipindah ke fungsi di efek.js yang dipanggil paint().
- Serialisasi JSON (ser, des, tree, fromJSON, MIGRATE) tetap utuh di simpan.js. Properti baru
  nanti ditambah di sana dan di MIGRATE.
- Semua DOM panel kanan (#props) milik panel.js, kecuali daftar efek (#fxlist) milik efek.js.
- IndexedDB (dbInit, dbLoad, dbPut, dbDel) -> performa.js; Drive memakainya dari clipboard.js.
- Nama fungsi di peta isi hanya panduan. Bila fungsi tidak ditemukan atau fitur sudah bertambah
  (mis. pensil, teks multi-baris), tempatkan sesuai kelompok di checklist.

URUTAN <script> DI index.html
  lib/jquery.min.js, lib/tailwind.js, js/inti.js, js/kanvas.js, js/efek.js, js/teks.js, js/pena.js,
  js/transformasi.js, js/alat.js, js/layer.js, js/panel.js, js/clipboard.js, js/simpan.js,
  js/performa.js, js/main.js

CARA MENGIRIM HASIL (agar tidak terpotong)
Kirim bertahap. Tiap berkas dalam blok kode sendiri dengan judul jalur (contoh: js/kanvas.js).
Setelah setiap batch, BERHENTI dan tunggu saya mengetik "lanjut".
  Batch 1: index.html, js/inti.js, js/kanvas.js, js/main.js
  Batch 2: js/alat.js, js/pena.js, js/transformasi.js
  Batch 3: js/layer.js, js/panel.js, js/efek.js, js/teks.js
  Batch 4: js/simpan.js, js/clipboard.js, js/performa.js, lalu Bagian 2 dan 8 dokumentasi yang sudah diperbarui
Kirim berkas LENGKAP (bukan potongan), karena ini pemecahan file.

PERIKSA SEBELUM SELESAI
- Tidak ada fungsi/variabel yang hilang atau terdeklarasi ganda.
- Tidak ada kode yang berjalan saat dimuat di luar MF.init.
- Setiap fungsi dari kode asli ada tepat satu kali di salah satu file. Beri tabel "fungsi -> file".
- Skenario uji manual untuk saya (tanpa error di Console): gambar tiap bentuk, pilih dan marquee,
  geser, rotasi, ubah radius, buat grup, urutkan layer, undo/redo, ubah warna dan efek,
  simpan lalu buka JSON, salin/tempel/duplikat (Ctrl+C, V, D, Alt+seret), masukkan gambar ke Drive,
  tutup lalu buka ulang (autosave) dengan internet dimatikan.

Jika ada bagian yang ambigu, buat asumsi, tuliskan di akhir, dan lanjutkan. Jangan berhenti untuk bertanya.