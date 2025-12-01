# core/mongo_client.py - Updated for multi-user support
import logging
from decouple import config
from pymongo import MongoClient, errors

logger = logging.getLogger(__name__)

# Load connection string
MONGO_CONNECTION_STRING = config('MONGO_CONNECTION_STRING', default=None)
if not MONGO_CONNECTION_STRING:
    raise RuntimeError("MONGO_CONNECTION_STRING not found in environment. Add it to your .env")

# Create a single client for app lifetime
client = None
try:
    client = MongoClient(
        MONGO_CONNECTION_STRING,
        serverSelectionTimeoutMS=10000,
        tls=True,
        tlsAllowInvalidCertificates=True
    )
    # Verify connection
    client.admin.command('ping')
    logger.info("MongoDB connection successful.")
except errors.ServerSelectionTimeoutError as e:
    logger.error("MongoDB server selection timeout: %s", e)
    if client:
        client.close()
    client = None
except Exception as e:
    logger.exception("Unexpected error connecting to MongoDB: %s", e)
    if client:
        client.close()
    client = None

def get_db(db_name: str = "DigitalMemo"):
    """
    Return a handle to the named database.
    Raises RuntimeError if the client is not available.
    """
    if not client:
        raise RuntimeError("MongoDB client is not available. Check connection string and IP whitelist.")
    return client[db_name]

def get_drafts_collection(db_name: str = "DigitalMemo", collection_name: str = "drafts"):
    """
    Get the 'drafts' collection handle for kacha bills.
    """
    db = get_db(db_name)
    return db[collection_name]

def get_kacha_bills_collection(db_name: str = "DigitalMemo", collection_name: str = "kacha_bills"):
    """
    Get the 'kacha_bills' collection handle for completed kacha bills.
    """
    db = get_db(db_name)
    return db[collection_name]

def get_pakka_bills_collection(db_name: str = "DigitalMemo", collection_name: str = "pakka_bills"):
    """
    Get the 'pakka_bills' collection handle for final official bills.
    """
    db = get_db(db_name)
    return db[collection_name]

def get_next_sequence_value(sequence_name, user_id, db_name="DigitalMemo"):
    """
    Get the next sequence value for automatic numbering (user-specific)
    """
    db = get_db(db_name)
    counters = db['counters']
    
    # Create user-specific sequence name
    user_sequence_name = f"{user_id}_{sequence_name}"
    
    result = counters.find_one_and_update(
        {'_id': user_sequence_name},
        {'$inc': {'sequence_value': 1}},
        upsert=True,
        return_document=True
    )
    return result['sequence_value']

def get_next_bill_number(bill_type, user_id, db_name="DigitalMemo"):
    """
    Get next bill number based on type (user-specific)
    """
    prefix = {
        'kacha': 'KACHA',
        'pakka': 'PAKKA',
        'draft': 'DRAFT'
    }.get(bill_type, 'BILL')
    
    sequence_name = f"{bill_type}_bill_number"
    next_number = get_next_sequence_value(sequence_name, user_id, db_name)
    return f"{prefix}-{next_number:03d}"

def get_company_details_collection(db_name: str = "DigitalMemo", collection_name: str = "company_details"):
    """
    Get the 'company_details' collection handle for storing company information.
    """
    db = get_db(db_name)
    return db[collection_name]

# User-specific query helpers
def get_user_drafts(user_id):
    """Get drafts for specific user"""
    collection = get_drafts_collection()
    return collection.find({'user_id': user_id})

def get_user_kacha_bills(user_id):
    """Get kacha bills for specific user"""
    collection = get_kacha_bills_collection()
    return collection.find({'user_id': user_id})

def get_user_pakka_bills(user_id):
    """Get pakka bills for specific user"""
    collection = get_pakka_bills_collection()
    return collection.find({'user_id': user_id})

def get_user_company_details(user_id):
    """Get company details for specific user"""
    collection = get_company_details_collection()
    return collection.find_one({'user_id': user_id})