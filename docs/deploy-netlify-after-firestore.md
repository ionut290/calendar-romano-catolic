# Ultima operazione necessaria: collegare Netlify al repository GitHub

## Stato verificato 8 ottobre 2026
- GitHub `main`: migrazione Firestore attivata.
- Workflow `Pubblica liturgia quotidiana su Firestore`: completato con successo, documento `dailyLiturgies/2026-10-08` creato in `ore-l-766fb`.
- Workflow `Verifica calendario`: controlli superati.
- **Netlify pubblicato: deployment del 4 ottobre 2026, effettuato tramite upload** (`Deploy triggered by upload`). Non coincide ancora con il GitHub `main` aggiornato. Il collegamento automatico a GitHub NON è dimostrato.
- Non disabilitare le funzioni Netlify in produzione finché la nuova versione non è distribuita.

## Azione consigliata, senza token in chat
1. Apri https://app.netlify.com/projects/calendar-romano-catolic
2. Vai in **Project configuration → Build & deploy → Continuous deployment**.
3. Collega la repository `ionut290/calendar-romano-catolic`, branch `main`. Controlla che non sia già collegata prima di cambiare impostazioni.
4. Per questo sito statico con funzioni, Netlify deve distribuire la cartella pubblica del progetto e `netlify/functions`. Verifica nelle impostazioni che i file `index.html`, `firebase-daily.js`, `app.js` e `sw.js` risultino nella pubblicazione. Non usare una sottocartella vuota.
5. Avvia una nuova distribuzione e apri `https://calendar-romano-catolic.netlify.app/`.
6. Verifica liturgia odierna, letture, audio, avvio PWA, navigazione delle date passate e offline.
7. Solo dopo, osserva Netlify `Cache-Status` per confermare il CDN e confronta i contatori di invocazione con i giorni precedenti.

## Limiti attuali
- Gli audio sono ancora archiviati in Netlify Blobs e le loro funzioni restano attive; il risparmio sulle letture Firestore è funzionante nel database, ma il traffico utenti cambierà solo dopo il deploy della web app.
- GitHub non può creare o autorizzare da solo l'integrazione Netlify senza un collegamento CI o un token di deploy. Non caricare il token nel repository, nelle issue o in chat.
- La cancellazione giornaliera dei documenti Firestore dipende dall'esecuzione GitHub Actions del giorno successivo, quindi non è garantita esattamente alle ore 00:00.
