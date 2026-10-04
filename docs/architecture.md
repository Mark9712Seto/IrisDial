# How Iris Dial works

## The three parts (Zepp OS)

| Part | Where it runs | What it does |
|---|---|---|
| **Device app** (`page/`) | on the watch | eyes, keyboard and dictation, waiting screen, reply, history |
| **Side service** (`app-side/`) | inside the Zepp app on the phone | talks to Hermes through the tunnel and tells the watch what is happening |
| **Settings app** (`setting/`) | a page in the Zepp app | where you paste the address and the keys |

Watch and phone talk over Bluetooth with Zepp OS messages (ZML `request` / `call`). The watch has no internet of its own.

## One question, step by step

1. **Ask Iris** (or **Continue**) opens the system keyboard; with its microphone the watch dictates, and the text goes to the phone.
2. The phone starts a *run* on Hermes (`POST /v1/runs`), in the chosen session.
3. Every 2 seconds it asks for the run's status (`GET /v1/runs/{id}`) and reads the session's latest messages to see which tool is in use. The watch shows it with the eyes: thinking, tool (with its name), done, error.
4. When the run is finished, the reply goes to the watch, which vibrates and shows it; scroll with the crown.
5. If Hermes takes longer than about 4–5 minutes, the watch offers **Keep waiting**, which resumes waiting for the same run.

History, pinning and new chats use Hermes' sessions API (`/api/sessions`).

## Security: two locks

- **Cloudflare Access** in front of the tunnel: only requests with `CF-Access-Client-Id` and `CF-Access-Client-Secret` (service token) get through. No ports open on the router.
- **Hermes key** (`Authorization: Bearer …`), as for Iris Notch.
- The four values live in the Zepp app's settings storage on the phone; the watch never receives them.
- The Cloudflare service token expires (you choose when, usually after a year): renew it and paste it again.

## Screen on while waiting

- During a question the waiting page keeps the screen on (`setPageBrightTime`, `pauseDropWristScreenOff` from `@zos/display`) until the reply, then restores the normal timeout.
- If the screen goes off anyway, `setWakeUpRelaunch` reopens Iris Dial on the same page when you raise your wrist, instead of the watch face.

## Planned

- **Notification when the reply is ready** with the app closed: an App Service on the watch that calls `notify()` from `@zos/notification`.
- **Approvals from the wrist** (*once* / *deny*).
- **Spoken replies**, if apps can use the Balance 2's speaker.
