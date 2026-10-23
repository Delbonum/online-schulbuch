# AutoCell (Web-Version)

Fertig gebaute Web-Version von [AutoCell](https://github.com/Delbonum/autocell) – Simulation zellulärer
Automaten. Der Quelltext liegt im eigenen Repository; hier stehen nur die gebauten Dateien
(`apps/autocell/dist` dort). Der Build kopiert sie unverändert nach `/informatik/autocell/`, in der
Toolsammlung ist AutoCell als externer Eintrag verlinkt (öffnet in neuem Tab, eigenes Design).

Aktualisieren:

```sh
cd ../Autocell && npm run build && cd -
node scripts/autocell-holen.mjs
```

Die Web-Version arbeitet offline (Service Worker `sw.js`, Gültigkeitsbereich nur `/informatik/autocell/`)
und kündigt neue Versionen selbst mit „Neu laden“ an.
