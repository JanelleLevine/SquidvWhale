# GitHub Pages Setup

This project is prepared to publish from the `docs/` folder so the original story files in the repo root stay untouched.

## What Is Safe

- Original working files remain in the repo root:
  - `scrolling-story.html`
  - `scrolling-story.css`
- GitHub Pages copy lives in `docs/`:
  - `docs/index.html`
  - `docs/scrolling-story.css`
  - copied image assets

## Next Steps

1. Create a new GitHub repository.
2. Push this folder to that repository.
3. In GitHub, open `Settings -> Pages`.
4. Set:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/docs`
5. Save and wait for the site to publish.

## Git Commands

```powershell
git init
git add .
git commit -m "Prepare GitHub Pages site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## Published URL

For a normal project repo, the site URL will be:

```text
https://YOUR-USERNAME.github.io/YOUR-REPO/
```
