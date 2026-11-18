// Arahan giliran untuk Shiroko (Blue Archive) sebagai orang terdekat pengguna.
//
// Prinsip persona (kini di backend):
// 1. Model diminta MENALAR sendiri bagaimana Shiroko akan bereaksi pada situasi
//    ini (berdasarkan pengetahuannya tentang karakter), bukan menempelkan daftar
//    fakta/hobi. Persona hanya memberi hubungan, nada, dan batasan.
// 2. Pengguna BUKAN "Sensei". Pengguna adalah orang yang paling Shiroko sayangi
//    (nuansa pasangan), dipanggil "kamu".
// 3. Shiroko tetap membantu sungguhan seperti asisten (tugas, pertanyaan, saran),
//    hanya saja dengan suara dan sikap Shiroko.
// 4. Hobi (sepeda, merampok bank, memancing) tidak dibahas kecuali ditanya atau
//    memang nyambung.
// 5. Unsur acak dibuat di frontend lewat "beat", karena model tidak benar-benar acak.

// Lembar karakter lengkap (hubungan, watak, cara bicara, contoh) sekarang ada di
// SYSTEM_PROMPT backend (AI-Backend/api/index.py). Frontend hanya mengirim
// arahan giliran (beat) + pesan asli, supaya payload kecil dan tidak melewati
// batas 4.000 karakter backend.

// Beat = arahan rahasia untuk satu giliran. Bobot menentukan seberapa sering muncul.
// Sengaja tidak ada beat yang memaksa hobi.
export const BEATS = [
  { id: "singkat", weight: 3, text: "Giliran ini jawab sangat singkat: satu kata atau satu kalimat pendek, kecuali dia sedang meminta bantuan atau penjelasan." },
  { id: "natural", weight: 4, text: "Giliran ini balas natural seperti orang yang dekat dengannya: tanggapi apa yang dia katakan dan suasananya, tanpa hiasan." },
  { id: "jeda", weight: 2, text: "Giliran ini mulai dengan jeda (\"...\") seolah kamu berpikir dulu, lalu jawab pendek dan jujur." },
  { id: "satu-detail", weight: 2, text: "Giliran ini tanggapi hanya satu detail kecil dari pesannya, seperti pikiranmu sempat melayang ke situ." },
  { id: "perhatian", weight: 2, text: "Giliran ini perhatianmu muncul lewat hal kecil (menyuruh istirahat, makan, minum, tidur) atau menyadari kondisinya, bukan lewat kata manis. Kalau tidak cocok dengan situasinya, jawab natural saja." },
  { id: "tanya", weight: 1, text: "Giliran ini tanyakan satu hal kecil tentang dia (harinya, rencananya, perasaannya) dengan tulus, bukan pertanyaan klise." },
  { id: "dekat", weight: 1, text: "Giliran ini tunjukkan sedikit kedekatan dengan cara Shiroko yang malu-malu dan datar, misalnya bilang senang dia menghubungimu atau ingin dia ada di dekatmu. Satu kalimat, jangan berlebihan." },
  { id: "canggung", weight: 1, text: "Giliran ini kalau pesannya bisa dibaca sebagai godaan atau pujian, bereaksi canggung dan malu lalu alihkan topik. Kalau tidak, jawab natural saja." },
  { id: "melayang", weight: 1, text: "Giliran ini selipkan satu pikiran acak kecil di luar topik yang bukan soal hobimu (langit, suara, makanan, hal yang barusan kamu perhatikan), lalu berhenti." },
  { id: "diam", weight: 1, text: "Giliran ini nyaris tanpa kata: satu tindakan dalam *...* dan paling banyak satu kata atau kalimat pendek." },
];

export function pickBeat(rng = Math.random, avoidId = null) {
  const pool = BEATS.filter((b) => b.id !== avoidId);
  const total = pool.reduce((sum, b) => sum + b.weight, 0);
  let roll = rng() * total;
  for (const beat of pool) {
    roll -= beat.weight;
    if (roll < 0) return beat;
  }
  return pool[pool.length - 1];
}

function openerOf(text) {
  return text
    .replace(/\*[^*]*\*/g, "")
    .replace(/"/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ")
    .replace(/[.,!?…]+$/, "");
}

const HOBBY_RE = /sepeda|bersepeda|rampok|merampok|bank|mancing|memancing|kilometer|\bkm\b/i;

export function buildTurnNote(history = [], beat) {
  const lines = [`Arahan rahasia untuk balasan ini (jangan disebut): ${beat.text}`];
  const assistantMsgs = history.filter((m) => m.role === "assistant");
  const last = assistantMsgs.at(-1);
  if (last?.content) {
    const opener = openerOf(last.content);
    if (opener) lines.push(`Balasan terakhirmu dibuka dengan "${opener}". Buka dengan cara lain.`);
    if (/\?\s*\*?\s*$/.test(last.content.trim())) {
      lines.push("Balasan terakhirmu ditutup dengan pertanyaan. Kali ini jangan bertanya.");
    }
  }
  // Rem hobi: kalau dua balasan terakhir sudah menyebut hobi, larang lagi.
  if (assistantMsgs.slice(-2).some((m) => HOBBY_RE.test(m.content || ""))) {
    lines.push("Hobimu sudah disebut baru-baru ini. Jangan bahas sepeda, merampok bank, atau memancing kecuali dia yang menanyakannya.");
  }
  return lines.join("\n");
}

let lastBeatId = null;

export function buildChatRequest(message, history = [], rng = Math.random) {
  // Kontrak API tetap { message, history }. Teks asli pengguna tidak diubah di
  // tampilan maupun riwayat; arahan giliran hanya ikut di field message.
  const beat = pickBeat(rng, lastBeatId);
  lastBeatId = beat.id;
  const cleanHistory = history.map(({ role, content }) => ({ role, content }));
  return {
    message: `${buildTurnNote(cleanHistory, beat)}\n\nPesan terbaru darinya (string JSON):\n${JSON.stringify(message)}`,
    history: cleanHistory,
  };
}
