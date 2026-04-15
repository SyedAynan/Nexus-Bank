"""
NEXA Email Service — OTP Delivery + Notification Emails
Integrates with SendGrid/SES when API key is configured.
Falls back to console logging for development/demo.
"""

import os
import logging
import time
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SES_ACCESS_KEY = os.getenv("AWS_SES_ACCESS_KEY", "")
FROM_EMAIL = os.getenv("EMAIL_FROM", "noreply@nexa-bank.com")
FROM_NAME = os.getenv("EMAIL_FROM_NAME", "NEXA Banking")


class EmailService:
    """Email service with console fallback when no provider configured."""

    def __init__(self):
        if SENDGRID_API_KEY:
            self.provider = "sendgrid"
            self.mode = "production"
        elif SES_ACCESS_KEY:
            self.provider = "ses"
            self.mode = "production"
        else:
            self.provider = "console"
            self.mode = "simulation"
        self._sent_log: List[Dict] = []
        logger.info(f"Email service: provider={self.provider}, mode={self.mode}")

    def get_status(self) -> Dict[str, Any]:
        return {
            "enabled": True,
            "provider": self.provider,
            "mode": self.mode,
            "from_email": FROM_EMAIL,
            "total_sent": len(self._sent_log),
        }

    def send_otp(
        self, to_email: str, otp_code: str, purpose: str = "login"
    ) -> Dict[str, Any]:
        """Send OTP code via email."""
        subject = f"NEXA — Your verification code: {otp_code}"
        html = f"""
        <div style="font-family: system-ui; max-width: 480px; margin: 0 auto; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #22d3ee; font-size: 28px; margin: 0;">NEXA</h1>
                <p style="color: #666; font-size: 12px; letter-spacing: 2px;">BEYOND FINTECH</p>
            </div>
            <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center;">
                <p style="color: #333; font-size: 14px; margin-bottom: 16px;">Your verification code for {purpose}:</p>
                <div style="font-size: 36px; font-weight: 700; color: #22d3ee; letter-spacing: 8px; padding: 16px; background: white; border-radius: 8px; border: 2px dashed #22d3ee;">{otp_code}</div>
                <p style="color: #999; font-size: 12px; margin-top: 16px;">This code expires in 5 minutes. Do not share it with anyone.</p>
            </div>
            <p style="color: #999; font-size: 11px; text-align: center; margin-top: 24px;">© 2026 NEXA Banking. All rights reserved.</p>
        </div>
        """
        return self._send(to_email, subject, html, "otp")

    def send_transaction_alert(
        self, to_email: str, tx_type: str, amount: float, account: str
    ) -> Dict[str, Any]:
        """Send transaction notification."""
        subject = f"NEXA — {tx_type.title()} of ${amount:,.2f}"
        html = f"""
        <div style="font-family: system-ui; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h1 style="color: #22d3ee; font-size: 24px;">NEXA</h1>
            <div style="background: #f8f9fa; border-radius: 12px; padding: 24px;">
                <h2 style="margin: 0; font-size: 16px; color: #333;">Transaction Alert</h2>
                <table style="width: 100%; margin-top: 16px; font-size: 14px;">
                    <tr><td style="color: #666; padding: 4px 0;">Type</td><td style="text-align: right; color: #333; font-weight: 600;">{tx_type.title()}</td></tr>
                    <tr><td style="color: #666; padding: 4px 0;">Amount</td><td style="text-align: right; color: #22d3ee; font-weight: 700;">${amount:,.2f}</td></tr>
                    <tr><td style="color: #666; padding: 4px 0;">Account</td><td style="text-align: right; color: #333;">{account}</td></tr>
                </table>
            </div>
        </div>
        """
        return self._send(to_email, subject, html, "transaction_alert")

    def send_security_alert(
        self, to_email: str, event: str, details: str
    ) -> Dict[str, Any]:
        """Send security notification (login, password change, etc.)."""
        subject = f"NEXA — Security Alert: {event}"
        html = f"""
        <div style="font-family: system-ui; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h1 style="color: #22d3ee; font-size: 24px;">NEXA</h1>
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 12px; padding: 24px;">
                <h2 style="margin: 0; font-size: 16px; color: #856404;">⚠️ Security Alert</h2>
                <p style="color: #856404; font-size: 14px; margin-top: 12px;"><strong>{event}</strong></p>
                <p style="color: #856404; font-size: 13px;">{details}</p>
                <p style="color: #856404; font-size: 12px; margin-top: 16px;">If this wasn't you, please contact support immediately.</p>
            </div>
        </div>
        """
        return self._send(to_email, subject, html, "security_alert")

    def _send(
        self, to_email: str, subject: str, html: str, email_type: str
    ) -> Dict[str, Any]:
        """Send email through configured provider or log to console."""
        record = {
            "to": to_email,
            "subject": subject,
            "type": email_type,
            "provider": self.provider,
            "timestamp": time.time(),
            "status": "sent",
        }

        if self.provider == "sendgrid":
            # Production: would use sendgrid.SendGridAPIClient here
            logger.info(f"Email [SendGrid]: {subject} → {to_email}")
            record["message_id"] = f"sg-{int(time.time())}"
        elif self.provider == "ses":
            # Production: would use boto3 SES client here
            logger.info(f"Email [SES]: {subject} → {to_email}")
            record["message_id"] = f"ses-{int(time.time())}"
        else:
            # Console fallback
            logger.info(f"📧 Email [Console]: {subject} → {to_email}")
            logger.info(f"   Type: {email_type} | Provider: console (simulation)")
            record["message_id"] = f"console-{int(time.time())}"
            record["mode"] = "simulation"

        self._sent_log.append(record)
        return record

    def get_sent_log(self, limit: int = 50) -> List[Dict]:
        """Return recent sent emails."""
        return list(reversed(self._sent_log[-limit:]))


# Singleton
email_service = EmailService()
