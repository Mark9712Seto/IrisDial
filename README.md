# Iris Dial

Iris al polso: gli occhi di Iris e la chat con Hermes Agent sull'**Amazfit Balance 2** (Zepp OS, schermo rotondo 480×480).
Progetto gemello di [Iris Notch](https://github.com/Mark9712Seto/IrisNotch), l'isola per Windows.

> Stato: **bozza**. Ci sono le schermate (`design/balance2.html`), un prototipo da usare col mouse (`design/prototipo.html`) e l'architettura (`docs/architettura.md`). Il codice dell'app non c'è ancora.

## Cosa farà

- Tieni premuto sullo schermo e parli; lasci e la domanda parte.
- Gli occhi mostrano cosa sta facendo Iris: ascolta, pensa, usa uno strumento, risponde.
- La risposta si legge girando la corona.
- Il via libera alle azioni (una volta / nega) si dà dal polso.
- Le sessioni di Hermes si scelgono da un elenco.

## Come è collegato

Orologio → Bluetooth → app Zepp sul telefono → internet → tunnel Cloudflare (service token) → Hermes e Whisper a casa.
Le chiavi stanno solo nelle impostazioni dell'app Zepp sul telefono, mai sull'orologio.

## Demo

```
python3 tools/bundle_demo.py   # rigenera le demo in design/ con il motore degli occhi
```
