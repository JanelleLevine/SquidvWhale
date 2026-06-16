# Squid vs Whale

The canonical site lives in `docs/`.

Edit these files:

- `docs/index.html`
- `docs/styles.css`
- `docs/script.js`
- `docs/assets/...`
- `docs/CanvaVideos/...`
- `docs/Chromatophores/...`

Do not edit these root website files for page changes:

- `index.html`
- `styles.css`
- `script.js`
- `assets/...`
- `Canva/...`
- `CanvaVideos/...`
- `Chromatophores/...`

Why:

- `index.html` at the repo root is redirect-only.
- The published page should always resolve to `docs/index.html`.

Protection:

- Enable the hooks locally with `git config core.hooksPath .githooks`.
- This repo includes a local pre-commit hook in `.githooks/pre-commit`.
- This repo also includes a local pre-push hook in `.githooks/pre-push`.
- The hooks block commits and pushes that touch the root website files listed above.
- If you intentionally need to bypass those guards, use `git commit --no-verify` or `git push --no-verify`.
