"""Primer adatok feldolgozasa Pandas, SciPy, sklearn KMeans es Altair/Vega-Lite segitsegevel.

Futtatas:
    python figures/primary_analysis.py

A script a kerdoives adatokat indexekke alakitja, KMeans klasztereket kepez,
SciPy Pearson-korrelaciokat szamol, majd Vega-Lite specifikaciokat ment a
figures/altair_specs mappaba.
"""

from __future__ import annotations

from pathlib import Path

import altair as alt
import pandas as pd
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "cleaned" / "master_dataset_harmonized3.csv"
OUT_DIR = ROOT / "figures" / "altair_specs"

GROUPS = ["Romaniai minta", "Holland minta"]
GROUP_COLORS = ["#d9480f", "#1d4ed8"]
BUBBLE_GROUP_COLORS = ["#d9480f", "#1d4ed8"]

EDUCATION_SCORES = {
    "K\u00f6z\u00e9piskola / \u00c9retts\u00e9gi": 1,
    "Szakk\u00e9pes\u00edt\u00e9s": 2,
    "F\u0151iskola / Egyetemi diploma (BA/BSc)": 3,
    "Mesterk\u00e9pz\u00e9s vagy magasabb (MA/MSc/PhD)": 4,
}

INCOME_SCORES = {
    "600 \u20ac alatt": 1,
    "600\u20131 000 \u20ac": 2,
    "1 001\u20131 600 \u20ac": 3,
    "1 601\u20132 400 \u20ac": 4,
    "2 400 \u20ac felett": 5,
}

SCALE_METRICS = {
    "attitude": {
        "label": "Kornyezeti attitud",
        "fields": ["q01_env_concern", "q02_nem_harm_decisions", "q03_follow_nemrms", "q04_sustainable_society"],
    },
    "replacement": {
        "label": "Cseregyakorisag",
        "fields": ["q09_replace_frequency_large_household", "q09_replace_frequency_personal_it", "q09_replace_frequency_small"],
    },
    "rent_share": {
        "label": "Berles/megosztas nyitottsag",
        "fields": ["q14_open_to_rent_share_large_household", "q14_open_to_rent_share_personal_it", "q14_open_to_rent_share_small"],
    },
    "durability": {
        "label": "Tartossag fontossaga",
        "fields": ["q15_importance_durability_large_household", "q15_importance_durability_personal_it", "q15_importance_durability_small"],
    },
    "repair": {
        "label": "Javitasi rutin",
        "fields": ["q16_usually_repair_large_household", "q16_usually_repair_personal_it", "q16_usually_repair_small"],
    },
    "full_repair": {
        "label": "Teljes javitas elfogadasa",
        "fields": ["q22_willing_after_full_repair_large_household", "q22_willing_after_full_repair_personal_it", "q22_willing_after_full_repair_small"],
    },
    "imperfect_repair": {
        "label": "Tokeletlen javitas elfogadasa",
        "fields": ["q23_willing_after_imperfect_repair_large_household", "q23_willing_after_imperfect_repair_personal_it", "q23_willing_after_imperfect_repair_small"],
    },
    "future_disposal": {
        "label": "Jovobeni felelos leadas",
        "fields": ["q30_willing_future_disposal"],
    },
}

ATTITUDE_ITEMS = {
    "q01_env_concern": "Kornyezeti aggodalom",
    "q02_nem_harm_decisions": "Dontesek kornyezeti hatasa",
    "q03_follow_nemrms": "Normakovetes",
    "q04_sustainable_society": "Fenntarthato tarsadalom",
}

BEHAVIOR_METRICS = {key: value for key, value in SCALE_METRICS.items() if key != "attitude"}

PRODUCT_CATEGORIES = [
    {"label": "Minden", "index": None},
    {"label": "Nagy eszkozok", "index": 0},
    {"label": "Szemelyes IT", "index": 1},
    {"label": "Kis eszkozok", "index": 2},
]

