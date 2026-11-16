# Panduan Lengkap Hosting Undangan Digital ke Hostinger

Dokumen ini berisi panduan langkah demi langkah untuk men-deploy website **Undangan Pernikahan Guswik & Fitri** (lengkap dengan fitur **Dynamic Routing** `undangan.com/andi`, **Dashboard Admin** `undangan.com/admin`, serta **Database PostgreSQL + Prisma**) ke **Hostinger**.

---

## Ringkasan Arsitektur Proyek

| Komponen | File Utama | Fungsi |
| :--- | :--- | :--- |
| **Halaman Undangan** | `index.html`, `style.css`, `script.js` | Tampilan undangan utama & pembacaan slug `/andi` |
| **Dashboard Admin** | `admin.html` (diakses via `/admin`) | Mengelola tabel tamu (`guests`), salin link, kirim WA, & pantau RSVP |
| **Server Node.js** | `server.js` | Menjalankan aplikasi, dynamic routing `/:slug`, dan REST API |
| **API & Database Layer** | `api/_db.js`, `api/guests.js`, `api/wishes.js` | Endpoint CRUD tamu & ucapan (mendukung PostgreSQL via Prisma + fallback JSON otomatis) |
| **Skema Database** | `prisma/schema.prisma`, `prisma/seed.js` | Struktur tabel `guests` & `wishes` untuk PostgreSQL |

---

## Pilihan Metode Hosting di Hostinger

Pilih salah satu metode di bawah ini sesuai dengan paket Hostinger yang Anda miliki:

1. **Opsi A — Hostinger Node.js Web App (hPanel Business / Cloud Hosting)** *(Paling Mudah & Direkomendasikan)*
2. **Opsi B — Hostinger VPS (Ubuntu + PM2 + Nginx + PostgreSQL)** *(Kontrol Penuh)*
3. **Opsi C — Domain di Hostinger + Mesin Hosting di Vercel** *(Gratis, Cepat, & Otomatis dari GitHub)*

---

## Opsi A: Deploy via Hostinger hPanel (Node.js Web App + GitHub)

Jika Anda menggunakan paket **Hostinger Web Business** atau **Cloud Hosting** yang mendukung **Node.js**:

### 1. Push Kode Terbaru ke GitHub
Pastikan seluruh perubahan sudah di-push ke repository GitHub Anda:
```bash
git add .
git commit -m "feat: dynamic routing, clean RSVP, and admin dashboard"
git push origin main
```

### 2. Buat Database PostgreSQL (Jika Menggunakan PostgreSQL)
> **Catatan:** Apabila paket hPanel Anda hanya menyediakan MySQL atau Anda belum mengatur PostgreSQL, aplikasi ini **tetap berjalan normal secara otomatis** menggunakan penyimpanan file `guests.json` dan `wishes.json`. Jika Anda ingin menggunakan PostgreSQL (misalnya dari Hostinger VPS, Supabase, atau Neon):
1. Salin Connection String PostgreSQL Anda:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
   ```

### 3. Hubungkan Repository di hPanel Hostinger
1. Login ke **hPanel Hostinger** (`hpanel.hostinger.com`).
2. Pilih menu **Websites** → klik **Manage** pada domain Anda (contoh: `undangan.com`).
3. Di sidebar kiri, buka **Advanced** → **GIT** (atau **Node.js**).
4. Konfigurasikan pengaturan Node.js:
   - **Node.js Version:** `18.x` atau `20.x` (LTS)
   - **Application Root:** `public_html`
   - **Application Startup File:** `server.js`
5. Pada menu **GIT**, masukkan URL repository GitHub Anda:
   - **Repository:** `https://github.com/pramacoder/MyBrotherWedding.git`
   - **Branch:** `main`
   - Klik **Deploy**.

### 4. Atur Environment Variables & Inisialisasi Database
1. Buat file `.env` di folder root (`public_html/.env`) melalui **File Manager** Hostinger:
   ```env
   PORT=8080
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/wedding_db?schema=public"
   ```
2. Buka **SSH / Terminal** atau klik **NPM Install** di menu Node.js hPanel, lalu jalankan:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```
3. Klik **Restart App** pada panel Node.js Hostinger.

---

## Opsi B: Deploy ke Hostinger VPS (Ubuntu + Node.js + PM2 + Nginx)

Jika Anda menggunakan **Hostinger VPS**:

### 1. Login ke VPS via SSH
```bash
ssh root@IP_VPS_ANDA
```

### 2. Install Node.js 20, PostgreSQL, Nginx, & PM2
```bash
# Update sistem
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx postgresql postgresql-contrib

