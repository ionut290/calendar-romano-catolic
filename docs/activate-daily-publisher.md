# Attivazione pubblicazione quotidiana su Firestore — ORE L

## Stato
Il branch `feature/firebase-daily-cache` contiene il lettore Firestore e il workflow con **Workload Identity Federation** (GitHub OIDC, senza chiavi JSON). Il pull request resta in bozza e **non è ancora attivo su main**.

## Configurazione Google Cloud
- Progetto: `ore-l-766fb` (numero `952052945501`).
- Pool: `calendario-github`, provider: `github-actions`.
- Provider resource: `projects/952052945501/locations/global/workloadIdentityPools/calendario-github/providers/github-actions`.
- Account: `calendario-firestore@ore-l-766fb.iam.gserviceaccount.com`.
- Controllare che provider OIDC abbia `google.subject = assertion.sub`, `attribute.repository = assertion.repository` e condizione `assertion.repository == 'ionut290/calendar-romano-catolic' && assertion.ref == 'refs/heads/main'`.
- Verificare che sull'account di servizio sia assegnato `roles/datastore.user` e che il principalSet `attribute.repository/ionut290/calendar-romano-catolic` abbia il ruolo **Workload Identity User** (`roles/iam.workloadIdentityUser`) **sull'account di servizio**. Non ampliare a tutto il pool.
- Nessuna chiave JSON e nessun secret Firebase permanente richiesto.

## Attivazione e test
1. Revisionare la PR e il parsing della pagina CEI: cambiamenti HTML potrebbero impedire la generazione.
2. Pubblicare su main solo dopo verifica dei permessi. I workflow schedulati di GitHub Actions si eseguono dal branch predefinito; la condizione OIDC intenzionalmente rifiuta le esecuzioni su branch di prova.
3. Avviare il workflow manualmente da GitHub Actions e verificare la riuscita dell'autenticazione federata e la presenza del documento `dailyLiturgies/YYYY-MM-DD` in Firestore.
4. Testare l'app su più dispositivi, compreso il fallback Netlify e l'uso offline, prima di disattivare le funzioni correnti.
5. Il job conserva solo il giorno italiano corrente nella collezione `dailyLiturgies`; le altre collezioni non vengono toccate. La pulizia è soggetta alla riuscita delle esecuzioni schedulate.
6. Gli MP3 **non sono ancora migrati**: restano sulla distribuzione corrente, senza Firebase Storage e senza Blaze.

## Limiti
GitHub Actions schedulate possono subire ritardi o esecuzioni saltate. Firestore richiede controlli sulle quote di lettura e operazioni; non garantiamo costi zero. La chiusura della migrazione Netlify sarà una fase successiva.
