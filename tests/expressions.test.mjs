import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { expressionDataset } from "../src/expressionDataset.js";

test("only Shiroko_01 (idle) and Shiroko_02 (talking) sprites are configured and present", () => {
  const sprites = Object.values(expressionDataset);
  assert.equal(sprites.length, 2);
  assert.equal(expressionDataset.Neutral_Calm.file, "/expressions/Shiroko_01.png");
  assert.equal(expressionDataset.Mild_Surprise.file, "/expressions/Shiroko_02.png");

  for (const { file } of sprites) {
    assert.ok(existsSync(new URL(`../public${file}`, import.meta.url)), file);
  }

  const filesOnDisk = readdirSync(new URL("../public/expressions", import.meta.url)).sort();
  assert.deepEqual(filesOnDisk, ["Shiroko_01.png", "Shiroko_02.png"]);
});
