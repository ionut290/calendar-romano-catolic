# Attivazione pubblicazione giornaliera Firestore (progetto ore-l-766fb)

Il codice è su `feature/firebase-daily-cache`; l'app pubblicata non è stata cambiata.
Gli audio rimangono sul sistema attuale **finché non verrà configurata una nuova distribuzione statica**. Questa migrazione iniziale riguarda solo i documenti di liturgia.

## Prima di attivare
1. In **Google Cloud Console**, selezionare soltanto il progetto `ore-l-766fb` e abilitare la Firestore API se necessario. Firestore deve già esistere.
2. Creare un account di servizio dedicato alla pubblicazione liturgia, concedendo solo i privilegi Firestore strettamente necessari; in produzione preferire Workload Identity Federation per evitare chiavi JSON permanenti.
3. Se si usa temporaneamente un JSON service-account, creare una chiave soltanto tramite Google Cloud IAM e conservarla **solo** nel repository GitHub: Settings → Secrets and variables → Actions → New repository secret. Nome esatto: `FIREBASE_SERVICE_ACCOUNT`; valore: contenuto JSON completo. Mai incollarla in chat, in un file pubblico o in issue.
4. Verificare che la chiave JSON contenga `project_id: ore-l-766fb`. Lo script rifiuta un altro progetto.
5. Verificare limiti e quote di GitHub Actions / Firestore. GitHub Actions schedulate eseguono soltanto sul **branch predefinito**; pubblicare il workflow in main solo dopo la revisione.
6. Dopo la pubblicazione in main, eseguire una volta manualmente da Actions → Pubblica liturgia quotidiana su Firestore → Run workflow. Controllare che appaia `dailyLiturgies/YYYY-MM-DD`, senza dati personali.
7. Il job è schedulato alle 22:15 e 23:15 UTC, ma pubblica solo nell'ora 00 in `Europe/Rome` (ora legale/solare). GitHub Actions può avere ritardi o saltare una schedulazione; usare Run workflow in caso di assenza di contenuti. Se resta senza dati, l'app continua temporaneamente con la vecchia origine Netlify.
8. **Non** attivare Cloud Storage e **non** disattivare Netlify prima che i test confermino la copertura delle letture.
9. Se la liturgia CEI cambia struttura HTML, il parser potrebbe fallire in modo sicuro: non eliminerà la liturgia precedente. Controllare i log dell'Action.

## Costi e prestazioni
- Firestore conserva solo la liturgia del giorno corrente, ma GitHub Actions e Firestore hanno quote e condizioni d'uso. Le letture pubbliche e le chiamate di lista hanno un costo/limite anche per cache miss.
- Il client usa la cache locale quotidiana e, in mancanza di documento, limita le riprove a una ogni 10 minuti per sessione.
- L'audio MP3 **non è su Firestore né Firebase Storage**: i file statici richiedono ancora pianificazione/test prima della migrazione.
- Evitare di assegnare segreti del repository a workflow di pull request non fidati.