MULTI_CHOICE = [
    {"column": "q20_repair_motivation", "label": "Javitasi motivaciok", "product": "Minden"},
    {"column": "q28_dropoff_motivation", "label": "Leadasi motivaciok", "product": "Minden"},
    {"column": "q29_dropoff_barrier", "label": "Leadasi akadalyok", "product": "Minden"},
    {"column": "q19_large_nemt_repair_reason", "label": "Nagy eszkoz javitasi akadaly", "product": "Nagy eszkozok"},
    {"column": "q18_it_nemt_repair_reason", "label": "IT eszkoz javitasi akadaly", "product": "Szemelyes IT"},
    {"column": "q17_small_nemt_repair_reason", "label": "Kis eszkoz javitasi akadaly", "product": "Kis eszkozok"},
    {"column": "q11", "label": "Nagy eszkoz eletciklus vege", "product": "Nagy eszkozok"},
    {"column": "q25_it_end_of_life", "label": "IT eszkoz eletciklus vege", "product": "Szemelyes IT"},
    {"column": "q24_small_end_of_life", "label": "Kis eszkoz eletciklus vege", "product": "Kis eszkozok"},
]


def base_chart(data: pd.DataFrame) -> alt.Chart:
    return configure_chart(alt.Chart(data))


def configure_chart(chart):
    return chart.configure_view(stroke=None).configure_axis(
        labelColor="#52635d",
        titleColor="#1d2522",
        gridColor="rgba(36, 92, 69, 0.12)",
        domain=False,
        tickColor="rgba(36, 92, 69, 0.16)",
    ).configure_legend(labelColor="#52635d", titleColor="#1d2522", orient="top")


def metric_series(data: pd.DataFrame, meta: dict, product: dict) -> pd.Series:
    numeric = data[meta["fields"]].apply(pd.to_numeric, errors="coerce")
    if product["index"] is None or len(meta["fields"]) != 3:
        return numeric.mean(axis=1)
    return numeric.iloc[:, product["index"]]


def prepare_data() -> pd.DataFrame:
    data = pd.read_csv(DATA_PATH)
    data["analysis_group"] = data["country"].where(data["country"].eq("Netherlands"), "Romaniai minta")
    data.loc[data["country"].eq("Netherlands"), "analysis_group"] = "Holland minta"

    for key, meta in SCALE_METRICS.items():
        numeric = data[meta["fields"]].apply(pd.to_numeric, errors="coerce")
        data[key] = numeric.mean(axis=1)

    used_fields = ["q10_bought_used_large_household", "q10_bought_used_personal_it", "q10_bought_used_small"]
    data["used_purchase_count"] = data[used_fields].eq("igen").sum(axis=1)
    data["knows_dropoff"] = data["q27_knews_dropoff"].astype(str).str.lower().eq("igen").astype(int)
    data["education_score"] = data["education"].map(EDUCATION_SCORES)
    data["income_score"] = data["household_income_eur"].map(INCOME_SCORES)
    data["circularity_index"] = data[
        ["attitude", "rent_share", "durability", "repair", "full_repair", "future_disposal"]
    ].mean(axis=1)

    cluster_features = ["attitude", "rent_share", "durability", "repair", "full_repair", "imperfect_repair", "future_disposal"]
    complete = data[cluster_features].dropna()
    scaler = StandardScaler()
    scaled = scaler.fit_transform(complete)
    model = KMeans(n_clusters=3, random_state=42, n_init=20)
    labels = model.fit_predict(scaled)

    centers = pd.DataFrame(scaler.inverse_transform(model.cluster_centers_), columns=cluster_features)
    ordered_clusters = centers.mean(axis=1).sort_values().index.tolist()
    label_map = {
        ordered_clusters[0]: "Ovatos linearis",
        ordered_clusters[1]: "Atmeneti pragmatikus",
        ordered_clusters[2]: "Korforgasos nyitott",
    }
    data["cluster"] = "Hianyos adat"
    data.loc[complete.index, "cluster"] = [label_map[label] for label in labels]
    return data


