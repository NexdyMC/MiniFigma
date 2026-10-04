# Instruksi untuk GitHub Copilot — Mini Vector

Proyek: editor desain vektor mirip Figma. Canvas 2D, jQuery dan Tailwind lokal (`lib/`), JavaScript per kelompok fitur di `js/`.
Harus berjalan OFFLINE dengan klik ganda `index.html` (file://), target laptop spek rendah.

Sebelum mengubah kode, baca `docs/DOKUMENTASI.md` (Bagian 0, 2, 8 dan 12). Kerjakan satu tugas atau satu fase per sesi.

## Aturan
- Tanpa ES module (`import`/`export`), bundler, framework, atau CDN. Script biasa, urutan tag `<script>` mengikuti Bagian 2.
- Deklarasi (`let`, `const`, `function`) di tingkat atas file; jangan mendeklarasikan nama yang sama di dua file.
  Kode yang memasang event atau berjalan saat dimuat didaftarkan lewat `MF.init`.
- Interaksi bersama memakai registri `MF.down`, `MF.move`, `MF.up`, `MF.keys`, `MF.overlay`, `MF.beforeMove`.
- Satu file = satu kelompok fitur (peta di Bagian 2). Baris pertama file berisi komentar kepemilikan `[6.x]`.
- Ubah file dengan diff sekecil mungkin. Jangan menulis ulang atau memformat ulang seluruh file. Gaya kode padat, nama pendek.
- Jangan merusak fitur yang sudah `[x]` di Bagian 6.
- Jangan mengedit `docs/DOKUMENTASI.md`. Jangan menghapus atau mengurutkan ulang butir di Bagian 6; pemilik proyek yang memperbarui status.
- Perubahan format proyek: naikkan `FMT_VERSION`, perbarui `ser()` / `des()` / `MIGRATE` di `js/simpan.js`, isi nilai default.
  File lama harus tetap terbuka dan tampil sama.
- Setelah mengubah data panggil `normalize()` (grup/urutan), `refresh()` (panel/layer) atau `draw()`, dan `save()` (riwayat + autosave).
- Hindari `requestAnimationFrame` terus-menerus; gambar ulang hanya saat ada perubahan.
- Teks UI dan komentar berbahasa Indonesia. Kelas Tailwind yang sudah ada dipertahankan. Ikon baru ditambah ke objek `P` di `js/inti.js`.
- `js/script.js` (bila ada) bukan bagian struktur: jangan dimuat atau diubah tanpa konfirmasi.

## Laporan di akhir tugas
(a) butir Bagian 6 yang berubah status, (b) fungsi yang diubah atau ditambah, (c) cara uji manual, (d) hal yang sengaja belum dikerjakan.