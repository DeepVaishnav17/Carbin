# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False

"""
High-performance cryptographic utilities implemented in Cython.
These functions are optimized for blockchain operations like hashing and proof validation.
"""

import hashlib
from cpython.bytes cimport PyBytes_AS_STRING
from libc.string cimport memcmp

cpdef str fast_sha256(str data):
    """
    Compute SHA256 hash of a string.
    Optimized version with reduced Python overhead.
    
    Args:
        data: Input string to hash
        
    Returns:
        Hexadecimal hash string
    """
    cdef bytes encoded = data.encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


cpdef bytes fast_sha256_bytes(bytes data):
    """
    Compute SHA256 hash of bytes, returning bytes.
    Even faster for binary data processing.
    
    Args:
        data: Input bytes to hash
        
    Returns:
        Raw hash bytes (32 bytes)
    """
    return hashlib.sha256(data).digest()


cpdef str fast_double_sha256(str data):
    """
    Compute double SHA256 hash (common in blockchain).
    SHA256(SHA256(data))
    
    Args:
        data: Input string to hash
        
    Returns:
        Hexadecimal hash string
    """
    cdef bytes encoded = data.encode('utf-8')
    cdef bytes first_hash = hashlib.sha256(encoded).digest()
    return hashlib.sha256(first_hash).hexdigest()


cpdef bint validate_proof(str block_hash, int difficulty):
    """
    Validate proof-of-work by checking leading zeros.
    Optimized comparison without string slicing.
    
    Args:
        block_hash: The hash to validate
        difficulty: Number of leading zeros required
        
    Returns:
        True if valid proof, False otherwise
    """
    cdef int i
    cdef str target = '0' * difficulty
    
    if len(block_hash) < difficulty:
        return False
    
    # Direct character comparison
    for i in range(difficulty):
        if block_hash[i] != '0':
            return False
    return True


cpdef bint validate_proof_bytes(bytes block_hash, int difficulty):
    """
    Validate proof-of-work using raw bytes.
    Each byte should be 0x00 for 2 leading zeros in hex.
    
    Args:
        block_hash: Raw hash bytes (32 bytes)
        difficulty: Number of leading zero bytes required (1 byte = 2 hex chars)
        
    Returns:
        True if valid proof, False otherwise
    """
    cdef int i
    cdef int byte_difficulty = difficulty // 2
    cdef int remainder = difficulty % 2
    cdef unsigned char byte_val
    cdef const unsigned char* hash_ptr = <const unsigned char*>PyBytes_AS_STRING(block_hash)
    
    # Check full zero bytes
    for i in range(byte_difficulty):
        if hash_ptr[i] != 0:
            return False
    
    # Check half byte if odd difficulty
    if remainder and byte_difficulty < 32:
        byte_val = hash_ptr[byte_difficulty]
        if byte_val >= 16:  # Upper nibble should be 0
            return False
    
    return True


cpdef tuple count_leading_zeros(str hash_string):
    """
    Count leading zeros in a hash string.
    
    Args:
        hash_string: Hexadecimal hash string
        
    Returns:
        Tuple of (count, total_length)
    """
    cdef int count = 0
    cdef int length = len(hash_string)
    cdef int i
    
    for i in range(length):
        if hash_string[i] == '0':
            count += 1
        else:
            break
    
    return (count, length)
