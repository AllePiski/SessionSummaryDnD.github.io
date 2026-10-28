# Cronache del Tavolo — Session Summary D&D

Web app per registrare l'audio delle sessioni di Dungeons & Dragons, segnare **chi sta parlando** e ritrovare la serata come una **sceneggiatura**, con il nome di ogni personaggio e le sue battute.

È un sito statico (Next.js con export statico, ospitato su GitHub Pages): tutti i dati restano nel browser, senza server né account.

## Funzionalità

- **Party**: si sceglie il numero di giocatori, poi per ognuno nome, giocatore, classe e avatar; il master si configura a parte. Il party si può eliminare per intero (con conferma), scegliendo se tenere o cancellare anche le sessioni registrate.
- **Avatar**: 20 razze in versione maschile e femminile (umano/umana, elfo/elfa, mezzelfo/mezzelfa, orco/orchessa, nano/nana, tiefling, dragonide, tabaxi…), oppure una foto caricata.
- **Registrazione**:
  - si tocca l'avatar di chi parla (o si usano i tasti `1`–`0`) e la barra in alto mostra "Ora parla";
  - **Discussione** (`D`, oppure Maiusc + tocco) per più personaggi insieme, **Nessuno** (`N`) per le pause e **Pausa** (`P`);
  - i PNG si aggiungono al volo: si scrive il nome e Invio;
  - dal pannello laterale si tirano i dadi senza interrompere la registrazione.
- **Riconoscimento vocale (facoltativo, spento di base)**:
  - si accende dalla barra laterale, anche a registrazione in corso;
  - acceso (Chrome, Edge, Safari): ogni frase viene trascritta e assegnata al personaggio selezionato;
  - spento: la sceneggiatura riporta chi ha parlato e quando, e le battute si scrivono a mano ("Trascrivi i turni mancanti", Invio passa al turno successivo).
- **Pagina della sessione**:
  - audio con timeline per personaggio, mini-player e scorciatoie (Spazio, frecce);
  - tempo di parola per personaggio;
  - sceneggiatura modificabile: correggi il testo, cambia chi parla, con "Annulla";
  - note del master salvate da sole;
  - export in `.txt`, `.md` o PDF.
- **Tiro dei dadi**: d4–d100 anche misti, modificatori, vantaggio e svantaggio, scopo facoltativo per gruppo (es. 1d8 Fuoco + 1d8 Ghiaccio, con totali separati), animazione e storico. Funziona anche senza party; lo storico si salva solo se esiste un party.
- **Salvataggio**:
  - l'audio si scarica con un nome basato sulla data di gioco, ad esempio `Sessione 2026-10-28 - La cripta.webm`; finché non lo scarichi un avviso te lo ricorda;
  - durante la registrazione l'audio viene salvato a pezzi: se la scheda si chiude o il browser va in crash, la sessione viene recuperata alla riapertura;
  - se a fine serata il salvataggio non riesce, si può riprovare o scaricare subito l'audio.

## Note sui browser

| | Registrazione audio | Riconoscimento vocale (facoltativo) |
|---|---|---|
| Chrome / Edge (desktop e Android) | ✅ | ✅ (usa il servizio vocale del browser) |
| Safari (macOS / iOS) | ✅ | ✅ |
| Firefox | ✅ | ❌ — audio e turni vengono registrati comunque |

I dati (party, sessioni, audio) sono salvati in IndexedDB nel browser che usi: se cancelli i dati del sito li perdi. Scarica l'audio di ogni sessione per tenerne una copia.

## Struttura del progetto

```
src/
  app/                  pagine (dashboard, party, registrazione, archivio, sessione, dadi)
  components/
    avatars/            avatar SVG: dati delle razze, parti del disegno, composizione
    characters/         creazione e modifica dei personaggi
    record/             preparazione e schermata di registrazione
    session/            pagina della sessione: player, timeline, sceneggiatura, note
    dice/               tiro dei dadi
    dashboard/, party/, sessions/   le altre pagine
    ui/                 componenti shadcn/ui (generati)
  hooks/                hook condivisi (dati da IndexedDB, stato della registrazione…)
  lib/
    recording-engine.ts motore di registrazione (microfono, MediaRecorder, turni, salvataggi)
    transcriber.ts      riconoscimento vocale con riavvio automatico
    db.ts, repo.ts      database IndexedDB e operazioni sui dati
    screenplay.ts       costruzione ed export della sceneggiatura
    dice.ts             logica dei dadi
```

## Tecnologie e librerie

- **Next.js 16** (export statico) e **React 19**, scritti in **TypeScript**
- **Tailwind CSS 4** con **shadcn/ui**: componenti su **Radix UI**, `class-variance-authority`, `cn`, `tw-animate-css`, icone **lucide-react**
- **Dexie** e **dexie-react-hooks** per IndexedDB
- **date-fns** e **react-day-picker** per le date in italiano
- **next-themes** per il tema chiaro e scuro, **sonner** per le notifiche
- **fix-webm-duration** per la durata corretta dei file audio WebM
- Font tramite `next/font`: Geist, Cinzel, Courier Prime
- API del browser: MediaRecorder, Web Audio, Web Speech, IndexedDB, Wake Lock, File System Access, Web Animations

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
