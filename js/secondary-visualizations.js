function renderWeeeCategoryTrend(rows) {
  // ÁBRA: "WEEE mennyiségek termékkategóriánként".
  // Adatelőkészítés: Eurostat/WEEE CSV; a JS országnevet egységesít és hiányzó értékeket szűr.
  // Renderelés: Vega-Lite grouped column chart kategória-szűrővel.
  const countryMap = {
    Romania: "Románia",
    Netherlands: "Hollandia",
  };
  const values = rows
    .map((row) => ({
      kategoria: normalize(row.Category),
      orszag: countryMap[normalize(row.Country)] || normalize(row.Country),
      ev: toNumber(row.Year),
      ertek: toNumber(row.Value),
    }))
    .filter((row) => ["Hollandia", "Románia"].includes(row.orszag) && Number.isFinite(row.ev) && Number.isFinite(row.ertek));
  const categories = [...new Set(values.map((row) => row.kategoria))];

  embedPrimary(secondaryCharts.categoryTrend, {
    ...primaryBaseSpec(values, 360),
    params: [
      { name: "kategoriaSzuro", value: categories[0], bind: { input: "select", options: categories, name: "Kategória: " } },
    ],
    transform: [{ filter: "datum.kategoria == kategoriaSzuro" }],
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "ev", type: "ordinal", title: "Év", sort: [2019, 2020, 2021, 2022, 2023] },
      y: { field: "ertek", type: "quantitative", title: "WEEE mennyiség" },
      xOffset: { field: "orszag", type: "nominal" },
      color: { field: "orszag", type: "nominal", title: "Ország", scale: { domain: ["Románia", "Hollandia"], range: [COMPARISON_COLORS.romania, COMPARISON_COLORS.netherlands] } },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "kategoria", title: "Kategória" },
        { field: "ev", title: "Év" },
        { field: "ertek", title: "Érték", format: "," },
      ],
    },
  });

  const latestYear = Math.max(...values.map((row) => row.ev));
  const latest = values.filter((row) => row.ev === latestYear).sort((a, b) => b.ertek - a.ertek)[0];
  const firstYear = Math.min(...values.map((row) => row.ev));
  if (secondaryNotes.categoryTrend && latest) {
    secondaryNotes.categoryTrend.textContent = `Az oszlopdiagram a WEEE mennyiségek változását mutatja termékkategóriánként, a rendelkezésre álló legkorábbi évvel, ${firstYear}-cel indítva. Az évenként egymás mellé tett oszlopok Románia és Hollandia összehasonlítását segítik. A holland adatsor 2023-ig, a román adatsor 2021-ig tart; ebből az következik, hogy Romániánál az utolsó évek hiányát óvatosan kell kezelni.`;
  }
}

function renderWeeeRecyclingTrend(rows) {
  // ÁBRA: "Ráta trend Románia, Hollandia és EU között".
  // Adatelőkészítés: Eurostat újrahasznosítási CSV; üres cella = hiányzó adat, nem nulla.
  // Renderelés: Vega-Lite vonaldiagram.
  const countryMap = {
    Romania: "Románia",
    Netherlands: "Hollandia",
    "European Union - 27 countries (from 2020)": "EU-27",
  };
  const values = rows
    .map((row) => ({
      orszag: countryMap[normalize(row.geo)] || normalize(row.geo),
      ev: toNumber(row.TIME_PERIOD),
      rata: toNumber(row.OBS_VALUE),
    }))
    // Az üres Eurostat cella hiányzó adat, nem 0; ezért a vonal megszakadhat.
    .filter((row) => ["Románia", "Hollandia", "EU-27"].includes(row.orszag) && Number.isFinite(row.ev) && Number.isFinite(row.rata));

  embedPrimary(secondaryCharts.recyclingTrend, {
    ...primaryBaseSpec(values, 340),
    mark: { type: "line", point: true, strokeWidth: 3 },
    encoding: {
      x: { field: "ev", type: "ordinal", title: "Év", sort: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
      y: { field: "rata", type: "quantitative", title: "Újrahasznosítási ráta (%)", scale: { domainMin: 50 } },
      color: { field: "orszag", type: "nominal", title: null, scale: { domain: ["Románia", "Hollandia", "EU-27"], range: [COMPARISON_COLORS.romania, COMPARISON_COLORS.netherlands, COMPARISON_COLORS.eu] } },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "ev", title: "Év" },
        { field: "rata", title: "Ráta", format: ".1f" },
      ],
    },
  });

  const latestYear = Math.max(...values.map((row) => row.ev));
  const latest = values.filter((row) => row.ev === latestYear).sort((a, b) => b.rata - a.rata);
  if (secondaryNotes.recyclingTrend && latest.length) {
    const romanianLast = values.filter((row) => row.orszag === "Románia").sort((a, b) => b.ev - a.ev)[0];
    secondaryNotes.recyclingTrend.textContent = `A vonaldiagram az újrahasznosítási rátát követi, de az üres romániai 2022-es és 2023-as rekordokat nem rajzolja nullaként, hanem hiányzó adatként kezeli. Románia utolsó elérhető rátája ${romanianLast.ev}-ben ${romanianLast.rata.toFixed(1)}%; ebből az következik, hogy a 2022-2023-as holland és EU-adatokkal már nem közvetlenül összevethető román pont.`;
  }
}

