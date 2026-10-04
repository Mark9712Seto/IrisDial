# Installing Iris Dial

*[Leggi in italiano](installazione.md)*

Iris Dial is a test version (0.1.x): you ask a question on the watch, the phone carries it to your Hermes through a tunnel, and the reply comes back to your wrist.

> The watch interface is in Italian for now. The labels below are given in Italian with their meaning in brackets.

## What you need

- A Zepp OS 3 (or newer) watch with a round screen. Designed for the **Amazfit Balance 2**.
- The **Zepp** app on your phone, with the watch paired.
- **Hermes Agent** with its API server turned on (see the [Iris Notch guide](https://github.com/Mark9712Seto/IrisNotch/blob/main/docs/hermes-setup.md)).
- A **Cloudflare tunnel** in front of Hermes, protected by a service token: [cloudflare-tunnel.md](cloudflare-tunnel.md).
- To install: a Windows PC with **Node.js** (LTS) and a Zepp account (the same one as the app).

## 1. Turn on developer mode in the Zepp app

1. Zepp app → **Profile** (bottom right) → **Settings** → **About** (the Zepp app's, not the watch's).
2. Tap the **Zepp icon** at the top **7 times in a row**, until a message appears.
3. From now on **Profile → Settings** has a **Developer mode** entry, with a button to scan QR codes.

## 2. Install from your PC

1. Download the code (**Code → Download ZIP** on GitHub) and extract it. You only need this once: the script downloads new versions by itself.
2. Right-click `tools\installa-sul-telefono.ps1` → **Run with PowerShell**. It downloads the latest Iris Dial from GitHub and prepares it.
   - The first time it sets up Zepp's official tool (`zeus`) and asks you to log in to your Zepp account in the browser.
   - At the end a **QR code** appears in the window.
3. On the phone: Zepp app → **Profile → Settings → Developer mode** → **Scan** → point it at the QR code. The app sends Iris Dial to the watch over Bluetooth.

The `.zab` file attached to each Release is the same package, but the Zepp app can't open it directly: use the QR code from step 2.

### Updating

Run `tools\installa-sul-telefono.ps1` again and scan the new QR code: it fetches the latest version and installs it over the old one. Your settings in the Zepp app (tunnel and keys) are kept.

If Windows blocks the script ("running scripts is disabled"), start it from PowerShell like this: `powershell -ExecutionPolicy Bypass -File .\tools\installa-sul-telefono.ps1`.

## 3. Paste the keys into the phone

Zepp app → your watch → **Apps** → **Iris Dial** → **Settings**:

| Field | What to enter |
|---|---|
| Indirizzo del tunnel *(tunnel address)* | e.g. `https://iris.yourdomain.com` |
| Cloudflare · Client ID | the service token's Client ID |
| Cloudflare · Client Secret | the service token's Client Secret |
| Chiave di Hermes *(Hermes key)* | Hermes' `API_SERVER_KEY` |

Then press **Prova il collegamento** *(test the connection)*: it should say **Collegata** *(connected)*. The keys stay on the phone and are never sent to the watch.

## 4. Try it on the watch

Open **Iris Dial** and press **Chiedi a Iris** *(Ask Iris)*: dictate with the keyboard's microphone (or type) and send. A full-screen waiting page shows big eyes and what Iris is doing (thinking, using a tool); the screen stays on until the reply, up to about 5 minutes. If it takes longer, **Aspetta ancora** *(keep waiting)* resumes the same answer without asking again.

| First screen | |
|---|---|
| **Chiedi a Iris** *(Ask Iris)* | starts a new chat and opens the keyboard |
| **Chat fissata** *(pinned chat)* | your pinned conversation (just one), to pick it up quickly |
| round clock button | **history**: Hermes' latest conversations (Telegram and Iris Notch ones too). Tap one to continue it; **Fissa** *(pin)* puts it on the pinned-chat button |

In the reply, scroll with the crown; at the end there are **Continua** *(continue, same conversation)* and **Nuova chat** *(new chat)*.

## Not there yet

- **Approvals from the wrist**: if Iris asks for permission, approve it from Iris Notch on your PC for now.
- **Streaming replies**: the reply arrives all at once at the end (the phone checks every 2 seconds whether Iris is done).
- **Notification with the screen off** and **spoken replies**: planned.

## For developers

`node tools/prova-hermes.mjs <address> [key] ["question"]` tests the phone side against a Hermes server (also the fake one from Iris Notch, `tools/mock_hermes.py`), without a watch or the Zepp app.
