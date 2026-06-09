function splitChoices(value) {
  // A többválaszos mezők pontosvesszővel elválasztott válaszokat tartalmaznak.
  return normalize(value)
    .split(";")
    .map((choice) => normalize(choice))
    .filter(Boolean);
}

function renderPrimaryMultiChoice(rows) {
  // ÁBRA: korábbi többválaszos primer nézet.
  // Módszer: többválaszos mezők splitelése, elemszámolás és mintán belüli arányképzés.
  // Renderelés: Vega-Lite oszlopdiagram. A jelenlegi oldal fő többválaszos nézete lentebb külön blokkokban fut.
  const values = multiChoiceQuestions.flatMap((question) => {
    const groupTotals = Object.fromEntries(GROUPS.map((group) => [group, rows.filter((row) => row.group === group && normalize(row[question.key])).length]));
    const counts = {};
    rows.forEach((row) => {
      splitChoices(row[question.key]).forEach((choice) => {
        const key = `${question.label}|||${row.group}|||${choice}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    const applicableProducts =
      question.product === "Minden"
        ? productCategories.map((product) => product.label)
        : ["Minden", question.product];
    return Object.entries(counts).flatMap(([key, count]) => {
      const [kerdes, minta, valasz] = key.split("|||");
      return applicableProducts.map((termek) => ({
        termek,
        kerdes,
        minta,
        valasz,
        darab: count,
        arany: percent(count, groupTotals[minta]),
      }));
    });
  });

  embedPrimary(primaryCharts.multiChoice, {
    ...primaryBaseSpec(values, 360),
    params: [
      { name: "kerdesSzuro", value: multiChoiceQuestions[0].label, bind: { input: "select", options: multiChoiceQuestions.map((question) => question.label), name: "Kérdés: " } },
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    transform: [
      { filter: "datum.kerdes == kerdesSzuro" },
      { filter: "datum.termek == termekSzuro" },
      { window: [{ op: "rank", as: "rank" }], sort: [{ field: "arany", order: "descending" }], groupby: ["minta"] },
      { filter: "datum.rank <= 8" },
    ],
    mark: { type: "bar", cornerRadiusEnd: 5 },
    encoding: {
      y: { field: "valasz", type: "nominal", title: null, sort: "-x" },
      x: { field: "arany", type: "quantitative", title: "Arány a válaszadók között", axis: { format: ".0f" } },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      opacity: { condition: { param: "mintaSzuro", value: 0.86 }, value: 0.18 },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "valasz", title: "Válasz" },
        { field: "darab", title: "Elemszám (háttéradat)" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (primaryNotes.multiChoice) {
    primaryNotes.multiChoice.textContent = "A többválaszos diagramnál a kérdés és a termékkategória is szűrhető. A sávok az adott válasz előfordulási arányát mutatják mintánként, nem nyers elemszámot. Következtetésem: a legnagyobb arányú akadályok és motivációk mutatják meg, hol lenne a legcélszerűbb beavatkozni: ár, kényelem, információ, szervizhálózat vagy leadási infrastruktúra oldalán.";
  }
}

const repairBarrierQuestions = [
  { key: "q19_large_nemt_repair_reason", label: "Nagy eszközök" },
  { key: "q18_it_nemt_repair_reason", label: "Személyes IT" },
  { key: "q17_small_nemt_repair_reason", label: "Kis eszközök" },
];

const disposalPathQuestions = [
  { key: "q11", label: "Nagy eszközök" },
  { key: "q25_it_end_of_life", label: "Személyes IT" },
  { key: "q24_small_end_of_life", label: "Kis eszközök" },
];

const motivationQuestions = [
  { key: "q20_repair_motivation", label: "Javítási motivációk" },
  { key: "q28_dropoff_motivation", label: "Leadási motivációk" },
];

function shareRowsForQuestion(rows, question, categoryLabel = question.label) {
  // TÖBBVÁLASZOS AGGREGÁCIÓ:
  // Kapcsolódó ábrák: "Akadályok és motivációk együtt olvasva", "Mi történik az eszközzel..."
  // A pontosvesszővel elválasztott válaszokból mintán belüli százalékos arányokat készít.
  return GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    const total = groupRows.filter((row) => normalize(row[question.key])).length;
    const counts = {};
    groupRows.forEach((row) => {
      splitChoices(row[question.key]).forEach((choice) => {
        counts[choice] = (counts[choice] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([valasz, darab]) => ({
      termek: categoryLabel,
      minta: group,
      valasz,
      darab,
      arany: percent(darab, total),
    }));
  });
}

function categoryAverageRows(categoryRows) {
  // A "Minden" nézet kategóriaátlag: nem a nyers válaszszámokat keveri össze.
  const grouped = {};
  categoryRows.forEach((row) => {
    const key = `${row.minta}|||${row.valasz}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row.arany);
  });
  return Object.entries(grouped).map(([key, values]) => {
    const [minta, valasz] = key.split("|||");
    return { termek: "Minden", minta, valasz, darab: null, arany: mean(values) };
  });
}

function productChoiceRows(rows, questions) {
  const categoryRows = questions.flatMap((question) => shareRowsForQuestion(rows, question));
  return [...categoryRows, ...categoryAverageRows(categoryRows)];
}

function topChoiceSpec(productField = true) {
  // VEGA-LITE SPECIFIKÁCIÓRÉSZ:
  // Kapcsolódó ábrák: akadályok/motivációk és leadási utak Top nézete.
  // A Vega-Lite window/rank transform csak a vizualizációban rangsorolja a leggyakoribb válaszokat.
  return {
    transform: [
      ...(productField ? [{ filter: "datum.termek == termekSzuro" }] : []),
      { window: [{ op: "rank", as: "rank" }], sort: [{ field: "arany", order: "descending" }], groupby: ["minta"] },
      { filter: "datum.rank <= 7" },
    ],
    mark: { type: "bar", cornerRadiusEnd: 5 },
    encoding: {
      y: { field: "valasz", type: "nominal", title: null, sort: "-x" },
      x: { field: "arany", type: "quantitative", title: "Arány a válaszadók között (%)", axis: { format: ".0f" } },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      opacity: { condition: { param: "mintaSzuro", value: 0.86 }, value: 0.18 },
      tooltip: [
        { field: "minta", title: "Minta" },
        ...(productField ? [{ field: "termek", title: "Termékkategória" }] : []),
        { field: "valasz", title: "Válasz" },
        { field: "darab", title: "Elemszám (háttéradat)" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  };
}

function comparisonColumnSpec(productField = true) {
  // VEGA-LITE SPECIFIKÁCIÓRÉSZ:
  // Kapcsolódó ábrák: akadályok/motivációk és leadási utak Országösszevetés nézete.
  // Itt nem stacked chart készül, hanem kategóriánként egymás melletti oszlop Romániának és Hollandiának.
  return {
    transform: productField ? [{ filter: "datum.termek == termekSzuro" }] : [],
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: {
        field: "valasz",
        type: "nominal",
        title: null,
        sort: { field: "arany", order: "descending" },
        axis: { labelAngle: -30, labelLimit: 120 },
      },
      y: { field: "arany", type: "quantitative", title: "Arány a válaszadók között (%)", axis: { format: ".0f" } },
      xOffset: { field: "minta" },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      tooltip: [
        { field: "minta", title: "Minta" },
        ...(productField ? [{ field: "termek", title: "Termékkategória" }] : []),
        { field: "valasz", title: "Válasz" },
        { field: "darab", title: "Elemszám (háttéradat)" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  };
}

function setChartViewToggle(toggle, selectedView, onChange) {
  if (!toggle) return;
  toggle.querySelectorAll("button").forEach((button) => {
    const isActive = button.dataset.view === selectedView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.onclick = () => onChange(button.dataset.view);
  });
}

function renderPrimaryBarrierMotivation(rows) {
  // ÁBRA: "Akadályok és motivációk együtt olvasva".
  // Módszer: JS többválaszos aggregáció, Top vagy Országösszevetés nézettel.
  // Renderelés: Vega-Lite bar chart; a motivációknál az 1 darabos válaszopciók szűrve vannak.
  setChartViewToggle(primaryBarrierViewToggle, primaryBarrierView, (view) => {
    primaryBarrierView = view;
    renderPrimaryBarrierMotivation(rows);
  });
  setChartViewToggle(primaryMotivationViewToggle, primaryMotivationView, (view) => {
    primaryMotivationView = view;
    renderPrimaryBarrierMotivation(rows);
  });

  const barrierSpec = primaryBarrierView === "compare" ? comparisonColumnSpec(true) : topChoiceSpec(true);
  embedPrimary(primaryCharts.barrierChoice, {
    ...primaryBaseSpec(productChoiceRows(rows, repairBarrierQuestions), primaryBarrierView === "compare" ? 390 : 330),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      ...(primaryBarrierView === "top" ? [{ name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" }] : []),
    ],
    ...barrierSpec,
  });

  const motivationValues = motivationQuestions.flatMap((question) =>
    shareRowsForQuestion(rows, question, question.label).map((row) => ({ ...row, kerdes: question.label }))
  ).filter((row) => row.darab > 1);
  const motivationSpec = primaryMotivationView === "compare" ? comparisonColumnSpec(false) : topChoiceSpec(false);
  embedPrimary(primaryCharts.motivationChoice, {
    ...primaryBaseSpec(motivationValues, primaryMotivationView === "compare" ? 390 : 330),
    params: [
      { name: "kerdesSzuro", value: motivationQuestions[0].label, bind: { input: "select", options: motivationQuestions.map((question) => question.label), name: "Motiváció: " } },
      ...(primaryMotivationView === "top" ? [{ name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" }] : []),
    ],
    transform: [{ filter: "datum.kerdes == kerdesSzuro" }, ...motivationSpec.transform],
    mark: motivationSpec.mark,
    encoding: motivationSpec.encoding,
  });

  if (primaryNotes.barrierMotivation) {
    primaryNotes.barrierMotivation.textContent = "A Top nézet a mintánként leggyakoribb válaszokat rangsorolja. Az Országösszevetés nézet minden kategóriánál egymás mellé teszi a romániai és holland mintát, ezért közvetlenül látszik, melyik országban mi a legelterjedtebb és mekkora az aránykülönbség. A motivációs ábrákból kimaradnak azok a válaszopciók, amelyeket az adott mintában csak egy válaszadó jelölt. A „Minden” termékszűrő kategóriaátlag, nem nyers elemszám.";
  }
}

function renderPrimaryDisposalPath(rows) {
  // ÁBRA: "Mi történik az eszközzel az életciklus végén?"
  // Módszer: JS többválaszos/kategóriaarány aggregáció termékkategóriánként.
  // Renderelés: Vega-Lite bar chart Top vagy Országösszevetés nézettel.
  setChartViewToggle(primaryDisposalViewToggle, primaryDisposalView, (view) => {
    primaryDisposalView = view;
    renderPrimaryDisposalPath(rows);
  });
  const disposalSpec = primaryDisposalView === "compare" ? comparisonColumnSpec(true) : topChoiceSpec(true);
  embedPrimary(primaryCharts.disposalPath, {
    ...primaryBaseSpec(productChoiceRows(rows, disposalPathQuestions), primaryDisposalView === "compare" ? 390 : 340),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      ...(primaryDisposalView === "top" ? [{ name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" }] : []),
    ],
    ...disposalSpec,
  });

  if (primaryNotes.disposalPath) {
    primaryNotes.disposalPath.textContent = "Ez az ábra azt mutatja, milyen utakra kerülnek a termékek az életciklus végén. A Top nézet a leggyakoribb leadási utakat emeli ki, az Országösszevetés pedig kategóriánként külön romániai és holland oszlopot mutat. Így jobban látszik, hol erősebb a hivatalos leadási út, és hol dominálnak inkább az informális vagy otthon tartási megoldások.";
  }
}

function renderPrimaryDropoffKnowledge(rows) {
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    const total = groupRows.filter((row) => normalize(row.q27_knews_dropoff)).length;
    const counts = countBy(groupRows, "q27_knews_dropoff");
    return Object.entries(counts)
      .filter(([answer]) => normalize(answer))
      .map(([answer, darab]) => ({
        minta: group,
        valasz: normalize(answer),
        darab,
        arany: percent(darab, total),
      }));
  });

  embedPrimary(primaryCharts.dropoffKnowledge, {
    ...primaryBaseSpec(values, 300),
    facet: {
      column: { field: "minta", type: "nominal", title: null, sort: GROUPS, header: { labelFontWeight: 800, labelColor: "#245c45" } },
    },
    spec: {
      mark: { type: "arc", innerRadius: 42, stroke: "#ffffff", strokeWidth: 2 },
      encoding: {
        theta: { field: "arany", type: "quantitative", stack: true },
        color: {
          field: "valasz",
          type: "nominal",
          title: "Válasz",
          scale: { domain: ["Igen", "Nem"], range: ["#245c45", "#b66f45"] },
        },
        tooltip: [
          { field: "minta", title: "Minta" },
          { field: "valasz", title: "Válasz" },
          { field: "arany", title: "Arány", format: ".1f" },
          { field: "darab", title: "Elemszám" },
        ],
      },
    },
    resolve: { scale: { color: "shared" } },
  });

}

function renderPrimaryRepairQuality(rows) {
  // ÁBRA: "Hibátlan és apró hibás eszközök elfogadása".
  // Módszer: q22 és q23 Likert-átlagok termékkategóriánként és mintánként.
  // Renderelés: Vega-Lite grouped column chart, 0-tól induló y-skálával.
  const fullMetric = scaleMetrics.find((metric) => metric.key === "fullRepair");
  const imperfectMetric = scaleMetrics.find((metric) => metric.key === "imperfectRepair");
  const values = productCategories.flatMap((product) =>
    GROUPS.flatMap((group) => {
      const groupRows = rows.filter((row) => row.group === group);
      return [
        { termek: product.label, minta: group, allapot: "Hibátlan javítás után", allapotRovid: "Hibátlan", atlag: mean(groupRows.map((row) => metricValueForProduct(row, fullMetric, product))) },
        { termek: product.label, minta: group, allapot: "Apró hibákkal javítás után", allapotRovid: "Apró hibás", atlag: mean(groupRows.map((row) => metricValueForProduct(row, imperfectMetric, product))) },
      ];
    })
  );

  embedPrimary(primaryCharts.repairQuality, {
    ...primaryBaseSpec(values, 340),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    transform: [{ filter: "datum.termek == termekSzuro" }],
    mark: { type: "bar", cornerRadiusEnd: 5 },
    encoding: {
      x: { field: "allapotRovid", type: "nominal", title: null, sort: ["Hibátlan", "Apró hibás"], axis: { labelAngle: 0 } },
      y: { field: "atlag", type: "quantitative", title: "Átlagos elfogadási hajlandóság", scale: { domain: [0, 6] } },
      xOffset: { field: "minta" },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      opacity: { condition: { param: "mintaSzuro", value: 0.9 }, value: 0.18 },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "termek", title: "Termékkategória" },
        { field: "allapot", title: "Javítás utáni állapot" },
        { field: "atlag", title: "Átlag", format: ".2f" },
      ],
    },
  });

  if (primaryNotes.repairQuality) {
    primaryNotes.repairQuality.textContent = "Az ábra a q22 és q23 kérdések 1-6-os skáláinak átlagát hasonlítja össze: külön a hibátlanul javított eszközöket, illetve azokat, amelyek kisebb esztétikai vagy működési hibával maradnak használhatók. Következtetésem: a két oszlop közötti távolság azt jelzi, mennyire törékeny a javított termék elfogadása; ha az apró hibás állapot erősen visszaesik, akkor a garancia, bizalom és minőségkommunikáció különösen fontos.";
  }
}
