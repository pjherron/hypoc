/**
 * Auto-discovery wrapper for opencode-model-router.
 *
 * opencode >= 1.18 ignores the `plugin` config array entirely and only
 * auto-discovers plugins from .opencode/plugins/*.ts. The real router lives
 * at plugins/opencode-model-router/src/index.ts, outside that directory, so
 * without this wrapper it is never loaded at all - none of /preset, /tiers,
 * /budget, /router, /annotate-plan, or delegation register, on any platform.
 *
 * This just re-exports the router's own default export (already a correct
 * function-factory, see src/index.ts) so auto-discovery picks it up.
 *
 * @opencode-ai/plugin resolution: src/index.ts does a runtime
 * `import { tool } from "@opencode-ai/plugin"`, resolved by walking up
 * from src/index.ts's own directory - NOT from this wrapper's location.
 * plugins/opencode-model-router/package.json now pins @opencode-ai/plugin
 * as a real dependency, and bin/install runs `npm install` there, so
 * plugins/opencode-model-router/node_modules/@opencode-ai/plugin exists as
 * an ancestor of src/, and that import resolves regardless of whether
 * opencode's own runtime cache happens to have a copy anywhere else.
 *
 * Root-caused via Dalston's WSL install report (issue 4).
 */
export { default } from "../../plugins/opencode-model-router/src/index.ts"
