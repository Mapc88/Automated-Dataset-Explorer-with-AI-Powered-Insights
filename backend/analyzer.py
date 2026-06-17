import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import json
import warnings
warnings.filterwarnings("ignore")


def _fig_json(fig) -> dict:
    return json.loads(fig.to_json())


def _safe_col(df: pd.DataFrame, col: str) -> pd.Series:
    return df[col].dropna()


def _classify_columns(df: pd.DataFrame) -> dict[str, list[str]]:
    numeric, categorical, datetime_cols, text = [], [], [], []

    for col in df.columns:
        series = df[col]
        if pd.api.types.is_datetime64_any_dtype(series):
            datetime_cols.append(col)
            continue
        if pd.api.types.is_numeric_dtype(series):
            numeric.append(col)
            continue
        if series.dtype == object:
            try:
                parsed = pd.to_datetime(series, errors="raise")
                df[col] = parsed
                datetime_cols.append(col)
                continue
            except Exception:
                pass
        nunique = series.nunique()
        if nunique <= 30 or (nunique / len(series)) < 0.05:
            categorical.append(col)
        else:
            text.append(col)

    return {"numeric": numeric, "categorical": categorical, "datetime": datetime_cols, "text": text}


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    original_shape = df.shape
    missing_before = int(df.isnull().sum().sum())

    df = df.dropna(how="all").dropna(axis=1, how="all")

    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()
        df[col] = df[col].replace("", np.nan)

    for col in df.select_dtypes(include="number").columns:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())

    for col in df.select_dtypes(include="object").columns:
        if df[col].isnull().any():
            mode = df[col].mode()
            if len(mode):
                df[col] = df[col].fillna(mode[0])

    missing_after = int(df.isnull().sum().sum())
    return df, {
        "original_shape": list(original_shape),
        "cleaned_shape": list(df.shape),
        "missing_before": missing_before,
        "missing_after": missing_after,
        "rows_dropped": original_shape[0] - df.shape[0],
    }


def build_summary(df: pd.DataFrame, col_types: dict) -> dict:
    desc = df.describe(include="all").replace({np.nan: None})
    missing = df.isnull().sum()

    return {
        "shape": list(df.shape),
        "columns": list(df.columns),
        "dtypes": {c: str(t) for c, t in df.dtypes.items()},
        "col_types": col_types,
        "missing_values": {c: int(v) for c, v in missing.items() if v > 0},
        "descriptive_stats": json.loads(desc.to_json()),
    }


def _top_correlations(df: pd.DataFrame, numeric_cols: list[str], n: int = 10) -> list[dict]:
    if len(numeric_cols) < 2:
        return []
    corr = df[numeric_cols].corr()
    pairs = []
    for i, c1 in enumerate(corr.columns):
        for c2 in corr.columns[i + 1:]:
            pairs.append({"col1": c1, "col2": c2, "r": round(float(corr.loc[c1, c2]), 4)})
    pairs.sort(key=lambda x: abs(x["r"]), reverse=True)
    return pairs[:n]


def _histogram(df, col) -> dict:
    fig = px.histogram(
        df, x=col, nbins=40,
        title=f"Distribution of {col}",
        template="plotly_white",
        color_discrete_sequence=["#6366f1"],
        marginal="box",
    )
    fig.update_layout(bargap=0.05)
    return _fig_json(fig)


def _boxplot(df, cols) -> dict:
    fig = go.Figure()
    for col in cols:
        fig.add_trace(go.Box(y=_safe_col(df, col), name=col, boxmean=True))
    fig.update_layout(
        title="Box Plots - Numeric Columns",
        template="plotly_white",
        showlegend=True,
    )
    return _fig_json(fig)


def _bar_chart(df, col) -> dict:
    counts = df[col].value_counts().head(20).reset_index()
    counts.columns = [col, "count"]
    fig = px.bar(
        counts, x=col, y="count",
        title=f"Value Counts - {col}",
        template="plotly_white",
        color="count",
        color_continuous_scale="Viridis",
    )
    fig.update_layout(coloraxis_showscale=False)
    return _fig_json(fig)


def _pie_chart(df, col) -> dict:
    counts = df[col].value_counts().head(10)
    fig = px.pie(
        values=counts.values, names=counts.index,
        title=f"Distribution - {col}",
        template="plotly_white",
        hole=0.35,
    )
    return _fig_json(fig)


