import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if db_url:
    print("DATABASE_URL is found.")
else:
    print("DATABASE_URL is NOT found.")

try:
    import psycopg2
    print("psycopg2 is installed.")
except ImportError:
    print("psycopg2 is NOT installed.")

try:
    import sqlalchemy
    print("sqlalchemy is installed.")
except ImportError:
    print("sqlalchemy is NOT installed.")
