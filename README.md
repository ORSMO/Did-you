# Did You? — Interactive Social App Prototype

A mobile-friendly, single-page demo combining swipe-to-answer discovery with topic-based stories and discussions.

## Live demo

**Live website:** https://did-you.onrender.com

**Deployment dashboard:** https://dashboard.render.com/static/srv-dc00aiajnfac738keo8g

The site is deployed as a **Render Static Site** with automatic deployments from the `main` branch.

## What you can do

- Swipe or tap Yes/No on questions; save or skip
- Explore trending questions and search categories
- Read, like, and reply to sample community stories
- Post public/anonymous sample stories
- Create questions with basic duplicate detection
- Review your personal answers and saved questions
- Control darker topic visibility in your local profile

The sample users, answer counts, popularity metrics, and stories are fictional. All actions save in **browser-local storage only**. There is **no authentication, moderation backend, or shared database**; this is a functional product prototype, not a live social network. Don't enter confidential information.

## Run locally

Open `index.html` in a modern browser, or serve the folder locally:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy to Render

1. Push all files in this folder to a GitHub repository (usually branch `main`).
2. In Render, choose **New > Static Site** and select that repository.
3. Use **Build Command:** `echo "Static site ready"` and **Publish Directory:** `.`.
4. Select the `main` branch and turn **Auto-Deploy** on.
5. Render will provide a live `*.onrender.com` URL once the first deployment succeeds.

An optional `render.yaml` is included for future Blueprint-based setup.

## Updating the prototype

Edit `index.html` and commit/push the change to `main`. With Render Auto-Deploy enabled, each push publishes a new version. Use the GitHub **Commits** tab for history, Render **Deploys** for status, and `CHANGELOG.md` for human-readable updates.

## Limitations / before production

Add real accounts, a persistent backend/database, privacy controls, abuse reporting and moderation, spam prevention, age-appropriate policies, and server-side authorization before inviting users to post real data.