def heatmap_spec(data: pd.DataFrame) -> alt.Chart:
    rows = []
    for product in PRODUCT_CATEGORIES:
        for group, group_data in data.groupby("analysis_group"):
            for key, meta in SCALE_METRICS.items():
                series = metric_series(group_data, meta, product).dropna()
                rows.append(
                    {
                        "product": product["label"],
                        "analysis_group": group,
                        "metric_label": meta["label"],
                        "mean": series.mean(),
                        "count": len(series),
                    }
                )
    long = pd.DataFrame(rows)
    product_param = alt.param(
        "product_filter",
        value="Minden",
        bind=alt.binding_select(options=[product["label"] for product in PRODUCT_CATEGORIES], name="Termekkategoria: "),
    )

    return base_chart(long).mark_rect(cornerRadius=4).encode(
        x=alt.X("metric_label:N", sort=[meta["label"] for meta in SCALE_METRICS.values()], title=None, axis=alt.Axis(labelAngle=-28)),
        y=alt.Y("analysis_group:N", sort=GROUPS, title=None),
        color=alt.Color("mean:Q", title="Atlag", scale=alt.Scale(scheme="yellowgreenblue", domain=[1, 6])),
        tooltip=["analysis_group:N", "metric_label:N", alt.Tooltip("mean:Q", format=".2f")],
    ).add_params(product_param).transform_filter(alt.datum.product == product_param).properties(width="container", height=330)


def histogram_spec(data: pd.DataFrame) -> alt.Chart:
    rows = []
    for product in PRODUCT_CATEGORIES:
        for key, meta in SCALE_METRICS.items():
            values = pd.DataFrame(
                {
                    "product": product["label"],
                    "analysis_group": data["analysis_group"],
                    "metric_label": meta["label"],
                    "value": metric_series(data, meta, product),
                }
            ).dropna()
            rows.append(values)
    long = pd.concat(rows, ignore_index=True)
    long["bin_value"] = (long["value"] * 2).floordiv(1) / 2
    grouped = long.groupby(["product", "analysis_group", "metric_label", "bin_value"], as_index=False).size().rename(columns={"size": "count"})
    totals = grouped.groupby(["product", "analysis_group", "metric_label"])["count"].transform("sum")
    grouped["share"] = grouped["count"] / totals * 100
    metric_param = alt.param(
        "metric_filter",
        value=SCALE_METRICS["attitude"]["label"],
        bind=alt.binding_select(options=[meta["label"] for meta in SCALE_METRICS.values()], name="Mutato: "),
    )
    product_param = alt.param(
        "product_filter",
        value="Minden",
        bind=alt.binding_select(options=[product["label"] for product in PRODUCT_CATEGORIES], name="Termekkategoria: "),
    )
    return base_chart(grouped).mark_bar(opacity=0.82).encode(
        x=alt.X("bin_value:O", title="Skalaertek-sav"),
        y=alt.Y("share:Q", title="Arany a mintan belul (%)"),
        color=alt.Color("analysis_group:N", scale=alt.Scale(domain=GROUPS, range=GROUP_COLORS), title=None),
        xOffset="analysis_group:N",
        tooltip=["analysis_group:N", "bin_value:O", alt.Tooltip("share:Q", format=".1f"), alt.Tooltip("count:Q", title="Elemszam (hatteradat)")],
    ).add_params(metric_param, product_param).transform_filter(
        (alt.datum.metric_label == metric_param) & (alt.datum.product == product_param)
    ).properties(width="container", height=340)


