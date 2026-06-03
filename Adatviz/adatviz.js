let weeeCollectionView = null;
let recyclingRateView = null;
let respondentsView = null;
let genderView = null;
let ageView = null;
let educationView = null;
let valueMeansView = null;
let valueIntensityView = null;
let smartphoneHandlingView = null;
let educationAttitudeView = null;
let ewasteAwarenessView = null;

const baseChartConfig = {
  view: { stroke: "#E5E7EB" },
  axis: {
    labelFontSize: 11,
    titleFontSize: 12,
    titleColor: "#374151",
    labelColor: "#4B5563",
    gridColor: "#E5E7EB",
  },
  legend: {
    titleFontSize: 12,
    labelFontSize: 11,
    orient: "top",
    direction: "horizontal",
    symbolType: "square",
    symbolSize: 110,
    labelColor: "#374151",
    titleColor: "#111827",
  },
  background: "#FFFFFF",
};

const chartSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  title: {
    text: "WEEE begyűjtés országonként és kategóriánként (2019-2023)",
    subtitle: "Minden évben külön oszlopon látszik Hollandia és Románia, kategóriánként egymásra halmozva",
    anchor: "start",
    fontSize: 18,
    subtitleFontSize: 13,
    offset: 16,
  },
  data: {
    values: [
      { Category: "Nagy gépek", Country: "Hollandia", Year: 2019, Value: 118002 },
      { Category: "Nagy gépek", Country: "Hollandia", Year: 2020, Value: 137312 },
      { Category: "Nagy gépek", Country: "Hollandia", Year: 2021, Value: 132800 },
      { Category: "Nagy gépek", Country: "Hollandia", Year: 2022, Value: 129593 },
      { Category: "Nagy gépek", Country: "Hollandia", Year: 2023, Value: 131069 },
      { Category: "Személyes IT eszközök", Country: "Hollandia", Year: 2019, Value: 39508 },
      { Category: "Személyes IT eszközök", Country: "Hollandia", Year: 2020, Value: 38627 },
      { Category: "Személyes IT eszközök", Country: "Hollandia", Year: 2021, Value: 35035 },
      { Category: "Személyes IT eszközök", Country: "Hollandia", Year: 2022, Value: 29413 },
      { Category: "Személyes IT eszközök", Country: "Hollandia", Year: 2023, Value: 36625 },
      { Category: "kis eszközök", Country: "Hollandia", Year: 2019, Value: 41139 },
      { Category: "kis eszközök", Country: "Hollandia", Year: 2020, Value: 44297 },
      { Category: "kis eszközök", Country: "Hollandia", Year: 2021, Value: 38156 },
      { Category: "kis eszközök", Country: "Hollandia", Year: 2022, Value: 40464 },
      { Category: "kis eszközök", Country: "Hollandia", Year: 2023, Value: 51762 },
      { Category: "Nagy gépek", Country: "Románia", Year: 2019, Value: 60618 },
      { Category: "Nagy gépek", Country: "Románia", Year: 2020, Value: 65608 },
      { Category: "Nagy gépek", Country: "Románia", Year: 2021, Value: 106484 },
      { Category: "Személyes IT eszközök", Country: "Románia", Year: 2019, Value: 19100 },
      { Category: "Személyes IT eszközök", Country: "Románia", Year: 2020, Value: 15725 },
      { Category: "Személyes IT eszközök", Country: "Románia", Year: 2021, Value: 25816 },
      { Category: "kis eszközök", Country: "Románia", Year: 2019, Value: 9153 },
      { Category: "kis eszközök", Country: "Románia", Year: 2020, Value: 9461 },
      { Category: "kis eszközök", Country: "Románia", Year: 2021, Value: 13608 },
    ],
  },
  transform: [
    {
      calculate: "datum.Country + ' - ' + datum.Category",
      as: "CountryCategory",
    },
  ],
  width: "container",
  height: 420,
  autosize: { type: "fit-x", contains: "padding" },
  mark: {
    type: "bar",
    cornerRadiusTopLeft: 3,
    cornerRadiusTopRight: 3,
    opacity: 0.92,
  },
  encoding: {
    x: {
      field: "Year",
      type: "ordinal",
      title: "Év",
      axis: { labelAngle: 0, grid: false },
    },
    xOffset: {
      field: "Country",
      sort: ["Hollandia", "Románia"],
      title: "Ország",
    },
    y: {
      field: "Value",
      type: "quantitative",
      title: "Begyűjtött e-hulladék (tonna)",
      stack: "zero",
      axis: { grid: true, tickCount: 6, format: "~s" },
    },
    color: {
      field: "CountryCategory",
      type: "nominal",
      title: "Ország / Kategória",
      scale: {
        domain: [
          "Hollandia - Nagy gépek",
          "Hollandia - Személyes IT eszközök",
          "Hollandia - kis eszközök",
          "Románia - Nagy gépek",
          "Románia - Személyes IT eszközök",
          "Románia - kis eszközök",
        ],
        range: [
          "#F97316",
          "#FB923C",
          "#FDBA74",
          "#2563EB",
          "#60A5FA",
          "#93C5FD",
        ],
      },
    },
    order: {
      field: "Category",
      sort: ["Nagy gépek", "Személyes IT eszközök", "kis eszközök"],
    },
    tooltip: [
      { field: "Year", title: "Év" },
      { field: "Country", title: "Ország" },
      { field: "Category", title: "Kategória" },
      { field: "Value", title: "Begyűjtött mennyiség (tonna)", format: "," },
    ],
  },
  config: baseChartConfig,
};

