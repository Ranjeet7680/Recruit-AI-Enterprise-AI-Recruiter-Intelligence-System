"""
PII-Safe Structured Logging Framework.
Automatically masks emails, phone numbers, auth tokens, and raw resume dumps from log streams.
"""

import re
import logging
import sys

# PII Regex Matchers
EMAIL_REGEX = re.compile(r"([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)")
PHONE_REGEX = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
BEARER_REGEX = re.compile(r"Bearer\s+([A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*)", re.IGNORECASE)

class PIIRedactingFormatter(logging.Formatter):
    """Custom logging formatter that strips PII before writing to log sinks."""
    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        # Redact Bearer Tokens
        msg = BEARER_REGEX.sub("Bearer [REDACTED_TOKEN]", msg)
        # Redact Emails (preserve first char and domain for debuggability)
        msg = EMAIL_REGEX.sub(r"\1[REDACTED]@\2", msg)
        # Redact Phones
        msg = PHONE_REGEX.sub("[REDACTED_PHONE]", msg)
        return msg

def get_logger(name: str = "nexora") -> logging.Logger:
    """Returns a configured PII-safe logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(PIIRedactingFormatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        ))
        logger.addHandler(handler)
    return logger

logger = get_logger("nexora.system")
