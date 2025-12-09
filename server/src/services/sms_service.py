import logging
import random
import string

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self, provider="mock"):
        self.provider = provider

    def send_sms(self, phone_number: str, message: str):
        if self.provider == "mock":
            logger.info(f"[[MOCK SMS]] To: {phone_number}, Message: {message}")
            print(f"[[MOCK SMS]] To: {phone_number}, Message: {message}") # Print to stdout for visibility in logs
            return True
        else:
            # Implement Twilio or other provider here
            pass

    def generate_code(self, length=6):
        return ''.join(random.choices(string.digits, k=length))

sms_service = SMSService()