def bubble_spec(data: pd.DataFrame) -> alt.Chart:
    repair_meta = SCALE_METRICS["repair"]
    rows = []
    for product in PRODUCT_CATEGORIES:
        product_data = data.copy()
        product_data["repair_product"] = metric_series(product_data, repair_meta, product)
        grouped = (
            product_data.dropna(subset=["education_score", "income_score", "repair_product", "future_disposal"])
            .groupby(["analysis_group", "education", "household_income_eur"], as_index=False)
            .agg(
                count=("country", "size"),
                repair=("repair_product", "mean"),
                future_disposal=("future_disposal", "mean"),
                education_score=("education_score", "mean"),
                income_score=("income_score", "mean"),
            )
        )
        grouped["product"] = product["label"]
        rows.append(grouped)
    plot_data = pd.concat(rows, ignore_index=True)
    plot_data = pd.concat(
        [
            plot_data.assign(size_type="Vegzettseg", size_value=plot_data["education_score"]),
            plot_data.assign(size_type="Kereset", size_value=plot_data["income_score"]),
        ],
        ignore_index=True,
    )
    size_param = alt.param(
        "size_filter",
        value="Vegzettseg",
        bind=alt.binding_select(options=["Vegzettseg", "Kereset"], name="Buborekmeret: "),
    )
    product_param = alt.param(
        "product_filter",
        value="Minden",
        bind=alt.binding_select(options=[product["label"] for product in PRODUCT_CATEGORIES], name="Termekkategoria: "),
    )
    return base_chart(plot_data).mark_circle(opacity=0.76, stroke="#ffffff", strokeWidth=1).encode(
        x=alt.X("repair:Q", title="Atlagos javitasi hajlandosag", scale=alt.Scale(domain=[1, 6])),
        y=alt.Y("future_disposal:Q", title="Atlagos felelos leadasi hajlandosag", scale=alt.Scale(domain=[1, 6])),
        size=alt.Size("size_value:Q", title="Valasztott tarsadalmi hatterszint", scale=alt.Scale(range=[90, 820])),
        color=alt.Color("analysis_group:N", title="Orszag/minta", scale=alt.Scale(domain=GROUPS, range=BUBBLE_GROUP_COLORS)),
        tooltip=[
            "analysis_group:N",
            "education:N",
            "household_income_eur:N",
            alt.Tooltip("repair:Q", format=".2f"),
            alt.Tooltip("future_disposal:Q", format=".2f"),
            "size_type:N",
            alt.Tooltip("size_value:Q", format=".1f"),
            alt.Tooltip("count:Q", title="Elemszam (hatteradat)"),
        ],
    ).add_params(size_param, product_param).transform_filter(
        (alt.datum.size_type == size_param) & (alt.datum.product == product_param)
    ).properties(width="container", height=380)


def candle_spec(data: pd.DataFrame) -> alt.LayerChart:
    rows = []
    for product in PRODUCT_CATEGORIES:
        for group, group_data in data.groupby("analysis_group"):
            for key, meta in SCALE_METRICS.items():
                series = metric_series(group_data, meta, product).dropna()
                rows.append(
                    {
                        "product": product["label"],
                        "analysis_group": group,
                        "metric_label": meta["label"],
                        "min": series.min(),
                        "q1": series.quantile(0.25),
                        "median": series.quantile(0.5),
                        "q3": series.quantile(0.75),
                        "max": series.max(),
                    }
                )
    candle_data = pd.DataFrame(rows)
    chart = alt.Chart(candle_data)
    product_param = alt.param(
        "product_filter",
        value="Minden",
        bind=alt.binding_select(options=[product["label"] for product in PRODUCT_CATEGORIES], name="Termekkategoria: "),
    )
    rule = chart.mark_rule(strokeWidth=2).encode(
        x=alt.X("metric_label:N", sort=[meta["label"] for meta in SCALE_METRICS.values()], title=None, axis=alt.Axis(labelAngle=-28)),
        y=alt.Y("min:Q", title="Skalaertek", scale=alt.Scale(domain=[1, 6])),
        y2="max:Q",
        color=alt.Color("analysis_group:N", scale=alt.Scale(domain=GROUPS, range=GROUP_COLORS), title=None),
        xOffset="analysis_group:N",
    )
    box = chart.mark_bar(size=18, cornerRadius=3).encode(
        x=alt.X("metric_label:N", sort=[meta["label"] for meta in SCALE_METRICS.values()]),
        y="q1:Q",
        y2="q3:Q",
        color=alt.Color("analysis_group:N", scale=alt.Scale(domain=GROUPS, range=GROUP_COLORS), title=None),
        xOffset="analysis_group:N",
        tooltip=["analysis_group:N", "metric_label:N", alt.Tooltip("median:Q", format=".2f")],
    )
    median = chart.mark_tick(color="#1d2522", thickness=2, size=24).encode(
        x=alt.X("metric_label:N", sort=[meta["label"] for meta in SCALE_METRICS.values()]),
        y="median:Q",
        xOffset="analysis_group:N",
    )
    return configure_chart(
        (rule + box + median)
        .add_params(product_param)
        .transform_filter(alt.datum.product == product_param)
        .properties(width="container", height=360)
    )