function renderWeeeRecyclingRanking(rows) {
  // ÁBRA: "Újrahasznosítási ráta az utolsó romániai adatévben".
  // Módszer: JS szűrés az utolsó olyan évre, ahol Romániának is van adatpontja.
  // Renderelés: Vega-Lite rangsoroló vízszintes oszlopdiagram.
  const latestYear = Math.max(
    ...rows
      .filter((row) => normalize(row.geo) === "Romania" && Number.isFinite(toNumber(row.OBS_VALUE)))
      .map((row) => toNumber(row.TIME_PERIOD))
  );
  const focus = new Set(["Romania", "Netherlands", "European Union - 27 countries (from 2020)"]);
  const values = rows
    .map((row) => ({
      orszag: normalize(row.geo),
      ev: toNumber(row.TIME_PERIOD),
      rata: toNumber(row.OBS_VALUE),
    }))
    .filter((row) => row.ev === latestYear && Number.isFinite(row.rata))
    .sort((a, b) => b.rata - a.rata)
    .slice(0, 16)
    .concat(
      rows
        .map((row) => ({ orszag: normalize(row.geo), ev: toNumber(row.TIME_PERIOD), rata: toNumber(row.OBS_VALUE) }))
        .filter((row) => row.ev === latestYear && focus.has(row.orszag) && Number.isFinite(row.rata))
    )
    .filter((row, index, array) => array.findIndex((item) => item.orszag === row.orszag) === index)
    .map((row) => ({
      ...row,
      tipus: focus.has(row.orszag) ? "Kiemelt összevetés" : "Top ország",
      label: row.orszag === "European Union - 27 countries (from 2020)" ? "EU-27" : row.orszag,
    }));

  embedPrimary(secondaryCharts.recyclingRanking, {
    ...primaryBaseSpec(values, 380),
    mark: { type: "bar", cornerRadiusEnd: 5 },
    encoding: {
      y: { field: "label", type: "nominal", sort: "-x", title: null },
      x: { field: "rata", type: "quantitative", title: `Újrahasznosítási ráta ${latestYear}-ban (%)` },
      color: { field: "tipus", type: "nominal", title: null, scale: { domain: ["Kiemelt összevetés", "Top ország"], range: [COMPARISON_COLORS.romania, COMPARISON_COLORS.netherlands] } },
      tooltip: [
        { field: "label", title: "Ország" },
        { field: "rata", title: "Ráta", format: ".1f" },
      ],
    },
  });

  const romania = values.find((row) => row.orszag === "Romania");
  const netherlands = values.find((row) => row.orszag === "Netherlands");
  if (secondaryNotes.recyclingRanking && romania && netherlands) {
    secondaryNotes.recyclingRanking.textContent = `A rangsor nem 2023-at, hanem ${latestYear}-et használja, mert ez az utolsó év, ahol Romániának is van újrahasznosítási rátaadata. Magyarország nincs külön kiemelve; a fókusz Románia, Hollandia és az EU-27 összevetése. Hollandia és Románia különbsége ebben az évben ${Math.abs(netherlands.rata - romania.rata).toFixed(1)} százalékpont, ami arra utal, hogy a primer minták országos hulladékkezelési háttere eltérő.`;
  }
}

