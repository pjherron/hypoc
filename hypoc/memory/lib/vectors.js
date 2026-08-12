// Scheme-append breadth + screening primitives (T5).
//
// A scheme is a named-vector embedding of the same artifact. The `content`
// scheme is the stock embedder's output; the `lexical` scheme is a
// deterministic hashed character n-gram transform — a genuinely different
// scheme computed post-inference, with no new model trained. Screening is a
// metric-driven per-corpus pass: it scores each dimension across the corpus
// and zeroes the non-information-bearing tail, so the screened representation
// (not the full-precision copy) is the stored one.

export function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.codePointAt(i);
  }
  return hash >>> 0;
}

// Deterministic hashed character n-gram vector (counts), size dims.
// Same text always yields the same vector; no randomness, no model.
export function lexicalVector(text, size) {
  const counts = new Array(size).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return counts;
  const grams = new Set();
  for (let n = 2; n <= 3; n += 1) {
    for (let i = 0; i + n <= normalized.length; i += 1) {
      const gram = normalized.slice(i, i + n);
      if (gram.includes(" ")) continue;
      grams.add(gram);
    }
  }
  for (const gram of grams) {
    counts[djb2(gram) % size] += 1;
  }
  return counts;
}

// Per-dimension score for a corpus of equal-length vectors.
function dimensionScores(vectors, rule) {
  const dims = vectors[0]?.length ?? 0;
  const scores = new Array(dims).fill(0);
  if (rule === "none") return scores;
  for (const vector of vectors) {
    for (let j = 0; j < dims; j += 1) {
      const value = vector[j];
      if (rule === "energy") {
        scores[j] += value * value;
      } else if (rule === "variance") {
        scores[j] += value;
      }
    }
  }
  if (rule === "variance" && vectors.length > 1) {
    const mean = scores.map((sum) => sum / vectors.length);
    const variance = new Array(dims).fill(0);
    for (const vector of vectors) {
      for (let j = 0; j < dims; j += 1) {
        const diff = vector[j] - mean[j];
        variance[j] += diff * diff;
      }
    }
    return variance;
  }
  return scores;
}

// Deterministic per-corpus screening rule: keep the top keepFraction
// information-bearing dimensions by score, tie-broken by index. Returns a
// boolean mask (true = dimension retained).
export function screenMask(vectors, { rule, keepFraction }) {
  const dims = vectors[0]?.length ?? 0;
  if (rule === "none" || dims === 0) {
    return new Array(dims).fill(true);
  }
  const scores = dimensionScores(vectors, rule);
  const order = scores.map((score, index) => ({ score, index }));
  order.sort((a, b) => b.score - a.score || a.index - b.index);
  const keep = Math.max(1, Math.min(dims, Math.round(keepFraction * dims)));
  const mask = new Array(dims).fill(false);
  for (let i = 0; i < keep; i += 1) {
    mask[order[i].index] = true;
  }
  return mask;
}

// Zero out the dimensions a mask discards. The screened vector is the stored
// representation; full precision is never kept.
export function applyMask(vector, mask) {
  if (!mask || mask.length !== vector.length) return vector.slice();
  return vector.map((value, index) => (mask[index] ? value : 0));
}
