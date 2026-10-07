# Tauri GUI per Docker

GUI per gestire i containers Docker.

Non è inclusa l'installazione e la configurazione di Docker.

Per creare una build di produzione per Windows/macOS:
```bash
npm run tauri build
```

Per creare una build di produzione per Linux:
```bash
NO_STRIP=true npm run tauri build
```

Per macOS universal:
```bash
npm run tauri build -- --target universal-apple-darwin
```

**TODO**
- crea container con opzioni