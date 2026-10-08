# Calendario Cattolico — Android Capacitor / Google Play

## Identità Android
- ID applicazione: `com.varga.calendariocattolico`. Questo ID è permanente dopo la prima pubblicazione: verificarne la disponibilità in Google Play prima del rilascio.
- Nome visibile: Calendario Cattolico.
- Sorgente: gli stessi file statici del sito, confezionati localmente in WebView Capacitor, senza utilizzare `server.url` remoto.
- Liturgia odierna: Firestore `ore-l-766fb`; Netlify rimane fallback per le richieste CEI e audio.
- Nessuna chiave di servizio Firebase è inclusa nell'APK.

## Build di prova (GitHub Actions)
Il workflow `Android Capacitor - build` crea l'APK debug per test, e un Android App Bundle AAB **non firmato** per validare la compilazione. Download da GitHub Actions → esecuzione → Artifacts.

Per compilare localmente:
```bash
npm install
npm run android:add
cd android
./gradlew assembleDebug bundleRelease
```
Gli APK debug non sono idonei alla pubblicazione su Google Play.

## Preparazione Play Console
1. Verificare la disponibilità del package ID nella Play Console. Dopo il primo caricamento non modificarlo.
2. Generare un **keystore di upload dedicato**, conservarlo offline e fare backup; non caricarlo in GitHub.
3. Configurare firma Gradle per AAB release solo con GitHub Actions secrets o firma locale. Non pubblicare mai password o file .jks.
4. Impostare numero versione Android (`versionCode` incrementale), Android target SDK richiesto da Google Play alla data di rilascio e icone adaptive originali.
5. Creare scheda Play Store, informativa privacy, dichiarazione Data safety, eventuali dichiarazioni sull'accesso alle letture e servizi esterni.
6. Testare APK su un dispositivo Android reale: Firestore, audio, santo del giorno, navigazione mese, offline e tasto Indietro.
7. Eseguire il test chiuso richiesto dalla Play Console per l'account specifico e pubblicare AAB **firmato**.

## Attenzione
La prima versione di GitHub Actions produce un AAB non firmato. Non equivale a un rilascio Google Play pronto: servono firma, grafica/icona, test funzionali e controlli privacy. L'Android build usa Google-hosted GitHub Actions e Android SDK: possono applicarsi limiti di minuti.
