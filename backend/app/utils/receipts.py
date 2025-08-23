from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from ..models.models import Stream, Dataset, Rule, Token, Audit


def _format_rule_summary(rule: Optional[Rule]) -> dict:
    if not rule:
        return {"name": None, "fields": None, "filters": None, "aggregations": None, "obfuscation": None, "ttlMinutes": None}
    return {
        "name": rule.name,
        "fields": rule.fields,
        "filters": rule.filters,
        "aggregations": rule.aggregations,
        "obfuscation": rule.obfuscation,
        "ttlMinutes": getattr(rule, "ttl_minutes", None),
    }


def render_receipt_html(
    stream: Stream,
    dataset: Optional[Dataset],
    rule: Optional[Rule],
    tokens: List[Token],
    events: List[Audit],
) -> str:
    dataset_hash = dataset.sha256 if dataset else "N/A"
    rule_summary = _format_rule_summary(rule)

    token_rows = "".join(
        f"<tr><td>{t.id}</td><td>{t.token}</td><td>{t.expires_at or ''}</td><td>{'yes' if t.one_time else 'no'}</td><td>{'yes' if t.revoked else 'no'}</td></tr>"
        for t in tokens
    )

    event_rows = "".join(
        f"<tr><td>{e.created_at}</td><td>{e.type}</td><td>{e.actor or ''}</td><td>{e.message or ''}</td></tr>"
        for e in events
    )

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8' />
  <title>Consent Receipt - Stream {stream.id}</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 24px; color: #222; }}
    h1 {{ color: #111; }}
    h2 {{ margin-top: 24px; }}
    .section {{ margin-bottom: 16px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
    th, td {{ border: 1px solid #ddd; padding: 8px; font-size: 13px; }}
    th {{ background: #f5f5f5; text-align: left; }}
    .meta {{ color: #555; font-size: 12px; }}
  </style>
</head>
<body>
  <h1>Consent Receipt</h1>
  <div class='meta'>Generated at {datetime.utcnow().isoformat()}Z</div>

  <div class='section'>
    <h2>Stream Details</h2>
    <div>ID: {stream.id}</div>
    <div>Name: {stream.name}</div>
    <div>Status: {stream.status}</div>
    <div>Expires At: {stream.expires_at or ''}</div>
  </div>

  <div class='section'>
    <h2>Dataset</h2>
    <div>ID: {dataset.id if dataset else 'N/A'}</div>
    <div>SHA-256: {dataset_hash}</div>
  </div>

  <div class='section'>
    <h2>Rule Summary</h2>
    <pre>{rule_summary}</pre>
  </div>

  <div class='section'>
    <h2>Tokens</h2>
    <table>
      <thead><tr><th>ID</th><th>Token</th><th>Expires At</th><th>One-Time</th><th>Revoked</th></tr></thead>
      <tbody>
        {token_rows}
      </tbody>
    </table>
  </div>

  <div class='section'>
    <h2>Audit Events</h2>
    <table>
      <thead><tr><th>Time</th><th>Type</th><th>Actor</th><th>Message</th></tr></thead>
      <tbody>
        {event_rows}
      </tbody>
    </table>
  </div>
</body>
</html>
"""
    return html


def generate_receipt_pdf(
    stream: Stream,
    dataset: Optional[Dataset],
    rule: Optional[Rule],
    tokens: List[Token],
    events: List[Audit],
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()

    elements = []
    elements.append(Paragraph(f"Consent Receipt - Stream {stream.id}", styles['Title']))
    elements.append(Paragraph(f"Generated at {datetime.utcnow().isoformat()}Z", styles['Normal']))
    elements.append(Spacer(1, 8))

    # Stream Details
    elements.append(Paragraph("Stream Details", styles['Heading2']))
    stream_data = [
        ["ID", str(stream.id)],
        ["Name", stream.name],
        ["Status", stream.status],
        ["Expires At", str(stream.expires_at or '')],
    ]
    t = Table(stream_data, hAlign='LEFT', colWidths=[80 * mm, 80 * mm])
    t.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
        ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8))

    # Dataset
    elements.append(Paragraph("Dataset", styles['Heading2']))
    dataset_hash = dataset.sha256 if dataset else "N/A"
    dataset_data = [
        ["ID", str(dataset.id) if dataset else 'N/A'],
        ["SHA-256", dataset_hash],
    ]
    t2 = Table(dataset_data, hAlign='LEFT', colWidths=[80 * mm, 80 * mm])
    t2.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
        ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 8))

    # Rule Summary
    elements.append(Paragraph("Rule Summary", styles['Heading2']))
    rs = _format_rule_summary(rule)
    for k, v in rs.items():
        elements.append(Paragraph(f"{k}: {v}", styles['Normal']))
    elements.append(Spacer(1, 8))

    # Tokens table
    elements.append(Paragraph("Tokens", styles['Heading2']))
    token_table_data = [["ID", "Token", "Expires At", "One-Time", "Revoked"]]
    for tkn in tokens:
        token_table_data.append([
            str(tkn.id),
            tkn.token,
            str(tkn.expires_at or ''),
            'yes' if tkn.one_time else 'no',
            'yes' if tkn.revoked else 'no',
        ])
    t3 = Table(token_table_data, hAlign='LEFT', colWidths=[15 * mm, 65 * mm, 35 * mm, 25 * mm, 25 * mm])
    t3.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
        ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(t3)
    elements.append(Spacer(1, 8))

    # Audit events table
    elements.append(Paragraph("Audit Events", styles['Heading2']))
    event_table_data = [["Time", "Type", "Actor", "Message"]]
    for ev in events:
        event_table_data.append([
            str(ev.created_at),
            ev.type,
            ev.actor or '',
            ev.message or '',
        ])
    t4 = Table(event_table_data, hAlign='LEFT', colWidths=[45 * mm, 35 * mm, 20 * mm, 60 * mm])
    t4.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
        ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(t4)

    doc.build(elements)
    value = buffer.getvalue()
    buffer.close()
    return value