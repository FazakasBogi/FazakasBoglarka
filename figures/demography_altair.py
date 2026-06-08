"""Altair chart definitions for the demographic visualizations.

Run after installing the requirements:
    python figures/demography_altair.py

The web page renders Vega-Lite specs in the browser. This file keeps the same
chart logic reproducible from Python/Altair for the thesis workflow.
"""

from pathlib import Path

import altair as alt
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "cleaned" / "master_dataset_harmonized3.csv"
OUT_DIR = ROOT / "figures" / "altair_specs"

GROUPS = ["Romániai minta", "Holland minta"]
GROUP_COLORS = {
    "Romániai minta": "#245c45",
    "Holland minta": "#2f7f7b",
}
SOURCE_LABELS = {
    "Hungary": "Magyar kitöltés",
    "Romania": "Román kitöltés",
    "Netherlands": "Holland kitöltés",
}
ATTRIBUTES = {
    "age": {
        "label": "Életkor",
        "order": ["18 - 24", "25 - 34", "35 - 44", "45 - 65"],
    },
    "gender": {
        "label": "Nem",
        "order": ["Nő", "Férfi", "Egyéb / nem kíván válaszolni"],
    },
    "education": {
        "label": "Végzettség",
        "order": [
            "Középiskola / Érettségi",
            "Szakképesítés",
            "Főiskola / Egyetemi diploma (BA/BSc)",
            "Mesterképzés vagy magasabb (MA/MSc/PhD)",
        ],
    },
    "residence": {
        "label": "Lakóhely",
        "order": [
            "Nagyváros (100 000 lakos fölött)",
            "Város (20 000 - 100 000 lakos)",
            "Kisváros / Község (20 000 lakos alatt)",
            "Vidéki terület / falu",
        ],
    },
    "household_size": {
        "label": "Háztartásméret",
        "order": ["1 fő (egyedül élek)", "2 fő", "3-4 fő", "5 vagy több fő"],
    },
}


def normalize(series: pd.Series) -> pd.Series:
    return series.fillna("").astype(str).str.strip().str.replace(r"\s+", " ", regex=True)


def add_analysis_group(data: pd.DataFrame) -> pd.DataFrame:
    data = data.copy()
    data["analysis_group"] = data["country"].where(
        data["country"].eq("Netherlands"), "Romániai minta"
    )
    data.loc[data["country"].eq("Netherlands"), "analysis_group"] = "Holland minta"
    return data


def source_count_chart(data: pd.DataFrame) -> alt.Chart:
    counts = (
        data.groupby("country", as_index=False)
        .size()
        .rename(columns={"size": "kitoltes"})
    )
    counts["forras"] = counts["country"].map(SOURCE_LABELS)
    counts["arany"] = counts["kitoltes"] / counts["kitoltes"].sum() * 100
    counts["cimke"] = counts.apply(
        lambda row: f"{row['kitoltes']} fő · {round(row['arany'])}%", axis=1
    )
    counts["szin"] = counts["country"].map(
        {"Hungary": "#245c45", "Romania": "#b66f45", "Netherlands": "#2f7f7b"}
    )

    y = alt.Y(
        "forras:N",
        sort=[SOURCE_LABELS["Hungary"], SOURCE_LABELS["Romania"], SOURCE_LABELS["Netherlands"]],
        title=None,
    )
    x = alt.X("kitoltes:Q", title="Kitöltések száma")

    bars = alt.Chart(counts).mark_bar(cornerRadiusEnd=6).encode(
        y=y,
        x=x,
        color=alt.Color("szin:N", scale=None, legend=None),
        tooltip=[
            alt.Tooltip("forras:N", title="Forrás"),
            alt.Tooltip("kitoltes:Q", title="Kitöltés"),
            alt.Tooltip("arany:Q", title="Arány", format=".1f"),
        ],
    )
    labels = alt.Chart(counts).mark_text(
        align="left", baseline="middle", dx=8, fontWeight=700
    ).encode(y=y, x=x, text="cimke:N")

    return (bars + labels).properties(width="container", height=210)


def demographic_comparison_chart(data: pd.DataFrame, attribute: str) -> alt.Chart:
    meta = ATTRIBUTES[attribute]
    grouped = add_analysis_group(data)
    grouped[attribute] = normalize(grouped[attribute])

    counts = (
        grouped.groupby(["analysis_group", attribute], as_index=False)
        .size()
        .rename(columns={"size": "valasz", attribute: "kategoria"})
    )
    totals = counts.groupby("analysis_group")["valasz"].transform("sum")
    counts["arany"] = counts["valasz"] / totals * 100
    counts["cimke"] = counts.apply(
        lambda row: f"{round(row['arany'])}% ({row['valasz']})", axis=1
    )

    y = alt.Y("kategoria:N", sort=meta["order"], title=meta["label"])
    x = alt.X(
        "arany:Q",
        title="Arány a mintán belül",
        scale=alt.Scale(domain=[0, 100]),
        axis=alt.Axis(format=".0f"),
    )
    offset = alt.YOffset("analysis_group:N", sort=GROUPS)

    bars = alt.Chart(counts).mark_bar(cornerRadiusEnd=6).encode(
        y=y,
        yOffset=offset,
        x=x,
        color=alt.Color(
            "analysis_group:N",
            title=None,
            scale=alt.Scale(domain=GROUPS, range=[GROUP_COLORS[group] for group in GROUPS]),
        ),
        tooltip=[
            alt.Tooltip("analysis_group:N", title="Minta"),
            alt.Tooltip("kategoria:N", title="Kategória"),
            alt.Tooltip("arany:Q", title="Arány", format=".1f"),
            alt.Tooltip("valasz:Q", title="Válasz"),
        ],
    )
    labels = alt.Chart(counts).mark_text(
        align="left", baseline="middle", dx=6, fontSize=12, fontWeight=700
    ).encode(y=y, yOffset=offset, x=x, text="cimke:N")

    return (bars + labels).properties(width="container", height=max(310, len(meta["order"]) * 70))


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = pd.read_csv(DATA_PATH)
    source_count_chart(data).save(OUT_DIR / "source_counts.vl.json")
    for attribute in ATTRIBUTES:
        demographic_comparison_chart(data, attribute).save(
            OUT_DIR / f"comparison_{attribute}.vl.json"
        )


if __name__ == "__main__":
    main()
