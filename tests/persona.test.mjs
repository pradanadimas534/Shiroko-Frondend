import test from "node:test";
import assert from "node:assert/strict";
import { buildChatRequest, SHIROKO_PERSONA } from "../src/persona.js";

test("persona uses the existing message/history contract without modifying history", () => {
  const history = Object.freeze([
    Object.freeze({ role: "user", content: "Halo, Shiroko." }),
    Object.freeze({
      role: "assistant",
      content: "Mau jalan sebentar?",
    }),
  ]);
  const payload = buildChatRequest(
    'Aku capek.\nBisa temani "sebentar"?',
    history,
  );
  assert.deepEqual(Object.keys(payload).sort(), ["history", "message"]);
  assert.deepEqual(payload.history, history);
  assert.notEqual(payload.history, history);
  assert.ok(payload.message.startsWith(SHIROKO_PERSONA));
  assert.equal(
    JSON.parse(payload.message.split("Pesan terbaru darinya (string JSON):\n").at(-1)),
    'Aku capek.\nBisa temani "sebentar"?',
  );
});

test("each turn carries one style request without accumulating earlier copies", () => {
  const first = buildChatRequest("Hai.", []);
  const next = buildChatRequest("Mau bersepeda?", [
    { role: "user", content: "Hai." },
  ]);
  for (const payload of [first, next]) {
    assert.equal(payload.message.split(SHIROKO_PERSONA).length - 1, 1);
    assert.ok(
      payload.history.every(
        ({ content }) => !content.includes(SHIROKO_PERSONA),
      ),
    );
  }
});

import { BEATS, pickBeat, buildTurnNote } from "../src/persona.js";

test("pickBeat respects weights, never repeats the avoided beat", () => {
  assert.equal(pickBeat(() => 0).id, BEATS[0].id);
  assert.equal(pickBeat(() => 0.999999).id, BEATS.at(-1).id);
  for (let i = 0; i < 200; i += 1) {
    assert.notEqual(pickBeat(Math.random, "singkat").id, "singkat");
  }
});

test("turn note blocks repeated opener and trailing question", () => {
  const note = buildTurnNote(
    [{ role: "assistant", content: "Nn. Mau ikut sepedaan?" }],
    BEATS[0],
  );
  assert.match(note, /dibuka dengan "Nn\. Mau"/);
  assert.match(note, /jangan bertanya/);
  assert.doesNotMatch(buildTurnNote([], BEATS[0]), /dibuka dengan/);
});

test("persona no longer calls the user Sensei and holds back hobbies", () => {
  assert.match(SHIROKO_PERSONA, /jangan pernah memanggilnya Sensei/);
  assert.ok(BEATS.every((b) => !/sepeda|rampok/i.test(b.text)));
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

test("persona stays free of the structure markers it forbids", () => {
  assert.ok(!SHIROKO_PERSONA.includes("Pesan terbaru darinya (string JSON):"));
  assert.ok(BEATS.every((b) => !b.text.includes("Pesan terbaru darinya (string JSON):")));
});