const respondentData = [
  { Csoport: "Magyar nyelvű romániai", Orszag: "Románia", Darab: 112 },
  { Csoport: "Román nyelvű romániai", Orszag: "Románia", Darab: 14 },
  { Csoport: "Holland, angol nyelvű", Orszag: "Hollandia", Darab: 59 },
];

const genderData = [
  { Csoport: "Románia összesen", Nem: "Nő", Darab: 71 },
  { Csoport: "Románia összesen", Nem: "Férfi", Darab: 54 },
  { Csoport: "Románia összesen", Nem: "Egyéb / nem válaszol", Darab: 1 },
  { Csoport: "Hollandia", Nem: "Nő", Darab: 24 },
  { Csoport: "Hollandia", Nem: "Férfi", Darab: 34 },
  { Csoport: "Hollandia", Nem: "Egyéb / nem válaszol", Darab: 1 },
];

const ageData = [
  { Csoport: "Románia összesen", Kor: "18 - 24 év", Darab: 79 },
  { Csoport: "Románia összesen", Kor: "25 - 34 év", Darab: 6 },
  { Csoport: "Románia összesen", Kor: "35 - 44 év", Darab: 8 },
  { Csoport: "Románia összesen", Kor: "45 - 65 év", Darab: 33 },
  { Csoport: "Hollandia", Kor: "18 - 24 év", Darab: 39 },
  { Csoport: "Hollandia", Kor: "25 - 34 év", Darab: 16 },
  { Csoport: "Hollandia", Kor: "35 - 44 év", Darab: 2 },
  { Csoport: "Hollandia", Kor: "45 - 65 év", Darab: 2 },
];

const educationData = [
  { Csoport: "Románia összesen", Vegzettseg: "Középiskola / Érettségi", Darab: 57 },
  { Csoport: "Románia összesen", Vegzettseg: "Főiskola / Egyetem (BA/BSc)", Darab: 40 },
  { Csoport: "Románia összesen", Vegzettseg: "Mesterképzés vagy magasabb", Darab: 24 },
  { Csoport: "Románia összesen", Vegzettseg: "Szakképesítés", Darab: 5 },
  { Csoport: "Hollandia", Vegzettseg: "Középiskola / Érettségi", Darab: 19 },
  { Csoport: "Hollandia", Vegzettseg: "Főiskola / Egyetem (BA/BSc)", Darab: 24 },
  { Csoport: "Hollandia", Vegzettseg: "Mesterképzés vagy magasabb", Darab: 15 },
  { Csoport: "Hollandia", Vegzettseg: "Szakképesítés", Darab: 1 },
];

const demographicColorScale = {
  domain: ["Románia", "Hollandia", "Románia összesen", "Magyar nyelvű romániai", "Román nyelvű romániai", "Holland, angol nyelvű"],
  range: ["#2563EB", "#F97316", "#2563EB", "#60A5FA", "#1D4ED8", "#F97316"],
};

const respondentsSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  title: {
    text: "Kitöltők megoszlása a kérdőív nyelve és országa szerint",
    subtitle: "A romániai minta magyar és román nyelvű kitöltésekből áll; a holland minta angol nyelvű",
    anchor: "start",
    fontSize: 18,
    subtitleFontSize: 13,
    offset: 16,
  },
  data: { values: respondentData },
  width: "container",
  height: 260,
  autosize: { type: "fit-x", contains: "padding" },
  mark: { type: "bar", cornerRadiusTopRight: 4, cornerRadiusBottomRight: 4, opacity: 0.92 },
  encoding: {
    y: { field: "Csoport", type: "nominal", title: null, sort: "-x", axis: { labelLimit: 230 } },
    x: { field: "Darab", type: "quantitative", title: "Kitöltők száma", axis: { tickMinStep: 1 } },
    color: {
      field: "Csoport",
      type: "nominal",
      title: "Csoport",
      scale: demographicColorScale,
    },
    tooltip: [
      { field: "Csoport", title: "Csoport" },
      { field: "Orszag", title: "Ország" },
      { field: "Darab", title: "Kitöltők száma" },
    ],
  },
  config: baseChartConfig,
};

function groupedBarSpec({ title, subtitle, data, categoryField, categoryTitle, height }) {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: title,
      subtitle,
      anchor: "start",
      fontSize: 18,
      subtitleFontSize: 13,
      offset: 16,
    },
    data: { values: data },
    width: "container",
    height,
    autosize: { type: "fit-x", contains: "padding" },
    mark: { type: "bar", cornerRadiusTopLeft: 3, cornerRadiusTopRight: 3, opacity: 0.92 },
    encoding: {
      x: {
        field: categoryField,
        type: "nominal",
        title: categoryTitle,
        axis: { labelAngle: -25, labelLimit: 140 },
      },
      xOffset: { field: "Csoport", sort: ["Románia összesen", "Hollandia"] },
      y: {
        field: "Darab",
        type: "quantitative",
        title: "Kitöltők száma",
        axis: { tickMinStep: 1, grid: true },
      },
      color: {
        field: "Csoport",
        type: "nominal",
        title: "Minta",
        scale: {
          domain: ["Románia összesen", "Hollandia"],
          range: ["#2563EB", "#F97316"],
        },
      },
      tooltip: [
        { field: "Csoport", title: "Minta" },
        { field: categoryField, title: categoryTitle },
        { field: "Darab", title: "Kitöltők száma" },
      ],
    },
    config: baseChartConfig,
  };
}

const genderSpec = groupedBarSpec({
  title: "Nemek megoszlása Románia és Hollandia mintájában",
  subtitle: "Darabszámok a demográfiai kérdések alapján",
  data: genderData,
  categoryField: "Nem",
  categoryTitle: "Nem",
  height: 300,
});

const ageSpec = groupedBarSpec({
  title: "Kor szerinti megoszlás",
  subtitle: "A romániai magyar és román nyelvű válaszok együtt szerepelnek Románia összesen néven",
  data: ageData,
  categoryField: "Kor",
  categoryTitle: "Korcsoport",
  height: 320,
});

const educationSpec = groupedBarSpec({
  title: "Legmagasabb iskolai végzettség szerinti megoszlás",
  subtitle: "A válaszkategóriák magyarra egységesítve jelennek meg",
  data: educationData,
  categoryField: "Vegzettseg",
  categoryTitle: "Végzettség",
  height: 340,
});

const valueMeansData = [
  { Kod: "E1", Dimenzio: "Univerzalizmus", Orszag: "Románia", Atlag: 5.02 },
  { Kod: "E2", Dimenzio: "Jóindulat", Orszag: "Románia", Atlag: 5.01 },
  { Kod: "E3", Dimenzio: "Konformitás", Orszag: "Románia", Atlag: 4.9 },
  { Kod: "E4", Dimenzio: "Biztonság", Orszag: "Románia", Atlag: 5.46 },
  { Kod: "E1", Dimenzio: "Univerzalizmus", Orszag: "Hollandia", Atlag: 4.68 },
  { Kod: "E2", Dimenzio: "Jóindulat", Orszag: "Hollandia", Atlag: 4.95 },
  { Kod: "E3", Dimenzio: "Konformitás", Orszag: "Hollandia", Atlag: 4.71 },
  { Kod: "E4", Dimenzio: "Biztonság", Orszag: "Hollandia", Atlag: 5.12 },
];

