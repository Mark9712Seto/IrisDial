# Privacy

Iris Dial has no servers, no account and no analytics. It only talks to the services listed here.

| What | Where it goes | When |
|---|---|---|
| Your questions, the replies, session names | from the Zepp app on your phone to **your own Hermes**, through **your own** Cloudflare tunnel | when you use the app |
| Your voice | turned into text by the **watch's own system keyboard** (Zepp OS dictation); Iris Dial only receives the text | when you dictate |
| Tunnel address, Cloudflare service token, Hermes key | the Zepp app's settings storage on your phone; never sent to the watch | — |

Cloudflare sees the requests that pass through your tunnel, under Cloudflare's own terms; what Hermes does with your messages depends on your Hermes setup and on the model provider it uses.

Uninstalling Iris Dial from the Zepp app removes its settings.

## The website

The project website (GitHub Pages) and the prototype send nothing anywhere: the prototype uses made-up answers. The pages load their fonts from Google Fonts, and GitHub hosts them, so both see the usual request data (IP address, browser) under their own privacy policies.

---

**Italiano.** Iris Dial non ha server, account o statistiche. Le domande vanno dall'app Zepp del telefono al **tuo** Hermes, attraverso il **tuo** tunnel Cloudflare. La voce la trasforma in testo la tastiera di sistema dell'orologio. Indirizzo e chiavi restano nelle impostazioni dell'app Zepp sul telefono e non arrivano mai all'orologio.
