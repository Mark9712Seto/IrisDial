# Architettura di Iris Dial

## I tre pezzi (Zepp OS)

| Pezzo | Dove gira | Cosa fa |
|---|---|---|
| **Device App** (`page/`) | sull'orologio | occhi, registrazione, testo della risposta, via libera, sessioni |
| **Side Service** (`app-side/`) | dentro l'app Zepp del telefono | chiama Whisper e Hermes attraverso il tunnel, manda gli eventi all'orologio |
| **Settings App** (`setting/`) | pagina nell'app Zepp | dove si incollano indirizzo e chiavi (`settingsStorage`) |

Orologio e telefono si parlano via Bluetooth con i messaggi di Zepp OS (`shared/messaggi.js`). L'orologio non ha internet suo.

## Una domanda, passo per passo

1. Dito premuto: l'orologio registra (Recorder, Opus). Lasciato il dito, il file passa al telefono (TransferFile).
2. Il telefono manda l'audio a Whisper (`/v1/audio/transcriptions`) e, se l'anteprima è accesa, rimanda il testo all'orologio.
3. Confermato il testo, il telefono apre una *run* su Hermes (`/v1/runs`) e ne segue gli eventi.
4. Gli eventi diventano stati degli occhi (pensa, strumento, risponde) e pezzi di testo sull'orologio.
5. Se un'azione chiede il permesso, l'orologio vibra e mostra *una volta* / *nega*; la scelta torna a Hermes (`run_approval`).

## Sicurezza: doppia barriera

- **Cloudflare Access** davanti al tunnel: passa solo chi manda `CF-Access-Client-Id` e `CF-Access-Client-Secret` (service token). Nessuna porta aperta sul router.
- **Chiave di Hermes** (`Authorization: Bearer …`) come per l'isola.
- Le quattro informazioni stanno nell'archivio impostazioni dell'app Zepp; l'orologio non le riceve mai.
- Il service token di Cloudflare ha una scadenza (si sceglie quando lo crei, di solito un anno): va rinnovato e reincollato.

## Da verificare sull'orologio vero

- Batteria con lo schermo acceso durante risposte lunghe.
- Lettura ad alta voce dall'altoparlante del Balance 2 (se le app possono usarlo).
- Fluidità degli occhi: sull'orologio vanno ridisegnati con meno dettagli (`shared/occhi.js`).
- Dimensione e durata del trasferimento audio via Bluetooth.
