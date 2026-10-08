# Firebase separato per Calendario Romano-Cattolico

## Stato attuale
Questo branch contiene soltanto configurazione e regole pronte per la revisione. **Non è stato creato un progetto Firebase, né è stata modificata l'app pubblicata.**

## Crea il progetto autonomo
1. Apri https://console.firebase.google.com/ e scegli **Aggiungi progetto**.
2. Nome suggerito: **Calendario Romano Cattolico**. L'ID progetto deve essere unico: scegli quello disponibile.
3. Registra una **Web App** e copia la configurazione pubblica (apiKey, authDomain, projectId, storageBucket, appId).
4. Crea il database **Cloud Firestore** in modalità bloccata inizialmente, scegliendo una regione adatta ai tuoi utenti.
5. Valuta il piano di fatturazione prima di abilitare **Cloud Storage**, **Cloud Functions** o **Cloud Run**: alcuni servizi richiedono un piano a consumo anche a traffico basso.
6. Installa Firebase CLI e accedi al nuovo progetto; configura l'alias del progetto localmente, senza committare credenziali.
7. Dopo revisione di queste regole, distribuiscile nel **solo nuovo progetto** con `firebase deploy --only firestore:rules,storage`.
8. Non distribuire le regole nel Firebase di Varga Gestionale.

## Schema dati
`dailyLiturgies/YYYY-MM-DD`:
- `date`: stringa ISO nel fuso Europe/Rome
- `source`, `sourceUrl`, `celebrazione`, `colore`, `letture`
- `audio`: mappa delle chiavi verso i percorsi Storage
- `updatedAt`: timestamp server
- `schemaVersion`: 1

File audio: `daily-audio/YYYY-MM-DD/<chiave>.mp3`.

## Regole di esercizio
- Un job backend schedulato secondo **Europe/Rome**, con controllo data idempotente, scrive una sola volta i contenuti del giorno e i relativi audio.
- Il client legge prima la cache locale e fa refresh solo quando necessario, senza un listener realtime permanente.
- Il job di pulizia elimina i dati e gli oggetti Storage di giorni precedenti. TTL Firestore da solo non garantisce cancellazione a mezzanotte.
- Implementare test e fallback a Netlify prima del passaggio, poi rimuovere vecchie dipendenze e job.
- Firestore addebita anche operazioni di lettura/scrittura/cancellazione; Storage ha costi di spazio e banda: monitorare gli utilizzi.
- L'accesso pubblico senza login è consentito *solo* per la collezione di liturgia pubblica. Non conservare informazioni personali in questi documenti.
- Evitare di committare service account JSON o token amministrativi su GitHub.
