import os
import smtplib
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT", 587)
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)



def send_otp_email(to_email: str, otp: str):
    msg = EmailMessage()
    msg["Subject"] = "Your verification code"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        f"""
Your verification code is:

{otp}

This code expires in 10 minutes.
If you did not request this, ignore this email.
"""
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)

def get_all_graduate_emails():
    """Fetch emails of all users with role 'graduate'"""
    try:
        # Note: 'User' table usually has 'email' and 'role'
        # Adjust table name if it's strictly case sensitive "User" or "users"
        # Based on userdatabase.py: supabase.table("User")
        emails = []

        grads = supabase.table("graduates").select("id").execute().data

        for grad in grads:
            id = grad["id"]
            res = supabase.table("User").select("email").eq("id",id).single().execute().data
            if res: emails.append(res["email"])

        # [row['email'] for row in res.data if row.get('email')]
        return emails
    except Exception as e:
        print(f"Error fetching graduate emails: {e}")
        return []

def get_graduate_email_by_id(graduate_id: str):
    """Fetch email for a specific graduate ID"""
    try:
        res = supabase.table("User").select("email").eq("id", graduate_id).single().execute()
        return res.data['email'] if res.data else None
    except Exception as e:
        print(f"Error fetching email for graduate {graduate_id}: {e}")
        return None

def send_email(to_emails: list[str], subject: str, body: str):
    """
    Send an email to a list of recipients.
    """
    print("Email config: host, user, password, from \n",SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM )
    if not (SMTP_HOST and SMTP_USER and SMTP_PASSWORD and SMTP_FROM):
        print("⚠️ Email configuration missing. Skipping email send.")
        print(f"Would have sent email to {len(to_emails)} recipients: {subject}")
        return

    if not to_emails:
        print("No recipients provided for email.")
        return

    try:
        # Convert list to unique set to avoid duplicates
        # unique_emails = list(set(to_emails))
        unique_emails = to_emails
        
        # Connect to SMTP server
        server = smtplib.SMTP(SMTP_HOST, int(SMTP_PORT))
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)

        # Send individual emails (to hide other recipients) or use BCC
        # For simplicity and privacy, let's send individually or BCC. 
        # BCC is better for bulk if supported, but loop is safer for errors.
        
        # Actually, let's just send one email with BCC if the list is long, 
        # or individual if it's small.
        # Let's iterate for now to be safe.
        
        print(f"Sending email '{subject}' to {len(unique_emails)} recipients...")

        for email_addr in unique_emails:
            msg = MIMEMultipart()
            msg['From'] = SMTP_FROM
            msg['To'] = email_addr
            msg['Subject'] = subject

            print("sending to: ", email_addr)

            msg.attach(MIMEText(body, 'html')) # Support HTML for nicer notifications

            server.sendmail(SMTP_FROM, email_addr, msg.as_string())

        server.quit()
        print("✅ Emails sent successfully.")

    except Exception as e:
        print(f"❌ Error sending email: {e}")
        
#send_email(["mxovelamxo@outlook.com","mo1motala@gmail.com"], "Testing function send", "test4")
#print(get_all_graduate_emails())