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
### Swipe controls

- **Swipe right / →:** Yes, I did
- **Swipe left / ←:** No, I didn't
- **Skip / ↓:** Move on without answering
- **Undo / Z:** Reverse your most recent swipe
- **Stories:** Read the community for the current card, or open the most recently answered question in the feedback strip.

Answers are saved privately in your browser and the feed advances automatically after each answer.

## Social profile · v1.2

Profiles now include an editable display name and username, a 160-character bio, an optional Instagram handle and website, four cover themes, and an uploadable profile photo. Photos are downscaled in the browser and stored locally.

The Instagram-style profile includes a curated **Dids** experience gallery, up to three pinned highlights, separate tabs for named stories and questions asked, and a **Preview profile** button.

- Swipe **Yes** on a question.
- From **My Life**, press **+ Show** next to a Yes answer (or visit its community and choose **Display this Did on your profile**).
- Open **Me → Manage Dids** to show or hide selected experiences and pin highlights.
- Your other Yes/No answers remain private. Anonymous stories are excluded from the profile preview.

**Prototype privacy note:** This remains a static, browser-only demo. The profile is not publicly accessible to other visitors, Instagram is an external profile link rather than a connected account, and uploaded photos are not sent to a server. Real shared profiles require authentication, storage, permissions, and moderation infrastructure.

## Threaded replies (v1.3)

Every story and discussion supports Reddit-style replies to replies. Tap **Reply** beneath any comment, add text (optionally anonymously), and post to nest a new reply beneath it. Long conversations are indented and can be collapsed or expanded. Replies can be upvoted. Previously saved flat replies continue to display and can be replied to; new nested replies are saved in the current browser's local storage.

This is still a local demonstration: comments are **not** shared between visitors or synced to a backend.
