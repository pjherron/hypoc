// Screening rule persistence + calibration. The rule is empirical and
// recalibratable per corpus: `calibrateMasks` computes one mask per screened
// scheme from the current corpus; the mask is stored so every stored vector and
// every query is screened with the SAME mask (deterministic, consistent).
// Recalibrate deliberately with `bun bin/reindex.js --recalibrate`.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { screenMask, applyMask } from "./vectors.js";

const MEMORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function primaryScheme(config) {
  return config.brain.vectors[0].name;
}

export function maskFilePath(config) {
  const configured = config.brain.screen.mask_path;
  return path.isAbsolute(configured)
    ? configured
    : path.join(MEMORY_ROOT, configured);
}

export async function loadMasks(config) {
  const file = maskFilePath(config);
  try {
    const raw = JSON.parse(await readFile(file, "utf-8"));
    return raw?.schemes ?? {};
  } catch {
    return {};
  }
}

export async function saveMasks(config, schemes) {
  const file = maskFilePath(config);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ schemes }, null, 2), "utf-8");
}

// schemes: { name: floatVectors[] } for every configured scheme over the corpus.
// Returns { name: { size, rule, keep_fraction, mask } } for the screened ones.
export async function calibrateMasks(config, schemes) {
  const { enabled, rule, keep_fraction } = config.brain.screen;
  const result = {};
  for (const vectorConfig of config.brain.vectors) {
    if (!enabled || !vectorConfig.screen) continue;
    const corpus = schemes[vectorConfig.name] ?? [];
    if (corpus.length === 0) continue;
    result[vectorConfig.name] = {
      size: vectorConfig.size,
      rule,
      keep_fraction,
      mask: screenMask(corpus, { rule, keepFraction: keep_fraction }),
    };
  }
  return result;
}

// Screen a set of scheme vectors ({ name: floatVec }) with the stored masks.
// If no mask exists for a scheme (corpus not yet calibrated) it is passed
// through unchanged. Returns { vectors, calibrated } where calibrated is false
// when any configured screened scheme has no mask on disk.
export async function screenVectors(config, schemeVectors) {
  const masks = await loadMasks(config);
  const screened = {};
  let calibrated = true;
  for (const vectorConfig of config.brain.vectors) {
    const vector = schemeVectors[vectorConfig.name];
    if (!vector) continue;
    const entry = masks[vectorConfig.name];
    if (vectorConfig.screen && config.brain.screen.enabled) {
      if (entry && entry.mask && entry.mask.length === vector.length) {
        screened[vectorConfig.name] = applyMask(vector, entry.mask);
      } else {
        calibrated = false;
        screened[vectorConfig.name] = vector;
      }
    } else {
      screened[vectorConfig.name] = vector;
    }
  }
  return { vectors: screened, calibrated };
}
