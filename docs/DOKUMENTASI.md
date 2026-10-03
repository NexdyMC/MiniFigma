# MiniFigma — Dokumentasi Proyek

> Dokumen ini ditulis agar AI (atau developer) lain bisa langsung melanjutkan proyek tanpa bertanya dari nol.
> Dokumen ini berada di `docs/DOKUMENTASI.md` dalam repo. Untuk GitHub Copilot: buka workspace proyek, lampirkan
> dokumen ini (`#file:docs/DOKUMENTASI.md`), lalu baca Bagian 0 dan Bagian 12. Untuk AI lain: kirim bersama kode proyek.

---

## 0. PROMPT PEMBUKA (salin-tempel ke AI baru)

```
Kamu akan melanjutkan proyek "MiniFigma": editor desain vektor mirip Figma
yang berjalan di browser, memakai <canvas> 2D. Struktur proyek terdiri dari
index.html, library lokal di lib/, dan JavaScript per kelompok fitur di js/.
Dokumentasi proyek berada di docs/DOKUMENTASI.md.
Kamu bekerja sebagai GitHub Copilot di workspace proyek: baca file langsung dari repo,
jangan meminta saya menempelkan kode yang sudah ada di workspace.

ATURAN WAJIB:
1. Baca dokumentasi sampai habis sebelum menulis kode.
2. Pertahankan struktur index.html + file JavaScript per kelompok fitur. Jangan
  gunakan ES module, bundler, atau framework.
3. Target: laptop spek rendah dan bisa jalan OFFLINE. Gunakan lib lokal; jangan
  tambahkan ketergantungan CDN atau library berat.
4. Kode yang memasang event atau menjalankan inisialisasi didaftarkan lewat
  MF.init. Ikuti registri dan urutan script pada Bagian 2.
5. JANGAN menulis ulang atau memformat ulang seluruh file. Ubah file di workspace
   dengan perubahan sekecil mungkin (diff kecil) dan sebutkan file serta fungsi yang
   diubah. Bila tidak bisa mengedit langsung, berikan potongan (cari baris X, ganti
   dengan Y) atau fungsi utuh yang jelas lokasinya.
6. Jangan merusak fitur yang sudah ada (lihat Bagian 6, kolom "Sudah").
7. Pertahankan format JSON proyek dan tambahkan migrasi bila format berubah
   (lihat Bagian 5).
8. Ikuti gaya kode yang ada (lihat Bagian 8).
9. Setelah selesai, sebutkan fitur apa yang berubah agar daftar di Bagian 6
   bisa saya perbarui.
10. Jangan mengedit docs/DOKUMENTASI.md. Daftar fitur di Bagian 6 saya perbarui sendiri.
    Jangan menghapus, menulis ulang, atau mengurutkan ulang butir di Bagian 6.
11. Kerjakan satu tugas atau satu fase per sesi. Untuk fitur Frame (6.12 sampai 6.20)
    ikuti Bagian 12. Jangan melompat ke fase lain.
12. Setelah mengubah kode, pastikan index.html tetap bisa dibuka lewat klik ganda
    (file://) tanpa error di Console, lalu tulis cara uji manualnya.

TUGAS SAYA SEKARANG: <tulis tugasnya di sini, mis. "Kerjakan Fase 0 Frame (Bagian 12.2)">
```

---

## 1. Ringkasan

| Item | Isi |
|---|---|
| Nama | MiniFigma — Editor Vektor Offline |
| Bahasa UI | Indonesia |
| Bentuk | `index.html` + JavaScript terpisah per kelompok fitur |
| Render | Canvas 2D (bukan SVG/DOM) |
| Library | jQuery 3.7.1 dan Tailwind, keduanya lokal di `lib/` |
| Penyimpanan | localStorage (autosave) + ekspor/impor file JSON |
| Ekspor gambar | PNG |
| Baris kode | ± 1000 baris, ditulis padat (banyak statement per baris) |

Seluruh library dimuat lokal agar aplikasi dapat dibuka langsung lewat `file://`
tanpa koneksi internet.

---

## 2. Struktur file

JavaScript dibagi menurut kepemilikan fitur. Semua script memakai scope global
biasa (tanpa `import`/`export`); handler dan panggilan awal didaftarkan melalui
`MF.init` dan dijalankan oleh `js/main.js` setelah seluruh file dimuat.

| Urutan | File | Kepemilikan |
|---|---|---|
| 1 | `lib/jquery.min.js` | jQuery lokal |
| 2 | `lib/tailwind.js` | Tailwind lokal |
| 3 | `js/inti.js` | State bersama, utilitas model, data grup, `MF` |
| 4 | `js/kanvas.js` | Canvas, paint, hit-test, magnet, dispatcher mouse |
| 5 | `js/efek.js` | Katalog dan panel efek |
| 6 | `js/teks.js` | Layout teks, editor kanvas, font lokal |
| 7 | `js/pena.js` | Pena Bézier dan edit titik |
| 8 | `js/transformasi.js` | Seleksi, transformasi, overlay |
| 9 | `js/alat.js` | Toolbar, bentuk, pensil, dispatcher keyboard |
| 10 | `js/layer.js` | UI layer, grup, urutan, rename |
| 11 | `js/panel.js` | Panel properti kanan |
| 12 | `js/clipboard.js` | Copy/paste, gambar, library gambar |
| 13 | `js/simpan.js` | JSON, migrasi, buka/simpan, ekspor PNG |
| 14 | `js/performa.js` | Riwayat, undo/redo, autosave |
| 15 | `js/frame.js` | [6.12] Preset ukuran, orientasi, bungkus/lepas frame, grup ↔ frame, corner smoothing |
| 16 | `js/hierarki.js` | [6.13] Induk–anak nyata (`fid`), label judul frame, navigasi Enter / Shift+Enter / Tab |
| 17 | `js/constraint.js` | [6.14] Constraints, resize responsif, clip konten frame, resize to fit |
| 18 | `js/autolayout.js` | [6.15] Auto layout |
| 19 | `js/layoutgrid.js` | [6.16] Layout grid per frame |
| 20 | `js/prototipe.js` | [6.17] Prototipe (alur antar frame) |
| 21 | `js/komponen.js` | [6.18] Komponen dan varian |
| 22 | `js/variabel.js` | [6.19] Style dan variabel |
| 23 | `js/organisasi.js` | [6.20] Section, tidy up, ekspor batch, inspeksi, salin properti |
| 24 | `js/main.js` | Runner `MF.init` dan pemulihan project |

