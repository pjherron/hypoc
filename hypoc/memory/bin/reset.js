#!/usr/bin/env bun
// Reset the brain store (drop the collection). Test/diagnostic helper.

import { loadConfig } from "../lib/config.js";
import { clearCollection } from "../lib/brain.js";

const config = await loadConfig();
await clearCollection(config);
console.log(`# Cleared brain collection ${config.brain.collection}`);
