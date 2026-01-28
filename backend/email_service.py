import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
SENDGRID_FROM = os.getenv('SENDGRID_FROM')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)



def send_otp_email(to_email: str, otp: str):
    html_content = f"""
    <p>Your verification code is:</p>
    <h2>{otp}</h2>
    <p>This code expires in 10 minutes.<br>
    If you did not request this, ignore this email.</p>
    """
    
    message = Mail(
        from_email=SENDGRID_FROM,
        to_emails=to_email,
        subject="Your verification code",
        html_content=html_content
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"OTP sent to {to_email}. Status: {response.status_code}")
    except Exception as e:
        print(f"Error sending OTP to {to_email}: {e}")

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
    Send an email to a list of recipients using SendGrid.
    """
    if not (SENDGRID_API_KEY and SENDGRID_FROM):
        print("⚠️ SendGrid configuration missing. Skipping email send.")
        print(f"Would have sent email to {len(to_emails)} recipients: {subject}")
        return

    if not to_emails:
        print("No recipients provided for email.")
        return

    try:
        # Convert list to unique set to avoid duplicates
        # unique_emails = list(set(to_emails))
        unique_emails = to_emails
        
        print(f"Sending email '{subject}' to {len(unique_emails)} recipients...")

        sg = SendGridAPIClient(SENDGRID_API_KEY)

        for email_addr in unique_emails:
            print("sending to: ", email_addr)
            
            message = Mail(
                from_email=SENDGRID_FROM,
                to_emails=email_addr,
                subject=subject,
                html_content=body
            )
            
            response = sg.send(message)
            print(f"Sent to {email_addr}. Status: {response.status_code}")

        print("✅ Emails sent successfully.")

    except Exception as e:
        print(f"❌ Error sending email: {e}")
        
#send_email(["mxovelamxo@outlook.com","mo1motala@gmail.com"], "Testing function send", "test4")
#print(get_all_graduate_emails())