const valueIntensityData = [
  { Dimenzio: "Univerzalizmus", Orszag: "Románia", Intenzitas: "1-4 válasz", Darab: 31 },
  { Dimenzio: "Univerzalizmus", Orszag: "Románia", Intenzitas: "5-6 válasz", Darab: 95 },
  { Dimenzio: "Jóindulat", Orszag: "Románia", Intenzitas: "1-4 válasz", Darab: 31 },
  { Dimenzio: "Jóindulat", Orszag: "Románia", Intenzitas: "5-6 válasz", Darab: 95 },
  { Dimenzio: "Konformitás", Orszag: "Románia", Intenzitas: "1-4 válasz", Darab: 38 },
  { Dimenzio: "Konformitás", Orszag: "Románia", Intenzitas: "5-6 válasz", Darab: 88 },
  { Dimenzio: "Biztonság", Orszag: "Románia", Intenzitas: "1-4 válasz", Darab: 13 },
  { Dimenzio: "Biztonság", Orszag: "Románia", Intenzitas: "5-6 válasz", Darab: 113 },
  { Dimenzio: "Univerzalizmus", Orszag: "Hollandia", Intenzitas: "1-4 válasz", Darab: 25 },
  { Dimenzio: "Univerzalizmus", Orszag: "Hollandia", Intenzitas: "5-6 válasz", Darab: 34 },
  { Dimenzio: "Jóindulat", Orszag: "Hollandia", Intenzitas: "1-4 válasz", Darab: 18 },
  { Dimenzio: "Jóindulat", Orszag: "Hollandia", Intenzitas: "5-6 válasz", Darab: 41 },
  { Dimenzio: "Konformitás", Orszag: "Hollandia", Intenzitas: "1-4 válasz", Darab: 24 },
  { Dimenzio: "Konformitás", Orszag: "Hollandia", Intenzitas: "5-6 válasz", Darab: 35 },
  { Dimenzio: "Biztonság", Orszag: "Hollandia", Intenzitas: "1-4 válasz", Darab: 10 },
  { Dimenzio: "Biztonság", Orszag: "Hollandia", Intenzitas: "5-6 válasz", Darab: 49 },
];

const smartphoneHandlingData = [
  { Opcio: "Háztartási szemét", Orszag: "Románia", Szazalek: 0.8, Darab: 1 },
  { Opcio: "Háztartási szemét", Orszag: "Hollandia", Szazalek: 0, Darab: 0 },
  { Opcio: "Szelektív gyűjtő", Orszag: "Románia", Szazalek: 0.8, Darab: 1 },
  { Opcio: "Szelektív gyűjtő", Orszag: "Hollandia", Szazalek: 8.5, Darab: 5 },
  { Opcio: "E-hulladékgyűjtő pont", Orszag: "Románia", Szazalek: 73, Darab: 92 },
  { Opcio: "E-hulladékgyűjtő pont", Orszag: "Hollandia", Szazalek: 61, Darab: 36 },
  { Opcio: "Visszaviszem az üzletbe", Orszag: "Románia", Szazalek: 24.6, Darab: 31 },
  { Opcio: "Visszaviszem az üzletbe", Orszag: "Hollandia", Szazalek: 30.5, Darab: 18 },
  { Opcio: "Eladom / odaadom", Orszag: "Románia", Szazalek: 73.8, Darab: 93 },
  { Opcio: "Eladom / odaadom", Orszag: "Hollandia", Szazalek: 59.3, Darab: 35 },
  { Opcio: "Megjavíttatom", Orszag: "Románia", Szazalek: 54, Darab: 68 },
  { Opcio: "Megjavíttatom", Orszag: "Hollandia", Szazalek: 52.5, Darab: 31 },
  { Opcio: "Elteszem a fiókba", Orszag: "Románia", Szazalek: 46.8, Darab: 59 },
  { Opcio: "Elteszem a fiókba", Orszag: "Hollandia", Szazalek: 49.2, Darab: 29 },
  { Opcio: "Mobilszolgáltató", Orszag: "Románia", Szazalek: 38.1, Darab: 48 },
  { Opcio: "Mobilszolgáltató", Orszag: "Hollandia", Szazalek: 11.9, Darab: 7 },
  { Opcio: "Nem tudom", Orszag: "Románia", Szazalek: 1.6, Darab: 2 },
  { Opcio: "Nem tudom", Orszag: "Hollandia", Szazalek: 0, Darab: 0 },
];

