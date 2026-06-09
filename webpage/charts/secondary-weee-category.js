window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.secondaryWeeeCategory = {
  id: "weeeCategoryTrend",
  title: "WEEE mennyiségek termékkategóriánként",
  type: "Vega-Lite grouped bar chart",
  data: "Eurostat WEEE mennyiségi adatok.",
  algorithm: [
    "Ország, év és termékkategória szerint szűrt mennyiségeket jelenít meg.",
    "Románia és Hollandia közvetlenül összehasonlítható.",
    "Az ábra a rendelkezésre álló korábbi évektől indul.",
  ],
  note: "A mennyiségek nem arányok, ezért az országméret és gyűjtési rendszer különbségeit is figyelembe kell venni.",
};
