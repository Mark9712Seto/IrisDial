// Impostazioni di Iris Dial nell'app Zepp del telefono: le quattro informazioni per arrivare a Hermes.
// Restano sul telefono (settingsStorage) e l'orologio non le vede mai.
const CAMPI = [
  ['tunnel_url', 'Indirizzo del tunnel', 'https://iris.tuodominio.it'],
  ['cf_client_id', 'Cloudflare · Client ID', 'xxxxxxxx.access'],
  ['cf_client_secret', 'Cloudflare · Client Secret', 'incolla il segreto'],
  ['hermes_key', 'Chiave di Hermes', 'incolla la chiave API'],
]

AppSettingsPage({
  build(props) {
    const s = props.settingsStorage
    const nascosto = (v) => (v ? '•'.repeat(Math.min(12, v.length)) + ' (salvato)' : '')
    return Section({}, [
      Text({ paragraph: true, style: { fontSize: '13px', color: '#666', marginBottom: '8px' } }, [
        'Incolla qui i valori del tunnel Cloudflare e la chiave di Hermes. Restano sul telefono.',
      ]),
      ...CAMPI.map(([key, label, ph]) => {
        const segreto = key !== 'tunnel_url' && key !== 'cf_client_id'
        return TextInput({
          label,
          placeholder: ph,
          value: segreto ? nascosto(s.getItem(key)) : s.getItem(key) || '',
          onChange: (v) => {
            v = String(v || '').trim()
            if (segreto && v.endsWith('(salvato)')) return
            s.setItem(key, v)
            if (key === 'tunnel_url' || key === 'hermes_key') s.removeItem('session_id') // server nuovo: sessione nuova
          },
        })
      }),
      View({ style: { marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' } }, [
        Button({ label: 'Prova il collegamento', color: 'primary', onClick: () => s.setItem('test_run', String(Date.now())) }),
        Text({ style: { fontSize: '14px', marginTop: '6px' } }, [s.getItem('test_result') || '']),
        Button({ label: 'Nuova conversazione', onClick: () => { s.removeItem('session_id'); s.setItem('test_result', 'La prossima domanda apre una conversazione nuova') } }),
      ]),
    ])
  },
})
