# Chart file structure

Ez a mappa az ábrák külön leíró specifikációit tartalmazza.

A tényleges renderelés jelenleg a `webpage/script.js` fájlban történik, mert ott vannak a közös segédfüggvények, az adatbetöltés és az interaktív szűrők. A külön chart-fájlok célja, hogy minden ábrához egy helyen legyen olvasható:

- az ábra HTML azonosítója,
- az ábra típusa,
- a használt adatforrás,
- az alkalmazott számítási vagy statisztikai logika,
- az értelmezési megjegyzés.

Fő fájlok:

- `primary-radar.js`: körforgásos fogyasztói profil pókháló ábra.
- `primary-heatmap.js`: primer életciklus-indexek heatmapje.
- `primary-histogram.js`: skálaválaszok eloszlása.
- `primary-bubble.js`: javítási és leadási hajlandóság háttérváltozók szerint.
- `primary-candles.js`: kvartilisek és medián gyertyaábrája.
- `primary-correlation.js`: Pearson korrelációs mátrix.
- `primary-barriers-motivations.js`: akadályok és motivációk.
- `primary-disposal-path.js`: leadási utak.
- `primary-repair-quality.js`: javítás utáni elfogadás.
- `primary-kmeans.js`: KMeans válaszadói profilok.
- `secondary-weee-category.js`: Eurostat WEEE mennyiségek.
- `secondary-recycling-trend.js`: Eurostat újrahasznosítási ráta trend.
- `secondary-recycling-ranking.js`: újrahasznosítási ráta rangsor.
