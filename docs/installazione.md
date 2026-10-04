# Installare Iris Dial (versione di prova 0.1.x)

Prima versione per verificare che l'idea funzioni: dall'orologio fai una domanda (a voce, se l'orologio lo permette, o scritta), il telefono la porta a Hermes attraverso il tunnel e la risposta torna sul polso.

## Cosa serve

- Un orologio Zepp OS 3 o più recente con schermo rotondo (pensato per **Amazfit Balance 2**).
- L'app **Zepp** sul telefono, con l'orologio collegato.
- **Hermes Agent** con l'API server acceso (vedi la guida di [Iris Notch](https://github.com/Mark9712Seto/IrisNotch)).
- Un **tunnel Cloudflare** davanti a Hermes, protetto da un service token: [docs/cloudflare-tunnel.md](cloudflare-tunnel.md).
- Per installare: un PC Windows con **Node.js** (LTS) e un account Zepp (lo stesso dell'app).

## 1. Accendi la modalità sviluppatore nell'app Zepp

1. App Zepp → **Profilo** (in basso a destra) → **Impostazioni** → **Informazioni** (quelle dell'app Zepp, non quelle dell'orologio).
2. Tocca **7 volte di fila l'icona di Zepp** in alto, finché compare un messaggio.
3. Da quel momento in **Profilo → Impostazioni** c'è la voce **Modalità sviluppatore**: lì c'è l'icona per scansionare il QR.

## 2. Installa dal PC

1. Scarica il codice (pulsante **Code → Download ZIP** su GitHub) ed estrailo. Basta la prima volta: lo script poi scarica da solo le versioni nuove.
2. Tasto destro su `tools\installa-sul-telefono.ps1` → **Esegui con PowerShell**. Scarica l'ultima versione di Iris Dial da GitHub e la prepara.
   - La prima volta prepara lo strumento di Zepp e ti fa accedere al tuo account nel browser.
   - Alla fine compare un **QR** nella finestra.
3. Sul telefono: app Zepp → **Profilo → Impostazioni → Modalità sviluppatore** → icona **Scansiona** in alto → inquadra il QR. L'app passa all'orologio via Bluetooth.

Il file `.zab` allegato alla Release è lo stesso pacchetto: l'app Zepp non lo apre direttamente, serve il QR del passo 2.

## Aggiornare

Rilancia `tools\installa-sul-telefono.ps1` e inquadra il nuovo QR: lo script scarica da solo l'ultima versione e la scrive sopra quella vecchia. Le impostazioni nell'app Zepp (tunnel e chiavi) restano. La versione installata si vede nell'app Zepp → Iris Dial.

Se Windows blocca lo script ("l'esecuzione di script è disabilitata"), aprilo così da PowerShell: `powershell -ExecutionPolicy Bypass -File .\tools\installa-sul-telefono.ps1`.

## 3. Incolla le chiavi nel telefono

App Zepp → il tuo orologio → **App** → **Iris Dial** → **Impostazioni**:

| Campo | Cosa mettere |
|---|---|
| Indirizzo del tunnel | es. `https://iris.tuodominio.it` |
| Cloudflare · Client ID | il Client ID del service token |
| Cloudflare · Client Secret | il Client Secret del service token |
| Chiave di Hermes | la `API_SERVER_KEY` di Hermes |

Poi **Prova il collegamento**: deve dire "Collegata".

## 4. Prova sull'orologio

Apri **Iris Dial** e premi **Chiedi a Iris**: detta (col microfono della tastiera) o scrivi la domanda e aspetta. Lo schermo resta acceso fino alla risposta, e gli occhi mostrano cosa sta facendo Iris (pensa, usa uno strumento).

| Sulla prima schermata | |
|---|---|
| **Chiedi a Iris** | apre una chat nuova e la tastiera (dettatura o lettere) |
| **Chat fissata** | la conversazione fissata (una sola), per riprenderla al volo |
| tasto tondo con l'orologio | la **cronologia**: le ultime conversazioni di Hermes (anche di Telegram e dell'isola); toccandone una si continua lì, **Fissa** la mette nel tasto *Chat fissata* |

Nella risposta: si scorre con la corona; in fondo **Continua** (stessa conversazione) e **Nuova chat**.

## Cosa non c'è ancora

- **Via libera dal polso:** se Iris chiede un permesso, per ora va dato dall'isola sul PC.
- **Risposta che arriva mentre scrive:** per ora arriva tutta insieme, alla fine (il telefono controlla ogni 2 secondi se Iris ha finito).

## Per chi sviluppa

`node tools/prova-hermes.mjs <indirizzo> [chiave] ["domanda"]` prova la parte telefono contro un Hermes (anche quello finto di Iris Notch, `tools/mock_hermes.py`), senza orologio né app Zepp.
- **Notifica a schermo spento** e **risposta letta a voce**: nelle prossime versioni.
