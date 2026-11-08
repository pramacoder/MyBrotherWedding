# design.md — Undangan Pernikahan Guswik & Fitri

> Sistem desain untuk website undangan. Fokus: **page awal** (cover bergaya kertas surat di atas ilustrasi gapura Bali) + token dasar untuk page berikutnya.
> Pasangan dokumen: [`animation.md`](./animation.md). Semua ID di bawah (mis. `DS-21`) bisa dicari dengan Ctrl+F dan dirujuk dari `animation.md`.

## Daftar isi

| ID | Modul | Isi singkat |
|---|---|---|
| DS-00 | Prinsip & asumsi | Arah visual, hal yang sengaja tidak ditiru |
| DS-10 | Warna | Token CSS, peran warna, kontras |
| DS-20 | Tipografi | `@font-face`, skala, aturan pemakaian font |
| DS-30 | Stage & responsif | Ukuran kanvas, safe area, breakpoint |
| DS-40 | Layer & aset | Urutan z-index, penempatan PNG, manifest aset |
| DS-50 | Komponen kertas surat | CSS kertas, teks, bayangan daun, tinta |
| DS-60 | Layout page awal | Wireframe, posisi tiap elemen |
| DS-70 | Page berikutnya | Token ringkas (cokelat-emas) agar konsisten |
| DS-80 | Aksesibilitas & performa | Kontras, alt text, ukuran file |
| DS-99 | Pertanyaan terbuka | Hal yang perlu dikonfirmasi |

---

## DS-00 Prinsip & asumsi

**Arah visual:** hangat, tropis, dan bersahaja. Ilustrasi gapura Bali (krem, emas, hijau daun) menjadi panggung, sedangkan kertas surat menjadi satu-satunya titik fokus.

**Sengaja tidak ditiru 1:1 dari video referensi**
- Palet ungu-magenta dan ilustrasi air terjun/pura dari video tidak dipakai. Palet diambil dari `Background.jpg` dan `card.png`.
- Font dan susunan teks video ("THE WEDDING OF / nama") diganti kertas surat dengan tulisan tangan terakota.
- Yang **dipertahankan** adalah gaya geraknya (lihat `animation.md`, A-01): wash-to-clear, dedaunan tumbuh dari tepi, tulisan nama seperti ditulis tangan, lalu idle yang tenang.

**Asumsi yang dipakai (ubah bila keliru)**

| # | Asumsi | Dampak |
|---|---|---|
| 1 | Page awal memakai palet `Background.jpg` + `card.png`; page berikutnya memakai cokelat tua + emas dari template | DS-10, DS-70 |
| 2 | Kertas dibuat dengan CSS, bukan memakai `card.png` utuh | DS-50 |
| 3 | File font `pfchampionscriptpro` tersedia sebagai `.woff2`/`.otf` | DS-20 |
| 4 | Stack bebas; kode contoh berupa HTML + CSS + JS biasa (GSAP opsional) | DS-30 |
| 5 | Peran tiap PNG di DS-40 adalah usulan berdasarkan nama file; sesuaikan setelah melihat isinya | DS-40 |

---

## DS-10 Warna

### DS-11 Token

```css
:root {
  /* Netral hangat — dari Background.jpg */
  --cream-50:  #FBF3E4;  /* latar halaman */
  --cream-100: #F6E7D0;  /* langit ilustrasi */
  --peach-200: #EBC9A0;  /* kabut dedaunan peach */
  --sage-300:  #B9BCA8;  /* siluet palem */
  --stone-500: #8D775F;  /* batu gapura */

  /* Emas — pita atas & penjor */
  --gold-300: #E3B766;   /* highlight, shimmer */
  --gold-500: #C58A3C;   /* emas utama */
  --gold-700: #A8732F;   /* emas bayangan */

  /* Tropis — dedaunan depan */
  --leaf-600: #3F7A3A;
  --leaf-800: #2C5230;
  --coral-500: #C4474B;  /* bunga merah */

  /* Kertas surat — dari card.png */
  --paper:      #F4EFE6;
  --paper-edge: #E6DED0;
  --ink-terracotta: #B84A2A;  /* tulisan tangan nama */
  --ink-tagline:    #6B4A33;  /* tagline kecil */

  /* Cokelat — dari template (page berikutnya, teks) */
  --cocoa-900: #2B1D14;
  --cocoa-800: #3B2A1E;
  --cocoa-600: #5A4332;
}
```

### DS-12 Peran warna

| Peran | Token | Catatan |
|---|---|---|
| Latar halaman / fallback bg | `--cream-50` | Tampil sebelum gambar termuat |
| Tulisan nama di kertas | `--ink-terracotta` | Hanya untuk judul halaman pertama |
| Tagline & label kecil | `--ink-tagline` | Hindari hitam murni |
| Tombol utama | isi `--cocoa-800`, teks `--cream-50`, garis `--gold-500` | |
| Aksen/ornamen | `--gold-500` → `--gold-300` (gradasi) | Jangan dipakai untuk teks panjang |

