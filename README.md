# MiniFigma — Dokumentasi Proyek

> Dokumen ini ditulis agar AI (atau developer) lain bisa langsung melanjutkan proyek tanpa bertanya dari nol.
> Kirim bersama file `index.html` (kode proyek). Baca bagian 0 dulu.

---

## 0. PROMPT PEMBUKA (salin-tempel ke AI baru)

```
Kamu akan melanjutkan proyek "MiniFigma": editor desain vektor mirip Figma
yang berjalan di browser, ditulis dalam SATU file HTML, memakai <canvas> 2D.
Saya melampirkan 2 file: (1) kode proyek, (2) dokumentasi ini.

ATURAN WAJIB:
1. Baca dokumentasi sampai habis sebelum menulis kode.
2. Tetap SATU file HTML. Jangan pecah jadi banyak file/framework (React, Vue, dll).
3. Target: laptop spek rendah dan bisa jalan OFFLINE. Hindari library berat.
4. JANGAN menulis ulang seluruh file. Berikan perubahan sebagai potongan
   (cari baris X, ganti dengan Y) atau fungsi utuh yang jelas lokasinya.
5. Jangan merusak fitur yang sudah ada (lihat Bagian 6, kolom "Sudah").
6. Pertahankan format JSON proyek dan tambahkan migrasi bila format berubah
   (lihat Bagian 5).
7. Ikuti gaya kode yang ada (lihat Bagian 8).
8. Setelah selesai, sebutkan fitur apa yang berubah agar daftar di Bagian 6
   bisa saya perbarui.

TUGAS SAYA SEKARANG: <tulis tugasnya di sini, mis. "Tambahkan Copy/Paste/Duplikat (Ctrl+C, Ctrl+V, Ctrl+D)">
```

---

## 1. Ringkasan

| Item | Isi |
|---|---|
| Nama | MiniFigma — Editor Vektor Offline |
| Bahasa UI | Indonesia |
| Bentuk | 1 file HTML (HTML + CSS + JS di dalamnya) |
| Render | Canvas 2D (bukan SVG/DOM) |
| Library | jQuery 3.7.1, Tailwind (Play CDN) |
| Penyimpanan | localStorage (autosave) + ekspor/impor file JSON |
| Ekspor gambar | PNG |
| Baris kode | ± 1000 baris, ditulis padat (banyak statement per baris) |

**Masalah offline yang belum selesai:** Tailwind dan jQuery masih diambil dari CDN
(`cdn.tailwindcss.com` dan `code.jquery.com`). Tanpa internet, UI tidak tampil benar.

---

## 2. Struktur file

Urutan di dalam `<script>` (semuanya di dalam satu `$(function(){ ... })`):

| Urutan | Bagian | Isi |
|---|---|---|
| 1 | Deklarasi state | `S`, `sel`, `multi`, `GR`, `V`, `drag`, `draft`, dll. |
| 2 | Ikon `P` dan fungsi `I()` | Ikon SVG inline (stroke, 24×24) |
| 3 | Katalog efek `EFX`, `BM`, `FLT` | Definisi efek dan blend mode |
| 4 | Seleksi & Grup (`grp-start` … `grp-end`) | Logika grup bersarang |
| 5 | Model | `bbox`, `seg`, `flat`, `mk`, `pvt`, `rp`, `move`, `geo` |
| 6 | Gambar | `trace`, `body`, `paint`, `draw` |
| 7 | Magnet | `snapRect`, `snapPt` |
| 8 | Hit test | `segDist`, `inPoly`, `hit` |
| 9 | Mouse | `mousedown`, `mousemove`, `mouseup`, `wheel` |
| 10 | Pena | `penClick`, `finishPen` |
| 11 | Toolbar & keyboard | `setTool`, handler `keydown` |
| 12 | Panel properti | `syncProps`, `renderFx`, handler input |
| 13 | Layer panel | `renderLayers`, `reorder`, `zmove`, `rename` |
| 14 | Simpan, riwayat, ekspor | `ser`, `des`, `toJSON`, `fromJSON`, `commit`, `undo`, `redo`, `persist` |
| 15 | Inisialisasi | `load()`, `fit()`, `refresh()` di baris paling bawah |

