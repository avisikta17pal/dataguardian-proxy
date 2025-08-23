import json
import os
from datetime import datetime
from typing import Any, Optional, List

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

import models


def to_json_string(value: Any) -> str:
	return json.dumps(value) if value is not None else json.dumps(None)


def from_json_string(value: str) -> Any:
	try:
		return json.loads(value)
	except Exception:
		return None


def log_audit_event(db: Session, event_type: str, actor: str, message: str) -> models.Audit:
	audit = models.Audit(
		type=event_type,
		actor=actor,
		message=message,
		createdAt=datetime.utcnow(),
	)
	db.add(audit)
	db.commit()
	db.refresh(audit)
	return audit


# Filesystem helpers
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")


def ensure_data_dir_exists() -> None:
	os.makedirs(DATA_DIR, exist_ok=True)


def dataset_csv_path(dataset_id: int) -> str:
	return os.path.join(DATA_DIR, f"{dataset_id}.csv")


def save_upload_to_path(upload, path: str) -> None:
	# upload: fastapi.UploadFile
	with open(path, "wb") as out_file:
		for chunk in iter(lambda: upload.file.read(1024 * 1024), b""):
			out_file.write(chunk)


def load_dataset_df(dataset_id: int) -> pd.DataFrame:
	path = dataset_csv_path(dataset_id)
	if not os.path.exists(path):
		raise FileNotFoundError(f"Dataset file not found: {path}")
	# Let pandas infer types; parse dates where possible
	try:
		df = pd.read_csv(path)
	except Exception as e:
		raise RuntimeError(f"Failed to read dataset CSV: {e}")
	return df


# Transformation helpers

def apply_rule_filters(df: pd.DataFrame, filters: Optional[List[dict]]) -> pd.DataFrame:
	if not filters:
		return df
	mask = pd.Series([True] * len(df))
	for f in filters:
		if not isinstance(f, dict):
			continue
		field = f.get("field")
		op = f.get("op")
		value = f.get("value")
		value2 = f.get("value2")
		if field not in df.columns:
			continue
		col = df[field]
		try:
			if op == "gt":
				mask &= col.astype(float) > float(value)
			elif op == "gte":
				mask &= col.astype(float) >= float(value)
			elif op == "lt":
				mask &= col.astype(float) < float(value)
			elif op == "lte":
				mask &= col.astype(float) <= float(value)
			elif op == "equals":
				mask &= col == value
			elif op == "in":
				vals = value if isinstance(value, list) else [value]
				mask &= col.isin(vals)
			elif op == "between":
				low = value
				high = value2
				mask &= (col.astype(float) >= float(low)) & (col.astype(float) <= float(high))
			elif op == "rangeDate":
				start = pd.to_datetime(value) if value else None
				end = pd.to_datetime(value2) if value2 else None
				col_dt = pd.to_datetime(col, errors="coerce")
				cond = pd.Series([True] * len(col_dt))
				if start is not None:
					cond &= col_dt >= start
				if end is not None:
					cond &= col_dt <= end
				mask &= cond
			else:
				# unsupported op: skip
				pass
		except Exception:
			# robust to type issues
			continue
	return df[mask]


def _apply_simple_agg(df: pd.DataFrame, field: str, op: str) -> pd.DataFrame:
	series = df[field]
	if op == "sum":
		val = series.sum()
	elif op in ("avg", "mean"):
		val = series.mean()
	elif op == "min":
		val = series.min()
	elif op == "max":
		val = series.max()
	elif op == "count":
		val = series.count()
	else:
		return df
	return pd.DataFrame([{field: val}])