const educationAttitudeData = [
  { Orszag: "Románia", Valasz: "Igen / már részt vett", Darab: 49 },
  { Orszag: "Románia", Valasz: "Nem", Darab: 8 },
  { Orszag: "Románia", Valasz: "Talán", Darab: 69 },
  { Orszag: "Hollandia", Valasz: "Igen / már részt vett", Darab: 17 },
  { Orszag: "Hollandia", Valasz: "Nem", Darab: 12 },
  { Orszag: "Hollandia", Valasz: "Talán", Darab: 30 },
];

const countryScale = {
  domain: ["Románia", "Hollandia"],
  range: ["#2563EB", "#F97316"],
};

const ewasteAwarenessData = [
  { Terulet: "EU27 (EU-átlag)", Szazalek: 27 },
  { Terulet: "Hollandia", Szazalek: 21 },
  { Terulet: "Románia", Szazalek: 26 },
];

const regionScale = {
  domain: ["EU27 (EU-átlag)", "Hollandia", "Románia"],
  range: ["#64748B", "#F97316", "#2563EB"],
};

const ewasteAwarenessSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  title: {
    text: "E-hulladék mint legsúlyosabb hulladékprobléma (QB7T)",
    subtitle:
      "Mindkét országban az arány az EU27 átlag (27%) alatt marad — az elektronikai hulladék tudatossága viszonylag alacsony a műanyag- és vegyszerhulladékhoz képest",
    anchor: "start",
    fontSize: 18,
    subtitleFontSize: 13,
    offset: 16,
  },
  data: { values: ewasteAwarenessData },
  width: "container",
  height: 300,
  autosize: { type: "fit-x", contains: "padding" },
  layer: [
    {
      data: { values: [{ Referencia: 27 }] },
      mark: {
        type: "rule",
        stroke: "#94A3B8",
        strokeWidth: 2,
        strokeDash: [6, 4],
        opacity: 0.9,
      },
      encoding: {
        y: { field: "Referencia", type: "quantitative" },
      },
    },
    {
      mark: { type: "bar", cornerRadiusTopLeft: 3, cornerRadiusTopRight: 3, opacity: 0.92 },
      encoding: {
        x: {
          field: "Terulet",
          type: "nominal",
          title: null,
          sort: ["EU27 (EU-átlag)", "Hollandia", "Románia"],
          axis: { labelAngle: 0, labelLimit: 160, labelFontWeight: "bold" },
        },
        y: {
          field: "Szazalek",
          type: "quantitative",
          title: "Válaszadók aránya (%)",
          scale: { domain: [0, 32] },
          axis: { grid: true, tickCount: 5 },
        },
        color: {
          field: "Terulet",
          type: "nominal",
          title: "Terület",
          scale: regionScale,
          legend: null,
        },
        tooltip: [
          { field: "Terulet", title: "Terület" },
          { field: "Szazalek", title: "Arány (%)", format: ".0f" },
        ],
      },
    },
    {
      transform: [{ calculate: "format(datum.Szazalek, '.0f') + '%'", as: "Cimke" }],
      mark: { type: "text", dy: -10, fontSize: 13, fontWeight: "bold", color: "#111827" },
      encoding: {
        x: {
          field: "Terulet",
          type: "nominal",
          sort: ["EU27 (EU-átlag)", "Hollandia", "Románia"],
        },
        y: { field: "Szazalek", type: "quantitative" },
        text: { field: "Cimke", type: "nominal" },
      },
    },
  ],
  config: baseChartConfig,
};

const valueMeansSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  title: {
    text: "Értékdimenziók összehasonlítása",
    subtitle: "Átlagértékek 1-6-os skálán, Románia és Hollandia mintájában",
    anchor: "start",
    fontSize: 18,
    subtitleFontSize: 13,
    offset: 16,
  },
  data: { values: valueMeansData },
  width: "container",
  height: 320,
  autosize: { type: "fit-x", contains: "padding" },
  mark: { type: "bar", cornerRadiusTopLeft: 3, cornerRadiusTopRight: 3, opacity: 0.92 },
  encoding: {
    x: {
      field: "Dimenzio",
      type: "nominal",
      title: "Értékdimenzió",
      sort: ["Univerzalizmus", "Jóindulat", "Konformitás", "Biztonság"],
      axis: { labelAngle: 0, labelLimit: 150 },
    },
    xOffset: { field: "Orszag", sort: ["Románia", "Hollandia"] },
    y: {
      field: "Atlag",
      type: "quantitative",
      title: "Átlag",
      scale: { domain: [0, 6] },
      axis: { tickCount: 7, grid: true },
    },
    color: { field: "Orszag", type: "nominal", title: "Ország", scale: countryScale },
    tooltip: [
      { field: "Kod", title: "Kód" },
      { field: "Dimenzio", title: "Dimenzió" },
      { field: "Orszag", title: "Ország" },
      { field: "Atlag", title: "Átlag", format: ".2f" },
    ],
  },
  config: baseChartConfig,
};

const valueIntensitySpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  title: {
    text: "Magas intenzitású értékválaszok aránya",
    subtitle: "100%-os oszlopok: minden dimenzión belül külön látszik Románia és Hollandia",
    anchor: "start",
    fontSize: 18,
    subtitleFontSize: 13,
    offset: 16,
  },
  data: { values: valueIntensityData },
  facet: {
    column: {
      field: "Dimenzio",
      type: "nominal",
      title: "Értékdimenzió",
      sort: ["Univerzalizmus", "Jóindulat", "Konformitás", "Biztonság"],
      header: { labelFontSize: 12, labelFontWeight: "bold", labelColor: "#111827" },
    },
  },
  spec: {
    width: 180,
    height: 280,
    mark: { type: "bar", opacity: 0.95 },
    encoding: {
      x: {
        field: "Orszag",
        type: "nominal",
        title: null,
        sort: ["Románia", "Hollandia"],
        axis: { labelAngle: 0, labelFontWeight: "bold" },
      },
      y: {
        field: "Darab",
        type: "quantitative",
        title: "Arány",
        stack: "normalize",
        axis: { format: "%", grid: true },
      },
      color: {
        field: "Intenzitas",
        type: "nominal",
        title: "Válaszintenzitás",
        scale: { domain: ["1-4 válasz", "5-6 válasz"], range: ["#CBD5E1", "#16A34A"] },
      },
      tooltip: [
        { field: "Dimenzio", title: "Dimenzió" },
        { field: "Orszag", title: "Ország" },
        { field: "Intenzitas", title: "Válasz" },
        { field: "Darab", title: "Darab" },
      ],
    },
  },
  resolve: { scale: { x: "independent" } },
  config: baseChartConfig,
};

const smartphoneHandlingSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  title: {
    text: "E-hulladék kezelés: elromlott okostelefon",
    subtitle: "Többválaszos kérdés, ezért az opciók százalékai nem adódnak össze 100%-ra",
    anchor: "start",
    fontSize: 18,
    subtitleFontSize: 13,
    offset: 16,
  },
  data: { values: smartphoneHandlingData },
  width: "container",
  height: 380,
  autosize: { type: "fit-x", contains: "padding" },
  mark: { type: "bar", cornerRadiusTopLeft: 3, cornerRadiusTopRight: 3, opacity: 0.92 },
  encoding: {
    x: {
      field: "Opcio",
      type: "nominal",
      title: "Válaszopció",
      sort: [
        "Háztartási szemét",
        "Szelektív gyűjtő",
        "E-hulladékgyűjtő pont",
        "Visszaviszem az üzletbe",
        "Eladom / odaadom",
        "Megjavíttatom",
        "Elteszem a fiókba",
        "Mobilszolgáltató",
        "Nem tudom",
      ],
      axis: { labelAngle: -30, labelLimit: 120 },
    },
    xOffset: { field: "Orszag", sort: ["Románia", "Hollandia"] },
    y: {
      field: "Szazalek",
      type: "quantitative",
      title: "Kitöltők aránya (%)",
      scale: { domain: [0, 80] },
      axis: { grid: true },
    },
    color: { field: "Orszag", type: "nominal", title: "Ország", scale: countryScale },
    tooltip: [
      { field: "Opcio", title: "Válaszopció" },
      { field: "Orszag", title: "Ország" },
      { field: "Darab", title: "Darab" },
      { field: "Szazalek", title: "Arány (%)", format: ".1f" },
    ],
  },
  config: baseChartConfig,
};

const educationAttitudeSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  title: {
    text: "Nyitottság e-hulladék edukációs programokra",
    subtitle: "Teljes minta: a már részt vevőket az igen/nyitott kategória tartalmazza",
    anchor: "start",
    fontSize: 18,
    subtitleFontSize: 13,
    offset: 16,
  },
  data: { values: educationAttitudeData },
  width: "container",
  height: 280,
  autosize: { type: "fit-x", contains: "padding" },
  mark: { type: "bar", opacity: 0.95 },
  encoding: {
    x: {
      field: "Orszag",
      type: "nominal",
      title: "Ország",
      sort: ["Románia", "Hollandia"],
      axis: { labelAngle: 0, labelFontWeight: "bold" },
    },
    y: {
      field: "Darab",
      type: "quantitative",
      title: "Arány",
      stack: "normalize",
      axis: { format: "%", grid: true },
    },
      color: {
        field: "Valasz",
        type: "nominal",
        title: "Válasz",
        scale: { domain: ["Igen / már részt vett", "Nem", "Talán"], range: ["#16A34A", "#DC2626", "#F59E0B"] },
      },
      order: { field: "Valasz", sort: ["Igen / már részt vett", "Talán", "Nem"] },
    tooltip: [
      { field: "Orszag", title: "Ország" },
      { field: "Valasz", title: "Válasz" },
      { field: "Darab", title: "Darab" },
    ],
  },
  config: baseChartConfig,
};

async function renderChart() {
  const chartContainer = document.getElementById("chart");
  if (!chartContainer) {
    console.error("Chart container not found.");
    return;
  }

  try {
    const result = await vegaEmbed("#chart", chartSpec, {
      actions: false,
      renderer: "svg",
      width: "container",
      tooltip: true,
    });
    weeeCollectionView = result.view;
  } catch (error) {
    console.error("Failed to render Vega-Lite chart:", error);
    chartContainer.innerHTML = "<p>A diagram nem jeleníthető meg.</p>";
  }
}

async function renderRecyclingRateChart() {
  const chartContainer = document.getElementById("chartRate");
  if (!chartContainer) {
    console.error("Recycling rate chart container not found.");
    return;
  }

  try {
    const result = await vegaEmbed("#chartRate", "weee_recycling_chart.json", {
      actions: false,
      renderer: "svg",
      width: "container",
      tooltip: true,
    });
    recyclingRateView = result.view;
  } catch (error) {
    console.error("Failed to render recycling rate chart:", error);
    chartContainer.innerHTML = "<p>A diagram nem jeleníthető meg.</p>";
  }
}

async function renderEmbeddedChart(selector, spec, assignView) {
  const chartContainer = document.querySelector(selector);
  if (!chartContainer) {
    console.error(`Chart container not found: ${selector}`);
    return;
  }

  try {
    const result = await vegaEmbed(selector, spec, {
      actions: false,
      renderer: "svg",
      width: "container",
      tooltip: true,
    });
    assignView(result.view);
  } catch (error) {
    console.error(`Failed to render chart: ${selector}`, error);
    chartContainer.innerHTML = "<p>A diagram nem jeleníthető meg.</p>";
  }
}