Komentar penanda di kode: `/* ---------- Nama ---------- */`, `/* fx-end */`, `/* grp-start */`, `/* grp-end */`.

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
| `fillOn`, `fill`, `fo`, `fv` | Isi aktif, warna hex, opasitas isi (%), isi terlihat |
| `stroke`, `sw`, `so`, `sv` | Warna garis, berat, opasitas garis (%), garis terlihat |
| `op` | Opasitas objek (%) |
| `bm` | Blend mode |
| `fx` | Array efek `{t, on, x, y, b, v, c, o}` |
| `hid`, `lock` | Sembunyi, kunci |
| `exp` | `false` = tidak ikut ekspor PNG |
| `ar` | Kunci rasio |
| `gid` | ID grup induk (0 = tanpa grup) |

Garis (line tool) disimpan sebagai `path` dengan 2 titik tanpa handle.

---

## 5. Format file JSON (versi 3)

```json
{
  "app": "MiniFigma",
  "version": 3,
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
        "stroke":     { "enabled": false, "color": "#d9d9d9", "opacity": 100, "visible": true,
                        "position": "center", "weight": 0 },
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
- Tipe di JSON: `frame`, `rectangle`, `ellipse`, `polygon`, `star`, `text`, `line`, `vector`, `group`.
- Properti khusus: `setting.polygon.sides`, `setting.star.points`, `setting.text.{content,font_size,font_family}`, `setting.path.{closed, points[]}`.
- Titik `vector` disimpan relatif terhadap `position`; `handle_in` dan `handle_out` untuk Bézier.
- Riwayat versi: v1 (dasar) → v2 (pivot, blend mode, efek) → v3 (grup, handle Bézier) → v4 (bitmap) → v5 (flip/radius sudut) → v6 (font teks).
- **Jika format berubah:** naikkan `FMT_VERSION`, tambahkan fungsi di objek `MIGRATE`, dan isi nilai default saat impor di `des()`.
- Autosave: kunci localStorage `minifigma.project`.
- Font TTF kustom disimpan terpisah di localStorage `minifigma.fonts`; file font tidak disertakan dalam ekspor JSON.

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
- [x] Teks (T): satu baris; edit langsung di kanvas dengan klik dua kali; pilihan font dan font TTF lokal tersimpan di browser
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
- [x] Isi: warna, hex, opasitas, tampil/sembunyi, tambah/hapus
- [x] Garis: warna, hex, opasitas, berat, tampil/sembunyi, tambah/hapus
- [x] Opsi "Tampil di ekspor"
- [x] Edit beberapa objek sekaligus (warna, opasitas, dll.)
- [~] Isi hanya satu warna solid per objek
- [~] Garis hanya posisi tengah (belum inside/outside)
- [ ] Gradien (linear, radial, angular)
- [ ] Banyak lapisan isi dan garis
- [ ] Garis putus-putus, ujung garis (cap), sambungan (join) kustom, panah
- [ ] Pipet warna (eyedropper), palet warna / style tersimpan
- [ ] Distribusi jarak otomatis (distribute)

### 6.7 Efek
- [x] Bayangan luar, bayangan dalam, glow
- [x] Layer blur, background blur
- [x] Kecerahan, kontras, saturasi, rotasi warna
- [x] Abu-abu, sepia, invert
- [x] Banyak efek per objek, bisa diaktifkan/dimatikan/dihapus
- [ ] Efek untuk teks: hanya sebagian (bayangan dalam dan background blur dilewati untuk teks)

### 6.8 Teks
- [x] Isi teks dan ukuran font
- [ ] Teks multi-baris dan kotak teks dengan lebar tetap
- [ ] Pilihan font (family), tebal, miring, garis bawah
- [ ] Rata kiri / tengah / kanan, jarak baris, jarak huruf
- [ ] Edit teks langsung di kanvas

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
- [ ] **Hilangkan CDN Tailwind** (ganti dengan CSS biasa di dalam `<style>`)
- [ ] **Hilangkan CDN jQuery** (tanam lokal, atau ganti ke JavaScript murni)
- [ ] Riwayat undo yang lebih hemat memori (sekarang menyimpan snapshot penuh JSON × 100)
- [ ] Culling: tidak menggambar objek di luar layar
- [ ] Cache `Path2D` untuk jalur kompleks
- [ ] Autosave ke IndexedDB (localStorage terbatas ± 5 MB)
- [ ] Service Worker / PWA agar bisa dipasang

---

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

- Satu file, JavaScript murni + jQuery (`$`), tanpa module/bundler.
- Gaya **padat**: nama pendek (`s` = shape, `g` = context/grup, `S` = daftar shape), banyak statement per baris. Jangan "merapikan" kode lama kecuali diminta.
- Selalu panggil `normalize()` setelah mengubah grup atau urutan, `refresh()` setelah mengubah data yang tampil di panel, dan `save()` setelah perubahan yang perlu masuk undo.
- Fitur baru yang menyimpan properti baru wajib ditambahkan ke **`ser()`** dan **`des()`** (JSON), diberi nilai default, dan pertimbangkan migrasi.
- UI memakai kelas Tailwind (warna gelap `#2c2c2c`, aksen `#0d99ff`). Bila CDN dihapus, kelas yang dipakai harus diganti dengan CSS biasa.
- Ikon baru ditambahkan ke objek `P` dalam gaya garis 24×24 (`currentColor`).
- Teks UI memakai bahasa Indonesia.
- Hindari `requestAnimationFrame` terus-menerus; gambar ulang hanya saat perlu.