### DS-13 Kontras (target WCAG AA)
- `--ink-terracotta` di atas `--paper`: sekitar 5:1, aman untuk teks besar (≥ 28px).
- `--ink-tagline` di atas `--paper`: > 7:1.
- Teks krem di atas `--cocoa-800`: > 10:1.

---

## DS-20 Tipografi

### DS-21 Keluarga font

| Peran | Font | Dipakai di |
|---|---|---|
| **Judul page pertama** | `'pfchampionscriptpro-regular', sans-serif` | **Hanya** "Guswik & Fitri" di kertas |
| Heading page lain | `'Playfair Display', serif` | Judul bagian, huruf kapital berspasi |
| Teks isi & tagline | `'Cormorant Garamond', serif` | Paragraf, tagline, label |
| Aksen script (opsional) | `'Pinyon Script', cursive` | Sub-judul seperti "Kindly RSVP" |

```css
@font-face {
  font-family: 'pfchampionscriptpro-regular';
  src: url('/assets/fonts/pfchampionscriptpro-regular.woff2') format('woff2'),
       url('/assets/fonts/pfchampionscriptpro-regular.otf')   format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-cover:   'pfchampionscriptpro-regular', sans-serif; /* hanya judul page pertama */
  --font-display: 'Playfair Display', serif;
  --font-body:    'Cormorant Garamond', serif;
  --font-accent:  'Pinyon Script', cursive;
}
```

### DS-22 Skala (mobile 390 px)

| Gaya | Font | Ukuran | Letter-spacing | Warna |
|---|---|---|---|---|
| Nama (cover) | `--font-cover` | `clamp(40px, 13vw, 58px)` | 0 | `--ink-terracotta` |
| "&" (cover) | `--font-cover` | 0.7× nama | 0 | `--ink-terracotta` |
| Eyebrow (opsional) | `--font-body`, uppercase | 11px | 0.30em | `--ink-tagline` |
| Tagline | `--font-body`, italic | 12px | 0.12em | `--ink-tagline` |
| Tombol | `--font-body`, uppercase, 600 | 12px | 0.20em | `--cream-50` |
| H2 page lain | `--font-display`, uppercase | 24px | 0.12em | `--cocoa-800` |
| Isi | `--font-body` | 18px / 1.6 | 0 | `--cocoa-800` |

> Jika file font gagal dimuat, `sans-serif` akan menampilkan nama dengan tampilan non-script. Bila ingin fallback tetap tampak seperti tulisan tangan, tambahkan `'Pinyon Script', cursive` sebelum `sans-serif`.

---

## DS-30 Stage & responsif

- **Rasio acuan:** `Background.jpg` = 1206 × 2576 px (≈ 9 : 19,2), cocok untuk ponsel portrait.
- Stage: `position: fixed; inset: 0; height: 100svh; overflow: hidden;`
- Background: `object-fit: cover; object-position: center top;` agar pita emas atas selalu terlihat.
- Padding aman: `env(safe-area-inset-*)` untuk poni/notch.

| Breakpoint | Perilaku |
|---|---|
| ≤ 480 px | Layout acuan (DS-60) |
| 481–1024 px | Stage dibatasi `max-width: 480px`, tengah; sisi kiri-kanan diisi `--cream-50` + blur dari background |
| > 1024 px | Sama dengan tablet; tampilan ala "ponsel di tengah layar" |

---

## DS-40 Layer & aset

### DS-41 Urutan layer (belakang → depan)

| z | ID | Isi | Catatan |
|---|---|---|---|
| 0 | `L0-bg` | `Background.jpg` | Dasar; sudah memuat pita emas, gapura, penjor, daun |
| 5 | `L1-shine` | Gold shimmer di pita atas | Gradien `--gold-300`, `mix-blend-mode: overlay` |
| 10 | `L2-fg-back` | `FG-BC` (rumpun tengah bawah) | Di belakang dua rumpun samping |
| 12 | `L3-fg-side` | `FG-BL`, `FG-BR` | Tumbuh dari sudut bawah |
| 14 | `L3b-drift` | Daun melayang | Maks. 5 elemen |
| 20 | `L4-paper` | Kertas surat | DS-50 |
| 22 | `L5-paper-flowers` | Bunga kecil di sudut kertas | Tumpang tindih tepi kertas |
| 24 | `L6-ink` | `ink.png` | Di tepi kanan-bawah kertas |
| 26 | `L7-ui` | Tombol "Buka Undangan" | |

### DS-42 Penempatan rumpun daun (usulan)

