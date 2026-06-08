const canvas = document.querySelector("#cycleCanvas");
const year = document.querySelector("#year");
const navLinks = [...document.querySelectorAll(".nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const sourceBars = document.querySelector("#sourceBars");
const groupCounts = document.querySelector("#groupCounts");
const attributeControls = document.querySelector("#attributeControls");
const comparisonChart = document.querySelector("#comparisonChart");
const profileCards = document.querySelector("#profileCards");
const conclusions = document.querySelector("#conclusions");
const totalResponses = document.querySelector("#totalResponses");
const primaryCharts = {
  heatmap: document.querySelector("#primaryHeatmap"),
  histogram: document.querySelector("#primaryHistogram"),
  bubble: document.querySelector("#primaryBubble"),
  candles: document.querySelector("#primaryCandles"),
  correlation: document.querySelector("#primaryCorrelation"),
  clusterProfile: document.querySelector("#primaryClusterProfile"),
  multiChoice: document.querySelector("#primaryMultiChoice"),
};
const primaryNotes = {
  heatmap: document.querySelector("#primaryHeatmapNote"),
  histogram: document.querySelector("#primaryHistogramNote"),
  bubble: document.querySelector("#primaryBubbleNote"),
  candles: document.querySelector("#primaryCandlesNote"),
  correlation: document.querySelector("#primaryCorrelationNote"),
  clusterProfile: document.querySelector("#primaryClusterProfileNote"),
  multiChoice: document.querySelector("#primaryMultiChoiceNote"),
};
const secondaryCharts = {
  categoryTrend: document.querySelector("#weeeCategoryTrend"),
  recyclingTrend: document.querySelector("#weeeRecyclingTrend"),
  recyclingRanking: document.querySelector("#weeeRecyclingRanking"),
};
const secondaryNotes = {
  categoryTrend: document.querySelector("#weeeCategoryTrendNote"),
  recyclingTrend: document.querySelector("#weeeRecyclingTrendNote"),
  recyclingRanking: document.querySelector("#weeeRecyclingRankingNote"),
};

const DATA_PATH = "../data/cleaned/master_dataset_harmonized3.csv";
const WEEE_DATA_PATH = "../data/weee_data.csv";
const WEEE_RECYCLING_PATH = "../data/weee_recycling rate.csv";
const GROUPS = ["Romániai minta", "Holland minta"];
const GROUP_COLORS = {
  "Romániai minta": "#b66f45",
  "Holland minta": "#2f7f7b",
};
const BUBBLE_GROUP_COLORS = {
  "Romániai minta": "#b66f45",
  "Holland minta": "#2f7f7b",
};
const COMPARISON_COLORS = {
  romania: "#b66f45",
  netherlands: "#2f7f7b",
  eu: "#52635d",
};
const sourceLabels = {
  Hungary: "Magyar kitöltés",
  Romania: "Román kitöltés",
  Netherlands: "Holland kitöltés",
};

const attributes = [
  { key: "age", label: "Életkor", order: ["18 - 24", "25 - 34", "35 - 44", "45 - 65"] },
  { key: "gender", label: "Nem", order: ["Nő", "Férfi", "Egyéb / nem kíván válaszolni"] },
  {
    key: "education",
    label: "Végzettség",
    order: [
      "Középiskola / Érettségi",
      "Szakképesítés",
      "Főiskola / Egyetemi diploma (BA/BSc)",
      "Mesterképzés vagy magasabb (MA/MSc/PhD)",
    ],
  },
  {
    key: "residence",
    label: "Lakóhely",
    order: [
      "Nagyváros (100 000 lakos fölött)",
      "Város (20 000 - 100 000 lakos)",
      "Kisváros / Község (20 000 lakos alatt)",
      "Vidéki terület / falu",
    ],
  },
  {
    key: "household_size",
    label: "Háztartásméret",
    order: ["1 fő (egyedül élek)", "2 fő", "3-4 fő", "5 vagy több fő"],
  },
];

const scaleMetrics = [
  { key: "attitude", label: "Környezeti attitűd", fields: ["q01_env_concern", "q02_nem_harm_decisions", "q03_follow_nemrms", "q04_sustainable_society"] },
  { key: "replacement", label: "Cseregyakoriság", fields: ["q09_replace_frequency_large_household", "q09_replace_frequency_personal_it", "q09_replace_frequency_small"] },
  { key: "rentShare", label: "Bérlés/megosztás nyitottság", fields: ["q14_open_to_rent_share_large_household", "q14_open_to_rent_share_personal_it", "q14_open_to_rent_share_small"] },
  { key: "durability", label: "Tartósság fontossága", fields: ["q15_importance_durability_large_household", "q15_importance_durability_personal_it", "q15_importance_durability_small"] },
  { key: "repair", label: "Javítási rutin", fields: ["q16_usually_repair_large_household", "q16_usually_repair_personal_it", "q16_usually_repair_small"] },
  { key: "fullRepair", label: "Teljes javítás elfogadása", fields: ["q22_willing_after_full_repair_large_household", "q22_willing_after_full_repair_personal_it", "q22_willing_after_full_repair_small"] },
  { key: "imperfectRepair", label: "Tökéletlen javítás elfogadása", fields: ["q23_willing_after_imperfect_repair_large_household", "q23_willing_after_imperfect_repair_personal_it", "q23_willing_after_imperfect_repair_small"] },
  { key: "futureDisposal", label: "Jövőbeni felelős leadás", fields: ["q30_willing_future_disposal"] },
];

const productCategories = [
  { key: "all", label: "Minden", index: null },
  { key: "large", label: "Nagy eszközök", index: 0 },
  { key: "personalIt", label: "Személyes IT", index: 1 },
  { key: "small", label: "Kis eszközök", index: 2 },
];

const attitudeItems = [
  { key: "q01_env_concern", label: "Környezeti aggodalom" },
  { key: "q02_nem_harm_decisions", label: "Döntések környezeti hatása" },
  { key: "q03_follow_nemrms", label: "Normakövetés" },
  { key: "q04_sustainable_society", label: "Fenntartható társadalom" },
];

const behaviorMetrics = scaleMetrics.filter((metric) => metric.key !== "attitude");

const multiChoiceQuestions = [
  { key: "q20_repair_motivation", label: "Javítási motivációk", product: "Minden" },
  { key: "q28_dropoff_motivation", label: "Leadási motivációk", product: "Minden" },
  { key: "q29_dropoff_barrier", label: "Leadási akadályok", product: "Minden" },
  { key: "q19_large_nemt_repair_reason", label: "Nagy eszköz javítási akadály", product: "Nagy eszközök" },
  { key: "q18_it_nemt_repair_reason", label: "IT eszköz javítási akadály", product: "Személyes IT" },
  { key: "q17_small_nemt_repair_reason", label: "Kis eszköz javítási akadály", product: "Kis eszközök" },
  { key: "q11", label: "Nagy eszköz életciklus vége", product: "Nagy eszközök" },
  { key: "q25_it_end_of_life", label: "IT eszköz életciklus vége", product: "Személyes IT" },
  { key: "q24_small_end_of_life", label: "Kis eszköz életciklus vége", product: "Kis eszközök" },
];

const educationScores = {
  "Középiskola / Érettségi": 1,
  "Szakképesítés": 2,
  "Főiskola / Egyetemi diploma (BA/BSc)": 3,
  "Mesterképzés vagy magasabb (MA/MSc/PhD)": 4,
};

const incomeScores = {
  "600 € alatt": 1,
  "600–1 000 €": 2,
  "1 001–1 600 €": 3,
  "1 601–2 400 €": 4,
  "2 400 € felett": 5,
};

let selectedAttribute = attributes[0].key;
let surveyRows = [];

if (year) {
  year.textContent = new Date().getFullYear();
}

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift().map(normalize);
  return rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, normalize(cells[index])]))
  );
}