---

## 9. Catatan masalah / utang teknis yang diketahui

1. **Ketergantungan CDN** (Tailwind dan jQuery): aplikasi tidak jalan tanpa internet.
2. **Resize terbatas**: tidak berfungsi untuk objek yang sudah diputar, teks, jalur, dan banyak objek.
3. **Undo memakai snapshot penuh** (`JSON.stringify` seluruh `S`) hingga 100 langkah: boros memori pada proyek besar.
4. **Frame tidak memotong (clip) isinya**. "Isi frame" ditentukan dari titik tengah objek yang berada di dalam area frame, bukan dari hubungan induk-anak yang nyata.
5. **Ekspor PNG** mengekspor semua objek terlihat sekaligus; belum ada pilihan seleksi/skala.
6. **Background blur** menyalin seluruh kanvas per objek: berat jika dipakai banyak.
7. **Font TTF kustom** tersimpan pada browser/perangkat ini dan tidak ikut dalam file JSON proyek.
8. **Kunci localStorage** hanya satu proyek (`minifigma.project`); belum ada daftar banyak proyek.

---

## 10. Peta jalan yang disarankan (urutan pengerjaan)

| No | Tugas | Alasan | Tingkat |
|---|---|---|---|
| 1 | Copy / Paste / Cut / Duplikat (Ctrl+C/V/X/D, Alt+seret) | Fitur dasar yang paling terasa kurang | Mudah |
| 2 | Hilangkan CDN: ganti Tailwind dengan CSS lokal, tanam jQuery | Syarat offline penuh dan lebih ringan | Sedang |
| 3 | Zoom to fit (Shift+1) dan zoom ke seleksi (Shift+2) | Navigasi cepat | Mudah |
| 4 | Resize penuh (sisi, objek berputar, multi-seleksi, jalur, teks) | Kelemahan terbesar di transformasi | Sulit |
| 5 | Teks lebih lengkap (multi-baris, font, tebal, rata, edit langsung) | Kebutuhan desain UI | Sedang |
| 6 | Gradien dan banyak lapisan isi/garis | Mendekati panel "Fill" Figma | Sedang |
| 7 | Ekspor: skala 2x–4x, per seleksi/frame, SVG | Hasil kerja bisa dipakai | Sedang |
| 8 | Impor gambar + pipet warna | Pelengkap | Sedang |
| 9 | Optimasi performa: culling, undo hemat memori, IndexedDB | Untuk laptop spek rendah | Sedang |
| 10 | Clip frame, auto layout, komponen, boolean | Fitur besar, terakhir | Sulit |

---

## 11. Cara kerja bersama AI (saran)

- Berikan **satu tugas per percakapan** dari Bagian 10 agar hemat limit.
- Minta AI menunjukkan **di mana** potongan kode ditempel (nama fungsi atau komentar penanda).
- Setelah tugas selesai, **perbarui centang di Bagian 6** dan unggah ulang dokumen ini untuk percakapan berikutnya.
- Uji cepat setelah setiap perubahan: gambar bentuk, pilih, grup, undo, simpan JSON, buka JSON.

---

*Dokumen dibuat berdasarkan pembacaan kode MiniFigma (format JSON v3).*