| ID | Aset | Posisi | Lebar | Transform-origin |
|---|---|---|---|---|
| `FG-BL` | `floral1.png` | `left:-14vw; bottom:-6vw` | 62vw | `0% 100%` |
| `FG-BR` | `floral4.png` | `right:-16vw; bottom:-8vw` | 66vw | `100% 100%` |
| `FG-BC` | `floralwithflower.png` | `left:50%; bottom:-10vw; translateX(-50%)` | 40vw | `50% 100%` |
| `FG-TL` *(opsional)* | `brunch.png` | `left:-6vw; top:-2vw` | 36vw | `0% 0%` |
| `FG-TR` *(opsional)* | `brunch1.png` | `right:-6vw; top:-2vw` | 36vw | `100% 0%` |

Rumpun depan sengaja melewati tepi layar agar terasa seperti tumbuh dari luar bingkai.

### DS-43 Manifest aset

Letakkan di `public/assets/` (semua PNG transparan; ekspor ulang ke WebP bila perlu).

| File | Peran | Layer / modul |
|---|---|---|
| `Background.jpg` | Latar page awal | `L0-bg` |
| `floral1.png`, `floral4.png`, `floralwithflower.png` | Rumpun depan | `L2`, `L3` |
| `floral2/3/5–9.png`, `floralwithflower2.png` | Cadangan / variasi rumpun; page berikutnya | DS-70 |
| `leave.png`, `leave1–7.png`, `leaves.png` | Daun melayang & percikan | `L3b-drift` |
| `whiteflowers.png`, `flower1–4.png`, `xposeflowers.png` | Bunga kecil di sudut kertas | `L5-paper-flowers` |
| `brunch.png`, `brunch1.png`, `brunchofleaves.png` | Ranting sudut atas / pembatas | `FG-TL/TR`, DS-70 |
| `bouquetofflowers.png`, `brunchofflowers.png` | Hiasan bagian RSVP / ucapan | DS-70 |
| `gapura1.png`, `temple.png`, `temple2.png` | Pembatas bagian, lokasi acara | DS-70 |
| `ink.png` | Tempat tinta + bulu pena di samping kertas | `L6-ink` |
| `card.png` | Referensi visual kertas; opsional sebagai varian foto | DS-50 |

Alt text: semua aset dekoratif memakai `alt=""` dan `aria-hidden="true"`.

---

## DS-50 Komponen kertas surat

### DS-51 Ukuran & posisi
- Rasio 2 : 3 (mengikuti `card.png`).
- Lebar: `min(58vw, 260px)`; pusat kertas di sekitar `42svh`.
- Rotasi diam: `-1.2deg`, supaya terasa diletakkan tangan.

### DS-52 Struktur HTML

```html
<article class="letter" aria-label="Undangan pernikahan Guswik dan Fitri">
  <p class="letter__eyebrow">The Wedding of</p>
  <h1 class="letter__names">
    <span class="w w--1">Guswik</span>
    <span class="w w--amp" aria-hidden="true">&amp;</span>
    <span class="w w--2">Fitri</span>
  </h1>
  <p class="letter__tagline">Two hearts, one forever</p>
  <span class="letter__leafshadow" aria-hidden="true"></span>
</article>
```

### DS-53 CSS

```css
.letter {
  position: absolute; left: 50%; top: 42svh;
  width: min(58vw, 260px); aspect-ratio: 2 / 3;
  transform: translate(-50%, -50%) rotate(-1.2deg);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: .2em; text-align: center;
  background:
    linear-gradient(135deg, rgba(255,255,255,.55), rgba(255,255,255,0) 45%),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 .4  0 0 0 0 .33  0 0 0 0 .25  0 0 0 .07 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"),
    var(--paper);
  border-radius: 2px;
  box-shadow:
    0 1px 0 var(--paper-edge) inset,
    0 2px 4px rgba(43,29,20,.18),
    0 14px 28px -8px rgba(43,29,20,.35),
    0 30px 50px -20px rgba(43,29,20,.30);
  overflow: hidden;
}

.letter__eyebrow {
  font: 400 11px/1 var(--font-body); letter-spacing: .30em;
  text-transform: uppercase; color: var(--ink-tagline); margin: 0 0 1.2em;
}

.letter__names {
  margin: 0; font: 400 clamp(40px, 13vw, 58px)/.95 var(--font-cover);
  color: var(--ink-terracotta);
  display: flex; flex-direction: column; align-items: center;
}
.letter__names .w { display: inline-block; }
.letter__names .w--amp { font-size: .7em; margin: .05em 0; }

.letter__tagline {
  margin: 1.6em 0 0; font: italic 400 12px/1.2 var(--font-body);
  letter-spacing: .12em; color: var(--ink-tagline);
}

/* bayangan daun di permukaan kertas (meniru cahaya dari card.png) */
.letter__leafshadow {
  position: absolute; inset: -10% -10% auto auto; width: 90%; aspect-ratio: 1;
  background: url('/assets/leave3.png') center / contain no-repeat;
  filter: brightness(0) blur(7px); opacity: .10;
  mix-blend-mode: multiply; transform: rotate(18deg);
  pointer-events: none;
}
```