function groupName(row) {
  return row.country === "Netherlands" ? "Holland minta" : "Romániai minta";
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = normalize(row[key]) || "Nincs válasz";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function percent(count, total) {
  return total ? (count / total) * 100 : 0;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getGroupRows(rows, group) {
  return rows.filter((row) => groupName(row) === group);
}

function orderedCategories(attribute, rows) {
  const found = new Set(rows.map((row) => normalize(row[attribute.key])).filter(Boolean));
  const ordered = attribute.order.filter((item) => found.has(item));
  const extra = [...found].filter((item) => !ordered.includes(item)).sort((a, b) => a.localeCompare(b, "hu"));
  return [...ordered, ...extra];
}

function renderSourceBars(rows) {
  const counts = countBy(rows, "country");
  const total = rows.length;
  const countries = ["Hungary", "Romania", "Netherlands"];
  const labels = countries.map((country) => sourceLabels[country]);
  const values = countries.map((country) => counts[country] || 0);
  const percentages = values.map((value) => percent(value, total));

  if (!window.demographyFigures) {
    sourceBars.innerHTML = `<p class="data-error">A demográfiai ábrák kódja nem tölthető be.</p>`;
    return;
  }

  window.demographyFigures.renderSourceBars(sourceBars, {
    labels,
    values,
    percentages,
    percentLabels: percentages.map(formatPercent),
    colors: ["#245c45", "#b66f45", "#2f7f7b"],
  });
}

function renderGroupCounts(rows) {
  const romania = getGroupRows(rows, "Romániai minta").length;
  const netherlands = getGroupRows(rows, "Holland minta").length;

  groupCounts.innerHTML = `
    <span><strong>${romania}</strong> romániai minta</span>
    <span><strong>${netherlands}</strong> holland minta</span>
  `;
}

function renderControls() {
  attributeControls.innerHTML = attributes
    .map(
      (attribute) => `
        <button class="${attribute.key === selectedAttribute ? "active" : ""}" type="button" data-attribute="${attribute.key}">
          ${attribute.label}
        </button>
      `
    )
    .join("");

  attributeControls.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedAttribute = button.dataset.attribute;
      renderDemography();
    });
  });
}

function renderComparisonChart(rows) {
  const attribute = attributes.find((item) => item.key === selectedAttribute);
  const categories = orderedCategories(attribute, rows);
  const groupTotals = Object.fromEntries(GROUPS.map((group) => [group, getGroupRows(rows, group).length]));
  const groupedCounts = Object.fromEntries(
    GROUPS.map((group) => [group, countBy(getGroupRows(rows, group), attribute.key)])
  );

  if (!window.demographyFigures) {
    comparisonChart.innerHTML = `<p class="data-error">A demográfiai ábrák kódja nem tölthető be.</p>`;
    return;
  }

  const chartData = {
    attributeLabel: attribute.label,
    categories,
    groups: GROUPS,
    colors: GROUP_COLORS,
    counts: {},
    percentages: {},
    percentLabels: {},
  };

  GROUPS.forEach((group) => {
    chartData.counts[group] = categories.map((category) => groupedCounts[group][category] || 0);
    chartData.percentages[group] = chartData.counts[group].map((count) => percent(count, groupTotals[group]));
    chartData.percentLabels[group] = chartData.percentages[group].map(formatPercent);
  });

  window.demographyFigures.renderComparisonChart(comparisonChart, chartData);
}

function share(rows, key, acceptedValues) {
  const accepted = new Set(acceptedValues);
  const count = rows.filter((row) => accepted.has(normalize(row[key]))).length;
  return percent(count, rows.length);
}

function renderProfileCards(rows) {
  const metrics = GROUPS.map((group) => {
    const groupRows = getGroupRows(rows, group);
    return {
      group,
      total: groupRows.length,
      women: share(groupRows, "gender", ["Nő"]),
      young: share(groupRows, "age", ["18 - 24"]),
      urban: share(groupRows, "residence", ["Nagyváros (100 000 lakos fölött)", "Város (20 000 - 100 000 lakos)"]),
      higher: share(groupRows, "education", [
        "Főiskola / Egyetemi diploma (BA/BSc)",
        "Mesterképzés vagy magasabb (MA/MSc/PhD)",
      ]),
    };
  });

  profileCards.innerHTML = metrics
    .map(
      (metric) => `
        <article class="profile-card">
          <span>${metric.group}</span>
          <strong>${metric.total} válaszadó</strong>
          <dl>
            <div><dt>Nők aránya</dt><dd>${formatPercent(metric.women)}</dd></div>
            <div><dt>18-24 évesek</dt><dd>${formatPercent(metric.young)}</dd></div>
            <div><dt>Városi válaszadók</dt><dd>${formatPercent(metric.urban)}</dd></div>
            <div><dt>Felsőfokú végzettség</dt><dd>${formatPercent(metric.higher)}</dd></div>
          </dl>
        </article>
      `
    )
    .join("");
}