def apply_rule_aggregations(df: pd.DataFrame, aggregations: Optional[List[dict]]) -> pd.DataFrame:
	if not aggregations:
		return df
	# Handle grouping and simple aggregations
	result_df = df
	for agg in aggregations:
		if not isinstance(agg, dict):
			continue
		op = agg.get("op")
		if op in ("groupByDay", "groupByMonth"):
			date_field = agg.get("dateField", "timestamp")
			if date_field not in result_df.columns:
				continue
			col_dt = pd.to_datetime(result_df[date_field], errors="coerce")
			result_df = result_df.copy()
			if op == "groupByDay":
				group_key = col_dt.dt.date
				group_label = "day"
			else:
				group_key = col_dt.dt.to_period("M").dt.to_timestamp()
				group_label = "month"
			agg_list = agg.get("aggs") or []
			if not agg_list:
				# default to count
				grouped = result_df.groupby(group_key).size().reset_index(name="count")
				grouped.rename(columns={grouped.columns[0]: group_label}, inplace=True)
				result_df = grouped
			else:
				agg_map = {}
				for a in agg_list:
					field = a.get("field")
					op2 = a.get("op")
					if field in result_df.columns and op2 in ["sum", "avg", "mean", "min", "max", "count"]:
						func = "mean" if op2 in ("avg", "mean") else ("count" if op2 == "count" else op2)
						agg_map[field] = func
				if not agg_map:
					continue
				grouped = result_df.groupby(group_key).agg(agg_map).reset_index()
				grouped.rename(columns={grouped.columns[0]: group_label}, inplace=True)
				result_df = grouped
		else:
			field = agg.get("field")
			if field in result_df.columns:
				result_df = _apply_simple_agg(result_df, field, op)
	return result_df


def apply_rule_obfuscation(df: pd.DataFrame, obfuscation: Optional[dict]) -> pd.DataFrame:
	if not obfuscation:
		return df
	result = df.copy()
	# Jitter: percent across numeric columns
	jitter_spec = obfuscation.get("jitter")
	if jitter_spec is not None:
		try:
			percent = float(jitter_spec if isinstance(jitter_spec, (int, float, str)) else jitter_spec.get("percent", 0))
			if percent > 0:
				r = (np.random.rand(len(result), 1) * 2 - 1) * (percent / 100.0)
				for col in result.select_dtypes(include=[np.number]).columns:
					noise = r.flatten() * result[col].astype(float)
					result[col] = (result[col].astype(float) + noise)
		except Exception:
			pass
	# Rounding: nearest N
	rounding_spec = obfuscation.get("rounding")
	if rounding_spec is not None:
		try:
			n = int(rounding_spec if isinstance(rounding_spec, (int, str)) else rounding_spec.get("value", 1))
			if n > 0:
				for col in result.select_dtypes(include=[np.number]).columns:
					result[col] = (np.round(result[col].astype(float) / n) * n)
		except Exception:
			pass
	# Bucketing: width or bins for numeric columns
	bucketing = obfuscation.get("bucketing")
	if isinstance(bucketing, dict):
		width = bucketing.get("width")
		bins = bucketing.get("bins")
		for col in result.select_dtypes(include=[np.number]).columns:
			try:
				if bins:
					result[col] = pd.cut(result[col].astype(float), bins=bins, include_lowest=True).astype(str)
				elif width:
					minv = result[col].min()
					maxv = result[col].max()
					b = np.arange(minv, maxv + width, width)
					result[col] = pd.cut(result[col].astype(float), bins=b, include_lowest=True).astype(str)
			except Exception:
				continue
	# Drop PII: list of columns
	drop_pii = obfuscation.get("dropPII")
	if isinstance(drop_pii, list) and drop_pii:
		cols = [c for c in drop_pii if c in result.columns]
		if cols:
			result = result.drop(columns=cols)
	# K-anonymity: suppress values for groups smaller than k
	k_an = obfuscation.get("kAnonymity")
	if isinstance(k_an, dict):
		k = int(k_an.get("k", 0))
		group_by = k_an.get("groupBy") or []
		group_by = [g for g in group_by if g in result.columns]
		if k > 1 and group_by:
			group_sizes = result.groupby(group_by).transform("size")
			mask = group_sizes < k
			for col in result.columns:
				if col not in group_by:
					result.loc[mask, col] = "*"
	return result