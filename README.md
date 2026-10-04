# TASK: Export to Code (HTML + Tailwind CSS) untuk Mini Vector, Tahap 7a

## Peran
Kamu senior front-end engineer. Tambahkan fitur **Export to Code** ke editor vektor **Mini Vector**. Hasilnya: kode HTML yang memakai class Tailwind CSS, bisa langsung di-copy-paste.

## Langkah 0 (WAJIB sebelum menulis kode)
1. Baca struktur project: cara elemen/frame disimpan, **format JSON dokumen**, panel properti kanan (terutama section "Ekspor"), dan modul warna `colors.js` (jika sudah ada).
2. Tulis ringkasan skema JSON (5-10 baris): tipe node, x/y/width/height, rotasi, radius, fills, strokes, text, children, visible/locked.
3. Jangan ubah format JSON. Fitur ini **hanya membaca** data. Ikuti gaya kode, framework, dan penamaan project yang ada.

## Lingkup tahap ini (7a)
Dikerjakan: mode **Fixed**, mode **Scale to fit**, modal **Code Preview** dengan resize, tombol Copy/Download.
Tidak dikerjakan dulu: validator, mode Responsive (inferensi flex/grid), gradient/pattern/image/video/shader (selain Solid), output JSX/SVG, import JSON.

## Deliverable (revisi: dua file)

### 1. `export.js` (logika murni, tanpa DOM)
- `jsonToTree(json) -> nodes`
- `exportToTailwind(nodes, { mode: 'fixed' | 'scale', fullPage: boolean }) -> { html, full }`
- `tw(...classes)`
- Tidak boleh memakai `document`, `window`, atau meng-import `html.js`.

### 2. `html.js` (UI + DOM, import dari `export.js`)
Export satu fungsi inisialisasi: `initCodePanel({ getSelection, subscribe, mountTab, mountModalRoot })`
- `getSelection()`: mengembalikan node terpilih dari state editor
- `subscribe(cb)`: dipanggil saat seleksi/properti berubah (jangan simpan state sendiri)
- `mountTab`: elemen tab "Code" di section Ekspor
- `mountModalRoot`: elemen tempat modal dirender

Tanggung jawab `html.js`:
- **Tab Code**: kode singkat (textContent), tombol Copy, tombol "Buka Code Preview".
- **Modal Code Preview**: dua kolom. Kiri `<iframe sandbox="allow-scripts">` dengan `srcdoc` dari `full`, handle drag resize, preset Frame/375/768/1440/Custom, input lebar. Kanan preview kode (monospace, `textContent`), Copy ("Copied!" 1,5 detik), Download .html.
- **Dropdown Mode** (Fixed | Scale to fit, default Scale), disimpan di dokumen.
- **Debounce 150 ms** saat re-render.
- **Shortcut** `Ctrl/Cmd+Shift+C`, tutup dengan Esc atau klik luar, kembalikan fokus ke tombol pemicu.
- **Copy**: `navigator.clipboard.writeText`, fallback `execCommand('copy')` via textarea sementara.
- **Cleanup**: fungsi `destroy()` yang melepas semua event listener dan observer.
- **Keamanan**: tanpa `eval`, tanpa `innerHTML` dari data user.
- Seleksi kosong: tampilkan "Pilih elemen untuk melihat kode".
- CSS modal digabung ke file CSS project (atau `html.css` jika project memakai file CSS per modul). Gaya mengikuti tema gelap panel yang ada.