const eurobarometerCountries = ["EU-27", "Romania", "Netherlands"];
const eurobarometerCountryLabels = {
  "EU-27": "EU-27",
  Romania: "Románia",
  Netherlands: "Hollandia",
};
const eurobarometerCountryColors = {
  "EU-27": COMPARISON_COLORS.eu,
  Romania: COMPARISON_COLORS.romania,
  Netherlands: COMPARISON_COLORS.netherlands,
};
const eurobarometerResponseLabels = {
  "Totally agree": "Teljesen egyetért",
  "Tend to agree": "Inkább egyetért",
  "Tend to disagree": "Inkább nem ért egyet",
  "Totally disagree": "Egyáltalán nem ért egyet",
  "Don't know": "Nem tudja",
  "Better ensuring that products sold on the EU market do not contribute to harming the environment": "EU-piaci termékek környezeti kontrollja",
  "Investing in Research and Development to find technological solutions": "K+F és technológiai megoldások",
  "Providing more information and education to be more environmentally friendly": "Több információ és oktatás",
  "Restoring nature": "Természet helyreállítása",
  "Ensuring that environmental laws are respected": "Környezeti jogszabályok betartatása",
  "Removing government subsidies on activities that pollute": "Szennyező támogatások megszüntetése",
  "Increasing taxation on activities that pollute": "Szennyező tevékenységek adóztatása",
  "Promoting the circular economy through reducing waste, and reusing or recycling products": "Körforgásos gazdaság ösztönzése",
  "None of the above (SPONTANEOUS)": "Egyik sem",
  "Use reusable packaging": "Újrahasználható csomagolás",
  "Correctly sort my waste for recycling": "Hulladék helyes szelektálása",
  "Primarily buy products in recycled packages": "Újrahasznosított csomagolású termék",
  "Primarily buy products that do not have more packaging than necessary": "Kevesebb felesleges csomagolás",
  "None of the above": "Egyik sem",
  "Plastic waste": "Műanyag hulladék",
  "Electronic waste": "Elektronikai hulladék",
  "Battery waste": "Akkumulátorhulladék",
  "Food waste": "Élelmiszer-hulladék",
  "Textile waste": "Textilhulladék",
  "Chemical waste": "Vegyi hulladék",
  "All of these": "Mindegyik",
  "None of these (SPONTANEOUS)": "Egyik sem",
  Yes: "Igen",
  No: "Nem",
};

function eurobarometerRowsForQuestion(rows, questionCode, options = {}) {
  // EUROBAROMETER ADATELŐKÉSZÍTÉS:
  // A PDF-ekből előállított tisztított CSV-ből kérdésenként kiválogatja Románia,
  // Hollandia és EU-27 százalékos válaszait, majd magyar címkékkel látja el őket.
  const exclude = new Set(options.exclude || []);
  return rows
    .filter((row) => row.question_code === questionCode && !exclude.has(row.response))
    .map((row) => ({
      ...row,
      orszag: eurobarometerCountryLabels[row.country] || row.country,
      valasz: eurobarometerResponseLabels[row.response] || row.response,
      arany: toNumber(row.percent),
      sorrend: toNumber(row.response_order),
    }))
    .filter((row) => Number.isFinite(row.arany));
}

function eurobarometerColorScale() {
  return {
    domain: eurobarometerCountries.map((country) => eurobarometerCountryLabels[country]),
    range: eurobarometerCountries.map((country) => eurobarometerCountryColors[country]),
  };
}

function renderEurobarometerQb1(rows) {
  // ÁBRA: QB1 - környezeti ügyek hatása a mindennapi életre és egészségre.
  // Módszer: Eurobarometer százalékok kérdéskód szerinti szűrése.
  // Renderelés: Vega-Lite rétegzett arc/nested pie specifikáció, külön gyűrűvel országonként.
  const values = eurobarometerRowsForQuestion(rows, "QB1", {
    exclude: ["Total 'Agree'", "Total 'Disagree'"],
  }).map((row) => {
    const ring = { "EU-27": 0, Romania: 1, Netherlands: 2 }[row.country];
    return {
      ...row,
      radius2: 58 + ring * 54,
      radius: 100 + ring * 54,
    };
  });
  const countryLabels = [
    { orszag: "EU-27", x: 0, y: -79 },
    { orszag: "Románia", x: 0, y: -133 },
    { orszag: "Hollandia", x: 0, y: -187 },
  ];

  embedPrimary(secondaryCharts.eurobarometerQb1NestedPie, {
    ...primaryBaseSpec(values, 420),
    layer: [
      {
        mark: { type: "arc", stroke: "#f7f5ee", strokeWidth: 2 },
        encoding: {
          theta: { field: "arany", type: "quantitative", stack: true },
          radius: { field: "radius", type: "quantitative", scale: { domain: [0, 220], range: [0, 220] } },
          radius2: { field: "radius2", type: "quantitative", scale: { domain: [0, 220], range: [0, 220] } },
          color: { field: "valasz", type: "nominal", title: "Válasz" },
          opacity: {
            field: "orszag",
            type: "nominal",
            scale: { domain: ["EU-27", "Románia", "Hollandia"], range: [0.62, 0.82, 1] },
            legend: null,
          },
          order: { field: "sorrend", type: "quantitative" },
          tooltip: [
            { field: "orszag", title: "Ország" },
            { field: "valasz", title: "Válasz" },
            { field: "arany", title: "Arány", format: ".1f" },
          ],
        },
      },
      {
        data: { values: countryLabels },
        mark: { type: "rect", width: 76, height: 20, cornerRadius: 4, fill: "#f7f5ee", fillOpacity: 0.92 },
        encoding: {
          x: { field: "x", type: "quantitative", scale: { domain: [-220, 220] }, axis: null },
          y: { field: "y", type: "quantitative", scale: { domain: [-220, 220] }, axis: null },
        },
      },
      {
        data: { values: countryLabels },
        mark: { type: "text", align: "center", baseline: "middle", fontWeight: 900, fontSize: 13, color: "#245c45" },
        encoding: {
          x: { field: "x", type: "quantitative", scale: { domain: [-220, 220] }, axis: null },
          y: { field: "y", type: "quantitative", scale: { domain: [-220, 220] }, axis: null },
          text: { field: "orszag" },
        },
      },
    ],
  });

  if (secondaryNotes.eurobarometerQb1NestedPie) {
    secondaryNotes.eurobarometerQb1NestedPie.textContent = "A beágyazott kördiagram három koncentrikus gyűrűben mutatja ugyanazt a kérdést: belül az EU-27, középen Románia, kívül Hollandia. Az országnevek a gyűrűk felső pontján jelennek meg; az összesítő egyetért és nem ért egyet sorokat nem rajzolja ki, mert azok duplikált kategóriák.";
  }
}