def correlation_spec(data: pd.DataFrame) -> alt.Chart:
    rows = []
    for product in PRODUCT_CATEGORIES:
        for attitude_field, attitude_label in ATTITUDE_ITEMS.items():
            for behavior_key, behavior_meta in BEHAVIOR_METRICS.items():
                pairs = pd.DataFrame(
                    {
                        "attitude": pd.to_numeric(data[attitude_field], errors="coerce"),
                        "behavior": metric_series(data, behavior_meta, product),
                    }
                ).dropna()
                r, p_value = stats.pearsonr(pairs["attitude"], pairs["behavior"]) if len(pairs) >= 3 else (None, None)
                rows.append(
                    {
                        "product": product["label"],
                        "x": behavior_meta["label"],
                        "y": attitude_label,
                        "r": r,
                        "p_value": p_value,
                    }
                )
    corr = pd.DataFrame(rows)
    chart = alt.Chart(corr)
    product_param = alt.param(
        "product_filter",
        value="Minden",
        bind=alt.binding_select(options=[product["label"] for product in PRODUCT_CATEGORIES], name="Termekkategoria: "),
    )
    cells = chart.mark_rect(cornerRadius=3).encode(
        x=alt.X("x:N", sort=[meta["label"] for meta in BEHAVIOR_METRICS.values()], title="Viselkedesi dimenzio", axis=alt.Axis(labelAngle=-28)),
        y=alt.Y("y:N", sort=list(ATTITUDE_ITEMS.values()), title="Kornyezeti attitud"),
        color=alt.Color(
            "r:Q",
            title="Pearson r",
            scale=alt.Scale(scheme="redblue", domain=[-1, 1]),
            legend=alt.Legend(orient="right", gradientLength=280, gradientThickness=14),
        ),
        tooltip=["x:N", "y:N", alt.Tooltip("r:Q", format=".3f"), alt.Tooltip("p_value:Q", format=".4f")],
    )
    labels = chart.mark_text(fontSize=11, fontWeight=700).encode(
        x=alt.X("x:N", sort=[meta["label"] for meta in BEHAVIOR_METRICS.values()]),
        y=alt.Y("y:N", sort=list(ATTITUDE_ITEMS.values())),
        text=alt.Text("r:Q", format=".2f"),
        color=alt.condition("abs(datum.r) > 0.55", alt.value("#ffffff"), alt.value("#1d2522")),
    )
    return configure_chart(
        (cells + labels)
        .add_params(product_param)
        .transform_filter(alt.datum.product == product_param)
        .properties(width="container", height=360)
    )