### Aturan antar-file
- Semua pemanggilan konversi lewat `export.js`; `html.js` tidak boleh punya logika konversi sendiri.
- Test (fixture 3 elemen) hanya untuk `export.js`.
## Aturan konversi
- Sumber: frame/elemen yang sedang dipilih. Jika yang dipilih elemen biasa, bungkus dengan root `relative` seukuran bounding box-nya.
- Koordinat anak **relatif ke parent**. Parent selalu `relative`, anak `absolute`.
- Urutan DOM = urutan layer. Elemen **hidden tidak diexport**, locked tetap diexport.
- Rectangle/frame → `<div>`. Ellipse → `<div class="rounded-full">`. Text → `<p>` dengan `text-[16px] font-[600] leading-[24px] text-[#hex]`, escape `< > & "`.
- Radius `rounded-[8px]`, rotasi `rotate-[15deg]` (lewati jika 0), opacity `opacity-[0.5]` (lewati jika 1).
- Fill Solid: `bg-[#RRGGBB]`, dengan alpha `bg-[#RRGGBBAA]`.
- Stroke: `border border-[#hex]` (Inside), `border-[3px]` untuk ketebalan lain. Outside memakai `outline outline-[Npx] outline-[#hex]`.
- Aturan arbitrary value: spasi diganti `_`, tidak ada spasi di dalam class. Bulatkan maksimal 2 desimal. Hapus class default.
- Vector/path → `<svg>` inline dengan `<path d="...">`.
- Fill non-Solid (gradient/image/dll): jangan crash, beri fallback `bg-gray-300` dan komentar `<!-- belum didukung -->`.

## Dua mode
**Fixed**
```html
<div class="relative w-[828px] h-[672px]">
  <div class="absolute left-[292px] top-0 w-[209px] h-[212px] bg-[#E84646]"></div>
</div>
```
**Scale to fit** (DEFAULT): root `relative w-full max-w-[828px] aspect-[828/672]`. Semua `left/top/width/height` anak jadi **persen** terhadap parent, dibulatkan 2 desimal:
```html
<div class="relative w-full max-w-[828px] aspect-[828/672]">
  <div class="absolute left-[35.27%] top-0 w-[25.24%] h-[31.55%] bg-[#E84646]"></div>
</div>
```
Font-size di mode ini memakai satuan `cqw` dengan container query (`@container` pada root, `text-[1.93cqw]`), agar teks ikut mengecil. Beri `text-[Npx]` biasa sebagai fallback komentar jika browser tidak mendukung.

## Output
- **Blok HTML**: hanya markup + class Tailwind, tanpa `<style>` dan tanpa `<script>`. Siap ditempel ke project yang sudah memakai Tailwind.
- **File lengkap** (`full`, untuk Download dan iframe): `<!DOCTYPE html>`, `<meta viewport>`, `<script src="https://cdn.tailwindcss.com"></script>`, dan blok HTML di `<body>`.
- Tampilkan catatan kecil di UI: "Blok HTML butuh Tailwind di project kamu. File lengkap sudah menyertakan CDN."

## Perilaku & keamanan
- Copy: `navigator.clipboard.writeText`, fallback `document.execCommand('copy')` lewat textarea sementara.
- Seleksi kosong: tampilkan "Pilih elemen untuk melihat kode", jangan crash.
- Jangan pakai `eval` atau `innerHTML` dengan data mentah user. Iframe memakai `sandbox="allow-scripts"` dan konten lewat `srcdoc`.
- Tidak ada dependensi baru.

## Test (fungsi murni)
Pakai fixture 3 elemen: merah (292,0, 209×212), kuning (0,91, 209×212), hijau (301,280, 168×131), frame 828×672. Verifikasi:
- Fixed menghasilkan nilai px yang sama persis dengan fixture.
- Scale to fit: merah `left-[35.27%] w-[25.24%] h-[31.55%]`.
- Elemen hidden tidak muncul. Teks dengan `<` dan `&` ter-escape.

## Kriteria penerimaan
- [ ] Memilih frame berisi 3 elemen lalu Copy menghasilkan satu blok HTML + Tailwind tanpa CSS terpisah.
- [ ] Hasil Download dibuka di browser dan tampil sama dengan canvas (posisi, ukuran, warna, stroke).
- [ ] Preview mode Scale to fit: lebar 1440 → 375 mengecil proporsional, tidak ada yang bertabrakan.
- [ ] Preset dan drag resize bekerja, mode bisa diganti dan tersimpan.
- [ ] Tidak ada error di console, seleksi kosong ditangani.

## Cara kerja
Kerjakan bertahap dan jelaskan singkat tiap tahap: (1) analisis + ringkasan skema JSON, (2) `export.js` mode Fixed + test, (3) mode Scale to fit, (4) tab Code + Copy, (5) modal preview + resize. Jika ada keputusan ambigu, pilih yang paling sederhana dan catat asumsimu.