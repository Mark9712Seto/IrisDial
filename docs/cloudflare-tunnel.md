# Cloudflare tunnel for Iris Dial

*[Leggi in italiano](cloudflare-tunnel.it.md)*

The watch (through the Zepp app on your phone) has to reach Hermes even when you're away from home, without opening ports on your router.
A **Cloudflare Tunnel** publishes Hermes on an address of yours, and **Cloudflare Access** locks it behind a **service token**:
without the token's two codes Cloudflare lets nobody through, and without the Hermes key, Hermes doesn't answer.

## What you need

- A domain managed by Cloudflare (the free plan is fine).
- A computer or container that is always on, in the same network as Hermes, to run `cloudflared`.

## 1. The tunnel

Cloudflare → **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel** (type *Cloudflared*).
Follow the instructions to install `cloudflared` on the chosen machine, then under **Public Hostname**:

| Field | Value |
|---|---|
| Subdomain | e.g. `iris` |
| Domain | your domain |
| Service | `HTTP` → `hermes-address:8642` |

## 2. The service token

Zero Trust → **Access** → **Service Auth** → **Service Tokens** → **Create Service Token**.
Copy the **Client ID** and **Client Secret** right away: the secret is shown only once. Choose a duration (for example one year) and note when it expires.

## 3. The Access application

Zero Trust → **Access** → **Applications** → **Add an application** → **Self-hosted**:

- domain: the same as the tunnel (e.g. `iris.yourdomain.com`);
- a **policy** with *Action* **Service Auth** and an *Include* rule → **Service Token** → the one you just created.

## 4. Test

From any computer, without the codes Cloudflare must answer with a 403 error:

```
curl -i https://iris.yourdomain.com/health
```

With the codes, Hermes must answer:

```
curl -i https://iris.yourdomain.com/health -H "CF-Access-Client-Id: <id>" -H "CF-Access-Client-Secret: <secret>"
```

Then paste the values into Iris Dial's settings in the Zepp app and press **Prova il collegamento** *(test the connection)*.

## When the token expires

Create a new token, add it to the policy, paste the new codes into the Zepp app, then delete the old one.
