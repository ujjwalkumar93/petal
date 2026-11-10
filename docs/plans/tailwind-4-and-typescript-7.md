# Plan: Tailwind CSS 4 and TypeScript 6/7

Status: **plan only, nothing upgraded** (November 2026). Petal is on Tailwind CSS 3.4.19 and TypeScript 5.9.3, both pinned.

Short version:

| Upgrade | Recommendation | Why |
|---|---|---|
| TypeScript 6.0 | **Do it next** (small, internal) | Only deprecated tsconfig options to fix; the lint stack supports it |
| TypeScript 7 (native) | **Wait** | typescript-eslint doesn't support it yet (peer `typescript <6.1.0`) |
| Tailwind 4 | **Wait for a major Petal release** | Breaks every custom app's class names (`tailwindPrefix`) |

---

## 1. Tailwind CSS 4

### What breaks for app authors

Custom apps compile their own Tailwind CSS. To avoid collisions in the shared DOM, the guide (`docs/custom-app-guide.md`) tells them to set a prefix:

```ts
// my-app/tailwind.config.ts (v3)
export default { prefix: "myapp-", content: [...] }
// components: className="myapp-text-primary myapp-bg-muted"
```

Tailwind 4 replaces this with a **variant-style prefix** set in CSS:

```css
@import "tailwindcss" prefix(myapp);
/* components: className="myapp:text-primary myapp:bg-muted" */
```

So **every prefixed class in every app has to be rewritten** (`myapp-` → `myapp:`), and each app's CSS entry point changes (`@tailwind base/components/utilities` → `@import "tailwindcss"`, JS config → CSS `@theme`, or `@config` to keep a JS file). This is a breaking change to the plugin contract, which is why it waits for a major Petal release and needs the maintainer's approval.

Apps without a prefix still need the CSS entry-point change and the renamed utilities below, but not a class rewrite.

### What changes in Petal itself

| Area | Today (v3) | With v4 |
|---|---|---|
| CSS entry | `@tailwind base; @tailwind components; @tailwind utilities;` in `globals.css` | `@import "tailwindcss";` |
| Config | `packages/core/tailwind.config.ts` (`darkMode: "class"`, `content`, theme colours) | `@theme` in CSS, or `@config "../tailwind.config.ts"` as a first step |
| Content scanning | explicit `content` globs, including `../../packages/ui/src` | automatic detection; `@source "../../ui/src"` for the workspace package |
| Dark mode | `darkMode: "class"` | `@custom-variant dark (&:where(.dark, .dark *));` |
| PostCSS | `tailwindcss` + `autoprefixer` | `@tailwindcss/postcss`; autoprefixer no longer needed |
| Theme colours | `primary: 'hsl(var(--primary))'` with CSS variables holding `H S% L%`, one set per theme in `globals.css` | keep the variables; declare `--color-primary: hsl(var(--primary))` in `@theme`. Opacity modifiers (`bg-primary/10`) then use `color-mix()`, which works with any colour |
| Renamed utilities | `shadow-sm`, `rounded-sm`, `blur-sm`, `outline-none`, default `ring` width 3px, default border colour `gray-200` | `shadow-xs`, `rounded-xs`, `blur-xs`, `outline-hidden`, `ring` 1px, border colour `currentColor`. Petal's `* { border-color: hsl(var(--border)) }` rule already covers the border default |
| `@petal/ui` peer | `tailwindcss: ^3.0.0` | `^4.0.0` |
| Browser support | v3 output runs in old browsers | v4 needs Safari 16.4+, Chrome 111+, Firefox 128+ (it relies on `@property`, cascade layers, `color-mix()`) |

Tailwind's own codemod (`npx @tailwindcss/upgrade`) handles most of the class renames and the config move. Run it on Petal and on each app, then review the diff by hand.

### Steps

1. **Before the major release**: in a Petal minor release, announce the change, publish the migration guide below, and add a `petalVersion` range to the example apps, so an app built for Tailwind 3 can declare `"<N"` and be refused cleanly by the new Petal (`/api/config` already enforces `petalVersion`).
2. **Petal**: branch, run the codemod, convert `globals.css` and the config, switch PostCSS, fix the renamed utilities. Check visually: light and dark themes, every built-in view, print preview, and the compat runtime's Desk controls (they carry their own CSS).
3. **`@petal/ui`**: same, plus the peer range.
4. **Scaffolders** (`petal create`, `create-petal-app`): generate v4 apps with `@import "tailwindcss" prefix(<app>)`.
5. **Example apps** (`hello-petal`, `billing-fe`, `petal-erpnext`): migrate them as the reference for app authors.
6. **Docs**: rewrite the `tailwindPrefix` section of the custom-app guide; `PetalAppMeta.tailwindPrefix` becomes the bare identifier (`"myapp"`), documented as v4 syntax.