File urutan 15 sampai 23 adalah **rencana**: dibuat pada Fase 0 (Bagian 12.2) sebagai kerangka kosong, lalu
diisi per fase. Setelah dibuat, tag `<script>`-nya harus ada di `index.html` persis sesuai urutan di atas
(semuanya sebelum `js/main.js`). Jika ada `js/script.js` di folder, itu bukan bagian struktur ini: jangan
dimuat atau diubah tanpa konfirmasi, dan jangan menyalin deklarasinya ke file lain.

Urutan tag `<script>` di `index.html` harus sama dengan tabel di atas.
Baris pertama setiap file fitur berisi komentar kepemilikan: `[6.x] Nama kelompok.
Isi: ... Bukan di sini: ...`.

### Peta kelompok fitur → file

| Bagian 6 | Kelompok | File utama |
|---|---|---|
| 6.1 | Kanvas dan navigasi | `kanvas.js` |
| 6.2 | Alat gambar | `alat.js` |
| 6.3 | Pena vektor | `pena.js` |
| 6.4 | Seleksi dan transformasi | `transformasi.js` |
| 6.5 | Layer dan grup | `layer.js` (data grup di `inti.js`) |
| 6.6 | Panel properti | `panel.js` |
| 6.7 | Efek | `efek.js` |
| 6.8 | Teks | `teks.js` |
| 6.9 | Riwayat, simpan, ekspor | `simpan.js` (JSON, buka/simpan, ekspor PNG); undo/redo dan autosave ada di `performa.js` |
| 6.10 | Clipboard dan pintasan | `clipboard.js` |
| 6.11 | Offline dan performa | `performa.js` |
| 6.12 | Pembuatan dan jenis frame | `frame.js` |
| 6.13 | Hierarki, seleksi, dan label frame | `hierarki.js` |
| 6.14 | Constraints dan resize responsif | `constraint.js` |
| 6.15 | Auto layout | `autolayout.js` |
| 6.16 | Layout grid | `layoutgrid.js` |
| 6.17 | Prototipe | `prototipe.js` |
| 6.18 | Komponen dan varian | `komponen.js` |
| 6.19 | Style dan variabel | `variabel.js` |
| 6.20 | Organisasi dan serah-terima | `organisasi.js` |

Aturan: fitur baru ditaruh di file kelompoknya. Perubahan kecil pada file lain (mis. `inti.js`, `layer.js`,
`kanvas.js`, `simpan.js`) boleh bila memang diperlukan, dan harus disebutkan di laporan.

### Registri `MF`

- `MF.init`: antrean callback yang dijalankan setelah semua script dimuat.
- `MF.down`: hook `{p, fn(e, ctx)}`; prioritas naik, `true` menghentikan dispatch.
- `MF.move[k]` dan `MF.up[k]`: handler berdasarkan `drag.k`.
- `MF.keys`: callback `fn(e, k)`; `true` berarti shortcut ditangani.
- `MF.overlay`: callback gambar overlay di atas objek.
- `MF.beforeMove`: hook sebelum memulai geser, dipakai duplikasi Alt-seret.
- Prioritas mouse: 10 pan, 20 pena, 30 teks, 40 bentuk, 50 pivot, 60 radius,
  70 titik/handle pena, 75 resize, 80 rotasi, 90 seleksi/marquee/geser.
- Fitur Frame yang butuh hook mouse baru memakai prioritas di antara 80 dan 90 dan mencatatnya di sini.
- Panel kanan: tiap file fitur Frame mengisi wadahnya sendiri (`slot-frame`, `slot-constraint`, `slot-autolayout`,
  `slot-layoutgrid`, `slot-prototipe`, `slot-komponen`, `slot-variabel`) lewat `MF.init`, bukan lewat `panel.js`.

---

## 3. Variabel state utama

| Variabel | Fungsi |
|---|---|
| `S` | Array semua objek (scene graph). Indeks 0 = paling belakang, terakhir = paling depan |
| `sel` | Objek terpilih tunggal (atau `null`) |
| `multi` | Array objek terpilih jika lebih dari satu |
| `selG` | ID grup yang sedang terpilih utuh (0 = tidak ada) |
| `selPt` | Indeks titik jalur yang terpilih (mode edit pena) |
| `GR` | Kamus grup: `GR[id] = {id, name, pid, c}` (`pid` = grup induk, `c` = terlipat) |
| `V` | Viewport: `{x, y, z}` (offset dan zoom, z: 0.05–32) |
| `tool` | Alat aktif: `select`, `frame`, `rect`, `line`, `ellipse`, `polygon`, `star`, `pen`, `text` |
| `drag` | Status interaksi mouse. Nilai `drag.k`: `pan`, `new`, `move`, `box`, `rot`, `piv`, `rad`, `pt`, `hd`, `penh` |
| `draft` | Jalur pena yang sedang digambar |
| `hist`, `hp` | Riwayat undo (array snapshot JSON string) dan pointer posisi |
| `G` | Garis panduan magnet yang sedang tampil |
| `uid`, `gn` | Penghitung ID objek dan ID grup |

### Konvensi penting
- Semua koordinat objek disimpan dalam **koordinat dunia (world)**. Konversi layar↔dunia: `s2w()` dan `w2s()`.
- Rotasi di-render lewat pivot: `pvt(s)` mengembalikan titik pivot, `rp(s,x,y,a)` memutar titik (`a=-1` untuk kebalikan).
- Anggota grup selalu **berurutan** di array `S`. Panggil `normalize()` setelah mengubah `gid`.
- Setelah mengubah data, panggil `refresh()` (panel + layer + gambar ulang) atau `draw()` (hanya kanvas), lalu `save()` (debounce 250 ms: commit riwayat + autosave).

---

## 4. Model objek

Setiap objek di `S` dibuat oleh `mk(type,x,y)`:

| Properti | Arti |
|---|---|
| `id`, `type` | ID unik dan tipe: `frame`, `rect`, `ellipse`, `polygon`, `star`, `text`, `path` |
| `name` | Nama layer |
| `x`, `y`, `w`, `h` | Posisi dan ukuran (untuk `path`, bbox dihitung dari titik, bukan dari properti ini) |
| `rot` | Rotasi (derajat) |
| `pvx`, `pvy` | Pivot sebagai pecahan bbox (default 0.5) |
| `r` | Radius sudut (rect dan frame) |
| `n` | Jumlah sisi (polygon) atau titik (star) |
| `pts` | Titik jalur: `{x, y, ho?, hi?}`. `ho` dan `hi` = handle Bézier (offset relatif terhadap titik) |
| `closed` | Jalur tertutup atau tidak |
| `text`, `fs` | Isi dan ukuran font (teks) |
| `fills`, `strokes` | Lapisan isi dan garis; mendukung warna/gradien, opasitas, visibilitas, serta opsi garis |
| `fillOn`, `fill`, `fo`, `fv` | Properti kompatibilitas untuk isi utama dan dokumen lama |
| `stroke`, `sw`, `so`, `sv` | Properti kompatibilitas untuk garis utama dan dokumen lama |
| `op` | Opasitas objek (%) |
| `bm` | Blend mode |
| `fx` | Array efek `{t, on, x, y, b, v, c, o}` |
| `hid`, `lock` | Sembunyi, kunci |
| `exp` | `false` = tidak ikut ekspor PNG |
| `ar` | Kunci rasio |
| `gid` | ID grup induk (0 = tanpa grup) |

Garis (line tool) disimpan sebagai `path` dengan 2 titik tanpa handle.

Properti tambahan untuk Frame (`fid`, constraints, auto layout, layout grid, dst.) baru dirancang di Bagian 12.2 dan belum ada di kode.

---

## 5. Format file JSON (versi 8)

```json
{
  "app": "MiniFigma",
  "version": 8,
  "name": "Tanpa judul",
  "view": { "x": 200, "y": 120, "zoom": 1 },
  "settings": { "grid": true, "snap_grid": true, "snap_objects": true },
  "layers": [
    {
      "id": 1, "type": "rectangle", "name": "Persegi 1",
      "visible": true, "locked": false,
      "setting": {
        "position":   { "x": 0, "y": 0, "rotation": 0, "pivot": { "x": 0.5, "y": 0.5 } },
        "layout":     { "width": 100, "height": 100, "aspect_ratio": false },
        "appearance": { "opacity": 100, "corner_radius": 0, "blend_mode": "normal" },
        "fill":       { "enabled": true, "color": "#d9d9d9", "opacity": 100, "visible": true },
        "fills":      [ { "type": "solid", "color": "#d9d9d9", "opacity": 100, "visible": true } ],
        "stroke":     { "enabled": false, "color": "#d9d9d9", "opacity": 100, "visible": true,
                        "position": "center", "weight": 0 },
        "strokes":    [ { "type": "solid", "color": "#222222", "opacity": 100, "visible": true,
                         "weight": 1, "position": "center", "dash": "solid", "cap": "butt",
                         "join": "round", "startArrow": "none", "endArrow": "none" } ],
        "export":     { "visible": true },
        "effects":    [ { "type": "drop_shadow", "visible": true, "x": 0, "y": 4, "blur": 8,
                          "color": "#000000", "opacity": 25 } ]
      }
    },
    { "id": 2, "type": "group", "name": "Grup 1", "visible": true, "locked": false,
      "collapsed": false, "children": [ /* layer lain */ ] }
  ]
}
```

- `layers` diurutkan dari paling **belakang** (indeks 0) ke paling depan.
- `setting.fills[]` mendukung `solid`, `linear`, `radial`, `angular` (`color`, `color2`, `angle`); `setting.strokes[]` menambahkan `weight`, `position`, `dash`, `cap`, `join`, `startArrow`, dan `endArrow`.
- Tipe di JSON: `frame`, `rectangle`, `ellipse`, `polygon`, `star`, `text`, `line`, `vector`, `group`.
- Properti khusus: `setting.polygon.sides`, `setting.star.points`, `setting.text.{content,font_size,font_family,bold,italic,underline,alignment,line_height,letter_spacing,fixed_width}`, `setting.path.{closed, points[]}`.
- Titik `vector` disimpan relatif terhadap `position`; `handle_in` dan `handle_out` untuk Bézier.
- Riwayat versi: v1 (dasar) → v2 (pivot, blend mode, efek) → v3 (grup, handle Bézier) → v4 (bitmap) → v5 (flip/radius sudut) → v6 (font teks) → v7 (layout dan gaya teks) → v8 (lapisan isi/garis dan opsi stroke; v7 tetap diimpor).
- **Jika format berubah:** naikkan `FMT_VERSION`, tambahkan fungsi di objek `MIGRATE`, dan isi nilai default saat impor di `des()`.
- Autosave: kunci localStorage `minifigma.project`.
- Palet warna tersimpan: localStorage `minifigma.palette` (maksimal 24 warna).
- Font TTF kustom disimpan terpisah di localStorage `minifigma.fonts`; file font tidak disertakan dalam ekspor JSON.
- Rencana format v9 untuk Frame (induk–anak nyata, constraints, auto layout) ada di Bagian 12.2. Versi saat ini tetap v8.

---

## 6. DAFTAR FITUR (checklist)

Legenda: `[x]` sudah lengkap · `[~]` ada tapi terbatas · `[ ]` belum ada

### 6.1 Kanvas dan navigasi
- [x] Kanvas 2D + dukungan layar HiDPI (`devicePixelRatio`)
- [x] Pan: Spasi + seret, klik tengah mouse, scroll
- [x] Zoom: Ctrl + scroll (ke arah kursor), tombol +/−, klik angka % untuk reset. Batas 5%–3200%
- [x] Grid piksel otomatis saat zoom ≥ 800%
- [x] Magnet ke grid
- [x] Magnet ke objek (tepi dan tengah) + garis panduan merah
- [x] Label ukuran (L × T) di bawah seleksi
- [x] Render hanya saat ada perubahan (tanpa loop animasi terus-menerus)
- [ ] Zoom to fit (Shift+1) dan zoom ke seleksi (Shift+2)
- [ ] Penggaris dan guide yang bisa ditarik
- [ ] Minimap
- [ ] Mode tangan (H)

