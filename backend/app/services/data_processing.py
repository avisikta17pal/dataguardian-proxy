from __future__ import annotations
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


def apply_filters(df: pd.DataFrame, filters: Optional[List[Dict[str, Any]]]) -> pd.DataFrame:
    if not filters:
        return df
    result = df.copy()
    for f in filters:
        field = f.get("field")
        op = f.get("op")
        value = f.get("value")
        if field not in result.columns:
            continue
        if op == "gt":
            result = result[result[field] > value]
        elif op == "ge":
            result = result[result[field] >= value]
        elif op == "lt":
            result = result[result[field] < value]
        elif op == "le":
            result = result[result[field] <= value]
        elif op == "eq":
            result = result[result[field] == value]
        elif op == "ne":
            result = result[result[field] != value]
        elif op == "between":
            if isinstance(value, (list, tuple)) and len(value) == 2:
                low, high = value
                result = result[(result[field] >= low) & (result[field] <= high)]
        elif op == "in":
            if isinstance(value, (list, tuple, set)):
                result = result[result[field].isin(list(value))]
        elif op == "contains":
            result = result[result[field].astype(str).str.contains(str(value), na=False)]
        elif op == "rangeDate":
            # value: {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}
            start = pd.to_datetime(value.get("start")) if value and value.get("start") else None
            end = pd.to_datetime(value.get("end")) if value and value.get("end") else None
            col = pd.to_datetime(result[field], errors="coerce")
            if start is not None:
                result = result[col >= start]
            if end is not None:
                result = result[col <= end]
        # ignore unsupported ops silently
    return result


def apply_aggregations(df: pd.DataFrame, aggregations: Optional[List[Dict[str, Any]]]) -> pd.DataFrame:
    if not aggregations:
        return df

    df_local = df.copy()
    groupby_cols: List[str] = []
    agg_map: Dict[str, List[str]] = {}

    # detect groupBy ops and prepare aggregation mapping
    for agg in aggregations:
        op = agg.get("op")
        field = agg.get("field")
        if op in ("groupByDay", "groupByMonth") and field:
            # create grouping key derived from datetime column
            dt = pd.to_datetime(df_local[field], errors="coerce")
            if op == "groupByDay":
                key = dt.dt.floor("D")
                key_name = f"{field}_day"
            else:
                key = dt.dt.to_period("M").dt.to_timestamp()
                key_name = f"{field}_month"
            df_local[key_name] = key
            groupby_cols.append(key_name)
        elif field and op in ("sum", "avg", "min", "max", "count"):
            if field not in agg_map:
                agg_map[field] = []
            if op == "avg":
                agg_map[field].append("mean")
            elif op == "count":
                agg_map[field].append("count")
            else:
                agg_map[field].append(op)

    if groupby_cols:
        grouped = df_local.groupby(groupby_cols, dropna=False).agg(agg_map)
        # flatten MultiIndex columns
        grouped.columns = [
            f"{col[0]}_{col[1]}" if isinstance(col, tuple) else str(col) for col in grouped.columns
        ]
        grouped = grouped.reset_index()
        return grouped

    # no group by: compute aggregations and return single-row df
    if agg_map:
        aggregated = df_local.agg(agg_map)
        # result is Series when single group; normalize to one-row DataFrame
        if isinstance(aggregated, pd.Series):
            aggregated = aggregated.to_frame().T
        # flatten columns similar to group case
        aggregated.columns = [
            f"{col[0]}_{col[1]}" if isinstance(col, tuple) else str(col) for col in aggregated.columns
        ]
        aggregated = aggregated.reset_index(drop=True)
        return aggregated

    return df_local


def apply_obfuscation(df: pd.DataFrame, obfuscation: Optional[Dict[str, Any]]) -> pd.DataFrame:
    if not obfuscation:
        return df
    result = df.copy()

    # Drop PII columns (boolean or list support)
    pii_cols = obfuscation.get("dropPII")
    if pii_cols:
        if isinstance(pii_cols, bool):
            # heuristic: common PII column names
            candidates = [
                "full_name","name","email","phone","address","ssn","date_of_birth","dob","account_id","ip_address"
            ]
            drop_cols = [c for c in candidates if c in result.columns]
        else:
            drop_cols = [c for c in pii_cols if c in result.columns]
        if drop_cols:
            result = result.drop(columns=drop_cols)

    # Bucketing
    bucketing = obfuscation.get("bucketing")
    if bucketing:
        # support single or multiple definitions
        bucket_defs = bucketing if isinstance(bucketing, list) else [bucketing]
        for b in bucket_defs:
            field = b.get("field")
            bins = b.get("bins")
            labels = b.get("labels")
            if field in result.columns and bins:
                result[field] = pd.cut(result[field], bins=bins, labels=labels, include_lowest=True)

    # Rounding
    rounding = obfuscation.get("rounding")
    if rounding:
        # rounding: {"nearest": N, "fields": [..]}
        nearest = rounding.get("nearest", 1)
        fields = rounding.get("fields") or result.select_dtypes(include=[np.number]).columns.tolist()
        for col in fields:
            if col in result.columns:
                result[col] = (result[col] / nearest).round() * nearest

    # Jitter
    jitter = obfuscation.get("jitter")
    if jitter:
        # jitter: {"percent": 5, "fields": [..]}
        percent = float(jitter.get("percent", 0)) / 100.0
        fields = jitter.get("fields") or result.select_dtypes(include=[np.number]).columns.tolist()
        for col in fields:
            if col in result.columns:
                noise = (np.random.rand(len(result)) * 2 - 1) * percent
                result[col] = result[col] * (1.0 + noise)

    # Differential-privacy-like noise (Laplace)
    dp = obfuscation.get("dpNoise")
    if dp:
        # dpNoise: {"scale": 1.0, "fields":[..]}
        scale = float(dp.get("scale", 1.0))
        fields = dp.get("fields") or result.select_dtypes(include=[np.number]).columns.tolist()
        for col in fields:
            if col in result.columns:
                noise = np.random.laplace(loc=0.0, scale=scale, size=len(result))
                result[col] = result[col].astype(float) + noise

    # K-anonymity
    kconf = obfuscation.get("kAnonymity")
    if kconf:
        k = int(kconf.get("k", 5))
        qis = kconf.get("quasiIdentifiers") or []
        if qis:
            # compute group sizes
            group_sizes = result.groupby(qis, dropna=False).transform("size")
            mask_small = group_sizes < k
            if mask_small.any(axis=None):
                # replace all values in those rows with '*'
                result = result.astype(object)
                result.loc[mask_small.any(axis=1), :] = "*"

    return result


def generate_synthetic(df: pd.DataFrame, config: Optional[Dict[str, Any]]) -> pd.DataFrame:
    """Simple synthetic generator by resampling and per-column shuffling.
    config: {"rows": int, "shuffle": bool}
    """
    if not config:
        return df
    rows = int(config.get("rows", len(df)))
    shuffled = df.sample(frac=1.0, replace=True, random_state=None)
    # Optional per-column shuffle to break row-wise linkage
    if config.get("shuffle", True):
        for col in shuffled.columns:
            shuffled[col] = shuffled[col].sample(frac=1.0, replace=False).reset_index(drop=True)
    # Repeat to reach desired row count
    out = pd.concat([shuffled] * (rows // len(shuffled) + 1), ignore_index=True).iloc[:rows]
    return out


def select_fields(df: pd.DataFrame, fields: Optional[List[str]]) -> pd.DataFrame:
    if not fields:
        return df
    existing = [f for f in fields if f in df.columns]
    if not existing:
        return df
    return df[existing]