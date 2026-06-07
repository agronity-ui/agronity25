# Agronity25 Production Ready

Project ini memigrasikan single-file HTML Agronity25 menjadi aplikasi full-stack Next.js + Supabase yang siap deploy ke Vercel. File HTML lama disimpan utuh di `legacy/index-original.html` agar desain, konten, ID/flow penting, dan aset imgurl lama tidak hilang.

## Stack final

- Next.js App Router + React
- Tailwind CSS dengan tema premium neon/dark Agronity25
- Supabase Auth, Database, Storage, Realtime, RLS
- PWA manifest + service worker + offline fallback
- Tesseract.js OCR untuk Scan KHS/struk di browser
- OpenAI Responses API untuk AgronityAI melalui backend route, bukan frontend
- Recharts untuk grafik IPK, jurnal, keuangan, dan streak
- Framer Motion/Lucide/Zustand siap dipakai untuk animasi pet dan state lanjutan
- Supabase Edge Function + Cron untuk pengecekan streak otomatis

## Struktur penting

```txt
app/
  (auth)/login, register
  (app)/dashboard, jadwal, agronews, apresiasi, social, khs, ai, journal, finance, streak, pet, dokumentasi, links, admin, profile
  api/ai/chat/route.ts
components/
  admin-console.tsx, social-feed.tsx, khs-manager.tsx, ai-chat.tsx, journal-app.tsx, finance-app.tsx, streak-center.tsx, pet-app.tsx
lib/
  supabase/, ipk.ts, upload.ts, security.ts, app.ts
public/
  manifest.json, sw.js, offline.html
supabase/
  schema.sql
  functions/streak-worker/index.ts
legacy/
  index-original.html
```

## Setup dari nol

1. Buat project Supabase baru.
2. Buka SQL Editor, paste semua isi `supabase/schema.sql`, lalu Run.
3. Project URL dan publishable key sudah diisi dari data yang kamu kirim. Yang masih perlu kamu ambil dari Project Settings > API adalah service role/secret key untuk server/Edge Function.
4. Copy `.env.example` menjadi `.env.local` dan isi:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://lfajzhsafoscgtxwyekj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_LXQB2iubrJlAmGExeVhrfQ_POzDP5f7
SUPABASE_SERVICE_ROLE_KEY=ISI_SERVICE_ROLE_KEY_JANGAN_SHARE
OPENAI_API_KEY=... # opsional tapi wajib untuk AgronityAI real
OPENAI_MODEL=gpt-4.1-mini
CRON_SECRET=isi-random-panjang
```

5. Install dan jalankan lokal:

```bash
npm install
npm run dev
```

6. Buat akun pertama melalui `/register`.
7. Jadikan akun tersebut admin via SQL Editor:

```sql
update public.profiles
set role = 'super_admin'
where id = (select id from auth.users where email = 'EMAIL_KAMU');
```

8. Supabase Email Confirmation:
   - Untuk bebas konfirmasi email: Supabase Dashboard > Authentication > Providers > Email > matikan Confirm email.
   - Jangan pernah membuat auth palsu atau menyimpan password manual di table public.

9. Deploy ke Vercel:
   - Push folder project ini ke GitHub.
   - Import ke Vercel.
   - Masukkan semua env dari `.env.example` ke Vercel Project Settings.
   - Deploy.

10. Deploy Edge Function streak:

```bash
supabase login
supabase link --project-ref lfajzhsafoscgtxwyekj
supabase functions deploy streak-worker
supabase secrets set CRON_SECRET=isi-random-panjang SUPABASE_SERVICE_ROLE_KEY=ISI_SERVICE_ROLE_KEY_JANGAN_SHARE SUPABASE_URL=...
```

11. Aktifkan Cron, edit baris terakhir di `schema.sql` dengan URL project dan secret kamu, lalu jalankan query `cron.schedule(...)` yang sudah disediakan sebagai komentar.

## API key yang dibutuhkan

- `OPENAI_API_KEY`: AgronityAI. Tanpa key, route mengembalikan pesan setup, bukan jawaban palsu.
- `SUPABASE_SERVICE_ROLE_KEY`: hanya server route/Edge Function. Jangan pernah pakai di client.
- `VAPID_*`: opsional untuk Web Push lanjutan.
- OCR memakai Tesseract.js client-side sehingga tidak perlu API key.

## Checklist testing

- Register, login, logout, session tetap aktif setelah refresh.
- Jalankan SQL role admin, buka `/admin`, CRUD jadwal/berita/apresiasi/dokumentasi.
- Tambah jadwal baru, pastikan jadwal seed lama tidak hilang.
- Upload gambar berita/apresiasi ke bucket `agronity-cms`.
- Buka `/social`, post teks, upload foto/video, ambil foto kamera native, like, komentar, simpan, report.
- Buka `/khs`, upload/capture KHS, OCR, koreksi hasil, simpan, grafik IPK muncul.
- Buka `/ai`, coba chat tanpa `OPENAI_API_KEY` harus muncul setup message. Setelah key diisi, respons real tersimpan di `ai_messages`.
- Buka `/journal`, tulis jurnal, upload foto, search, grafik mood.
- Buka `/finance`, catat transaksi, upload struk, grafik harian/kategori.
- Buka `/streak`, login harian tercatat, activity logs masuk, pet XP naik.
- Deploy Edge Function + Cron, pastikan streak berubah menjadi almost_broken/broken/restored sesuai deadline.
- Lighthouse PWA: manifest terbaca, service worker aktif, offline fallback jalan.
- Test mobile: bottom navigation scroll, kamera getUserMedia, upload file, tidak ada horizontal overflow.

## Catatan produksi

- SQL schema sudah memakai server time `Asia/Makassar` untuk streak, bukan jam device user.
- Semua data private user memakai RLS `user_id = auth.uid()`.
- Admin bisa moderasi dan CRUD CMS lewat role `admin`/`super_admin`.
- Realtime publication diaktifkan untuk social, chat, notification, dan streak.
- Untuk production serius, jalankan `npm run build` sebelum deploy dan cek semua warning dependency.

## Supabase project kamu

Gunakan root URL ini untuk client Supabase, bukan endpoint REST:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://lfajzhsafoscgtxwyekj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_LXQB2iubrJlAmGExeVhrfQ_POzDP5f7
```

Endpoint yang kamu kirim `https://lfajzhsafoscgtxwyekj.supabase.co/rest/v1/` hanya untuk REST API langsung, bukan nilai `NEXT_PUBLIC_SUPABASE_URL`.