### 6.2 Alat gambar
- [x] Pilih (V)
- [x] Frame (F)
- [x] Persegi (R)
- [x] Garis (L)
- [x] Elips (O)
- [x] Poligon (3–20 sisi; menu dropdown atau Shift+R)
- [x] Bintang (3–20 titik; menu dropdown atau Shift+O)
- [x] Pena Bézier (P)
- [x] Teks (T): multi-baris, kotak lebar tetap, gaya font, alignment, spacing, dan edit langsung di kanvas
- [x] Pensil / gambar bebas (B)
- [x] Impor gambar (bitmap; library lokal, drag-and-drop, atau paste)
- [x] Shortcut untuk poligon/bintang (Shift+R / Shift+O)

### 6.3 Pena vektor
- [x] Klik = titik sudut; klik + seret = titik melengkung
- [x] Tutup jalur dengan klik titik pertama
- [x] Selesai: Enter, Esc, atau klik dua kali
- [x] Seret titik; seret handle (Alt = handle tidak simetris)
- [x] Klik dua kali pada titik: sudut ↔ lengkung
- [ ] Tambah titik di tengah segmen
- [ ] Hapus titik tertentu
- [ ] Putus / sambung jalur
- [ ] Boolean (union, subtract, intersect, exclude)

### 6.4 Seleksi dan transformasi
- [x] Pilih satu, Shift + klik, kotak seleksi (marquee), Ctrl+A
- [x] Geser dengan mouse atau panah (Shift = 10 px)
- [x] Isi frame ikut bergerak saat frame digeser
- [x] Rotasi dari luar sudut (Shift = 15°) + label derajat
- [x] Titik pivot (tampil dengan Alt, bisa diseret, atau lewat panel)
- [x] Radius sudut (handle di sudut + panel) untuk rect dan frame
- [x] Kunci rasio
- [x] Input angka X, Y, Lebar, Tinggi, Rotasi
- [~] Resize lewat handle sudut: hanya objek tanpa rotasi, bukan teks, bukan jalur
- [~] Resize dari sisi (tengah-atas, tengah-kiri, dst.)
- [~] Resize objek yang sudah diputar, teks, jalur, dan multi-seleksi
- [~] Flip horizontal / vertikal
- [~] Radius sudut per sudut

