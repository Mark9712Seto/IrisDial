# Tunnel Cloudflare per Iris Dial

L'orologio (attraverso l'app Zepp del telefono) deve arrivare a Hermes anche fuori casa, senza aprire porte sul router.
Un **Cloudflare Tunnel** pubblica Hermes su un indirizzo tuo, e **Cloudflare Access** lo chiude dietro un **service token**:
senza i due codici del token Cloudflare non fa passare nessuno, e senza la chiave di Hermes, Hermes non risponde.

## Cosa serve

- Un dominio gestito da Cloudflare (piano gratuito).
- Un computer o container sempre acceso nella stessa rete di Hermes, dove gira `cloudflared`.

## 1. Il tunnel

Cloudflare → **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel** (tipo *Cloudflared*).
Segui le istruzioni per installare `cloudflared` sulla macchina scelta, poi in **Public Hostname**:

| Campo | Valore |
|---|---|
| Subdomain | es. `iris` |
| Domain | il tuo dominio |
| Service | `HTTP` → `indirizzo-di-hermes:8642` |

## 2. Il service token

Zero Trust → **Access** → **Service Auth** → **Service Tokens** → **Create Service Token**.
Copia subito **Client ID** e **Client Secret**: il segreto si vede una volta sola. Scegli la durata (per esempio 1 anno) e segnati quando scade.

## 3. L'applicazione Access

Zero Trust → **Access** → **Applications** → **Add an application** → **Self-hosted**:

- dominio: lo stesso del tunnel (es. `iris.tuodominio.it`);
- **policy** con *Action* **Service Auth** e regola *Include* → **Service Token** → quello appena creato.

## 4. Prova

Da un computer qualsiasi, senza i codici deve rispondere Cloudflare con un errore 403:

```
curl -i https://iris.tuodominio.it/health
```

Con i codici deve rispondere Hermes:

```
curl -i https://iris.tuodominio.it/health -H "CF-Access-Client-Id: <id>" -H "CF-Access-Client-Secret: <segreto>"
```

Poi incolla i valori nelle impostazioni di Iris Dial nell'app Zepp e premi **Prova il collegamento**.

## Quando scade il token

Crea un token nuovo, aggiungilo alla policy, incolla i nuovi codici nell'app Zepp, poi elimina quello vecchio.
