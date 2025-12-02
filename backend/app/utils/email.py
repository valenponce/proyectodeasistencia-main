from flask_mail import Message
from flask import current_app

def send_email(to_email, subject, body):
    from app import mail  # ⬅️ import diferido para evitar error circular

    msg = Message(
        subject,
        recipients=[to_email],
        body=body,
        sender=(current_app.config.get("MAIL_DEFAULT_NAME", "Sistema"), current_app.config.get("MAIL_DEFAULT_EMAIL"))
    )
    mail.send(msg)