### 6.5 Layer dan grup
- [x] Panel layer dengan ikon per tipe
- [x] Seret untuk mengubah urutan (termasuk masuk/keluar grup)
- [x] Ganti nama (klik dua kali / F2)
- [x] Sembunyi dan kunci (ikon mata dan gembok)
- [x] Maju/mundur: Ctrl+] / Ctrl+[ ; paling depan/belakang: Ctrl+Shift+] / [
- [x] Grup (Ctrl+G), pisah grup (Ctrl+Shift+G), grup bersarang
- [x] Lipat/buka grup; klik dua kali di kanvas untuk masuk ke dalam grup
- [x] Indentasi layer di dalam frame
- [ ] Pencarian layer
- [ ] Halaman (pages) ganda
- [ ] Clip konten frame (isi frame yang keluar batas masih tergambar)
- [ ] Auto layout, constraints, komponen/instance

### 6.6 Panel properti
- [x] Sejajarkan (6 tombol), relatif ke frame atau antar objek terpilih
- [x] Opasitas, radius, blend mode (16 mode), tampil/sembunyi
- [x] Isi berlapis: warna, hex, opasitas, tampil/sembunyi, tambah/hapus
- [x] Garis berlapis: warna, hex, opasitas, berat, tampil/sembunyi, tambah/hapus
- [x] Opsi "Tampil di ekspor"
- [x] Edit beberapa objek sekaligus (warna, opasitas, dll.)
- [x] Isi solid dan gradien linear, radial, angular
- [x] Posisi garis tengah, dalam, dan luar
- [x] Garis putus-putus, ujung (cap), sambungan (join), dan panah
- [x] Pipet warna di kanvas dan palet warna tersimpan lokal
- [x] Distribusi jarak horizontal dan vertikal untuk 3+ objek
- [x] Ikon aksi Font Awesome Free inline/lokal; tanpa CDN

### 6.7 Efek
- [x] Bayangan luar, bayangan dalam, glow
- [x] Layer blur, background blur
- [x] Kecerahan, kontras, saturasi, rotasi warna
- [x] Abu-abu, sepia, invert
- [x] Banyak efek per objek, bisa diaktifkan/dimatikan/dihapus
- [ ] Efek untuk teks: hanya sebagian (bayangan dalam dan background blur dilewati untuk teks)

### 6.8 Teks
- [x] Isi teks dan ukuran font
- [x] Teks multi-baris dan kotak teks dengan lebar tetap
- [x] Pilihan font (family), tebal, miring, garis bawah
- [x] Rata kiri / tengah / kanan, jarak baris, jarak huruf
- [x] Edit teks langsung di kanvas (Enter = baris baru, Ctrl+Enter = selesai)
- [x] Lebar kotak teks dapat diatur dari 100–900 px
- [x] **Bobot font (font weight)**: dropdown 9 tingkat
- [x] Hanya tampilkan bobot yang tersedia untuk font terpilih
- [x] Bobot tersimpan di JSON (`setting.text.font_weight`, angka 100–900)


### 6.9 Riwayat, simpan, ekspor
- [x] Undo/Redo (maks. 100 langkah): Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y
- [x] Autosave ke localStorage
- [x] Simpan JSON (Ctrl+S), Buka JSON, Baru, nama proyek
- [x] Validasi file, migrasi versi, batas 10 MB, pesan galat
- [~] Ekspor PNG: seluruh objek terlihat sekaligus, skala 1x, latar transparan
- [ ] Ekspor SVG, JPG, PDF
- [ ] Ekspor per objek / per frame / seleksi
- [ ] Skala ekspor 2x, 3x, 4x
- [ ] Salin sebagai PNG ke clipboard

### 6.10 Clipboard dan pintasan
- [x] **Copy / Paste / Cut** (Ctrl+C, V, X)
- [x] **Duplikat** (Ctrl+D, dan Alt+seret)
- [x] Paste di tempat (Ctrl+Shift+V)
- [x] Tempel gambar dari clipboard sistem
- [x] Slot penyimpanan max 6 gambar 

### 6.11 Offline dan performa
- [x] Seluruh logika berjalan di browser tanpa server
- [x] Render berbasis event (hemat CPU saat diam)
- [x] **Hilangkan CDN Tailwind** (runtime lokal di `lib/tailwind.js`)
- [x] **Hilangkan CDN jQuery** (`lib/jquery.min.js`)
- [ ] Riwayat undo yang lebih hemat memori (sekarang menyimpan snapshot penuh JSON × 100)
- [ ] Culling: tidak menggambar objek di luar layar
- [ ] Cache `Path2D` untuk jalur kompleks
- [ ] Autosave ke IndexedDB (localStorage terbatas ± 5 MB)
- [ ] Service Worker / PWA agar bisa dipasang

### 6.12 Pembuatan dan jenis frame
- [x] Preset ukuran di panel saat alat Frame aktif atau frame terpilih, dengan kategori: Telepon, Tablet, Desktop, Presentasi, Jam tangan, Kertas, Media sosial
- [x] Daftar preset bawaan (contoh: Desktop 1440×1024, Slide 16:9 1920×1080, A4 595×842, post Instagram)
- [x] Preset buatan sendiri (simpan ukuran frame terpilih sebagai preset)
- [x] Tukar orientasi potret ↔ lanskap
- [x] Bungkus seleksi dengan frame (Ctrl+Alt+G)
- [x] Lepas frame tanpa menghapus isinya
- [x] Ubah grup menjadi frame, dan frame menjadi grup
- [x] Frame di dalam frame (bersarang): saat ini hanya lewat aturan titik tengah, belum induk-anak nyata
- [x] Corner smoothing (sudut ala iOS) untuk frame dan persegi

### 6.13 Hierarki, seleksi, dan label frame
- [x] Hierarki induk–anak nyata: seret objek ke dalam/luar frame mengganti induknya otomatis (menggantikan aturan titik tengah)
- [x] Anak ikut berputar saat frame diputar
- [x] X/Y anak ditampilkan relatif terhadap frame induk
- [x] Label judul frame di kanvas: klik = pilih, seret = pindahkan, klik dua kali = ganti nama
- [x] Klik badan frame yang kosong memulai marquee; klik anak memilih anak
- [x] Enter = pilih anak, Shift+Enter = pilih induk, Tab / Shift+Tab = saudara berikutnya / sebelumnya
- [x] Panel layer: panah lipat/buka frame, anak bersarang di bawah induknya
- [x] Sembunyikan/kunci frame berlaku untuk seluruh isinya
- [x] Menghapus frame ikut menghapus isinya
- [x] Sorot (hover) frame dan anak saat kursor lewat

### 6.14 Constraints dan resize responsif
- [ ] Constraint horizontal: Kiri, Kanan, Kiri & Kanan, Tengah, Skala
- [ ] Constraint vertikal: Atas, Bawah, Atas & Bawah, Tengah, Skala
- [ ] Widget constraint di panel (kotak dengan garis penjangkar yang bisa diklik)
- [ ] Anak mengikuti constraint saat ukuran frame berubah (handle atau angka L/T)
- [ ] Resize frame tanpa mengubah isi (tahan Ctrl/Cmd saat menyeret handle)
- [ ] Sesuaikan ukuran frame ke isinya (Resize to fit)
- [ ] Constraint dinonaktifkan otomatis untuk anak yang diatur auto layout

### 6.15 Auto layout
- [ ] Tambah auto layout ke frame atau seleksi (Shift+A); hapus (Ctrl+Alt+Shift+A)
- [ ] Flow (arah): Freeform, Vertikal, Horizontal, Grid (sesuai panel Layout di Figma)
- [ ] Wrap: lanjut ke baris/kolom berikutnya + jarak antar baris
- [ ] Jarak antar item (gap) berupa angka, atau Auto (space between)
- [ ] Padding: seragam, horizontal/vertikal, dan 4 sisi terpisah
- [ ] Perataan anak: 9 titik (kiri-atas … kanan-bawah), plus baseline untuk teks
- [ ] Ukuran frame: Fixed atau Hug contents (menyusut mengikuti isi)
- [ ] Ukuran anak: Fixed, Hug, atau Fill container
- [ ] Lebar/tinggi minimum dan maksimum
- [ ] Posisi absolut (anak mengabaikan auto layout tapi tetap di dalam frame)
- [ ] Urutan tumpukan: item pertama di atas atau terakhir di atas
- [ ] Garis (stroke) ikut atau tidak ikut dihitung dalam layout
- [ ] Seret anak untuk menyusun ulang, dengan penanda sisip biru
- [ ] Auto layout bersarang
- [ ] Mode Grid: jumlah baris dan kolom, jarak antar sel, rentang sel (span)

### 6.16 Layout grid (grid panduan di frame)
Berbeda dengan grid piksel di 6.1: ini grid desain milik tiap frame.
- [ ] Beberapa layout grid per frame, tipe Grid (persegi), Kolom, dan Baris
- [ ] Kolom/Baris: jumlah, gutter, margin/offset, lebar/tinggi, perataan (Stretch, Kiri, Tengah, Kanan)
- [ ] Grid persegi: ukuran sel
- [ ] Warna dan opasitas grid
- [ ] Tampil/sembunyikan layout grid (Ctrl+Shift+4)
- [ ] Objek menempel (snap) ke garis layout grid
- [ ] Preset 12 / 8 / 4 kolom (desktop / tablet / ponsel)
- [ ] Layout grid tidak ikut diekspor

### 6.17 Prototipe (alur antar frame)
- [ ] Tab Design / Prototype di panel kanan
- [ ] Titik awal alur (Flow starting point) pada frame, beberapa alur bernama
- [ ] Hubungkan objek/frame ke frame tujuan dengan panah koneksi
- [ ] Pemicu: On click, On drag, While hovering, While pressing, Mouse enter/leave, After delay, Key
- [ ] Aksi: Navigate to, Back, Scroll to, Open link
- [ ] Overlay: Open, Swap, Close overlay; posisi dan latar overlay
- [ ] Animasi: Instant, Dissolve, Smart animate, Move in/out, Push, Slide in/out, dengan easing dan durasi
- [ ] Perilaku scroll frame: Tanpa scroll, Horizontal, Vertikal, Dua arah
- [ ] Fixed position: anak tetap di tempat saat frame di-scroll
- [ ] Pratinjau di bingkai perangkat dan mode Present (Ctrl+Alt+Enter)
- [ ] Warna latar prototipe dan skala pratinjau (Fit, Fill, 100%)
- [ ] Tampil/sembunyikan semua panah koneksi

### 6.18 Komponen dan varian
- [ ] Buat komponen dari frame atau seleksi (Ctrl+Alt+K); komponen utama diberi penanda
- [ ] Instance: salinan terhubung yang ikut berubah saat komponen utama berubah
- [ ] Override pada instance (teks, warna, efek, visibilitas) dan reset override
- [ ] Lepas instance (Ctrl+Alt+B), Go to main component, Push/Restore changes
- [ ] Varian (component set): properti Variant (mis. State = Hover) dengan pemilih di panel
- [ ] Properti komponen: Boolean, Text, Instance swap
- [ ] Ganti komponen pada instance (Instance swap)
- [ ] Instance bersarang
- [ ] Panel Aset: daftar komponen, pencarian, seret ke kanvas
- [ ] Ekspor/impor pustaka komponen antar proyek (JSON)

### 6.19 Style dan variabel
Style warna sudah ada di 6.6 (palet / style tersimpan), tidak diulang.
- [ ] Style teks (font, ukuran, bobot, spasi) dan style efek
- [ ] Style layout grid
- [ ] Variabel: tipe Color, Number, String, Boolean
- [ ] Koleksi variabel dan mode (mis. Light/Dark, Mobile/Desktop)
- [ ] Terapkan variabel ke properti: warna isi/garis, lebar/tinggi, padding, gap, radius, opasitas, teks
- [ ] Pilih mode variabel per frame (mis. frame ini memakai Dark)
- [ ] Panel variabel berbentuk tabel
- [ ] Ekspor/impor variabel sebagai token JSON

### 6.20 Organisasi dan serah-terima
- [ ] Section (Shift+Alt+S): wadah pengelompok frame dengan nama dan warna latar; frame di dalamnya ikut bergerak
- [ ] Tidy up: rapikan objek/frame terpilih menjadi baris/kolom dengan jarak seragam
- [ ] Duplikat frame diletakkan di samping kanan, tidak menumpuk
- [ ] Ekspor semua frame sekaligus (batch, ZIP, atau PDF multi-halaman)
- [ ] Urutan presentasi frame untuk PDF dan pratinjau
- [ ] Ukur jarak: tahan Alt untuk melihat jarak antar objek dan ke tepi frame
- [ ] Mode inspeksi: ukuran, posisi, warna, font; salin sebagai CSS atau kelas Tailwind
- [ ] Salin dan tempel properti/gaya antar objek (Ctrl+Alt+C / Ctrl+Alt+V)

---

**Daftar bobot font (font weight) untuk nomor 6.8 Text**

| Angka | Nama di daftar | Keterangan |
|---|---|---|
| 100 | Thin | Paling tipis (disebut juga Hairline) |
| 200 | Extra Light | Disebut juga Ultra Light |
| 300 | Light | Tipis |
| 400 | Regular | Normal; sama dengan kata kunci `normal` |
| 500 | Medium | Sedikit lebih tebal dari normal |
| 600 | Semi Bold | Disebut juga Demi Bold |
| 700 | Bold | Tebal; sama dengan kata kunci `bold` |
| 800 | Extra Bold | Disebut juga Ultra Bold |
| 900 | Black | Paling tebal (disebut juga Heavy) |


## 7. Pintasan keyboard (yang sudah ada)

| Tombol | Fungsi |
|---|---|
| V / F / R / O / L / P / T | Pilih / Frame / Persegi / Elips / Garis / Pena / Teks |
| Spasi + seret | Geser kanvas |
| Ctrl + scroll | Zoom |
| Scroll | Geser kanvas |
| Ctrl+A | Pilih semua |
| Delete / Backspace | Hapus |
| Panah (Shift = 10) | Geser objek |
| Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y | Undo / Redo |
| Ctrl+G / Ctrl+Shift+G | Grup / Pisah grup |
| Ctrl+] / Ctrl+[ | Maju / mundur satu lapis |
| Ctrl+Shift+] / [ | Paling depan / paling belakang |
| Ctrl+S | Simpan JSON |
| F2 | Ganti nama layer |
| Enter / Esc | Selesai menggambar pena / batal pilih |
| Alt | Tampilkan pivot (saat menyeret handle: handle bebas) |
| Shift | Tambah seleksi; saat rotasi: kelipatan 15° |
| Ctrl + klik | Pilih anggota langsung di dalam grup |

---

## 8. Gaya kode (ikuti agar konsisten)

- Pertahankan JavaScript biasa + jQuery (`$`), tanpa ES module, import/export,
  bundler, atau framework. Aplikasi harus tetap bekerja dengan klik ganda `index.html`.
- Satu file JavaScript memiliki satu kelompok fitur sesuai Bagian 2. Jangan
  mendeklarasikan nama top-level yang sama pada file berbeda.
- Deklarasi fungsi/variabel berada di tingkat atas. Jangan pasang event atau
  menjalankan inisialisasi saat file dimuat; daftarkan lewat `MF.init`.
- Gunakan registri `MF.down`, `MF.move`, `MF.up`, `MF.keys`, `MF.overlay`, dan
  `MF.beforeMove` untuk interaksi bersama. Pasang dispatcher mouse/keyboard sekali.
- Gaya **padat**: ikuti format kode yang ada; jangan merapikan bagian lain tanpa
  diminta.
- Selalu panggil `normalize()` setelah mengubah grup atau urutan, `refresh()`
  setelah mengubah data yang tampil di panel, dan `save()` setelah perubahan
  yang perlu masuk undo.
- Fitur yang mengubah format proyek wajib memperbarui `ser()`, `des()`, default,
  dan migrasi di `js/simpan.js`. Refactor ini tidak mengubah format JSON.
- UI memakai kelas Tailwind yang sudah ada; jQuery dan Tailwind dimuat dari
  `lib/`, bukan CDN. CSS kecil tetap berada di `index.html`.
- Ikon Font Awesome Free yang digunakan inline di `js/inti.js` berasal dari
  Fort Awesome, Copyright 2024 Fonticons, Inc.; lisensi ikon CC BY 4.0:
  https://fontawesome.com/license/free. Tidak ada aset ikon yang dimuat dari CDN.
- Ikon baru ditambahkan ke objek `P` di `js/inti.js` dalam gaya garis 24×24
  (`currentColor`). Teks UI dan komentar berbahasa Indonesia.
- Hindari `requestAnimationFrame` terus-menerus; gambar ulang hanya saat perlu.
- Fitur Frame (6.12 sampai 6.20): satu file per kelompok sesuai Bagian 2; UI panel kanan fitur itu diisi ke wadah
  `slot-*` miliknya oleh file fiturnya sendiri.
- Perubahan pada daftar fitur (Bagian 6) hanya berupa tanda status `[ ]` / `[~]` / `[x]`, dilakukan oleh pemilik proyek.
- Aturan ringkas untuk GitHub Copilot ada di `.github/copilot-instructions.md`; bila aturan di sini berubah, perbarui juga file itu.

---

## 9. Catatan masalah / utang teknis yang diketahui

1. **Library UI lokal:** Tailwind dan jQuery dimuat dari `lib/`, tidak lagi memerlukan CDN.
2. **Resize terbatas**: tidak berfungsi untuk objek yang sudah diputar, teks, jalur, dan banyak objek.
3. **Undo memakai snapshot penuh** (`JSON.stringify` seluruh `S`) hingga 100 langkah: boros memori pada proyek besar.
4. **Frame tidak memotong (clip) isinya**. "Isi frame" ditentukan dari titik tengah objek yang berada di dalam area frame, bukan dari hubungan induk-anak yang nyata.
5. **Ekspor PNG** mengekspor semua objek terlihat sekaligus; belum ada pilihan seleksi/skala.
6. **Background blur** menyalin seluruh kanvas per objek: berat jika dipakai banyak.
7. **Font TTF kustom** tersimpan pada browser/perangkat ini dan tidak ikut dalam file JSON proyek.
8. **Kunci localStorage** hanya satu proyek (`minifigma.project`); belum ada daftar banyak proyek.
9. **Kerangka file Frame belum ada**: `frame.js` sampai `organisasi.js` baru rencana; dibuat pada Fase 0 (Bagian 12.2).
10. **`js/script.js`** (bila masih ada di folder) tidak termasuk struktur di Bagian 2; periksa isinya dan pindahkan atau hapus agar tidak ada deklarasi ganda.

---

## 10. Peta jalan yang disarankan (urutan pengerjaan)

| No | Tugas | Alasan | Tingkat |
|---|---|---|---|
| 1 | Copy / Paste / Cut / Duplikat (Ctrl+C/V/X/D, Alt+seret) | Fitur dasar yang paling terasa kurang | Mudah |
| 2 | Hilangkan CDN: gunakan Tailwind dan jQuery lokal | Selesai pada refactor struktur | Selesai |
| 3 | Zoom to fit (Shift+1) dan zoom ke seleksi (Shift+2) | Navigasi cepat | Mudah |
| 4 | Resize penuh (sisi, objek berputar, multi-seleksi, jalur, teks) | Kelemahan terbesar di transformasi | Sulit |
| 5 | Teks lebih lengkap (multi-baris, font, tebal, rata, edit langsung) | Kebutuhan desain UI | Sedang |
| 6 | Gradien dan banyak lapisan isi/garis | Mendekati panel "Fill" Figma | Sedang |
| 7 | Ekspor: skala 2x–4x, per seleksi/frame, SVG | Hasil kerja bisa dipakai | Sedang |
| 8 | Impor gambar + pipet warna | Pelengkap | Sedang |
| 9 | Optimasi performa: culling, undo hemat memori, IndexedDB | Untuk laptop spek rendah | Sedang |
| 10 | Clip frame, auto layout, komponen, boolean | Fitur besar, terakhir | Sulit |
| 11 | Frame Fase 0: kerangka 9 file baru dan wadah panel (Bagian 12.2) | Landasan untuk fase Frame | Mudah |
| 12 | Frame Fase 1: induk–anak nyata, label, preset (6.12 dan 6.13) | Fondasi semua fitur Frame | Sulit |
| 13 | Frame Fase 2: constraints dan clip konten (6.14) | Frame menjadi wadah sungguhan | Sedang |
| 14 | Frame Fase 3: auto layout (6.15) | Fitur Frame paling berpengaruh | Sulit |
| 15 | Frame Fase 4: layout grid (6.16) | Grid desain per frame | Sedang |
| 16 | Frame Fase 5 sampai 8: prototipe, komponen, variabel, organisasi (6.17 sampai 6.20) | Rancang dulu, kode kemudian | Sulit |

Baris 11 sampai 16 merinci bagian Frame dari baris 10 dan mengikuti Bagian 12.

---

## 11. Cara kerja bersama AI (saran)

- Berikan **satu tugas per percakapan** dari Bagian 10 agar hemat limit.
- Minta AI menunjukkan **di mana** potongan kode ditempel (nama fungsi atau komentar penanda).
- Setelah tugas selesai, **perbarui centang di Bagian 6** dan unggah ulang dokumen ini untuk percakapan berikutnya
  (untuk GitHub Copilot cukup simpan dan commit; dokumen dibaca langsung dari repo).
- Uji cepat setelah setiap perubahan: gambar bentuk, pilih, grup, undo, simpan JSON, buka JSON.
- Untuk GitHub Copilot: pakai mode Agent, lampirkan hanya file yang relevan, satu branch atau commit per fase (Bagian 12.1).

---

## 12. Panduan untuk GitHub Copilot dan pekerjaan Frame

### 12.1 Pengaturan GitHub Copilot

- Simpan dokumen ini di `docs/DOKUMENTASI.md`. Salin file `copilot-instructions.md` (ringkasan aturan Bagian 0) ke
  `.github/copilot-instructions.md`; Copilot memuatnya otomatis di repo ini bila fitur instruksi repositori aktif.
- Pakai Copilot Chat mode **Agent** (atau Edit) di VS Code. Lampirkan `#file:docs/DOKUMENTASI.md` dan hanya file
  `js/` yang relevan dengan tugas (mis. `#file:js/inti.js`). Hindari melampirkan semua file sekaligus agar konteks
  tidak penuh; pakai `#codebase` untuk mencari fungsi.
- Satu fase per sesi. Buat branch Git (atau commit) sebelum mulai agar mudah dibatalkan.
- Setelah Copilot selesai: buka `index.html` dengan klik ganda, periksa Console, jalankan uji manual (Bagian 11),
  baru commit.
- Copilot tidak mengedit dokumentasi. Anda memperbarui tanda status di Bagian 6 sendiri berdasarkan laporannya.
- Bila hasilnya mengubah banyak file atau memformat ulang, minta ulang: "ubah hanya file X, diff seminimal mungkin".

### 12.2 Pengerjaan Frame (6.12 sampai 6.20)

**Aturan khusus Frame**
- Kerjakan hanya fase yang disebut. Jangan melompat.
- Bagian 6 tidak diedit oleh Copilot. Laporkan butir mana yang berubah status.
- Format JSON saat ini v8. Perubahan Frame menaikkan ke v9 dan menambah `MIGRATE[8]`. File v8 harus tetap terbuka
  dan tampil sama.
- Performa: tanpa loop animasi terus-menerus; layout dihitung ulang hanya untuk frame yang berubah; tidak ada kerja
  berat di `mousemove` tanpa perlu.

**Kondisi awal (verifikasi di kode, jangan dianggap pasti)**
- Semua objek ada di array datar `S` (urutan z). Anak frame ditentukan aturan lama: titik tengah objek berada di dalam
  kotak frame dan objek berada di atas frame pada urutan `S` (`kidsOf`, `kidsFor`, `inside`).
- Grup memakai `gid` dan `GR`; anggota grup selalu berurutan di `S` (`arrange`, `normalize`).
- Frame belum memotong (clip) isinya dan belum punya induk–anak nyata.
- Koordinat semua objek berupa koordinat dunia.

**Usulan desain (boleh diubah, tapi jelaskan alasannya)**
- Tambah properti `fid` (id frame induk, 0 = tingkat atas) pada tiap objek, termasuk frame yang bersarang.
- Jaga invarian: anak sebuah frame berurutan tepat setelah frame itu di `S`, seperti anggota grup. Perluas
  `arrange()` / `normalize()` agar menjaga urutan ini.
- Grup dan frame saling bersarang (grup di dalam frame, frame di dalam grup). Pertimbangkan satu pohon induk–anak
  yang menampung keduanya (mis. `GR[id].fid` untuk grup yang berada di dalam frame). Bila tetap memakai dua relasi
  (`gid` dan `fid`), tuliskan aturan gabungannya.
- Koordinat tetap koordinat dunia; panel menampilkan X/Y relatif terhadap induk.
- JSON v9: layer `frame` punya `children` (seperti `group`). Sifat frame di `setting.frame`
  `{clip_content, layout:{...}, grids:[...]}`; sifat anak di `setting.constraints` `{horizontal, vertical}`.
- `MIGRATE[8]`: hitung anak frame dengan aturan lama (titik tengah di dalam frame dan di atas frame pada urutan `S`),
  lalu isi `fid` / `children`.

**Fungsi yang pasti terdampak (periksa semuanya)**
`kidsOf`, `kidsFor`, `inside`, `startMove`, `moveWith`, `hit` (bagian anak yang terpotong clip tidak boleh bisa
diklik), `boxHit` (aturan frame vs anak), tombol Delete dan Cut, `align` (pencarian induk), `renderLayers` (hierarki
menggantikan indentasi berbasis aturan lama), `exportSel` dan `insertClones` (petakan ulang `fid`), `ser` / `des` /
`tree` / `fromJSON`, `snapRect` (menempel ke tepi frame), urutan gambar di `draw()` dan ekspor PNG (clip saat
menggambar anak), serta snapshot undo.

**Fase**

| Fase | Isi | File utama | Uji penerimaan |
|---|---|---|---|
| 0 | Kerangka | 9 file baru di Bagian 2 (urutan 15–23) | Aplikasi berjalan persis seperti sebelumnya, Console tanpa error |
| 1 | 6.12 dan 6.13 | `frame.js`, `hierarki.js` (+ `inti.js`, `layer.js`, `simpan.js`) | Berkas v8 lama tampil sama; seret objek masuk/keluar frame mengganti induk; undo/redo, salin/tempel, simpan/buka JSON tetap benar |
| 2 | 6.14 dan baris "Clip konten frame" di 6.5 | `constraint.js` (+ `kanvas.js`, `transformasi.js`) | Anak mengikuti constraint saat frame di-resize; Ctrl saat resize tidak mengubah isi; isi yang keluar frame terpotong |
| 3 | 6.15 | `autolayout.js` | Horizontal/Vertikal + gap + padding + perataan + Hug/Fill/Fixed dulu; lalu Wrap, min/max, posisi absolut, penanda sisip; terakhir mode Grid |
| 4 | 6.16 | `layoutgrid.js` (+ `kanvas.js`) | Grid kolom/baris tampil di frame, objek menempel ke garis grid, tidak ikut ekspor |
| 5–8 | 6.17 sampai 6.20 | `prototipe.js`, `komponen.js`, `variabel.js`, `organisasi.js` | Mulai dengan rancangan data JSON dan UI, tunggu persetujuan, baru tulis kode |

**Fase 0 (kerangka)**
- Buat 9 file di `js/`: `frame.js`, `hierarki.js`, `constraint.js`, `autolayout.js`, `layoutgrid.js`, `prototipe.js`,
  `komponen.js`, `variabel.js`, `organisasi.js`.
- Isi tiap file hanya komentar kepemilikan di baris pertama (`/* [6.x] Nama kelompok. Isi: ... Bukan di sini: ... */`)
  dan satu panggilan `MF.init(function(){});` kosong.
- Tambahkan tag `<script>` di `index.html` sesuai urutan Bagian 2 (sebelum `js/main.js`).
- Tambahkan wadah kosong di panel kanan setelah bagian Efek: `slot-frame`, `slot-constraint`, `slot-autolayout`,
  `slot-layoutgrid`, `slot-prototipe`, `slot-komponen`, `slot-variabel`. Wadah kosong tidak boleh terlihat.
- Jangan mengubah perilaku apa pun.

### 12.3 Template prompt per fase

```
Baca docs/DOKUMENTASI.md (Bagian 0, 2, 8, 11, dan 12). Kerjakan Fase <N> dari Bagian 12.2.
Lampiran: #file:docs/DOKUMENTASI.md dan file js yang terdampak.
Ikuti aturan Bagian 0 (diff kecil, tanpa CDN, tanpa ES module, MF.init, tidak mengedit dokumentasi).
Format JSON naik ke v9 hanya bila fase ini mengubah format; sertakan migrasi dan nilai default.
Di akhir tulis: (a) butir Bagian 6 yang berubah status, (b) fungsi yang diubah atau ditambah,
(c) cara uji manual, (d) hal yang sengaja belum dikerjakan.
```

---

*Dokumen diperbarui berdasarkan kode MiniFigma (format JSON v8). Bagian 12 ditambahkan untuk GitHub Copilot dan pengerjaan Frame.*