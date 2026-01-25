# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False

"""
High-performance block utilities implemented in Cython.
Optimized for mining and block hash calculations.
"""

import hashlib
import json
from cpython cimport bool

cpdef str calculate_block_hash(int index, double timestamp, object data, 
                                str previous_hash, long nonce):
    """
    Calculate block hash with optimized JSON serialization.
    
    Args:
        index: Block index
        timestamp: Block timestamp
        data: Block data (transactions)
        previous_hash: Hash of previous block
        nonce: Mining nonce
        
    Returns:
        Hexadecimal hash string
    """
    cdef str block_string = json.dumps({
        "index": index,
        "timestamp": timestamp,
        "data": data,
        "previous_hash": previous_hash,
        "nonce": nonce
    }, sort_keys=True)
    
    return hashlib.sha256(block_string.encode('utf-8')).hexdigest()


cpdef tuple mine_block_hash(int index, double timestamp, object data,
                            str previous_hash, int difficulty, long start_nonce=0):
    """
    Mine a block by finding a valid nonce.
    This is the most CPU-intensive operation in the blockchain.
    
    Args:
        index: Block index
        timestamp: Block timestamp
        data: Block data (transactions)
        previous_hash: Hash of previous block
        difficulty: Number of leading zeros required
        start_nonce: Starting nonce value
        
    Returns:
        Tuple of (hash, nonce) when valid proof found
    """
    cdef long nonce = start_nonce
    cdef str block_hash
    cdef str target = '0' * difficulty
    cdef int i
    cdef bint valid
    
    # Pre-build the static parts of the block
    cdef dict block_template = {
        "index": index,
        "timestamp": timestamp,
        "data": data,
        "previous_hash": previous_hash,
        "nonce": 0
    }
    
    while True:
        block_template["nonce"] = nonce
        block_hash = hashlib.sha256(
            json.dumps(block_template, sort_keys=True).encode('utf-8')
        ).hexdigest()
        
        # Check if hash meets difficulty requirement
        valid = True
        for i in range(difficulty):
            if block_hash[i] != '0':
                valid = False
                break
        
        if valid:
            return (block_hash, nonce)
        
        nonce += 1


cpdef str fast_transaction_hash(str sender, str receiver, double amount, double timestamp):
    """
    Calculate transaction hash efficiently.
    
    Args:
        sender: Sender address
        receiver: Receiver address
        amount: Transaction amount
        timestamp: Transaction timestamp
        
    Returns:
        Hexadecimal hash string
    """
    cdef str tx_string = json.dumps({
        "sender": sender,
        "receiver": receiver,
        "amount": amount,
        "timestamp": timestamp
    }, sort_keys=True)
    
    return hashlib.sha256(tx_string.encode('utf-8')).hexdigest()


cpdef bytes fast_transaction_hash_bytes(str sender, str receiver, double amount, double timestamp):
    """
    Calculate transaction hash as bytes for signing.
    
    Args:
        sender: Sender address
        receiver: Receiver address
        amount: Transaction amount
        timestamp: Transaction timestamp
        
    Returns:
        Raw hash bytes (32 bytes)
    """
    cdef str tx_string = json.dumps({
        "sender": sender,
        "receiver": receiver,
        "amount": amount,
        "timestamp": timestamp
    }, sort_keys=True)
    
    return hashlib.sha256(tx_string.encode('utf-8')).digest()


cpdef bint verify_chain_segment(list hashes, list previous_hashes, int start_index=1):
    """
    Verify a segment of the blockchain for hash consistency.
    
    Args:
        hashes: List of block hashes
        previous_hashes: List of previous_hash values
        start_index: Starting index for verification
        
    Returns:
        True if chain segment is valid
    """
    cdef int i
    cdef int length = len(hashes)
    
    if length != len(previous_hashes):
        return False
    
    for i in range(start_index, length):
        if previous_hashes[i] != hashes[i - 1]:
            return False
    
    return True