async function downloadViewAsImage(view, filename) {
  if (!view) {
    console.error("Chart view is not ready.");
    return;
  }

  try {
    const imageUrl = await view.toImageURL("png");
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    link.click();
  } catch (error) {
    console.error("Failed to export chart image:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderChart();
  renderRecyclingRateChart();
  renderEmbeddedChart("#chartRespondents", respondentsSpec, (view) => {
    respondentsView = view;
  });
  renderEmbeddedChart("#chartGender", genderSpec, (view) => {
    genderView = view;
  });
  renderEmbeddedChart("#chartAge", ageSpec, (view) => {
    ageView = view;
  });
  renderEmbeddedChart("#chartEducation", educationSpec, (view) => {
    educationView = view;
  });
  renderEmbeddedChart("#chartEwasteAwareness", ewasteAwarenessSpec, (view) => {
    ewasteAwarenessView = view;
  });
  renderEmbeddedChart("#chartValueMeans", valueMeansSpec, (view) => {
    valueMeansView = view;
  });
  renderEmbeddedChart("#chartValueIntensity", valueIntensitySpec, (view) => {
    valueIntensityView = view;
  });
  renderEmbeddedChart("#chartSmartphoneHandling", smartphoneHandlingSpec, (view) => {
    smartphoneHandlingView = view;
  });
  renderEmbeddedChart("#chartEducationAttitude", educationAttitudeSpec, (view) => {
    educationAttitudeView = view;
  });

  const downloadChartBtn = document.getElementById("downloadChartBtn");
  if (downloadChartBtn) {
    downloadChartBtn.addEventListener("click", () =>
      downloadViewAsImage(weeeCollectionView, "weee_begyujtes_diagram.png")
    );
  }

  const downloadRateBtn = document.getElementById("downloadRateBtn");
  if (downloadRateBtn) {
    downloadRateBtn.addEventListener("click", () =>
      downloadViewAsImage(recyclingRateView, "weee_ujrahasznositas_diagram.png")
    );
  }

  const downloadRespondentsBtn = document.getElementById("downloadRespondentsBtn");
  if (downloadRespondentsBtn) {
    downloadRespondentsBtn.addEventListener("click", () =>
      downloadViewAsImage(respondentsView, "demografia_kitoltok_diagram.png")
    );
  }

  const downloadGenderBtn = document.getElementById("downloadGenderBtn");
  if (downloadGenderBtn) {
    downloadGenderBtn.addEventListener("click", () =>
      downloadViewAsImage(genderView, "demografia_nemek_diagram.png")
    );
  }

  const downloadAgeBtn = document.getElementById("downloadAgeBtn");
  if (downloadAgeBtn) {
    downloadAgeBtn.addEventListener("click", () =>
      downloadViewAsImage(ageView, "demografia_kor_diagram.png")
    );
  }

  const downloadEducationBtn = document.getElementById("downloadEducationBtn");
  if (downloadEducationBtn) {
    downloadEducationBtn.addEventListener("click", () =>
      downloadViewAsImage(educationView, "demografia_vegzettseg_diagram.png")
    );
  }

  const downloadEwasteAwarenessBtn = document.getElementById("downloadEwasteAwarenessBtn");
  if (downloadEwasteAwarenessBtn) {
    downloadEwasteAwarenessBtn.addEventListener("click", () =>
      downloadViewAsImage(ewasteAwarenessView, "ehulladek_qb7t_tudatossag_diagram.png")
    );
  }

  const downloadValueMeansBtn = document.getElementById("downloadValueMeansBtn");
  if (downloadValueMeansBtn) {
    downloadValueMeansBtn.addEventListener("click", () =>
      downloadViewAsImage(valueMeansView, "ertekdimenziok_atlag_diagram.png")
    );
  }

  const downloadValueIntensityBtn = document.getElementById("downloadValueIntensityBtn");
  if (downloadValueIntensityBtn) {
    downloadValueIntensityBtn.addEventListener("click", () =>
      downloadViewAsImage(valueIntensityView, "ertekdimenziok_intenzitas_diagram.png")
    );
  }

  const downloadSmartphoneHandlingBtn = document.getElementById("downloadSmartphoneHandlingBtn");
  if (downloadSmartphoneHandlingBtn) {
    downloadSmartphoneHandlingBtn.addEventListener("click", () =>
      downloadViewAsImage(smartphoneHandlingView, "okostelefon_ehulladek_kezeles_diagram.png")
    );
  }

  const downloadEducationAttitudeBtn = document.getElementById("downloadEducationAttitudeBtn");
  if (downloadEducationAttitudeBtn) {
    downloadEducationAttitudeBtn.addEventListener("click", () =>
      downloadViewAsImage(educationAttitudeView, "edukacios_attitud_diagram.png")
    );
  }
});
