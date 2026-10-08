# Firebase separato per Calendario Romano-Cattolico

## Stato attuale
Questo branch contiene soltanto configurazione e regole pronte per la revisione. **È stato scelto dall'utente il progetto Firebase esistente `ore-l-766fb` e configurato il suo alias in `.firebaserc`. Non abbiamo verificato se Firestore o Storage siano attivi, né modificato l'app pubblicata.**

## Progetto Firebase selezionato
- Console: https://console.firebase.google.com/u/0/project/ore-l-766fb/overview
- ID progetto Firebase: `ore-l-766fb`
- L'alias `default` in `.firebaserc` punta a questo progetto.
- Prima di distribuire **qualsiasi regola** controllare se il progetto contiene già dati o altre applicazioni: le regole proposte contengono una negazione generale di accesso alle altre collezioni e NON devono sovrascrivere regole esistenti senza revisione.
- Nella Console Firebase: controllare prima **Firestore Database**, **Storage**, **Impostazioni progetto > Le tue app** e piano di fatturazione.
- Registrare la Web App (se non esiste), ottenere la configurazione pubblica (apiKey, authDomain, projectId, storageBucket, appId). Non pubblicare service account e chiavi private.
- Integrare il client Firebase, i job backend e i test in un secondo passo: l'alias da solo non abilita un collegamento operativo.
- Solo dopo la revisione delle regole e l'autorizzazione alla distribuzione, fare deploy esplicitamente verso il progetto corretto.

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
