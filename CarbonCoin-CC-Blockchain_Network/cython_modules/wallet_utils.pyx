# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False

"""
High-performance wallet utilities implemented in Cython.
Optimized for address generation and signature operations.
"""

import hashlib

cpdef str generate_address(bytes public_key_bytes):
    """
    Generate wallet address from public key bytes.
    
    Args:
        public_key_bytes: Raw public key bytes
        
    Returns:
        Wallet address (SHA256 hash as hex)
    """
    return hashlib.sha256(public_key_bytes).hexdigest()


cpdef str ripemd160_hash(bytes data):
    """
    Compute RIPEMD160 hash (used in Bitcoin-style addresses).
    
    Args:
        data: Input bytes
        
    Returns:
        Hexadecimal hash string
    """
    cdef object h = hashlib.new('ripemd160')
    h.update(data)
    return h.hexdigest()


cpdef str generate_bitcoin_style_address(bytes public_key_bytes):
    """
    Generate Bitcoin-style address: RIPEMD160(SHA256(pubkey)).
    
    Args:
        public_key_bytes: Raw public key bytes
        
    Returns:
        Bitcoin-style address
    """
    cdef bytes sha256_hash = hashlib.sha256(public_key_bytes).digest()
    cdef object ripemd = hashlib.new('ripemd160')
    ripemd.update(sha256_hash)
    return ripemd.hexdigest()


cpdef bint verify_address_format(str address, int expected_length=64):
    """
    Verify that an address has valid format.
    
    Args:
        address: Address string to verify
        expected_length: Expected length of address
        
    Returns:
        True if address format is valid
    """
    cdef int i
    cdef str c
    cdef str valid_chars = '0123456789abcdef'
    
    if len(address) != expected_length:
        return False
    
    for i in range(expected_length):
        c = address[i].lower()
        if c not in valid_chars:
            return False
    
    return True


cpdef bytes hex_to_bytes(str hex_string):
    """
    Convert hexadecimal string to bytes efficiently.
    
    Args:
        hex_string: Hexadecimal string
        
    Returns:
        Bytes representation
    """
    return bytes.fromhex(hex_string)


cpdef str bytes_to_hex(bytes data):
    """
    Convert bytes to hexadecimal string efficiently.
    
    Args:
        data: Input bytes
        
    Returns:
        Hexadecimal string
    """
    return data.hex()