function logGamma(value) {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];

  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }

  let x = 0.9999999999998099;
  const adjusted = value - 1;

  coefficients.forEach((coefficient, index) => {
    x += coefficient / (adjusted + index + 1);
  });

  const t = adjusted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (adjusted + 0.5) * Math.log(t) - t + Math.log(x);
}

function regularizedGammaP(a, x) {
  if (x <= 0) return 0;

  let sum = 1 / a;
  let term = sum;

  for (let n = 1; n < 100; n += 1) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 1e-12) break;
  }

  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function regularizedGammaQ(a, x) {
  if (x <= 0) return 1;

  let b = x + 1 - a;
  let c = 1 / Number.MIN_VALUE;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i < 100; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < Number.MIN_VALUE) d = Number.MIN_VALUE;
    c = b + an / c;
    if (Math.abs(c) < Number.MIN_VALUE) c = Number.MIN_VALUE;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-12) break;
  }

  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

function chiSquarePValue(chiSquare, degreesOfFreedom) {
  if (degreesOfFreedom <= 0) return 1;
  const a = degreesOfFreedom / 2;
  const x = chiSquare / 2;
  return x < a + 1 ? 1 - regularizedGammaP(a, x) : regularizedGammaQ(a, x);
}

function analyzeDemographicAttribute(rows, attribute) {
  const categories = orderedCategories(attribute, rows);
  const observed = GROUPS.map((group) => {
    const groupRows = getGroupRows(rows, group);
    const counts = countBy(groupRows, attribute.key);
    return categories.map((category) => counts[category] || 0);
  });
  const rowTotals = observed.map((row) => row.reduce((sum, value) => sum + value, 0));
  const columnTotals = categories.map((_, columnIndex) =>
    observed.reduce((sum, row) => sum + row[columnIndex], 0)
  );
  const total = rowTotals.reduce((sum, value) => sum + value, 0);

  if (!total || categories.length < 2) {
    return {
      attribute: attribute.label,
      v: 0,
      chiSquare: 0,
      degreesOfFreedom: 0,
      pValue: 1,
      categories,
      observed,
    };
  }

  let chiSquare = 0;
  observed.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const expected = (rowTotals[rowIndex] * columnTotals[columnIndex]) / total;
      if (expected > 0) {
        chiSquare += (value - expected) ** 2 / expected;
      }
    });
  });

  const rowCount = observed.length;
  const columnCount = categories.length;
  const degreesOfFreedom = (rowCount - 1) * (columnCount - 1);
  const cramerDenominator = Math.min(rowCount - 1, columnCount - 1);
  const phiSquared = chiSquare / total;
  const v = cramerDenominator > 0 ? Math.sqrt(phiSquared / cramerDenominator) : 0;
  const pValue = chiSquarePValue(chiSquare, degreesOfFreedom);

  return {
    attribute: attribute.label,
    v,
    chiSquare,
    degreesOfFreedom,
    pValue,
    categories,
    observed,
  };
}

function comparabilityMetrics(rows) {
  const effects = attributes.map((attribute) => analyzeDemographicAttribute(rows, attribute));
  const meanV = effects.reduce((sum, effect) => sum + effect.v, 0) / effects.length;
  const significantEffects = effects.filter((effect) => effect.pValue < 0.05);
  const strongestEffect = [...effects].sort((a, b) => b.v - a.v)[0];

  return {
    meanV,
    significantEffects,
    strongestEffect,
    effects,
  };
}

function cramerEffectLabel(value) {
  if (value < 0.1) return "elhanyagolható";
  if (value < 0.3) return "gyenge";
  if (value < 0.5) return "közepes";
  return "erős";
}

function formatPValue(value) {
  if (value < 0.001) return "< 0.001";
  return value.toFixed(3);
}