function renderEurobarometerQb2(rows) {
  // ÁBRA: QB2T - leghatékonyabb környezetpolitikai intézkedések.
  // Módszer: Eurobarometer többválaszos százalékok összevetése Románia, Hollandia és EU-27 között.
  // Renderelés: Vega-Lite grouped column chart.
  const values = eurobarometerRowsForQuestion(rows, "QB2T");
  embedPrimary(secondaryCharts.eurobarometerQb2Columns, {
    ...primaryBaseSpec(values, 420),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "valasz", type: "nominal", title: null, sort: { field: "sorrend" }, axis: { labelAngle: -28, labelLimit: 130 } },
      y: { field: "arany", type: "quantitative", title: "Arány (%)" },
      xOffset: { field: "orszag" },
      color: { field: "orszag", type: "nominal", title: null, scale: eurobarometerColorScale() },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "valasz", title: "Válasz" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (secondaryNotes.eurobarometerQb2Columns) {
    secondaryNotes.eurobarometerQb2Columns.textContent = "Az oszlopdiagram a QB2T összesített kérdést használja, vagyis az első négy választás együtt jelenik meg. Ez a forma jól mutatja, hogy Románia, Hollandia és az EU-átlag mely környezetpolitikai eszközöket tartja inkább hatékonynak.";
  }
}

function renderEurobarometerQb6(rows) {
  // ÁBRA: QB6 - hulladékcsökkentési lépések.
  // Módszer: többválaszos Eurobarometer arányok; az összegek meghaladhatják a 100%-ot.
  // Renderelés: Vega-Lite stacked bar chart, reszponzív jelmagyarázattal.
  const values = eurobarometerRowsForQuestion(rows, "QB6");
  embedPrimary(secondaryCharts.eurobarometerQb6Stacked, {
    ...primaryBaseSpec(values, 360),
    mark: { type: "bar", cornerRadiusEnd: 3 },
    encoding: {
      y: { field: "orszag", type: "nominal", title: null, sort: ["EU-27", "Románia", "Hollandia"] },
      x: { field: "arany", type: "quantitative", title: "Választási arányok összege (%)", stack: true },
      color: {
        field: "valasz",
        type: "nominal",
        title: "Vállalás",
        sort: { field: "sorrend" },
        legend: { orient: "bottom", direction: "vertical", columns: 1, labelLimit: 260 },
      },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "valasz", title: "Válasz" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (secondaryNotes.eurobarometerQb6Stacked) {
    secondaryNotes.eurobarometerQb6Stacked.textContent = "A QB6 többválaszos kérdés, ezért a halmozott sávok összege meghaladhatja a 100%-ot. Ez nem hiba: azt mutatja, hogy egy ország válaszadói mennyi különböző hulladékcsökkentési lépést tartanak elképzelhetőnek egyszerre.";
  }
}

function renderEurobarometerQb7(rows) {
  // ÁBRA: QB7T - problémás hulladéktípusok.
  // Módszer: országonkénti százalékos válaszprofil a tisztított Eurobarometer CSV-ből.
  // Renderelés: Vega-Lite vonaldiagram pontjelöléssel.
  const values = eurobarometerRowsForQuestion(rows, "QB7T");
  embedPrimary(secondaryCharts.eurobarometerQb7Dots, {
    ...primaryBaseSpec(values, 380),
    mark: { type: "line", point: { filled: true, size: 80 }, strokeWidth: 3 },
    encoding: {
      x: { field: "valasz", type: "nominal", title: null, sort: { field: "sorrend" }, axis: { labelAngle: -25, labelLimit: 115 } },
      y: { field: "arany", type: "quantitative", title: "Arány (%)" },
      color: { field: "orszag", type: "nominal", title: null, scale: eurobarometerColorScale() },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "valasz", title: "Hulladéktípus" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (secondaryNotes.eurobarometerQb7Dots) {
    secondaryNotes.eurobarometerQb7Dots.textContent = "A vonaldiagram válaszkategóriánként köti össze Románia, Hollandia és az EU-átlag arányait, így jobban látható az országprofilok lefutása. A műanyag hulladék jellemzően magas, az elektronikai és akkumulátorhulladék pedig közvetlenül kapcsolódik a dolgozat e-hulladék fókuszához.";
  }
}

function renderEurobarometerQb8(rows) {
  // ÁBRA: QB8 - fizetési hajlandóság fenntarthatóbb/javíthatóbb termékekért.
  // Módszer: igen/nem/bizonytalan válaszmegoszlások országonként.
  // Renderelés: Vega-Lite 100%-os normalizált stacked bar chart.
  const values = eurobarometerRowsForQuestion(rows, "QB8");
  embedPrimary(secondaryCharts.eurobarometerQb8Share, {
    ...primaryBaseSpec(values, 300),
    mark: { type: "bar", cornerRadiusEnd: 3 },
    encoding: {
      y: { field: "orszag", type: "nominal", title: null, sort: ["EU-27", "Románia", "Hollandia"] },
      x: { field: "arany", type: "quantitative", title: "Megoszlás", stack: "normalize", axis: { format: "%" } },
      color: { field: "valasz", type: "nominal", title: "Válasz", sort: { field: "sorrend" } },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "valasz", title: "Válasz" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (secondaryNotes.eurobarometerQb8Share) {
    secondaryNotes.eurobarometerQb8Share.textContent = "A 100%-os sávdiagram azt mutatja, milyen arányban jelenik meg az igen, nem és bizonytalan válasz a fenntarthatóbb, javíthatóbb vagy újrahasznosíthatóbb termékekért fizetendő felárnál. Ez közvetlen hidat ad a primer kutatás vásárlási és javítási hajlandósági kérdéseihez.";
  }
}

function renderEurobarometerVisualizations(rows) {
  renderEurobarometerQb1(rows);
  renderEurobarometerQb2(rows);
  renderEurobarometerQb6(rows);
  renderEurobarometerQb7(rows);
  renderEurobarometerQb8(rows);
}

async function loadSecondaryData() {
  // MÁSODLAGOS ADATBETÖLTÉS:
  // WEEE, újrahasznosítási ráta és Eurobarometer CSV-k párhuzamos betöltése.
  // A renderelő függvények építik meg az ábránkénti Vega-Lite specifikációkat.
  try {
    const [weeeResponse, recyclingResponse, eurobarometerResponse] = await Promise.all([
      fetch(WEEE_DATA_PATH),
      fetch(WEEE_RECYCLING_PATH),
      fetch(EUROBAROMETER_PATH),
    ]);
    if (!weeeResponse.ok || !recyclingResponse.ok || !eurobarometerResponse.ok) throw new Error("secondary data fetch failed");
    const weeeRows = parseCsv(await weeeResponse.text());
    const recyclingRows = parseCsv(await recyclingResponse.text());
    const eurobarometerRows = parseCsv(await eurobarometerResponse.text());
    renderWeeeCategoryTrend(weeeRows);
    renderWeeeRecyclingTrend(recyclingRows);
    renderWeeeRecyclingRanking(recyclingRows);
    renderEurobarometerVisualizations(eurobarometerRows);
    setupChartDownloadButtons();
  } catch (error) {
    const message = "A másodlagos adatfájlok nem tölthetők be. Indíts helyi webszervert, hogy a CSV-k dinamikusan olvashatók legyenek.";
    [...Object.values(secondaryCharts), ...Object.values(secondaryNotes)].forEach((element) => {
      if (element) element.textContent = message;
    });
  }
}