def cluster_profile_spec(data: pd.DataFrame) -> alt.Chart:
    values = data[data["cluster"] != "Hianyos adat"].groupby("cluster")[[*SCALE_METRICS]].mean().reset_index()
    long = values.melt("cluster", var_name="metric", value_name="mean")
    long["metric_label"] = long["metric"].map(lambda key: SCALE_METRICS[key]["label"])
    return base_chart(long).mark_line(point=alt.OverlayMarkDef(filled=True, size=70), strokeWidth=3).encode(
        x=alt.X("metric_label:N", sort=[meta["label"] for meta in SCALE_METRICS.values()], title=None, axis=alt.Axis(labelAngle=-28)),
        y=alt.Y("mean:Q", title="Klaszteratlag", scale=alt.Scale(domain=[1, 6])),
        color=alt.Color("cluster:N", title="KMeans klaszter"),
        tooltip=["cluster:N", "metric_label:N", alt.Tooltip("mean:Q", format=".2f")],
    ).properties(width="container", height=360)


def multichoice_spec(data: pd.DataFrame) -> alt.Chart:
    rows = []
    product_labels = [product["label"] for product in PRODUCT_CATEGORIES]
    for question in MULTI_CHOICE:
        column = question["column"]
        label = question["label"]
        exploded = data[["analysis_group", column]].dropna().copy()
        exploded[column] = exploded[column].astype(str).str.split(";")
        exploded = exploded.explode(column)
        exploded[column] = exploded[column].str.strip()
        totals = data.groupby("analysis_group")[column].apply(lambda series: series.astype(str).str.len().gt(0).sum())
        counts = exploded.groupby(["analysis_group", column]).size().reset_index(name="count")
        counts["question"] = label
        counts["share"] = counts.apply(lambda row: row["count"] / totals[row["analysis_group"]] * 100, axis=1)
        counts = counts.rename(columns={column: "answer"})
        applicable_products = product_labels if question["product"] == "Minden" else ["Minden", question["product"]]
        for product in applicable_products:
            rows.append(counts.assign(product=product))

    long = pd.concat(rows, ignore_index=True)
    question_param = alt.param(
        "question_filter",
        value=MULTI_CHOICE[0]["label"],
        bind=alt.binding_select(options=[question["label"] for question in MULTI_CHOICE], name="Kerdes: "),
    )
    product_param = alt.param(
        "product_filter",
        value="Minden",
        bind=alt.binding_select(options=product_labels, name="Termekkategoria: "),
    )
    return base_chart(long).mark_bar(cornerRadiusEnd=5).encode(
        y=alt.Y("answer:N", sort="-x", title=None),
        x=alt.X("share:Q", title="Arany a valaszadok kozott"),
        color=alt.Color("analysis_group:N", scale=alt.Scale(domain=GROUPS, range=GROUP_COLORS), title=None),
        tooltip=["analysis_group:N", "answer:N", alt.Tooltip("count:Q", title="Elemszam (hatteradat)"), alt.Tooltip("share:Q", format=".1f")],
    ).add_params(question_param, product_param).transform_filter(
        (alt.datum.question == question_param) & (alt.datum.product == product_param)
    ).properties(width="container", height=360)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = prepare_data()
    data.to_csv(OUT_DIR / "primary_analysis_enriched.csv", index=False)
    heatmap_spec(data).save(OUT_DIR / "primary_heatmap.vl.json")
    histogram_spec(data).save(OUT_DIR / "primary_histogram.vl.json")
    bubble_spec(data).save(OUT_DIR / "primary_bubble_repair_disposal_background.vl.json")
    candle_spec(data).save(OUT_DIR / "primary_candles.vl.json")
    correlation_spec(data).save(OUT_DIR / "primary_correlation_scipy.vl.json")
    cluster_profile_spec(data).save(OUT_DIR / "primary_cluster_profile.vl.json")
    multichoice_spec(data).save(OUT_DIR / "primary_multichoice.vl.json")


if __name__ == "__main__":
    main()