function renderCramerBreakdown(metrics) {
  const rows = metrics.effects
    .map(
      (effect) => `
        <tr>
          <td>${effect.attribute}</td>
          <td>${effect.chiSquare.toFixed(2)}</td>
          <td>${effect.degreesOfFreedom}</td>
          <td>${formatPValue(effect.pValue)}</td>
          <td>${effect.pValue < 0.05 ? "igen" : "nem"}</td>
          <td><strong>${effect.v.toFixed(3)}</strong></td>
          <td>${cramerEffectLabel(effect.v)}</td>
        </tr>
      `
    )
    .join("");

  const contingencyTables = metrics.effects
    .map(
      (effect) => `
        <article class="cramer-mini-table">
          <h4>${effect.attribute}</h4>
          <table>
            <thead>
              <tr>
                <th>Kategória</th>
                <th>Romániai minta</th>
                <th>Holland minta</th>
              </tr>
            </thead>
            <tbody>
              ${effect.categories
                .map(
                  (category, index) => `
                    <tr>
                      <td>${category}</td>
                      <td>${effect.observed[0][index]}</td>
                      <td>${effect.observed[1][index]}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </article>
      `
    )
    .join("");

  return `
    <details class="cramer-details">
      <summary>Khi-négyzet próba és Cramér-féle V teljes lebontása</summary>
      <div class="cramer-explanation">
        <p>
          Minden demográfiai változóra külön Khi-négyzet próbát végzünk. A próba azt vizsgálja,
          hogy a romániai és holland minta megoszlása statisztikailag eltér-e az adott változó
          kategóriái mentén.
        </p>
        <p>
          A szignifikancia után a Cramér-féle V mutatja meg a gyakorlati jelentőséget:
          V = sqrt(χ² / (n · min(r-1, c-1))). Ez 0 és 1 közötti hatásméret, ahol a nagyobb
          érték erősebb demográfiai különbséget jelez.
        </p>
        <p>
          Értelmezés: p < 0.05 esetén a különbség statisztikailag szignifikáns. A gyakorlati
          jelentőség a V alapján olvasható: 0.1 alatt elhanyagolható, 0.1-0.3 gyenge,
          0.3-0.5 közepes, 0.5 felett erős hatás.
        </p>
      </div>
      <div class="cramer-table-wrap">
        <table class="cramer-summary-table">
          <thead>
            <tr>
              <th>Attribútum</th>
              <th>χ²</th>
              <th>df</th>
              <th>p-érték</th>
              <th>Szignifikáns</th>
              <th>Cramér V</th>
              <th>Gyakorlati jelentőség</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="cramer-contingencies">${contingencyTables}</div>
    </details>
  `;
}

function renderConclusions(rows) {
  const metrics = comparabilityMetrics(rows);
  const sampleRatio = getGroupRows(rows, "Romániai minta").length / getGroupRows(rows, "Holland minta").length;
  const effectLabel = cramerEffectLabel(metrics.meanV);
  const significantCount = metrics.significantEffects.length;
  const practicalEffects = metrics.effects.filter((effect) => effect.v >= 0.3);
  const verdict =
    significantCount === 0
      ? "A Khi-négyzet próbák alapján nincs statisztikailag kimutatható demográfiai eltérés a két minta között."
      : practicalEffects.length === 0
        ? "Van statisztikailag szignifikáns demográfiai eltérés, de a Cramér-féle V alapján a gyakorlati jelentősége gyenge."
        : "A Khi-négyzet próba és a Cramér-féle V alapján van olyan demográfiai eltérés, amely gyakorlati szempontból is figyelmet igényel.";

  conclusions.innerHTML = `
    <article>
      <span class="conclusion-number">${significantCount}/${metrics.effects.length}</span>
      <h3>Khi-négyzet próba</h3>
      <p>${verdict}</p>
    </article>
    <article>
      <span class="conclusion-number">${metrics.strongestEffect.v.toFixed(2)}</span>
      <h3>Legnagyobb hatásméret</h3>
      <p>A legerősebb gyakorlati különbség a(z) ${metrics.strongestEffect.attribute.toLowerCase()} változónál látszik: ${cramerEffectLabel(metrics.strongestEffect.v)} hatás.</p>
    </article>
    <article>
      <span class="conclusion-number">${metrics.meanV.toFixed(2)}</span>
      <h3>Átlagos gyakorlati hatás</h3>
      <p>Az öt demográfiai változó átlagos Cramér V értéke ${effectLabel}. A mintanagyság aránya: ${sampleRatio.toFixed(1)}x.</p>
    </article>
    ${renderCramerBreakdown(metrics)}
  `;
}

function toNumber(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function mean(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function metricValue(row, metric) {
  return mean(metric.fields.map((field) => toNumber(row[field])));
}

function metricValueForProduct(row, metric, product) {
  if (product.index === null || metric.fields.length !== 3) {
    return metricValue(row, metric);
  }
  return toNumber(row[metric.fields[product.index]]);
}

function enrichedPrimaryRows(rows) {
  const enriched = rows.map((row, index) => {
    const values = Object.fromEntries(scaleMetrics.map((metric) => [metric.key, metricValue(row, metric)]));
    return {
      ...row,
      respondentId: index + 1,
      group: groupName(row),
      circularity: mean([values.attitude, values.rentShare, values.durability, values.repair, values.fullRepair, values.futureDisposal]),
      usedPurchaseCount: ["q10_bought_used_large_household", "q10_bought_used_personal_it", "q10_bought_used_small"].filter((field) => normalize(row[field]).toLowerCase() === "igen").length,
      knowsDropoff: normalize(row.q27_knews_dropoff).toLowerCase() === "igen" ? 1 : 0,
      educationScore: educationScores[normalize(row.education)] || null,
      incomeScore: incomeScores[normalize(row.household_income_eur)] || null,
      ...values,
    };
  });

  const clustered = assignKMeansClusters(enriched);
  return clustered;
}

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}

function assignKMeansClusters(rows) {
  const features = ["attitude", "rentShare", "durability", "repair", "fullRepair", "imperfectRepair", "futureDisposal"];
  const complete = rows
    .map((row, index) => ({ row, index, vector: features.map((field) => row[field]) }))
    .filter((item) => item.vector.every((value) => Number.isFinite(value)));

  if (complete.length < 3) {
    return rows.map((row) => ({ ...row, cluster: "Kevés adat" }));
  }

  const k = 3;
  let centroids = [
    complete[0].vector,
    complete[Math.floor(complete.length / 2)].vector,
    complete[complete.length - 1].vector,
  ].map((vector) => [...vector]);
  let assignments = new Array(complete.length).fill(0);

  for (let iteration = 0; iteration < 35; iteration += 1) {
    assignments = complete.map((item) => {
      const distances = centroids.map((centroid) => euclideanDistance(item.vector, centroid));
      return distances.indexOf(Math.min(...distances));
    });

    centroids = centroids.map((centroid, clusterIndex) => {
      const members = complete.filter((_, index) => assignments[index] === clusterIndex);
      if (!members.length) return centroid;
      return centroid.map((_, featureIndex) => mean(members.map((member) => member.vector[featureIndex])));
    });
  }

  const clusterScores = centroids.map((centroid, index) => ({ index, score: mean(centroid) || 0 })).sort((a, b) => a.score - b.score);
  const labels = ["Óvatos lineáris", "Átmeneti pragmatikus", "Körforgásos nyitott"];
  const labelByCluster = Object.fromEntries(clusterScores.map((cluster, index) => [cluster.index, labels[index]]));
  const clusterByOriginalIndex = Object.fromEntries(complete.map((item, index) => [item.index, labelByCluster[assignments[index]]]));

  return rows.map((row, index) => ({ ...row, cluster: clusterByOriginalIndex[index] || "Hiányos adat" }));
}

function primaryBaseSpec(values, height = 340) {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    background: "transparent",
    width: "container",
    height,
    data: { values },
    config: {
      view: { stroke: null },
      axis: {
        labelColor: "#52635d",
        titleColor: "#1d2522",
        gridColor: "rgba(36, 92, 69, 0.12)",
        domain: false,
        tickColor: "rgba(36, 92, 69, 0.16)",
      },
      legend: { labelColor: "#52635d", titleColor: "#1d2522", orient: "top" },
      range: { category: ["#245c45", "#2f7f7b", "#b66f45", "#d6a84f", "#7c9a4f"] },
    },
  };
}

function embedPrimary(element, spec) {
  if (!element) return;
  if (!window.vegaEmbed) {
    element.innerHTML = `<p class="data-error">A Vega-Embed könyvtár nem tölthető be.</p>`;
    return;
  }
  window.vegaEmbed(element, spec, {
    renderer: "svg",
    actions: { export: true, source: false, compiled: false, editor: false },
  });
}

function averageBy(items, key) {
  const groups = {};
  items.forEach((item) => {
    const group = item[key];
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  });
  return groups;
}

function renderPrimaryHeatmap(rows) {
  const values = productCategories.flatMap((product) =>
    GROUPS.flatMap((group) =>
      scaleMetrics.map((metric) => {
        const groupRows = rows.filter((row) => row.group === group);
        const scores = groupRows.map((row) => metricValueForProduct(row, metric, product)).filter((value) => Number.isFinite(value));
        return {
          termek: product.label,
          minta: group,
          dimenzio: metric.label,
          atlag: mean(scores),
          elemszam: scores.length,
        };
      })
    )
  );

  embedPrimary(primaryCharts.heatmap, {
    ...primaryBaseSpec(values, 330),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    transform: [{ filter: "datum.termek == termekSzuro" }],
    mark: { type: "rect", cornerRadius: 4 },
    encoding: {
      x: { field: "dimenzio", type: "nominal", title: null, sort: scaleMetrics.map((metric) => metric.label), axis: { labelAngle: -28 } },
      y: { field: "minta", type: "nominal", title: null, sort: GROUPS },
      color: { field: "atlag", type: "quantitative", title: "Átlag", scale: { scheme: "yellowgreenblue", domain: [1, 6] } },
      opacity: { condition: { param: "mintaSzuro", value: 1 }, value: 0.25 },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "dimenzio", title: "Dimenzió" },
        { field: "atlag", title: "Átlag", format: ".2f" },
        { field: "elemszam", title: "Elemszám" },
      ],
    },
  });

  const strongest = [...values].filter((item) => Number.isFinite(item.atlag)).sort((a, b) => b.atlag - a.atlag)[0];
  if (primaryNotes.heatmap && strongest) {
    primaryNotes.heatmap.textContent = `A heatmap színei az 1-6-os skálák átlagát jelzik; a termékkategória-szűrő a termékspecifikus kérdéseknél külön számol, a "Minden" pedig átlagol. Következtetésem: a legerősebb átlag a(z) ${strongest.dimenzio.toLowerCase()} dimenziónál látszik a(z) ${strongest.minta.toLowerCase()} csoportban, ezért ezt a dimenziót érdemes a fogyasztói körforgásos nyitottság egyik fő jelének tekinteni.`;
  }
}

function renderPrimaryHistogram(rows) {
  const rawValues = rows.flatMap((row) =>
    productCategories.flatMap((product) =>
      scaleMetrics.map((metric) => ({
        termek: product.label,
        minta: row.group,
        metrika: metric.label,
        ertek: metricValueForProduct(row, metric, product),
      }))
    )
  ).filter((item) => Number.isFinite(item.ertek));
  const histogramCounts = {};
  rawValues.forEach((item) => {
    const sav = Math.floor(item.ertek * 2) / 2;
    const key = `${item.termek}|||${item.metrika}|||${item.minta}|||${sav}`;
    histogramCounts[key] = (histogramCounts[key] || 0) + 1;
  });
  const histogramTotals = {};
  rawValues.forEach((item) => {
    const key = `${item.termek}|||${item.metrika}|||${item.minta}`;
    histogramTotals[key] = (histogramTotals[key] || 0) + 1;
  });
  const values = Object.entries(histogramCounts).map(([key, count]) => {
    const [termek, metrika, minta, savText] = key.split("|||");
    const sav = Number(savText);
    return {
      termek,
      metrika,
      minta,
      sav,
      darab: count,
      arany: percent(count, histogramTotals[`${termek}|||${metrika}|||${minta}`]),
    };
  });

  embedPrimary(primaryCharts.histogram, {
    ...primaryBaseSpec(values, 340),
    params: [
      { name: "valasztottMetrika", value: scaleMetrics[0].label, bind: { input: "select", options: scaleMetrics.map((metric) => metric.label), name: "Mutató: " } },
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    transform: [
      { filter: "datum.metrika == valasztottMetrika" },
      { filter: "datum.termek == termekSzuro" },
    ],
    mark: { type: "bar", opacity: 0.82 },
    encoding: {
      x: { field: "sav", type: "ordinal", title: "Skálaérték-sáv" },
      y: { field: "arany", type: "quantitative", title: "Arány a mintán belül (%)" },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      xOffset: { field: "minta", type: "nominal" },
      opacity: { condition: { param: "mintaSzuro", value: 0.86 }, value: 0.18 },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "sav", title: "Értéksáv" },
        { field: "arany", title: "Arány", format: ".1f" },
        { field: "darab", title: "Elemszám (háttéradat)" },
      ],
    },
  });

  if (primaryNotes.histogram) {
    primaryNotes.histogram.textContent = "A hisztogram a kiválasztott mutató és termékkategória mintán belüli százalékos eloszlását mutatja, ezért a romániai és holland minta eltérő elemszáma nem torzítja az összehasonlítást. Következtetésem: ha az egyik minta magasabb skálaértékeknél sűrűsödik, ott nem csak az átlag, hanem a válaszadói tömb is erősebb hajlandóságot jelez.";
  }
}

function renderPrimaryBubble(rows) {
  const groups = {};
  productCategories.forEach((product) => {
    rows.forEach((row) => {
      const education = normalize(row.education);
      const income = normalize(row.household_income_eur);
      const repairMetric = scaleMetrics.find((metric) => metric.key === "repair");
      const repairValue = metricValueForProduct(row, repairMetric, product);
      if (!educationScores[education] || !incomeScores[income] || !Number.isFinite(repairValue)) return;
      const key = `${product.label}|||${row.group}|||${education}|||${income}`;
      if (!groups[key]) {
        groups[key] = {
          termek: product.label,
          minta: row.group,
          vegzettseg: education,
          kereset: income,
          darab: 0,
          javitasok: [],
          leadasok: [],
          vegzettsegek: [],
          keresetek: [],
        };
      }
      groups[key].darab += 1;
      groups[key].javitasok.push(repairValue);
      groups[key].leadasok.push(row.futureDisposal);
      groups[key].vegzettsegek.push(row.educationScore);
      groups[key].keresetek.push(row.incomeScore);
    });
  });
  const values = Object.values(groups).flatMap((item) => {
    const base = {
      termek: item.termek,
      minta: item.minta,
      vegzettseg: item.vegzettseg,
      kereset: item.kereset,
      darab: item.darab,
      javitas: mean(item.javitasok),
      leadas: mean(item.leadasok),
      vegzettsegiSzint: mean(item.vegzettsegek),
      keresetiSzint: mean(item.keresetek),
    };
    return [
      { ...base, meretTipus: "Végzettség", meretErtek: base.vegzettsegiSzint },
      { ...base, meretTipus: "Kereset", meretErtek: base.keresetiSzint },
    ];
  }).filter((item) => Number.isFinite(item.javitas) && Number.isFinite(item.leadas) && Number.isFinite(item.meretErtek));

  embedPrimary(primaryCharts.bubble, {
    ...primaryBaseSpec(values, 380),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      { name: "meretSzuro", value: "Végzettség", bind: { input: "select", options: ["Végzettség", "Kereset"], name: "Buborékméret: " } },
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    transform: [
      { filter: "datum.termek == termekSzuro" },
      { filter: "datum.meretTipus == meretSzuro" },
    ],
    mark: { type: "circle", opacity: 0.78, stroke: "#ffffff", strokeWidth: 1.5 },
    encoding: {
      x: { field: "javitas", type: "quantitative", title: "Átlagos javítási hajlandóság", scale: { domain: [1, 6] } },
      y: { field: "leadas", type: "quantitative", title: "Átlagos felelős leadási hajlandóság", scale: { domain: [1, 6] } },
      size: { field: "meretErtek", type: "quantitative", title: "Választott társadalmi háttérszint", scale: { range: [90, 820] } },
      color: { field: "minta", type: "nominal", title: "Ország/minta", scale: { domain: GROUPS, range: GROUPS.map((group) => BUBBLE_GROUP_COLORS[group]) } },
      opacity: { condition: { param: "mintaSzuro", value: 0.84 }, value: 0.16 },
      tooltip: [
        { field: "termek", title: "Termékkategória" },
        { field: "minta", title: "Minta" },
        { field: "vegzettseg", title: "Végzettség" },
        { field: "kereset", title: "Kereset" },
        { field: "javitas", title: "Átlagos javítási hajlandóság", format: ".2f" },
        { field: "leadas", title: "Átlagos felelős leadási hajlandóság", format: ".2f" },
        { field: "meretTipus", title: "Méret típusa" },
        { field: "meretErtek", title: "Méret pontszám", format: ".1f" },
        { field: "darab", title: "Elemszám (háttéradat)" },
      ],
    },
  });

  const countryAverages = GROUPS.map((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    return {
      group,
      repair: mean(groupRows.map((row) => row.repair)),
      disposal: mean(groupRows.map((row) => row.futureDisposal)),
    };
  });
  if (primaryNotes.bubble) {
    const comparison = countryAverages
      .filter((item) => Number.isFinite(item.repair) && Number.isFinite(item.disposal))
      .map((item) => `${item.group}: javítás ${item.repair.toFixed(2)}, felelős leadás ${item.disposal.toFixed(2)}`)
      .join("; ");
    primaryNotes.bubble.textContent = `A diagramon minden buborék egy országon belüli végzettség-jövedelem csoportot jelöl. Az átlagos javítási hajlandóságot a q16 termékkategória szerinti mezőiből számoltam: "Minden" esetén a három kategória átlaga, külön szűrőnél csak az adott terméktípus értéke szerepel. Az átlagos felelős leadási hajlandóság a q30 1-6-os skálája. A buborék mérete a legördülő szerint vagy a végzettségi pontszámot (1=középiskola, 4=mesterképzés vagy magasabb), vagy a kereseti pontszámot (1=600 € alatt, 5=2 400 € felett) mutatja. Következtetésem: azok a csoportok érdekesek igazán, amelyek egyszerre magas javítási és leadási hajlandóságot mutatnak; ${comparison}.`;
  }
}

function quantile(sortedValues, q) {
  const values = sortedValues.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!values.length) return null;
  const position = (values.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  return values[base + 1] !== undefined ? values[base] + rest * (values[base + 1] - values[base]) : values[base];
}

function renderPrimaryCandles(rows) {
  const values = productCategories.flatMap((product) =>
    GROUPS.flatMap((group) =>
      scaleMetrics.map((metric) => {
        const scores = rows.filter((row) => row.group === group).map((row) => metricValueForProduct(row, metric, product));
        return {
          termek: product.label,
          minta: group,
          dimenzio: metric.label,
          min: quantile(scores, 0),
          q1: quantile(scores, 0.25),
          median: quantile(scores, 0.5),
          q3: quantile(scores, 0.75),
          max: quantile(scores, 1),
        };
      })
    )
  );

  embedPrimary(primaryCharts.candles, {
    ...primaryBaseSpec(values, 360),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
    ],
    transform: [{ filter: "datum.termek == termekSzuro" }],
    layer: [
      {
        mark: { type: "rule", strokeWidth: 2 },
        encoding: {
          x: { field: "dimenzio", type: "nominal", title: null, sort: scaleMetrics.map((metric) => metric.label), axis: { labelAngle: -28 } },
          y: { field: "min", type: "quantitative", title: "Skálaérték", scale: { domain: [1, 6] } },
          y2: { field: "max" },
          color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
          xOffset: { field: "minta", type: "nominal" },
        },
      },
      {
        mark: { type: "bar", size: 18, cornerRadius: 3 },
        encoding: {
          x: { field: "dimenzio", type: "nominal", sort: scaleMetrics.map((metric) => metric.label) },
          y: { field: "q1", type: "quantitative" },
          y2: { field: "q3" },
          color: { field: "minta", type: "nominal", scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
          xOffset: { field: "minta", type: "nominal" },
          tooltip: [
            { field: "minta", title: "Minta" },
            { field: "dimenzio", title: "Dimenzió" },
            { field: "min", title: "Minimum", format: ".2f" },
            { field: "q1", title: "Q1", format: ".2f" },
            { field: "median", title: "Medián", format: ".2f" },
            { field: "q3", title: "Q3", format: ".2f" },
            { field: "max", title: "Maximum", format: ".2f" },
          ],
        },
      },
      {
        mark: { type: "tick", color: "#1d2522", thickness: 2, size: 24 },
        encoding: {
          x: { field: "dimenzio", type: "nominal", sort: scaleMetrics.map((metric) => metric.label) },
          y: { field: "median", type: "quantitative" },
          xOffset: { field: "minta", type: "nominal" },
        },
      },
    ],
  });

  if (primaryNotes.candles) {
    primaryNotes.candles.textContent = "A gyertya-diagram nem csak átlagot mutat: a vonal a minimum-maximum tartományt, a test a középső 50%-ot, a jelölés pedig a mediánt. A termékkategória-szűrővel látható, hogy ugyanaz a dimenzió nagy, személyes IT vagy kis eszközöknél mennyire szóródik. Következtetésem: ahol a gyertya teste rövidebb, ott egységesebb a válaszadói gondolkodás; ahol hosszabb, ott a minta megosztottabb.";
  }
}

function pearsonCorrelation(aValues, bValues) {
  const pairs = aValues.map((value, index) => [value, bValues[index]]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (pairs.length < 3) return null;
  const aMean = mean(pairs.map(([a]) => a));
  const bMean = mean(pairs.map(([, b]) => b));
  const numerator = pairs.reduce((sum, [a, b]) => sum + (a - aMean) * (b - bMean), 0);
  const aDenominator = Math.sqrt(pairs.reduce((sum, [a]) => sum + (a - aMean) ** 2, 0));
  const bDenominator = Math.sqrt(pairs.reduce((sum, [, b]) => sum + (b - bMean) ** 2, 0));
  return aDenominator && bDenominator ? numerator / (aDenominator * bDenominator) : null;
}

function renderPrimaryCorrelation(rows) {
  const values = productCategories.flatMap((product) =>
    attitudeItems.flatMap((attitude) =>
      behaviorMetrics.map((behavior) => ({
        termek: product.label,
        x: behavior.label,
        y: attitude.label,
        r: pearsonCorrelation(
          rows.map((row) => toNumber(row[attitude.key])),
          rows.map((row) => metricValueForProduct(row, behavior, product))
        ),
      }))
    )
  );

  embedPrimary(primaryCharts.correlation, {
    ...primaryBaseSpec(values, 360),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
    ],
    transform: [{ filter: "datum.termek == termekSzuro" }],
    layer: [
      {
        mark: { type: "rect", cornerRadius: 3 },
        encoding: {
          x: { field: "x", type: "nominal", title: "Viselkedési dimenzió", sort: behaviorMetrics.map((metric) => metric.label), axis: { labelAngle: -28 } },
          y: { field: "y", type: "nominal", title: "Környezeti attitűd", sort: attitudeItems.map((item) => item.label) },
          color: {
            field: "r",
            type: "quantitative",
            title: "Pearson r",
            scale: { scheme: "redblue", domain: [-1, 1] },
            legend: { orient: "right", gradientLength: 280, gradientThickness: 14 },
          },
          tooltip: [
            { field: "x", title: "Mutató 1" },
            { field: "y", title: "Mutató 2" },
            { field: "r", title: "Pearson r", format: ".3f" },
          ],
        },
      },
      {
        mark: { type: "text", fontSize: 11, fontWeight: 700 },
        encoding: {
          x: { field: "x", type: "nominal", sort: behaviorMetrics.map((metric) => metric.label) },
          y: { field: "y", type: "nominal", sort: attitudeItems.map((item) => item.label) },
          text: { field: "r", type: "quantitative", format: ".2f" },
          color: {
            condition: { test: "abs(datum.r) > 0.55", value: "#ffffff" },
            value: "#1d2522",
          },
        },
      },
    ],
    resolve: { scale: { color: "shared" } },
  });

  const strongest = [...values]
    .filter((item) => Number.isFinite(item.r))
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))[0];
  if (primaryNotes.correlation && strongest) {
    primaryNotes.correlation.textContent = `A mátrix azt mutatja, hogy az egyes környezeti attitűdállítások mely viselkedési dimenziókkal járnak együtt; termékkategóriára szűrve a termékspecifikus dimenziók külön számolódnak. A cellák Pearson r értékei korrelációt, nem oksági bizonyítékot jelentenek. Következtetésem: a legerősebb kapcsolat a(z) ${strongest.y.toLowerCase()} és a(z) ${strongest.x.toLowerCase()} között látszik (r=${strongest.r.toFixed(2)}).`;
  }
}

function renderPrimaryClusterProfile(rows) {
  const clusters = averageBy(rows.filter((row) => row.cluster !== "Hiányos adat"), "cluster");
  const values = Object.entries(clusters).flatMap(([cluster, clusterRows]) =>
    scaleMetrics.map((metric) => ({
      klaszter: cluster,
      dimenzio: metric.label,
      atlag: mean(clusterRows.map((row) => row[metric.key])),
      elemszam: clusterRows.length,
    }))
  );

  embedPrimary(primaryCharts.clusterProfile, {
    ...primaryBaseSpec(values, 360),
    mark: { type: "line", point: { filled: true, size: 70 }, strokeWidth: 3 },
    encoding: {
      x: { field: "dimenzio", type: "nominal", title: null, sort: scaleMetrics.map((metric) => metric.label), axis: { labelAngle: -28 } },
      y: { field: "atlag", type: "quantitative", title: "Klaszterátlag", scale: { domain: [1, 6] } },
      color: { field: "klaszter", type: "nominal", title: "KMeans klaszter" },
      tooltip: [
        { field: "klaszter", title: "Klaszter" },
        { field: "dimenzio", title: "Dimenzió" },
        { field: "atlag", title: "Átlag", format: ".2f" },
        { field: "elemszam", title: "Elemszám" },
      ],
    },
  });

  if (primaryNotes.clusterProfile) {
    primaryNotes.clusterProfile.textContent = "Ez az ábra a KMeans által képzett válaszadói szegmensek átlagos profilját mutatja. Következtetésem: ha a klasztervonalak több dimenzióban is tartósan elkülönülnek, akkor nem egy-egy kérdés véletlen eltéréséről, hanem eltérő fogyasztói profilokról beszélhetünk; ezt feltáró, nem bizonyító elemzésként érdemes kezelni.";
  }
}

function splitChoices(value) {
  return normalize(value)
    .split(";")
    .map((choice) => normalize(choice))
    .filter(Boolean);
}

function renderPrimaryMultiChoice(rows) {
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

function renderPrimaryVisualizations(rows) {
  const primaryRows = enrichedPrimaryRows(rows);
  renderPrimaryHeatmap(primaryRows);
  renderPrimaryHistogram(primaryRows);
  renderPrimaryBubble(primaryRows);
  renderPrimaryCandles(primaryRows);
  renderPrimaryCorrelation(primaryRows);
  renderPrimaryClusterProfile(primaryRows);
  renderPrimaryMultiChoice(primaryRows);
}

function renderWeeeCategoryTrend(rows) {
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

async function loadSecondaryData() {
  try {
    const [weeeResponse, recyclingResponse] = await Promise.all([fetch(WEEE_DATA_PATH), fetch(WEEE_RECYCLING_PATH)]);
    if (!weeeResponse.ok || !recyclingResponse.ok) throw new Error("secondary data fetch failed");
    const weeeRows = parseCsv(await weeeResponse.text());
    const recyclingRows = parseCsv(await recyclingResponse.text());
    renderWeeeCategoryTrend(weeeRows);
    renderWeeeRecyclingTrend(recyclingRows);
    renderWeeeRecyclingRanking(recyclingRows);
  } catch (error) {
    const message = "A másodlagos adatfájlok nem tölthetők be. Indíts helyi webszervert, hogy a CSV-k dinamikusan olvashatók legyenek.";
    [...Object.values(secondaryCharts), ...Object.values(secondaryNotes)].forEach((element) => {
      if (element) element.textContent = message;
    });
  }
}

function renderDemography() {
  renderControls();
  renderComparisonChart(surveyRows);
  renderProfileCards(surveyRows);
  renderConclusions(surveyRows);
}

async function loadSurveyData() {
  try {
    const response = await fetch(DATA_PATH);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    surveyRows = parseCsv(await response.text());
    renderSourceBars(surveyRows);
    renderGroupCounts(surveyRows);
    renderDemography();
    renderPrimaryVisualizations(surveyRows);
    if (totalResponses) totalResponses.textContent = surveyRows.length;
  } catch (error) {
    const message = "Az adatfájl nem tölthető be. Indíts helyi webszervert, hogy a CSV dinamikusan olvasható legyen.";
    [sourceBars, groupCounts, comparisonChart, profileCards, conclusions, ...Object.values(primaryCharts)].forEach((element) => {
      if (element) element.innerHTML = `<p class="data-error">${message}</p>`;
    });
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawElectronicsIcon(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.18, 1.18);

  ctx.strokeStyle = "#245c45";
  ctx.fillStyle = "#f7f5ee";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";

  drawRoundedRect(ctx, -42, -30, 84, 54, 6);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-54, 38);
  ctx.lineTo(54, 38);
  ctx.lineTo(42, 24);
  ctx.lineTo(-42, 24);
  ctx.closePath();
  ctx.fillStyle = "#edf2ea";
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#2f7f7b";
  ctx.fillRect(-26, -16, 52, 8);
  ctx.fillStyle = "#d6a84f";
  ctx.fillRect(-26, 0, 34, 8);

  ctx.strokeStyle = "#b66f45";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 34, -22, 22, 42, 5);
  ctx.stroke();

  ctx.fillStyle = "#b66f45";
  ctx.beginPath();
  ctx.arc(45, 14, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTextOnArc(ctx, text, cx, cy, radius, centerAngle, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 23px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const letters = [...text];
  const spacing = 20 / radius;
  const startAngle = centerAngle - ((letters.length - 1) * spacing) / 2;

  letters.forEach((letter, index) => {
    const angle = startAngle + index * spacing;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  });

  ctx.restore();
}

function drawCycle(time = 0) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;
  const colors = ["#245c45", "#2f7f7b", "#d6a84f", "#b66f45"];
  const labels = ["vásárlás", "javítás", "újrahasználat", "leadás"];
  const rotation = time / 1800;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);

  ctx.lineWidth = 34;
  ctx.lineCap = "round";

  for (let i = 0; i < 4; i += 1) {
    const start = -Math.PI / 2 + i * (Math.PI / 2) + 0.12;
    const end = start + Math.PI / 2 - 0.28;
    const labelAngle = start + (end - start) / 2;

    ctx.beginPath();
    ctx.strokeStyle = colors[i];
    ctx.arc(cx, cy, radius, start, end);
    ctx.stroke();

    const ax = cx + Math.cos(end) * radius;
    const ay = cy + Math.sin(end) * radius;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(end + Math.PI / 2);
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawTextOnArc(ctx, labels[i], cx, cy, radius + 68, labelAngle, colors[i]);
  }

  ctx.restore();

  const pulse = 1 + Math.sin(time / 700) * 0.025;
  ctx.beginPath();
  ctx.fillStyle = "#f7f5ee";
  ctx.strokeStyle = "#d8ded4";
  ctx.lineWidth = 2;
  ctx.arc(cx, cy, radius * 0.54 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawElectronicsIcon(ctx, cx, cy);
  requestAnimationFrame(drawCycle);
}

function updateActiveNav() {
  const current = sections
    .map((section) => ({
      id: section.id,
      top: Math.abs(section.getBoundingClientRect().top - 120),
    }))
    .sort((a, b) => a.top - b.top)[0];

  if (!current) return;

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${current.id}`;
    link.classList.toggle("active", isActive);
  });
}

requestAnimationFrame(drawCycle);
loadSurveyData();
loadSecondaryData();
window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("resize", updateActiveNav);
updateActiveNav();
