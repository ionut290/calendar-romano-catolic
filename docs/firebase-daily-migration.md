# Migrazione Firebase: contenuti del solo giorno corrente

Obiettivo: ridurre le invocazioni Netlify senza interrompere la versione pubblicata.

## Architettura proposta
- Firestore: documento `dailyLiturgies/YYYY-MM-DD` con letture CEI, data italiana, stato, versione e riferimento audio.
- Firebase Storage: `daily-audio/YYYY-MM-DD/*.mp3` (non inserire MP3 in Firestore).
- Cache sul dispositivo: conservare solo la giornata italiana corrente; invalidare al cambio data.
- Un solo job backend schedulato nel fuso `Europe/Rome` aggiorna la liturgia e genera gli audio; nessuna generazione per singolo utente.
- Job di pulizia: eliminare documenti e oggetti audio di date precedenti; Firestore TTL non garantisce rimozione puntuale a mezzanotte.
- Non eliminare profili, preferenze, configurazioni o altre collezioni permanenti.

## Requisiti prima di attivare la migrazione
1. Identificare il progetto Firebase corretto e predisporre credenziali **solo lato server**.
2. Definire regole Firestore: lettura pubblica del documento giornaliero se il calendario è pubblico, scrittura solo dal servizio autorizzato; negare scritture client.
3. Definire regole Storage e limiti di accesso per gli MP3.
4. Verificare disponibilità, limiti e costi di Cloud Functions/Cloud Run, Firestore e Storage.
5. Aggiungere un lettore Firebase con fallback alle attuali funzioni Netlify; confrontare liturgia e audio sui dispositivi.
6. Attivare la nuova sorgente solo dopo test; successivamente disattivare i job e gli endpoint Netlify obsoleti.
7. Monitorare letture, scritture, traffico e download: la cache riduce i costi ma non li azzera.

**Stato:** documento di pianificazione, nessuna modifica al funzionamento dell'app pubblicata.
