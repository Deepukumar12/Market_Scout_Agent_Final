import os
import sys
from dotenv import load_dotenv

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from src.domains.notifications.services.email_service import send_email_report

load_dotenv()

def test_email():
    email = os.getenv("EMAIL_USER")
    print(f"Testing email dispatch to: {email}")
    
    subject = "ScoutForge AI | Connection Test"
    content = "This is a tactical connection test for the automated intelligence network."
    html = "<h1 style='color: #0071E3;'>CONNECTION SECURE</h1><p>Neural link verified.</p>"
    
    send_email_report(
        to_email=email,
        subject=subject,
        content=content,
        html_content=html
    )

if __name__ == "__main__":
    test_email()
