import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os
import logging
from src.core.config import settings

logger = logging.getLogger(__name__)

def send_email_report(to_email, subject, content, attachment_path=None):
    try:
        sender = settings.EMAIL_USER
        password = settings.EMAIL_PASS
        smtp_host = settings.SMTP_HOST
        smtp_port = settings.SMTP_PORT
        use_ssl = settings.SMTP_USE_SSL

        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to_email

        msg.attach(MIMEText(content))

        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as f:
                part = MIMEApplication(f.read(), Name=os.path.basename(attachment_path))
            part['Content-Disposition'] = f'attachment; filename="{os.path.basename(attachment_path)}"'
            msg.attach(part)

        # Connect and Send
        if use_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(sender, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(sender, password)
                server.send_message(msg)

        logger.info(f"📧 Email sent successfully to {to_email}")

    except Exception as e:
        logger.error(f"❌ Email SMTP error: {e}")
        raise e
