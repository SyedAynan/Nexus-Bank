"""
NEXA Export Service — CSV + PDF Statement Generation
Generates downloadable transaction statements in CSV and PDF formats.
PDF uses basic HTML-to-text formatting (no external dependencies required).
"""

import csv
import io
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ExportService:
    """Transaction export service for CSV and PDF generation."""

    def generate_csv(self, transactions: list[dict], account_info: dict | None = None) -> str:
        """Generate CSV content from transactions."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header with account info
        if account_info:
            writer.writerow(["NEXA Banking — Account Statement"])
            writer.writerow([f"Account: {account_info.get('account_number', 'N/A')}"])
            writer.writerow([f"Type: {account_info.get('account_type', 'N/A')}"])
            writer.writerow([f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
            writer.writerow([])

        # Column headers
        writer.writerow(["Date", "Type", "Description", "Amount", "Balance"])

        running_balance = account_info.get("balance", 0) if account_info else 0

        for tx in transactions:
            date = tx.get("created_at", tx.get("date", ""))
            if isinstance(date, datetime):
                date = date.strftime("%Y-%m-%d %H:%M")
            elif isinstance(date, str) and "T" in date:
                date = date[:16].replace("T", " ")

            tx_type = tx.get("type", "unknown")
            desc = tx.get("description", "")
            amount = tx.get("amount", 0)

            # Format amount with sign
            if tx_type in ("withdrawal", "transfer_out", "emi"):
                amount_str = f"-${abs(amount):,.2f}"
            else:
                amount_str = f"+${abs(amount):,.2f}"

            writer.writerow([date, tx_type, desc, amount_str, f"${running_balance:,.2f}"])

        # Summary
        writer.writerow([])
        writer.writerow(["Summary"])
        writer.writerow([f"Total Transactions: {len(transactions)}"])
        total_in = sum(
            t.get("amount", 0) for t in transactions if t.get("type") in ("deposit", "interest", "transfer_in")
        )
        total_out = sum(
            t.get("amount", 0) for t in transactions if t.get("type") in ("withdrawal", "transfer_out", "emi")
        )
        writer.writerow([f"Total Credits: ${total_in:,.2f}"])
        writer.writerow([f"Total Debits: ${total_out:,.2f}"])

        return output.getvalue()

    def generate_pdf_content(self, transactions: list[dict], account_info: dict | None = None) -> str:
        """Generate PDF-ready HTML content for statements.
        This returns HTML that can be rendered as a PDF by the frontend or wkhtmltopdf.
        """
        acct_num = account_info.get("account_number", "N/A") if account_info else "N/A"
        acct_type = account_info.get("account_type", "N/A") if account_info else "N/A"
        balance = account_info.get("balance", 0) if account_info else 0
        generated = datetime.now().strftime("%B %d, %Y at %I:%M %p")

        rows = ""
        for tx in transactions:
            date = tx.get("created_at", tx.get("date", ""))
            if isinstance(date, datetime):
                date = date.strftime("%b %d, %Y")
            elif isinstance(date, str) and "T" in date:
                date = date[:10]

            tx_type = tx.get("type", "unknown")
            desc = tx.get("description", tx_type.replace("_", " ").title())
            amount = tx.get("amount", 0)

            if tx_type in ("withdrawal", "transfer_out", "emi"):
                amt_html = f'<span style="color:#ef4444;">-${abs(amount):,.2f}</span>'
            else:
                amt_html = f'<span style="color:#22c55e;">+${abs(amount):,.2f}</span>'

            rows += f"""
            <tr>
                <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb;">{date}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb;">{tx_type.replace("_", " ").title()}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb;">{desc}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:600;">{amt_html}</td>
            </tr>"""

        total_in = sum(
            t.get("amount", 0) for t in transactions if t.get("type") in ("deposit", "interest", "transfer_in")
        )
        total_out = sum(
            t.get("amount", 0) for t in transactions if t.get("type") in ("withdrawal", "transfer_out", "emi")
        )

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>NEXA Statement</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1f2937;">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #22d3ee; padding-bottom:20px; margin-bottom:30px;">
        <div>
            <h1 style="margin:0; font-size:32px; color:#22d3ee; letter-spacing:4px;">NEXA</h1>
            <p style="margin:4px 0 0; font-size:11px; color:#6b7280; letter-spacing:3px;">BEYOND FINTECH</p>
        </div>
        <div style="text-align:right;">
            <p style="margin:0; font-size:13px; color:#6b7280;">Account Statement</p>
            <p style="margin:4px 0 0; font-size:12px; color:#9ca3af;">Generated: {generated}</p>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:30px;">
        <div style="background:#f9fafb; border-radius:8px; padding:16px;">
            <p style="margin:0; font-size:12px; color:#6b7280;">Account Number</p>
            <p style="margin:4px 0 0; font-size:16px; font-weight:700;">{acct_num}</p>
        </div>
        <div style="background:#f9fafb; border-radius:8px; padding:16px;">
            <p style="margin:0; font-size:12px; color:#6b7280;">Account Type</p>
            <p style="margin:4px 0 0; font-size:16px; font-weight:700;">{acct_type.title()}</p>
        </div>
        <div style="background:#f9fafb; border-radius:8px; padding:16px;">
            <p style="margin:0; font-size:12px; color:#6b7280;">Current Balance</p>
            <p style="margin:4px 0 0; font-size:16px; font-weight:700; color:#22d3ee;">${balance:,.2f}</p>
        </div>
        <div style="background:#f9fafb; border-radius:8px; padding:16px;">
            <p style="margin:0; font-size:12px; color:#6b7280;">Total Transactions</p>
            <p style="margin:4px 0 0; font-size:16px; font-weight:700;">{len(transactions)}</p>
        </div>
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:30px;">
        <thead>
            <tr style="background:#f3f4f6;">
                <th style="padding:10px 12px; text-align:left; font-size:12px; color:#6b7280; font-weight:600;">Date</th>
                <th style="padding:10px 12px; text-align:left; font-size:12px; color:#6b7280; font-weight:600;">Type</th>
                <th style="padding:10px 12px; text-align:left; font-size:12px; color:#6b7280; font-weight:600;">Description</th>
                <th style="padding:10px 12px; text-align:right; font-size:12px; color:#6b7280; font-weight:600;">Amount</th>
            </tr>
        </thead>
        <tbody>{rows}</tbody>
    </table>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:30px;">
        <div style="background:#ecfdf5; border-radius:8px; padding:16px; text-align:center;">
            <p style="margin:0; font-size:11px; color:#065f46;">Total Credits</p>
            <p style="margin:4px 0 0; font-size:18px; font-weight:700; color:#22c55e;">${total_in:,.2f}</p>
        </div>
        <div style="background:#fef2f2; border-radius:8px; padding:16px; text-align:center;">
            <p style="margin:0; font-size:11px; color:#991b1b;">Total Debits</p>
            <p style="margin:4px 0 0; font-size:18px; font-weight:700; color:#ef4444;">${total_out:,.2f}</p>
        </div>
        <div style="background:#eff6ff; border-radius:8px; padding:16px; text-align:center;">
            <p style="margin:0; font-size:11px; color:#1e40af;">Net Flow</p>
            <p style="margin:4px 0 0; font-size:18px; font-weight:700; color:#3b82f6;">${total_in - total_out:,.2f}</p>
        </div>
    </div>

    <div style="border-top:1px solid #e5e7eb; padding-top:20px; text-align:center;">
        <p style="margin:0; font-size:11px; color:#9ca3af;">© 2026 NEXA — Beyond Fintech. All rights reserved.</p>
        <p style="margin:4px 0 0; font-size:10px; color:#d1d5db;">This statement is generated electronically and is valid without signature.</p>
    </div>
</body>
</html>"""
        return html

    def generate_audit_report(self, audit_entries: list[dict], report_type: str = "general") -> str:
        """Generate audit trail CSV for compliance."""
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([f"NEXA Banking — Audit Report ({report_type.upper()})"])
        writer.writerow([f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
        writer.writerow([])
        writer.writerow(["Timestamp", "User", "Action", "Details", "IP Address", "Risk Level"])

        for entry in audit_entries:
            writer.writerow(
                [
                    entry.get("timestamp", ""),
                    entry.get("user", "system"),
                    entry.get("action", ""),
                    entry.get("details", ""),
                    entry.get("ip_address", "N/A"),
                    entry.get("risk_level", "low"),
                ]
            )

        return output.getvalue()


# Singleton
export_service = ExportService()