def _correlation_heatmap(df, numeric_cols) -> dict:
    corr = df[numeric_cols].corr().round(2)
    fig = px.imshow(
        corr, text_auto=True,
        title="Correlation Heatmap",
        template="plotly_white",
        color_continuous_scale="RdBu",
        zmin=-1, zmax=1,
        aspect="auto",
    )
    return _fig_json(fig)


def _scatter_with_regression(df, x_col, y_col) -> dict:
    from scipy import stats
    data = df[[x_col, y_col]].dropna()
    if len(data) < 3:
        return None
    slope, intercept, r, *_ = stats.linregress(data[x_col], data[y_col])
    fig = px.scatter(
        data, x=x_col, y=y_col,
        title=f"{x_col} vs {y_col}  (r={r:.2f})",
        template="plotly_white",
        trendline="ols",
        color_discrete_sequence=["#6366f1"],
        opacity=0.6,
    )
    return _fig_json(fig)


def _time_series(df, date_col, value_cols) -> list[dict]:
    charts = []
    df_ts = df.copy()
    df_ts[date_col] = pd.to_datetime(df_ts[date_col])
    df_ts = df_ts.sort_values(date_col)
    for vcol in value_cols[:4]:
        grouped = df_ts.groupby(date_col)[vcol].mean().reset_index()
        fig = px.area(
            grouped, x=date_col, y=vcol,
            title=f"{vcol} over time",
            template="plotly_white",
            color_discrete_sequence=["#6366f1"],
        )
        charts.append(_fig_json(fig))
    return charts


def _violin_plot(df, numeric_cols, cat_col=None) -> dict:
    cols_to_plot = numeric_cols[:6]
    if cat_col and cat_col in df.columns:
        melted = df[cols_to_plot + [cat_col]].melt(id_vars=cat_col, var_name="variable", value_name="value")
        fig = px.violin(melted, y="value", x="variable", color=cat_col,
                        box=True, template="plotly_white",
                        title="Violin Plot by Category")
    else:
        melted = df[cols_to_plot].melt(var_name="variable", value_name="value")
        fig = px.violin(melted, y="value", x="variable",
                        box=True, template="plotly_white",
                        title="Violin Plot - Numeric Distributions",
                        color_discrete_sequence=["#6366f1"])
    return _fig_json(fig)


def _pairplot_sample(df, numeric_cols) -> dict:
    cols = numeric_cols[:5]
    sample = df[cols].dropna().sample(min(300, len(df)), random_state=42)
    dims = [dict(label=c, values=sample[c]) for c in cols]
    fig = go.Figure(go.Splom(
        dimensions=dims,
        showupperhalf=False,
        marker=dict(size=4, opacity=0.5, color="#6366f1"),
    ))
    fig.update_layout(title="Pair Plot (sample 300)", template="plotly_white", height=700)
    return _fig_json(fig)


def _detect_outliers(df: pd.DataFrame, numeric_cols: list[str]) -> dict:
    results = {}
    for col in numeric_cols:
        s = df[col].dropna()
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        outliers = s[(s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)]
        if len(outliers):
            results[col] = {"count": int(len(outliers)), "pct": round(len(outliers) / len(s) * 100, 2)}
    return results


def _clustering(df, numeric_cols):
    if len(numeric_cols) < 2:
        return None, None
    from sklearn.preprocessing import StandardScaler
    from sklearn.cluster import KMeans
    from sklearn.decomposition import PCA
    from sklearn.metrics import silhouette_score

    data = df[numeric_cols].dropna()
    if len(data) < 10:
        return None, None

    fit_data = data.sample(5000, random_state=42) if len(data) > 5000 else data
    scaled = StandardScaler().fit_transform(fit_data)

    best_k, best_score, best_labels = None, -1.0, None
    max_k = min(5, len(fit_data) - 1)
    for k in range(2, max_k + 1):
        labels = KMeans(n_clusters=k, n_init=10, random_state=42).fit_predict(scaled)
        if len(set(labels)) < 2:
            continue
        score = silhouette_score(scaled, labels)
        if score > best_score:
            best_k, best_score, best_labels = k, score, labels
    if best_k is None:
        return None, None

    coords = PCA(n_components=2).fit_transform(scaled)
    plot_df = pd.DataFrame({
        "PC1": coords[:, 0],
        "PC2": coords[:, 1],
        "Cluster": [f"Cluster {c}" for c in best_labels],
    })
    fig = px.scatter(
        plot_df, x="PC1", y="PC2", color="Cluster",
        title=f"KMeans Clusters (k={best_k}, PCA projection)",
        template="plotly_white",
        opacity=0.7,
    )
    sizes = {f"Cluster {int(c)}": int((best_labels == c).sum()) for c in sorted(set(best_labels))}
    meta = {"k": int(best_k), "silhouette": round(float(best_score), 3), "sizes": sizes}
    return _fig_json(fig), meta