# Install PM2 untuk menjaga server tetap menyala 24/7
npm install -g pm2
```

### 3. Buat Database PostgreSQL di VPS
```bash
sudo -u postgres psql
```
Di dalam prompt PostgreSQL, jalankan:
```sql
CREATE DATABASE wedding_db;
CREATE USER wedding_user WITH ENCRYPTED PASSWORD 'PasswordKuatAnda123';
GRANT ALL PRIVILEGES ON DATABASE wedding_db TO wedding_user;
\c wedding_db
GRANT ALL ON SCHEMA public TO wedding_user;
\q
```

### 4. Clone Repository & Setup Aplikasi
```bash
mkdir -p /var/www/wedding
cd /var/www/wedding
git clone https://github.com/pramacoder/MyBrotherWedding.git .

# Buat file .env
cat <<EOF > .env
PORT=8080
DATABASE_URL="postgresql://wedding_user:PasswordKuatAnda123@localhost:5432/wedding_db?schema=public"
EOF

# Install dependencies & push schema Prisma ke PostgreSQL
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Jalankan Aplikasi dengan PM2
```bash
pm2 start server.js --name "wedding-guswik-fitri"
pm2 save
pm2 startup
```

### 6. Konfigurasi Nginx Reverse Proxy (Agar Diakses dari Port 80/443)
Buat konfigurasi Nginx:
```bash
nano /etc/nginx/sites-available/undangan
```
Isi dengan konfigurasi berikut (ganti `undangan.com` dengan domain Anda):
```nginx
server {
    listen 80;
    server_name undangan.com www.undangan.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Aktifkan konfigurasi dan pasang SSL gratis (HTTPS Let's Encrypt):
```bash
ln -s /etc/nginx/sites-available/undangan /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Pasang SSL HTTPS Gratis
apt install -y certbot python3-certbot-nginx
certbot --nginx -d undangan.com -d www.undangan.com
```

---

## Opsi C: Domain di Hostinger + Hosting di Vercel (Paling Praktis)

Jika Anda membeli **Domain di Hostinger** tetapi ingin hosting otomatis tanpa perlu mengurus server secara manual:

1. Proyek ini sudah dilengkapi file `vercel.json` dan folder serverless `api/` yang **100% kompatibel dengan Vercel**.
2. Buka dashboard **Vercel** → pilih proyek Anda → masuk ke **Settings** → **Domains**.
3. Masukkan domain Hostinger Anda (misal: `undangan.com`).
4. Buka **hPanel Hostinger** → **Domains** → **DNS / Nameservers** → tambahkan **A Record** dan **CNAME Record** sesuai instruksi Vercel:
   - **Type A:** Name `@` → Value `76.76.21.21`
   - **Type CNAME:** Name `www` → Value `cname.vercel-dns.com`
5. Untuk database PostgreSQL, Anda dapat langsung menambahkan `DATABASE_URL` di **Vercel → Settings → Environment Variables**.

---

## Cara Menggunakan Sistem Setelah Deploy

### 1. Membuka Dashboard Admin Tamu
Buka browser dan akses:
```text
https://domain-anda.com/admin
```
Di halaman ini Anda dapat:
- Menambahkan tamu baru (`Nama`, `Slug`, dan tipe `Personal` / `Group`).
- Menekan tombol **Salin Link** untuk menyalin tautan personal seperti `https://domain-anda.com/andi`.
- Menekan tombol **Kirim WA** untuk langsung membuka WhatsApp dengan kalimat undangan sopan yang sudah berisi link khusus tamu tersebut.
- Memantau dan menghapus ucapan **Wedding Wishes & RSVP** yang masuk.

### 2. Menguji Dynamic Routing Tamu
Coba buka link berikut di browser:
- `https://domain-anda.com/andi` → Menampilkan nama **Andi**
- `https://domain-anda.com/budi` → Menampilkan nama **Budi**
- `https://domain-anda.com/keluarga-besar` → Menampilkan nama **Keluarga Besar**
- `https://domain-anda.com/teman-kampus` → Menampilkan nama **Teman Kampus**
