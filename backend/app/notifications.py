import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# Lazy load twilio to prevent crashes if not installed
TWILIO_AVAILABLE = False
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    pass

class NotificationService:
    @staticmethod
    def send_status_update(grievance, old_status: str, new_status: str, owner_email: str = None, owner_phone: str = None):
        """
        Sends notifications (SMS, WhatsApp, Email) to the citizen on grievance status changes.
        """
        # Determine contact email & phone
        email = grievance.email or owner_email
        phone = grievance.phone or owner_phone
        title = grievance.title
        g_id = grievance.id

        message_body = (
            f"Update on your Naarad-GRS Grievance #{g_id} ({title}):\n"
            f"The status has been updated from '{old_status}' to '{new_status}'."
        )

        logger.info(f"Dispatching notifications for grievance #{g_id}")

        # 1. Dispatch SMS
        if phone:
            NotificationService.send_sms(phone, message_body)
            NotificationService.send_whatsapp(phone, message_body)
        else:
            logger.info(f"No phone number available for grievance #{g_id}; SMS skipped.")

        # 2. Dispatch Email
        if email:
            email_subject = f"Naarad-GRS Update: Grievance #{g_id} is '{new_status}'"
            NotificationService.send_email(email, email_subject, message_body)
        else:
            logger.info(f"No email address available for grievance #{g_id}; email skipped.")

    @staticmethod
    def send_sms(to_number: str, message: str):
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_SMS_FROM_NUMBER")

        if TWILIO_AVAILABLE and account_sid and auth_token and from_number:
            try:
                client = Client(account_sid, auth_token)
                client.messages.create(
                    body=message,
                    from_=from_number,
                    to=to_number
                )
                logger.info(f"Twilio SMS sent successfully to {to_number}")
            except Exception as e:
                logger.error(f"Failed to send Twilio SMS to {to_number}: {e}")
        else:
            # Fallback mock logging (Development Mode)
            print("\n" + "="*60)
            print("[MOCK SMS DISPATCH]")
            print(f"To: {to_number}")
            print(f"Message: {message}")
            print("="*60 + "\n")

    @staticmethod
    def send_whatsapp(to_number: str, message: str):
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_whatsapp = os.getenv("TWILIO_WHATSAPP_FROM") or "whatsapp:+14155238886"  # Twilio sandbox default

        # Ensure to_number is in correct whatsapp recipient format: e.g., whatsapp:+919876543210
        whatsapp_to = to_number
        if not whatsapp_to.startswith("whatsapp:"):
            whatsapp_to = f"whatsapp:{to_number}"

        if TWILIO_AVAILABLE and account_sid and auth_token:
            try:
                client = Client(account_sid, auth_token)
                client.messages.create(
                    body=message,
                    from_=from_whatsapp,
                    to=whatsapp_to
                )
                logger.info(f"Twilio WhatsApp sent successfully to {whatsapp_to}")
            except Exception as e:
                logger.error(f"Failed to send Twilio WhatsApp to {whatsapp_to}: {e}")
        else:
            # Fallback mock logging (Development Mode)
            print("\n" + "="*60)
            print("[MOCK WHATSAPP DISPATCH]")
            print(f"To: {whatsapp_to}")
            print(f"Message: {message}")
            print("="*60 + "\n")

    @staticmethod
    def send_email(to_email: str, subject: str, body: str):
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = os.getenv("SMTP_PORT", "587")
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@naarad-grs.gov.in")

        if smtp_server and smtp_user and smtp_password:
            try:
                msg = MIMEMultipart()
                msg['From'] = from_email
                msg['To'] = to_email
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'plain'))

                server = smtplib.SMTP(smtp_server, int(smtp_port))
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(from_email, to_email, msg.as_string())
                server.quit()
                logger.info(f"Email notification sent successfully to {to_email}")
            except Exception as e:
                logger.error(f"Failed to send SMTP email to {to_email}: {e}")
        else:
            # Fallback mock logging (Development Mode)
            print("\n" + "="*60)
            print("[MOCK EMAIL DISPATCH]")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Body:\n{body}")
            print("="*60 + "\n")