### Migration guide for app authors (to publish with the release)

1. `npx @tailwindcss/upgrade` in the app.
2. Replace `prefix: "myapp-"` with `@import "tailwindcss" prefix(myapp);` and rewrite classes from `myapp-x` to `myapp:x` (the codemod does this when it can read the prefix from the old config).
3. Update `tailwindPrefix` in the app's Petal registration to `"myapp"`.
4. Set `petalVersion` to the new major (e.g. `">=1.0.0"`).
5. Rebuild and check the app in light and dark mode.

### Risks

- Apps that build class names dynamically (`"myapp-text-" + color`) aren't caught by the codemod.
- Apps upgraded before the host, or the host before the apps, render unstyled. `petalVersion` makes the mismatch visible on `/apps` instead of silent.
- Customers on old browsers (Safari < 16.4) lose styling.

**Effort**: Petal and `@petal/ui` about 2–3 days including visual checks; each app 0.5–1 day.

---

## 2. TypeScript 6.0 and 7

Petal runs TypeScript 5.9.3 everywhere (pinned). Two releases exist:

- **TypeScript 6.0** (6.0.3, April 2026): the last release of the JavaScript-based compiler. It deprecates options that 7 removes.
- **TypeScript 7** (7.0.2, July 2026): the native (Go) compiler, much faster. It drops everything 6.0 deprecated.

### Blockers for 7

| Tool | Status | Effect |
|---|---|---|
| typescript-eslint 8.72.2 (via eslint-config-next 16.4.6) | peer `typescript >=4.8.4 <6.1.0` | `pnpm lint` can't run against TS 7 |
| Next.js 16.4 build type-check | uses the `typescript` package's JavaScript API | verify whether Next supports TS 7 before switching; until then `next build` would need `typescript.ignoreBuildErrors` with a separate `tsc` step, which isn't acceptable |
| Vitest / esbuild / Turbopack | strip types without type-checking | unaffected |

So 7 waits until typescript-eslint and Next declare support. TS 6.0 has none of these blockers.

### What 6.0 asks us to change

Re-check each item against the TypeScript 6.0 release notes when doing the work:

| Where | Today | Change |
|---|---|---|
| `packages/cli`, `packages/create-petal-app` tsconfig | `"moduleResolution": "Node"` (node10, deprecated) with `"module": "CommonJS"` | `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`; may require explicit file extensions in relative imports |
| `packages/core/tsconfig.json` | `"baseUrl": "."` with `paths` | drop `baseUrl`; write `paths` relative to the tsconfig (`"@/*": ["./src/*"]`), which works without it since TS 4.1 |
| `tooling/tsconfig/base.json` | `"target": "ES2020"` | still allowed; consider `ES2022` to match the Node 26 / modern-browser baseline |
| Defaults that change in 6.0 | we set `strict`, `module` and `moduleResolution` explicitly | check `types` (automatic inclusion of `@types/*`) and `rootDir` defaults; set them explicitly where we relied on the old defaults, e.g. `"types": ["node"]` in `e2e/` (already explicit) |

### Steps

1. Branch; set `typescript` to `6.0.3` in every package (pinned).
2. Fix the tsconfig items above until `pnpm typecheck` passes with **no deprecation warnings**; that makes the later move to 7 a version bump.
3. Run lint, tests, and both builds (`next build` into `.next-prod`, the CLI's esbuild bundle).
4. Later, when typescript-eslint's peer range includes 7 and Next documents support: bump to 7, run the same checks, compare `pnpm typecheck` time before and after.

**Effort**: 6.0 about half a day; 7 about half a day once unblocked.

---

## 3. Related dependency decisions (Phase 4)

- **frappe-charts stays at `2.0.0-rc27`**, a pre-release, pinned exactly. It's the version Frappe itself pins (`apps/frappe/package.json`) and ships to Desk, and Petal's compat runtime passes Desk's own chart code to it, so matching Frappe matters more than being on a stable tag (the only stable release, 1.6.2, is far behind). Bump it when Frappe does.
- **`pnpm.overrides`** in the root `package.json` replace only known-vulnerable transitive versions, each scoped to its vulnerable range (`"nanoid@<3.3.18": "3.3.20"`). When `pnpm audit` is clean without an entry (its parent now ships the fix), delete it.
- **Left open on purpose**: `minimatch <11` inside eslint-config-next's TypeScript parser (moderate, dev-only). Forcing it two majors ahead underneath a lint plugin could break linting; it goes away when that plugin updates.
