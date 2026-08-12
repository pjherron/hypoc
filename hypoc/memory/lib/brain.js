// The brain store: Qdrant with named-vector schemes, each <=8-bit per
// dimension. Scheme-append breadth: every configured scheme is an optional
// named vector, so appending a scheme adds a column without rebuilding
// existing points. Full-precision vectors are used only transiently for the
// query and are never persisted; the screened, quantized representation is the
// stored one.

import { fetchWithRetry, uuidV5 } from "./util.js";

// Storage representation for the configured datatype. turbo4/float16/float32
// accept float vectors and Qdrant quantizes in-flight; uint8 needs a lossy
// manual [0,255] mapping (used by the lexical scheme).
export function toStorageVector(vector, datatype) {
  if (datatype === "uint8") {
    let min = Infinity;
    let max = -Infinity;
    for (const value of vector) {
      if (value < min) min = value;
      if (value > max) max = value;
    }
    const range = max - min || 1;
    return vector.map((value) => Math.round(((value - min) / range) * 255));
  }
  return vector;
}

async function request(config, path, init, operation) {
  const res = await fetchWithRetry(
    `${config.brain.qdrant_url}${path}`,
    { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } },
    { retry: config.retry, operation },
  );
  return res;
}

function collectionVectors(config) {
  const vectors = {};
  for (const vector of config.brain.vectors) {
    vectors[vector.name] = {
      size: vector.size,
      distance: vector.distance,
      datatype: vector.datatype,
      on_disk: vector.on_disk,
      // Optional named vectors are what make scheme-append decoupled: a point
      // may carry any subset, so reindexing one scheme never rebuilds others.
      optional: true,
    };
  }
  return vectors;
}

export async function ensureCollection(config) {
  const name = config.brain.collection;

  const getRes = await request(config, `/collections/${name}`, {}, "qdrant_get_collection");
  if (getRes.status === 200) {
    // Collection exists. Append any configured scheme that is missing without
    // touching unrelated vectors (Qdrant merges new named vectors in place).
    const existing = await getRes.json();
    const existingVectors = existing.result?.config?.params?.vectors ?? {};
    const configured = collectionVectors(config);
    const missing = {};
    for (const [schemeName, params] of Object.entries(configured)) {
      if (!existingVectors[schemeName]) missing[schemeName] = params;
    }
    if (Object.keys(missing).length > 0) {
      const updateRes = await request(
        config,
        `/collections/${name}`,
        { method: "PATCH", body: JSON.stringify({ vectors: missing }) },
        "qdrant_append_vectors",
      );
      if (!updateRes.ok) {
        throw new Error(`Qdrant append vectors failed (${updateRes.status}): ${await updateRes.text()}`);
      }
    }
    return;
  }
  if (getRes.status !== 404) {
    throw new Error(`Qdrant error (${getRes.status}): ${await getRes.text()}`);
  }

  const createRes = await request(
    config,
    `/collections/${name}`,
    {
      method: "PUT",
      body: JSON.stringify({ vectors: collectionVectors(config) }),
    },
    "qdrant_create_collection",
  );
  if (!createRes.ok) {
    throw new Error(`Qdrant create failed (${createRes.status}): ${await createRes.text()}`);
  }
}

export async function clearCollection(config) {
  const name = config.brain.collection;
  const delRes = await request(config, `/collections/${name}`, { method: "DELETE" }, "qdrant_delete_collection");
  if (!delRes.ok && delRes.status !== 404) {
    throw new Error(`Qdrant delete failed (${delRes.status}): ${await delRes.text()}`);
  }
}

// artifact: { artifactPath, title, sourceSession, text, vectors: { scheme: float } }
// Only the schemes provided are upserted (per-scheme reindexing stays
// decoupled thanks to optional named vectors).
export async function indexArtifact(config, artifact) {
  await ensureCollection(config);
  const id = uuidV5(artifact.artifactPath, config.ids.namespace_uuid);
  const vectors = {};
  for (const vectorConfig of config.brain.vectors) {
    const vector = artifact.vectors?.[vectorConfig.name];
    if (vector === undefined) continue;
    vectors[vectorConfig.name] = toStorageVector(vector, vectorConfig.datatype);
  }
  if (Object.keys(vectors).length === 0) {
    throw new Error(`indexArtifact: no scheme vectors provided for ${artifact.artifactPath}.`);
  }
  const point = {
    id,
    vector: vectors,
    payload: {
      artifact_path: artifact.artifactPath,
      source_session: artifact.sourceSession,
      title: artifact.title,
      text: artifact.text,
    },
  };
  const res = await request(
    config,
    `/collections/${config.brain.collection}/points?wait=true`,
    { method: "PUT", body: JSON.stringify({ points: [point] }) },
    "qdrant_upsert",
  );
  if (!res.ok) {
    throw new Error(`Qdrant upsert failed (${res.status}): ${await res.text()}`);
  }
  return id;
}

// queryVectors: { scheme: float } (screened). Search runs on the named scheme
// (default: the first configured scheme). Missing vectors for a point are
// skipped by Qdrant, which is what keeps per-scheme operations safe.
export async function search(config, queryVectors, limit, scheme) {
  await ensureCollection(config);
  const schemeName = scheme ?? config.brain.vectors[0].name;
  const queryVector = queryVectors[schemeName];
  if (!queryVector) {
    throw new Error(`search: no query vector for scheme "${schemeName}".`);
  }
  const res = await request(
    config,
    `/collections/${config.brain.collection}/points/search`,
    {
      method: "POST",
      body: JSON.stringify({
        vector: { name: schemeName, vector: queryVector },
        limit,
        with_payload: true,
        with_vectors: false,
      }),
    },
    "qdrant_search",
  );
  if (!res.ok) {
    throw new Error(`Qdrant search failed (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  return (json.result ?? []).map((item) => ({
    artifact_path: item.payload?.artifact_path ?? null,
    source_session: item.payload?.source_session ?? null,
    title: item.payload?.title ?? null,
    score: item.score,
  }));
}
