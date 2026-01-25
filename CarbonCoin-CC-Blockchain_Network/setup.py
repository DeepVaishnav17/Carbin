"""
Setup script for building Cython extensions.

Build commands:
    python setup.py build_ext --inplace    # Build for development
    python setup.py install                 # Install to site-packages
    
For Windows, you may need Visual Studio Build Tools installed.
For Linux/Mac, you need gcc/clang.
"""

import sys
import os
from setuptools import setup, Extension, find_packages

# Try to import Cython
try:
    from Cython.Build import cythonize
    from Cython.Distutils import build_ext
    USE_CYTHON = True
except ImportError:
    USE_CYTHON = False
    print("Cython not found. Installing from pre-built extensions or pure Python fallback.")

# Compiler optimization flags
extra_compile_args = []
extra_link_args = []

if sys.platform == 'win32':
    # Windows (MSVC)
    extra_compile_args = ['/O2', '/arch:AVX2']
elif sys.platform == 'darwin':
    # macOS (clang)
    extra_compile_args = ['-O3', '-march=native', '-ffast-math']
    extra_link_args = ['-O3']
else:
    # Linux (gcc)
    extra_compile_args = ['-O3', '-march=native', '-ffast-math', '-fopenmp']
    extra_link_args = ['-O3', '-fopenmp']


def get_extensions():
    """Define Cython extensions."""
    extensions = []
    
    cython_modules = [
        ('cython_modules.crypto_utils', 'cython_modules/crypto_utils'),
        ('cython_modules.block_utils', 'cython_modules/block_utils'),
        ('cython_modules.wallet_utils', 'cython_modules/wallet_utils'),
    ]
    
    for module_name, module_path in cython_modules:
        if USE_CYTHON:
            source = f'{module_path}.pyx'
        else:
            source = f'{module_path}.c'
            if not os.path.exists(source):
                print(f"Warning: {source} not found. Skipping {module_name}.")
                continue
        
        ext = Extension(
            module_name,
            sources=[source],
            extra_compile_args=extra_compile_args,
            extra_link_args=extra_link_args,
        )
        extensions.append(ext)
    
    return extensions


extensions = get_extensions()

if USE_CYTHON and extensions:
    extensions = cythonize(
        extensions,
        compiler_directives={
            'language_level': 3,
            'boundscheck': False,
            'wraparound': False,
            'cdivision': True,
            'embedsignature': True,
        },
        annotate=True,  # Generate HTML annotation files
    )

setup(
    name='CarbonCoin(CC)blockchain_network',
    version='1.0.0',
    description='High-performance blockchain network with Cython optimization',
    author='Ronak S. Maniya',
    packages=find_packages(),
    ext_modules=extensions if extensions else [],
    cmdclass={'build_ext': build_ext} if USE_CYTHON else {},
    python_requires='>=3.8',
    install_requires=[
        'Flask>=2.0.0',
        'ecdsa>=0.18.0',
        'requests>=2.28.0',
    ],
    extras_require={
        'dev': [
            'Cython>=3.0.0',
            'pytest>=7.0.0',
            'pytest-benchmark>=4.0.0',
        ],
    },
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Programming Language :: Python :: 3',
        'Programming Language :: Cython',
    ],
)