### DS-54 Bunga & tinta di sekitar kertas

| Elemen | Aset | Posisi relatif ke kertas | Ukuran |
|---|---|---|---|
| Bunga kiri-atas | `whiteflowers.png` | `top:-6%; left:-14%` | 34% lebar kertas |
| Bunga kanan-bawah | `flower2.png` | `bottom:-4%; right:-12%` | 30% |
| Ranting kiri-bawah | `flower4.png` | `bottom:6%; left:-16%` | 24% |
| Tinta & pena | `ink.png` | `bottom:-8%; right:-22%`, rotasi `8deg` | 16vw |

Bunga tumpang tindih tepi kertas agar terkesan menindih surat, seperti di `card.png`.

### DS-55 Tombol
Tombol pil di bawah kertas, tengah: label **"Buka Undangan"**, isi `--cocoa-800`, garis 1 px `--gold-500`, tinggi 44 px, radius 999 px, padding horizontal 28 px.

---

## DS-60 Layout page awal

```
┌──────────────────────────┐  ← L0 pita emas (bagian dari Background.jpg)
│ ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ │
│ palem          palem     │
│     ┌──────────────┐     │  ← kertas: pusat di 42svh
│  🌼 │  THE WEDDING │     │
│     │      OF      │     │
│     │   Guswik     │     │
│     │      &       │     │
│     │    Fitri     │  🖋 │  ← ink.png
│     │ Two hearts,  │     │
│     │ one forever  │     │
│     └──────────────┘     │
│     [ Buka Undangan ]    │  ← tombol di ±72svh
│  gapura ░░░░░░ gapura    │  ← dasar gapura tetap terlihat
│ 🌿🌿🌿  bunga  🌿🌿🌿   │  ← rumpun depan (FG-BL/BC/BR)
└──────────────────────────┘
```

Aturan: kertas tidak menutupi bagian bawah gapura dan jalan setapak, sebab area itu dipakai pada transisi "Buka Gapura" (`animation.md`, A-30).

---

## DS-70 Page berikutnya (ringkas)

Agar transisi dari cover terasa menyatu, page berikutnya memakai cokelat-emas dari template.

| Elemen | Aturan |
|---|---|
| Latar bagian gelap | `--cocoa-800`, teks `--cream-50` |
| Panel isi (cerita, form) | `--paper` dengan bingkai ornamen emas `--gold-500` |
| Heading | `--font-display`, huruf kapital berspasi, warna `--gold-300` di atas gelap |
| Sub-judul script | `--font-accent`, `--gold-300` |
| Ornamen daun | `floral*` dengan opacity 0,9 di sudut panel; `bouquetofflowers` untuk RSVP |
| Pembatas bagian | `gapura1` / `temple2` ukuran kecil, tengah, opacity 0,85 |

Bagian yang diperkirakan ada (mengikuti template): kalender acara, timeline hari-H, hitung mundur, RSVP, ucapan tamu. Rinciannya dibuat setelah cakupan dikonfirmasi (DS-99).

---

## DS-80 Aksesibilitas & performa

- Satu `<h1>` saja: nama mempelai. Eyebrow dan tagline berupa `<p>`.
- Tombol "Buka Undangan" adalah `<button>` sungguhan, fokus terlihat: `outline: 2px solid var(--gold-300); outline-offset: 3px`.
- Bila `prefers-reduced-motion: reduce`, gerak diganti fade singkat (lihat `animation.md`, A-50).
- Berat target page awal: `Background.jpg` → WebP ≤ 350 KB; tiap PNG daun → WebP ≤ 120 KB; total aset cover ≤ 1,5 MB.
- `<link rel="preload">` untuk background dan file font judul.
- Ukuran asli aset dipakai ≤ 2× ukuran tampil (retina), tidak lebih.

---

## DS-99 Pertanyaan terbuka

1. Apakah teks eyebrow "The Wedding of" dipertahankan atau dihapus agar kertas hanya berisi "Guswik & Fitri" dan tagline?
2. Apakah cakupan website mencakup semua bagian template (kalender, timeline, hitung mundur, RSVP, ucapan)?
3. Apakah ada nama tamu dinamis (mis. `?to=Nama Tamu`) yang perlu ditampilkan di cover?
4. Apakah akan ada musik latar dengan tombol mute?
5. Isi tiap PNG belum terlihat satu per satu; penempatan di DS-42 dan DS-54 perlu disesuaikan setelah dicek.
