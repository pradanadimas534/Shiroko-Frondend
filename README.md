# Chat AI — Sunaookami Shiroko (Frontend)

Frontend React visual novel interaktif untuk mengobrol dengan Sunaookami Shiroko. Seluruh logika persona, system prompt, dan pemrosesan model AI berada di repositori backend API terpisah.

## Menjalankan di Lokal

```sh
npm install
npm run dev
```

- Build produksi: `npm run build`
- Menjalankan unit test frontend: `npm test`

## Fitur Frontend

- **Ekspresi Karakter (`public/expressions/`)**:
  - `Shiroko_01.png`: Ditampilkan saat kondisi **Idle / Diam** (menunggu pesan, selesai berbicara, atau saat menampilkan narasi `*...*`).
  - `Shiroko_02.png`: Ditampilkan otomatis **Saat Bicara** (selama animasi teks dialog berjalan).
- **Latar Ruangan Waktu *Real-Time* (`src/sceneTime.js`)**:
  - Latar ruangan Abydos otomatis menyesuaikan waktu lokal pengguna (`morning`, `day`, `evening`, `night-lit`, `night`).
- **Kotak Dialog Visual Novel (`src/dialogue.js`)**:
  - Memisahkan narasi dalam tanda bintang (`*...*`) dari dialog ucapan dan membagi balasan panjang ke beberapa halaman tanpa memotong kalimat.
- **Menu Pengaturan Ringkas**:
  - Tombol pengaturan di pojok kanan atas untuk membuka **Riwayat Chat** dan **Tentang AI**.

## Kontrak API Backend

Frontend mengirim `POST /api/chat` dengan payload murni tanpa injeksi prompt dari sisi klien:

```json
{
  "message": "Halo Shiroko",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Proxy development di `vite.config.js` mengarah ke `http://localhost:5000` (atau menggunakan variabel environment `VITE_API_BASE` pada produksi).
