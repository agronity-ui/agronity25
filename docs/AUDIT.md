# Audit singkat file HTML lama Agronity25

File lama adalah single-file HTML besar dengan SEO, PWA meta, Tailwind CDN, Supabase JS CDN, animasi premium, loader, top nav, bottom nav mobile, dan section tab. Fitur yang ditemukan dan dimigrasikan ke struktur production:

- Beranda/dashboard premium dengan quick cards, logo imgurl, notifikasi, countdown/next class widget.
- AgroNEWS: hero news, ticker, berita pilihan, fallback berita, integrasi API berita eksternal dan Supabase berita.
- Apresiasi: data achievers, modal detail, kartu prestasi.
- Mengenal/mahasiswa/profil: login mahasiswa lama berbasis nama + tanggal lahir dari array `students`.
- Jadwal kuliah: semester 1 dan 2, highlight hari ini, countdown kelas berikutnya.
- Simulator IPK: input matkul, SKS, nilai, kalkulasi IPK.
- Dokumentasi dan Links.
- Admin panel: login Supabase, CRUD jadwal/berita/apresiasi, upload gambar Supabase Storage, preview live, edit/delete.
- PWA: manifest Blob dan service worker Blob di runtime.
- Notifikasi browser dan tombol test notifikasi.
- Animasi ulang tahun/birthday check dari data mahasiswa.

Masalah utama yang diperbaiki di versi baru:

- Auth mahasiswa statis diganti Supabase Auth asli.
- LocalStorage/simulasi diganti database per user.
- CDN/script global dipisah menjadi komponen Next.js.
- API key tidak lagi hardcoded di HTML, dipindah ke env.
- Upload gambar/video memakai bucket dan validasi file.
- Admin CRUD dibuat tidak menimpa data lama.
- PWA dipindah ke manifest dan service worker file nyata.
- Streak/pet dihitung backend via DB function + Edge Function, bukan localStorage.
