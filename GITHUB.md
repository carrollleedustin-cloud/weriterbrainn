# Create GitHub repo and push

Git is initialized and the initial commit is done. To put this on GitHub:

## 1. Create the repo on GitHub

1. Open **https://github.com/new**
2. Set **Repository name** (e.g. `weriterbrainn`)
3. Choose **Public** (or Private)
4. Do **not** add a README, .gitignore, or license (this repo already has them)
5. Click **Create repository**

## 2. Add remote and push

In a terminal, from the project root:

```bash
# Replace YOUR_USERNAME and REPO_NAME with your GitHub username and repo name
git remote add origin https://github.com/YOUR_USERNAME/weriterbrainn.git

# Rename branch to main (optional; GitHub default is main)
git branch -M main

# Push
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/weriterbrainn.git
git branch -M main
git push -u origin main
```

## 3. Optional: GitHub CLI

To use [GitHub CLI](https://cli.github.com/) next time:

```bash
gh auth login
gh repo create weriterbrainn --private --source=. --remote=origin --push
```
