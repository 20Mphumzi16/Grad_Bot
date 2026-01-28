import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from security import hash_password, verify_password

pwd = "my_secret_password"
hashed = hash_password(pwd)
print(f"Password: {pwd}")
print(f"Hashed: {hashed}")
print(f"Verify Correct: {verify_password(pwd, hashed)}")
print(f"Verify Incorrect: {verify_password('wrong', hashed)}")

assert verify_password(pwd, hashed) == True
assert verify_password('wrong', hashed) == False
print("Test passed!")
