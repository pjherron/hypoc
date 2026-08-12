// Seam tests for the mnemonic spine (T1) and the tickets that extend it:
// T2 real-history sweep, T3 auto warm-start, T4 manual escape hatches, and T5
// scheme-append + screening. External behavior only: every test drives the CLIs
// and asserts on their output. Internals (store, embedder, dimensions,
// datatypes, masks) are never asserted — the screening line IS external output
// of the reindex CLI, and a passing recall test is the proof of the seam.

import { beforeAll, afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const REPO = path.resolve(ROOT, "..");
const DECISIONS = path.join(ROOT, "decisions");
const FIXTURE_DB = path.join(ROOT, "fixtures", "session-db.sqlite3");
const STATE = path.join(ROOT, ".sweep-test-state.json");
const DRYRUN_STATE = path.join(ROOT, ".sweep-test-dryrun-state.json");

function runCli(binName, args) {
  const res = spawnSync("bun", [path.join(ROOT, "bin", binName), ...args], {
    encoding: "utf8",
    cwd: ROOT,
    timeout: 600_000,
  });
  if (res.status !== 0) {
    throw new Error(`${binName} failed (${res.status})\nstderr: ${res.stderr}`);
  }
  return res.stdout;
}

function recallLines(output) {
  return output.split("\n").filter((line) => line.startsWith("- "));
}

function decisionFiles() {
  return readdirSync(DECISIONS).filter((file) => file.endsWith(".md"));
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

beforeAll(() => {
  rmSync(STATE, { force: true });
  rmSync(DRYRUN_STATE, { force: true });
  runCli("reset.js", []);
  // Recalibrate the screening masks over the committed corpus, then index with
  // the screened representation. All recall tests below therefore run on
  // screened vectors.
  runCli("reindex.js", ["--recalibrate"]);
});

afterAll(() => {
  rmSync(STATE, { force: true });
  rmSync(DRYRUN_STATE, { force: true });
});

describe("distillation write path", () => {
  test("distilling a decision session produces a committed artifact with a source-session link", () => {
    const out = runCli("distill.js", [path.join(ROOT, "fixtures", "may-auth-decision.session.json")]);
    expect(out).toContain("DISTILLED");
    expect(out).toContain("source-session ses_may_auth_0001");

    const match = out.match(/DISTILLED (memory\/decisions\/\d{4}-\d{2}-\d{2}-[^\s]+\.md)/);
    expect(match).not.toBeNull();
    const artifactPath = match[1];
    expect(artifactPath).toContain("2026-05-14-");
    expect(decisionFiles()).toContain(path.basename(artifactPath));

    const content = readFileSync(path.join(REPO, artifactPath), "utf-8");
    expect(content).toContain("source-session: ses_may_auth_0001");
  }, 120_000);

  test("distilling a garbage session produces no artifact (write path rejects)", () => {
    const out = runCli("distill.js", [path.join(ROOT, "fixtures", "garbage.session.json")]);
    expect(out).toContain("NO_DECISION");
    expect(decisionFiles().some((file) => file.toLowerCase().includes("garbage"))).toBe(false);
  }, 120_000);
});

describe("recall seam", () => {
  test("a fixture-inspired query recalls the artifact, unsummoned, with its source-session", () => {
    const out = runCli("recall.js", ["how should user authentication and session tokens work"]);
    const lines = recallLines(out);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(5);

    expect(lines[0]).toContain("2026-05-14-api-authentication-method-decision.md");
    expect(lines[0]).toContain("source-session: ses_may_auth_0001");
  });

  test("a query about a past-dated topic returns that decision (readable contract)", () => {
    const out = runCli("recall.js", ["how do we deploy the web service to production"]);
    const lines = recallLines(out);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain("2026-06-09-web-service-deployment-strategy.md");
    expect(lines[0]).toContain("source-session: ses_jun_deploy_0002");
  });

  test("garbage distillation gives wrong-or-empty recall: no garbage in the brain", () => {
    const out = runCli("recall.js", ["qzx plork vamut 88413 nertle"]);
    const lines = recallLines(out);
    for (const line of lines) {
      expect(line).not.toContain("source-session: ses_garbage_0007");
    }
  });

  test("recalled count is bounded by the Miller default and configurable", () => {
    const broad = recallLines(runCli("recall.js", ["the team decided to ship which approach"]));
    expect(broad.length).toBeGreaterThan(0);
    expect(broad.length).toBeLessThanOrEqual(5);

    const two = recallLines(runCli("recall.js", ["the team decided to ship which approach", "--limit", "2"]));
    expect(two.length).toBeLessThanOrEqual(2);

    // A huge limit clamps to the Miller hard ceiling (9), never higher.
    const big = recallLines(runCli("recall.js", ["the team decided to ship which approach", "--limit", "99"]));
    expect(big.length).toBeGreaterThan(0);
    expect(big.length).toBeLessThanOrEqual(9);
  });
});

describe("consolidate sweep over real session records (T2)", () => {
  test("dry run lists closed sessions awaiting distillation without processing", () => {
    const out = runCli("sweep.js", ["--db", FIXTURE_DB, "--state", DRYRUN_STATE, "--closed-after", "0", "--dry-run"]);
    expect(out).toContain("ses_jun_garbage_0010");
    expect(out).toContain("ses_jul_cache_0011");
    expect(out).toContain("Dry run");
    expect(existsSync(DRYRUN_STATE)).toBe(false);
  });

  test("sweep distills closed sessions lacking an artifact, skips garbage, and tracks state", () => {
    const out = runCli("sweep.js", ["--db", FIXTURE_DB, "--state", STATE, "--closed-after", "0"]);
    expect(out).toContain("NO_DECISION ses_jun_garbage_0010");
    // ses_jul_cache_0011 must end up with a committed artifact (freshly
    // distilled, or confirmed-existing on a rerun of the suite).
    expect(decisionFiles().some((file) => file.includes("caching"))).toBe(true);

    const state = readJson(STATE);
    expect(Object.keys(state).sort()).toEqual(
      ["ses_jun_garbage_0010", "ses_jul_cache_0011", "ses_jun_rate_0009"].sort(),
    );
    expect(state.ses_jun_garbage_0010.status).toBe("no_decision");
    // ses_jul_cache_0011 ends up recallable either freshly distilled (first
    // run) or as a confirmed-existing artifact (reruns of the suite).
    expect(["indexed", "existing"]).toContain(state.ses_jul_cache_0011.status);
  }, 180_000);

  test("a decision made in a real past session is recallable through the seam after the sweep", () => {
    const out = runCli("recall.js", ["how should we cache API responses"]);
    const lines = recallLines(out);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain("2026-07-05-api-response-caching-strategy.md");
    expect(lines[0]).toContain("source-session: ses_jul_cache_0011");
  });

  test("rerunning the sweep distills nothing twice", () => {
    const out = runCli("sweep.js", ["--db", FIXTURE_DB, "--state", STATE, "--closed-after", "0"]);
    expect(out).toContain("# Sweep complete: 0 distilled");
    expect(out).toContain("0 candidates");
  });
});

describe("manual escape hatches (T4)", () => {
  test("/distill a named closed session with no decision reports NO_DECISION", () => {
    const out = runCli("distill-session.js", ["ses_jun_garbage_0010", "--db", FIXTURE_DB]);
    expect(out).toContain("NO_DECISION");
  }, 120_000);

  test("/distill a decision session produces its committed artifact", () => {
    const out = runCli("distill-session.js", ["ses_jun_rate_0009", "--db", FIXTURE_DB]);
    expect(out).toContain("DISTILLED");
    expect(out).toContain("source-session ses_jun_rate_0009");
  }, 120_000);

  test("/recall returns artifacts with source-session links, Miller-bounded", () => {
    const out = runCli("recall.js", ["authentication tokens"]);
    const lines = recallLines(out);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(5);
    for (const line of lines) {
      expect(line).toMatch(/source-session: ses_[a-z0-9_]+/);
    }
  });
});

describe("auto warm-start (T3)", () => {
  test("a first-message query about a past-dated topic surfaces that decision, unasked", () => {
    const out = runCli("warmstart.js", ["how should we rate limit the public api"]);
    expect(out).toContain("Recalled decisions");
    expect(out).toContain("source-session: ses_jun_rate_0009");
    expect(out).toContain("2026-06-20-rate-limiting-strategy-decision.md");
  });

  test("the injected warm context is Miller-bounded", () => {
    const out = runCli("warmstart.js", ["the team decided to ship which approach"]);
    const lines = out.split("\n").filter((line) => line.startsWith("- "));
    expect(lines.length).toBeLessThanOrEqual(5);
  });
});

describe("scheme-append breadth + post-inference screening (T5)", () => {
  test("screening prunes each scheme to its information-bearing core (reported externally)", () => {
    const out = runCli("reindex.js", ["--recalibrate"]);
    expect(out).toContain("SCREENED content");
    expect(out).toContain("SCREENED lexical");

    const content = out.match(/SCREENED content kept (\d+)\/768/);
    expect(content).not.toBeNull();
    expect(Number(content[1])).toBeGreaterThan(0);
    expect(Number(content[1])).toBeLessThan(768);

    const lexical = out.match(/SCREENED lexical kept (\d+)\/512/);
    expect(lexical).not.toBeNull();
    expect(Number(lexical[1])).toBeLessThan(512);
  }, 180_000);

  test("recall quality holds at the seam after screening (a recall test passes on screened vectors)", () => {
    const out = runCli("recall.js", ["how should user authentication and session tokens work"]);
    const lines = recallLines(out);
    expect(lines[0]).toContain("2026-05-14-api-authentication-method-decision.md");
    expect(lines[0]).toContain("source-session: ses_may_auth_0001");
  });

  test("scheme-append is decoupled: per-scheme reindex leaves the seam intact", () => {
    const out = runCli("reindex.js", ["--scheme", "content"]);
    expect(out).toContain("scheme=content");
    const recall = recallLines(runCli("recall.js", ["how do we deploy the web service to production"]));
    expect(recall[0]).toContain("2026-06-09-web-service-deployment-strategy.md");
    expect(recall[0]).toContain("source-session: ses_jun_deploy_0002");
  }, 180_000);
});
