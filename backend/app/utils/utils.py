from datetime import datetime
from typing import Dict, Any, List
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def render_receipt_html(context: Dict[str, Any]) -> str:
    dataset = context.get("dataset", {})
    rule = context.get("rule", {})
    stream = context.get("stream", {})
    tokens: List[Dict[str, Any]] = context.get("tokens", [])
    audits: List[Dict[str, Any]] = context.get("audits", [])
    generated_at = context.get("generatedAt")

    def esc(s: Any) -> str:
        return ("" if s is None else str(s)).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <title>Consent Receipt - Stream {esc(stream.get('id'))}</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 24px; color: #111; }}
    h1 {{ font-size: 20px; margin-bottom: 12px; }}
    h2 {{ font-size: 16px; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
    th, td {{ border: 1px solid #eee; padding: 6px 8px; font-size: 12px; text-align: left; }}
    .meta {{ color: #555; font-size: 12px; }}
    .code {{ font-family: monospace; background: #fafafa; padding: 2px 4px; }}
  </style>
</head>
<body>
  <h1>Consent Receipt</h1>
  <div class=\"meta\">Generated at: {esc(generated_at)}</div>

  <h2>Dataset</h2>
  <table>
    <tr><th>ID</th><td>{esc(dataset.get('id'))}</td></tr>
    <tr><th>Name</th><td>{esc(dataset.get('name'))}</td></tr>
    <tr><th>SHA256</th><td class=\"code\">{esc(dataset.get('sha256'))}</td></tr>
  </table>

  <h2>Rule</h2>
  <table>
    <tr><th>ID</th><td>{esc(rule.get('id'))}</td></tr>
    <tr><th>Name</th><td>{esc(rule.get('name'))}</td></tr>
    <tr><th>Fields</th><td class=\"code\">{esc(rule.get('fields'))}</td></tr>
    <tr><th>Filters</th><td class=\"code\">{esc(rule.get('filters'))}</td></tr>
    <tr><th>Aggregations</th><td class=\"code\">{esc(rule.get('aggregations'))}</td></tr>
    <tr><th>Obfuscation</th><td class=\"code\">{esc(rule.get('obfuscation'))}</td></tr>
    <tr><th>TTL Minutes</th><td>{esc(rule.get('ttlMinutes'))}</td></tr>
  </table>

  <h2>Stream</h2>
  <table>
    <tr><th>ID</th><td>{esc(stream.get('id'))}</td></tr>
    <tr><th>Name</th><td>{esc(stream.get('name'))}</td></tr>
    <tr><th>Status</th><td>{esc(stream.get('status'))}</td></tr>
    <tr><th>Expires At</th><td>{esc(stream.get('expiresAt'))}</td></tr>
  </table>

  <h2>Tokens</h2>
  <table>
    <tr><th>ID</th><th>Token</th><th>Scope</th><th>Expires</th><th>One-Time</th><th>Revoked</th><th>Created</th></tr>
    {''.join([f"<tr><td>{esc(t.get('id'))}</td><td class='code'>{esc(t.get('token'))}</td><td>{esc(t.get('scope'))}</td><td>{esc(t.get('expiresAt'))}</td><td>{esc(t.get('oneTime'))}</td><td>{esc(t.get('revoked'))}</td><td>{esc(t.get('createdAt'))}</td></tr>" for t in tokens])}
  </table>

  <h2>Audit Events</h2>
  <table>
    <tr><th>ID</th><th>Type</th><th>Actor</th><th>Message</th><th>Created</th></tr>
    {''.join([f"<tr><td>{esc(a.get('id'))}</td><td>{esc(a.get('type'))}</td><td>{esc(a.get('actor'))}</td><td>{esc(a.get('message'))}</td><td>{esc(a.get('createdAt'))}</td></tr>" for a in audits])}
  </table>
</body>
</html>
"""
    return html


def render_receipt_pdf(context: Dict[str, Any]) -> bytes:
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    line_y = height - 40
    def draw_line(text: str, size: int = 10):
        nonlocal line_y
        p.setFont("Helvetica", size)
        p.drawString(40, line_y, text[:110])
        line_y -= 14
        if line_y < 60:
            p.showPage()
            line_y = height - 40

    stream = context.get("stream", {})
    dataset = context.get("dataset", {})
    rule = context.get("rule", {})

    p.setTitle(f"Consent Receipt - Stream {stream.get('id')}")
    draw_line("Consent Receipt", 16)
    draw_line(f"Generated: {context.get('generatedAt')}", 10)
    draw_line("", 10)
    draw_line("Dataset", 12)
    draw_line(f"ID: {dataset.get('id')}  Name: {dataset.get('name')}")
    draw_line(f"SHA256: {dataset.get('sha256')}")
    draw_line("", 10)
    draw_line("Rule", 12)
    draw_line(f"ID: {rule.get('id')}  Name: {rule.get('name')}")
    draw_line(f"Fields: {rule.get('fields')}")
    draw_line(f"Filters: {rule.get('filters')}")
    draw_line(f"Aggregations: {rule.get('aggregations')}")
    draw_line(f"Obfuscation: {rule.get('obfuscation')}")
    draw_line(f"TTL Minutes: {rule.get('ttlMinutes')}")

    draw_line("", 10)
    draw_line("Stream", 12)
    draw_line(f"ID: {stream.get('id')}  Name: {stream.get('name')}")
    draw_line(f"Status: {stream.get('status')}  Expires At: {stream.get('expiresAt')}")

    tokens = context.get("tokens", [])
    draw_line("", 10)
    draw_line("Tokens", 12)
    for t in tokens:
        draw_line(f"Token {t.get('id')}  Scope: {t.get('scope')}  Expires: {t.get('expiresAt')}  One-Time: {t.get('oneTime')}  Revoked: {t.get('revoked')}")

    audits = context.get("audits", [])
    draw_line("", 10)
    draw_line("Audit Events", 12)
    for a in audits:
        draw_line(f"{a.get('createdAt')} - {a.get('type')} by {a.get('actor')}: {a.get('message')}")

    p.showPage()
    p.save()
    pdf = buffer.getvalue()
    buffer.close()
    return pdf