def _detect_geo(df):
    lat_names = {"lat", "latitude"}
    lon_names = {"lon", "lng", "long", "longitude"}
    lat_col = lon_col = None
    for col in df.columns:
        name = str(col).strip().lower()
        if name in lat_names and pd.api.types.is_numeric_dtype(df[col]):
            lat_col = col
        elif name in lon_names and pd.api.types.is_numeric_dtype(df[col]):
            lon_col = col
    if lat_col is None or lon_col is None:
        return None, None
    lat_ok = df[lat_col].dropna().between(-90, 90).all()
    lon_ok = df[lon_col].dropna().between(-180, 180).all()
    if lat_ok and lon_ok:
        return lat_col, lon_col
    return None, None


def _geo_map(df, lat, lon, color_col=None):
    cols = [lat, lon] + ([color_col] if color_col else [])
    data = df[cols].dropna(subset=[lat, lon])
    if len(data) > 2000:
        data = data.sample(2000, random_state=42)
    fig = px.scatter_mapbox(
        data, lat=lat, lon=lon,
        color=color_col if color_col else None,
        zoom=1, height=500,
        mapbox_style="open-street-map",
        title="Geographic Distribution",
    )
    fig.update_layout(margin={"r": 0, "t": 40, "l": 0, "b": 0})
    return _fig_json(fig)


def analyze(df: pd.DataFrame) -> dict:
    df, cleaning_report = clean_dataframe(df)
    col_types = _classify_columns(df)
    summary = build_summary(df, col_types)

    numeric = col_types["numeric"]
    categorical = col_types["categorical"]
    datetime_cols = col_types["datetime"]

    charts = []
    chart_meta = []  # chart labels

    for col in numeric[:8]:
        charts.append(_histogram(df, col))
        chart_meta.append(f"Histogram: {col}")

    if len(numeric) >= 2:
        charts.append(_boxplot(df, numeric[:10]))
        chart_meta.append("Box plots for numeric columns")

        charts.append(_violin_plot(df, numeric[:6], categorical[0] if categorical else None))
        chart_meta.append("Violin plot")

        charts.append(_correlation_heatmap(df, numeric))
        chart_meta.append("Correlation heatmap")

        if len(numeric) >= 2:
            charts.append(_pairplot_sample(df, numeric))
            chart_meta.append("Pair plot")

        top_corrs = _top_correlations(df, numeric, n=3)
        for pair in top_corrs:
            fig = _scatter_with_regression(df, pair["col1"], pair["col2"])
            if fig:
                charts.append(fig)
                chart_meta.append(f"Scatter: {pair['col1']} vs {pair['col2']} (r={pair['r']})")

    for col in categorical[:6]:
        nunique = df[col].nunique()
        if nunique <= 8:
            charts.append(_pie_chart(df, col))
            chart_meta.append(f"Pie chart: {col}")
        else:
            charts.append(_bar_chart(df, col))
            chart_meta.append(f"Bar chart: {col}")

    if datetime_cols and numeric:
        ts_charts = _time_series(df, datetime_cols[0], numeric[:4])
        charts.extend(ts_charts)
        chart_meta.extend([f"Time series: {c}" for c in numeric[:4]])

    clusters = None
    if len(numeric) >= 2:
        cluster_fig, clusters = _clustering(df, numeric)
        if cluster_fig:
            charts.append(cluster_fig)
            chart_meta.append(f"Cluster analysis (KMeans, k={clusters['k']})")

    lat_col, lon_col = _detect_geo(df)
    if lat_col and lon_col:
        color_col = categorical[0] if categorical else None
        charts.append(_geo_map(df, lat_col, lon_col, color_col))
        chart_meta.append("Geographic map")

    top_corrs = _top_correlations(df, numeric)
    outliers = _detect_outliers(df, numeric)

    return {
        "cleaning_report": cleaning_report,
        "summary": summary,
        "top_correlations": top_corrs,
        "outliers": outliers,
        "clusters": clusters,
        "charts": charts,
        "chart_meta": chart_meta,
        "preview": json.loads(df.head(20).to_json(orient="records", date_format="iso")),
    }
