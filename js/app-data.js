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
    setupChartDownloadButtons();
    if (totalResponses) totalResponses.textContent = surveyRows.length;
  } catch (error) {
    const message = "Az adatfájl nem tölthető be. Indíts helyi webszervert, hogy a CSV dinamikusan olvasható legyen.";
    [sourceBars, groupCounts, comparisonChart, profileCards, conclusions, ...Object.values(primaryCharts)].forEach((element) => {
      if (element) element.innerHTML = `<p class="data-error">${message}</p>`;
    });
  }
}
