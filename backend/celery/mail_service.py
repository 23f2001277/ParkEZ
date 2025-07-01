import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging

# Configure logging
logger = logging.getLogger(__name__)

SMTP_SERVER = 'localhost'
SMTP_PORT = 1025
SENDER_EMAIL = 'admin@gmail.com'
SENDER_PASSWORD = 'admin'

def send_email(to, subject, content):
    """
    Send email via SMTP server (MailHog for development)

    Args:
        to (str): Recipient email address
        subject (str): Email subject
        content (str): Email content (HTML or plain text)

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        msg = MIMEMultipart()
        msg['To'] = to
        msg['From'] = SENDER_EMAIL
        msg['Subject'] = subject

        # Attach content as HTML
        msg.attach(MIMEText(content, 'html'))

        # Connect to SMTP server and send email
        with smtplib.SMTP(host=SMTP_SERVER, port=SMTP_PORT) as client:
            
            client.send_message(msg)

        logger.info(f"Email sent successfully to {to}")
        return True

    except smtplib.SMTPException as e:
        logger.error(f"SMTP error when sending email to {to}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error when sending email to {to}: {str(e)}")
        return False