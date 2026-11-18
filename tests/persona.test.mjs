import test from "node:test";
import assert from "node:assert/strict";
import { buildChatRequest, BEATS, pickBeat, buildTurnNote } from "../src/persona.js";

const MARK = "Pesan terbaru darinya (string JSON):\n";

test("request keeps the message/history contract without modifying history", () => {
  const history = Object.freeze([
    Object.freeze({ role: "user", content: "Halo, Shiroko." }),
    Object.freeze({ role: "assistant", content: "Mau jalan sebentar?" }),
  ]);
  const payload = buildChatRequest('Aku capek.\nBisa temani "sebentar"?', history);
  assert.deepEqual(Object.keys(payload).sort(), ["history", "message"]);
  assert.deepEqual(payload.history, history);
  assert.notEqual(payload.history, history);
  assert.equal(
    JSON.parse(payload.message.split(MARK).at(-1)),
    'Aku capek.\nBisa temani "sebentar"?',
  );
});

test("payload stays small: backend holds the full persona", () => {
  const payload = buildChatRequest("x".repeat(400), []);
  assert.ok(payload.message.length < 1200, `too long: ${payload.message.length}`);
});

test("pickBeat respects weights, never repeats the avoided beat", () => {
  assert.equal(pickBeat(() => 0).id, BEATS[0].id);
  assert.equal(pickBeat(() => 0.999999).id, BEATS.at(-1).id);
  for (let i = 0; i < 200; i += 1) {
    assert.notEqual(pickBeat(Math.random, "singkat").id, "singkat");
  }
});

test("turn note blocks repeated opener and trailing question", () => {
  const note = buildTurnNote(
    [{ role: "assistant", content: "Nn. Mau ikut jalan?" }],
    BEATS[0],
  );
  assert.match(note, /dibuka dengan "Nn\. Mau"/);
  assert.match(note, /jangan bertanya/);
  assert.doesNotMatch(buildTurnNote([], BEATS[0]), /dibuka dengan/);
});

test("beats never force hobbies and hobby brake kicks in after a mention", () => {
  assert.ok(BEATS.every((b) => !/sepeda|rampok|mancing/i.test(b.text)));
  assert.ok(BEATS.every((b) => !/Sensei/.test(b.text)));
  const note = buildTurnNote(
    [{ role: "assistant", content: "Aku baru selesai sepeda." }],
    BEATS[0],
  );
  assert.match(note, /Jangan bahas sepeda/);
  assert.doesNotMatch(
    buildTurnNote([{ role: "assistant", content: "Hai." }], BEATS[0]),
    /Jangan bahas sepeda/,
  );
});
