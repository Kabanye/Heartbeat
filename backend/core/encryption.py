"""
Encryption utilities for securing service credentials.
Uses Fernet symmetric encryption for storing sensitive data.
"""
from cryptography.fernet import Fernet
from django.conf import settings


class CredentialEncryption:
    """
    Handles encryption and decryption of service credentials.
    
    Service credentials (passwords, API keys) must be encrypted at rest
    but retrievable for health checks. This is different from user passwords
    which are hashed (one-way) and cannot be retrieved.
    """
    
    def __init__(self):
        self.key = settings.ENCRYPTION_KEY
        if isinstance(self.key, str):
            self.key = self.key.encode()
        self.cipher = Fernet(self.key)
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext credential.
        
        Args:
            plaintext: The sensitive string to encrypt
            
        Returns:
            Encrypted string (Fernet token)
        """
        if not plaintext:
            return plaintext
        encrypted = self.cipher.encrypt(plaintext.encode())
        return encrypted.decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted credential.
        
        Args:
            ciphertext: The encrypted string to decrypt
            
        Returns:
            Original plaintext string
        """
        if not ciphertext:
            return ciphertext
        decrypted = self.cipher.decrypt(ciphertext.encode())
        return decrypted.decode()


# Singleton instance for use across the application
encryption = CredentialEncryption()