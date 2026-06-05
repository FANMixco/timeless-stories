# i18n Manager

Local JSON editor for the source files in `js/i18n`, `js/i18n/memory-game`, and `js/data`.

Run it from the repository root:

```sh
npm run i18n:manager
```

The manager prints the local URL with an available port, for example:

```txt
http://127.0.0.1:49231
```

If you need a specific port, pass one directly or use `PORT`:

```sh
node tools/i18n-manager/server.mjs 4185
```

The manager can:

- edit `js/i18n/lang-*.json`
- edit `js/i18n/memory-game/lang-*.json`
- edit `js/data/*.json`
- add a new language file from an existing language template
- validate JSON
- save pretty source JSON
- generate matching `.min.json` files
- regenerate all minified JSON files at once
