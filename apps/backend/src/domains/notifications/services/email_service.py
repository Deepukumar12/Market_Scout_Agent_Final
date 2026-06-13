import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

import re

def send_email_report(to_email, subject, content, attachment_path=None, attachment_name=None, html_content=None):
    try:
        sender = os.getenv("EMAIL_USER")
        password = os.getenv("EMAIL_PASS")

        if not sender or not password or sender == "your_email@gmail.com":
            print("⚠️ [EMAIL] EMAIL_USER or EMAIL_PASS not configured in .env. Skipping.")
            return

        # Sanitize and Validate recipient
        to_email = to_email.strip() if to_email else ""
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not to_email or not re.match(email_regex, to_email):
            print(f"❌ [EMAIL] Invalid recipient format: '{to_email}'")
            return

        print(f"📤 [EMAIL] Preparing dispatch to: {to_email}...")

        # Structure for mixed content
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"] = sender # Simplified to avoid "Address not found" on some clients
        msg["To"] = to_email

        body_container = MIMEMultipart("alternative")
        body_container.attach(MIMEText(content, "plain"))
        if html_content:
            body_container.attach(MIMEText(html_content, "html"))
        msg.attach(body_container)

        if attachment_path and os.path.exists(attachment_path):
            try:
                filename = attachment_name if attachment_name else os.path.basename(attachment_path)
                with open(attachment_path, "rb") as f:
                    part = MIMEApplication(f.read(), Name=filename)
                part['Content-Disposition'] = f'attachment; filename="{filename}"'
                msg.attach(part)
                print(f"📎 [EMAIL] Attached: {filename}")
            except Exception as e:
                print(f"❌ [EMAIL] Attachment error: {e}")

        # Use Port 587 with STARTTLS for better compatibility
        print("⚡ [EMAIL] Establishing secure SMTP connection (Port 587)...")
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.set_debuglevel(1) # Enable verbose output to catch exact error
            server.starttls() 
            server.login(sender, password)
            server.send_message(msg)

        print(f"📧 [EMAIL] Protocol complete. Sent to {to_email}")

    except smtplib.SMTPRecipientsRefused as e:
        print(f"❌ [EMAIL] Address Rejected: {to_email}. Error: {e}")
    except smtplib.SMTPAuthenticationError:
        print("❌ [EMAIL] Auth failed. Verify Gmail App Password.")
    except Exception as e:
        print(f"❌ [EMAIL] Critical Dispatch Error: {e}")
