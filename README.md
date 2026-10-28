# Cronache del Tavolo — Session Summary D&D

Web app per registrare l'audio delle sessioni di Dungeons & Dragons, segnare **chi sta parlando** e ottenere a fine serata una **sceneggiatura** con il nome di ogni personaggio e le sue battute.

Realizzata con Next.js (export statico), React, Tailwind CSS e shadcn/ui. Tutto resta nel browser: niente server, niente account.

## Funzionalità

- **Party**: si parte dal numero di giocatori, poi nome, giocatore, classe e avatar di ogni personaggio, più il master.
- **Avatar**: 20 razze in versione maschile e femminile (umano/umana, elfo/elfa, mezzelfo/mezzelfa, orco/orchessa, nano/nana, tiefling, dragonide, tabaxi…) oppure una foto caricata.
- **Nuova sessione**: data di gioco, titolo facoltativo, scelta dei personaggi presenti, prova del microfono.
- **Registrazione**: si tocca l'avatar di chi parla (o si usano i tasti `1`–`0`) e il personaggio si illumina. Con **Seleziona** si scelgono più personaggi per una discussione. I PNG che compaiono si aggiungono al volo.
- **Riconoscimento vocale (facoltativo, spento di base)**: si attiva dall'interruttore nella barra laterale, anche a registrazione in corso. Quando è acceso (Chrome, Edge, Safari) ogni frase viene trascritta e associata al personaggio selezionato in quel momento; quando è spento la sceneggiatura riporta chi ha parlato e quando, e le battute si possono scrivere a mano.
- **Dashboard della sessione**: audio con timeline per personaggio, tempo di parola, sceneggiatura modificabile (correggi il testo, riassegna chi parla, ascolta da un punto preciso), note del master.
- **Salvataggio in locale**: l'audio si scarica con un nome basato sulla data di gioco, ad esempio `Sessione 2026-10-28 - La cripta.webm`. La sceneggiatura si esporta in `.txt`, `.md` o PDF (stampa).
- **Sicurezza dei dati**: l'audio viene salvato a pezzi durante la registrazione; se la scheda si chiude o il browser va in crash, la sessione viene recuperata alla riapertura.

## Note sui browser

| | Registrazione audio | Riconoscimento vocale (opzionale) |
|---|---|---|
| Chrome / Edge (desktop e Android) | ✅ | ✅ (il riconoscimento vocale usa i servizi del browser) |
| Safari (macOS / iOS) | ✅ | ✅ |
| Firefox | ✅ | ❌ — vengono registrati audio e turni di parola, le battute si possono scrivere dopo |

I dati (party, sessioni, audio) sono salvati in IndexedDB nel browser che usi: cancellando i dati del sito si perdono. Scarica l'audio di ogni sessione per tenerne una copia.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build    # genera il sito statico in out/
npx serve out    # anteprima della build
```

## Pubblicazione su GitHub Pages

Il workflow `.github/workflows/deploy.yml` compila il sito e lo pubblica a ogni push su `main`. Il percorso del sito (`/<nome-repo>`) viene passato alla build tramite `NEXT_PUBLIC_BASE_PATH`.

Configurazione una tantum: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
