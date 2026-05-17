# i18n Manager

Local JSON editor for the source files in `js/i18n` and `js/data`.

Run it from the repository root:

```sh
node tools/i18n-manager/server.mjs
```

Then open:

```txt
http://localhost:4173
```

If that port is busy, pass another one:

```sh
node tools/i18n-manager/server.mjs 4185
```

The manager can:

- edit `js/i18n/lang-*.json`
- edit `js/data/*.json`
- add a new language file from an existing language template
- validate JSON
- save pretty source JSON
- generate matching `.min.json` files
- regenerate all minified JSON files at once
