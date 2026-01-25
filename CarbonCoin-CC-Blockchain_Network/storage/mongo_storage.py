"""
MongoDB Storage Module for Wallet Data

This module handles storing wallet data to MongoDB for integration with 
the main website. Only user wallets created via the /create_wallet API
endpoint are stored here (not collection, miners, or test users).

Collection: Wallets
Fields:
    - wallet_address: The wallet's public address
    - created_at: Timestamp when wallet was created
    - label: Username passed during wallet creation
"""

import logging
from typing import Optional, Dict
from datetime import datetime

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError, DuplicateKeyError
    from bson import ObjectId
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

from config import MONGO_URI, MONGO_DATABASE, MONGO_WALLETS_COLLECTION

# Configure logging
logger = logging.getLogger(__name__)


class MongoStorage:
    """
    MongoDB storage handler for wallet data.
    Used to store user wallets created via API for website integration.
    """
    
    _instance = None
    _client = None
    _db = None
    _collection = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern to reuse MongoDB connection."""
        if cls._instance is None:
            cls._instance = super(MongoStorage, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize MongoDB connection (only once due to singleton)."""
        if self._initialized:
            return
            
        if not PYMONGO_AVAILABLE:
            logger.warning("[MongoStorage] pymongo not installed. MongoDB features disabled.")
            self._initialized = True
            return
        
        try:
            self._client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # Test connection
            self._client.admin.command('ping')
            
            self._db = self._client[MONGO_DATABASE]
            self._collection = self._db[MONGO_WALLETS_COLLECTION]
            
            # Create unique index on wallet_address to prevent duplicates
            self._collection.create_index("wallet_address", unique=True)
            # Create index on label (username) for quick lookups
            self._collection.create_index("label")
            
            logger.info(f"[MongoStorage] Connected to MongoDB: {MONGO_DATABASE}.{MONGO_WALLETS_COLLECTION}")
            self._initialized = True
            
        except Exception as e:
            logger.error(f"[MongoStorage] Failed to connect to MongoDB: {e}")
            self._client = None
            self._db = None
            self._collection = None
            self._initialized = True
    
    def is_connected(self) -> bool:
        """Check if MongoDB is connected and available."""
        if not PYMONGO_AVAILABLE or self._client is None:
            return False
        try:
            self._client.admin.command('ping')
            return True
        except:
            return False
    
    def store_wallet(self, wallet_address: str, created_at: float, label: str, user_id: str = None) -> tuple:
        """
        Store a wallet in MongoDB.
        
        Args:
            wallet_address: The wallet's public address
            created_at: Timestamp when wallet was created (unix timestamp)
            label: Username/label for the wallet
            user_id: Optional ObjectId string from Users collection (for website integration)
            
        Returns:
            (success: bool, error_message: str or None)
        """
        if not self.is_connected():
            return False, "MongoDB not connected"
        
        try:
            document = {
                "wallet_address": wallet_address,
                "created_at": datetime.fromtimestamp(created_at),
                "label": label
            }
            
            # Add user_id only if provided (links to Users collection)
            # Convert string to ObjectId for proper MongoDB reference
            if user_id:
                document["user_id"] = ObjectId(user_id)
            
            self._collection.insert_one(document)
            logger.info(f"[MongoStorage] Stored wallet for user '{label}': {wallet_address[:16]}...")
            return True, None
            
        except DuplicateKeyError:
            return False, f"Wallet address already exists in database"
        except PyMongoError as e:
            logger.error(f"[MongoStorage] Failed to store wallet: {e}")
            return False, str(e)
        except Exception as e:
            logger.error(f"[MongoStorage] Unexpected error storing wallet: {e}")
            return False, str(e)
    
    def get_wallet_by_username(self, username: str) -> Optional[Dict]:
        """
        Get wallet by username (label).
        
        Args:
            username: The username/label to search for
            
        Returns:
            Wallet document dict or None if not found
        """
        if not self.is_connected():
            return None
        
        try:
            result = self._collection.find_one({"label": username})
            if result:
                # Convert ObjectId and datetime for JSON serialization
                result["_id"] = str(result["_id"])
                if isinstance(result.get("created_at"), datetime):
                    result["created_at"] = result["created_at"].timestamp()
            return result
        except Exception as e:
            logger.error(f"[MongoStorage] Failed to get wallet by username: {e}")
            return None
    
    def get_wallet_by_address(self, wallet_address: str) -> Optional[Dict]:
        """
        Get wallet by address.
        
        Args:
            wallet_address: The wallet address to search for
            
        Returns:
            Wallet document dict or None if not found
        """
        if not self.is_connected():
            return None
        
        try:
            result = self._collection.find_one({"wallet_address": wallet_address})
            if result:
                result["_id"] = str(result["_id"])
                if isinstance(result.get("created_at"), datetime):
                    result["created_at"] = result["created_at"].timestamp()
            return result
        except Exception as e:
            logger.error(f"[MongoStorage] Failed to get wallet by address: {e}")
            return None
    
    def username_exists(self, username: str) -> bool:
        """
        Check if a username/email already has a wallet assigned.
        Uses case-insensitive comparison.
        
        Args:
            username: The username/email to check
            
        Returns:
            True if username already has a wallet, False otherwise
        """
        if not self.is_connected():
            # If MongoDB is not connected, check local storage
            return False
        
        try:
            # Case-insensitive search using regex
            import re
            pattern = re.compile(f"^{re.escape(username)}$", re.IGNORECASE)
            count = self._collection.count_documents({"label": pattern})
            return count > 0
        except Exception as e:
            logger.error(f"[MongoStorage] Failed to check username: {e}")
            return False
    
    def get_all_wallets(self) -> list:
        """
        Get all wallets from MongoDB.
        
        Returns:
            List of wallet documents
        """
        if not self.is_connected():
            return []
        
        try:
            results = list(self._collection.find())
            for result in results:
                result["_id"] = str(result["_id"])
                if isinstance(result.get("created_at"), datetime):
                    result["created_at"] = result["created_at"].timestamp()
            return results
        except Exception as e:
            logger.error(f"[MongoStorage] Failed to get all wallets: {e}")
            return []
    
    def close(self):
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            logger.info("[MongoStorage] MongoDB connection closed")


# Global instance for easy access
mongo_storage = MongoStorage()
