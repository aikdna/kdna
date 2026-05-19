from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="kdna",
    version="0.4.0",
    author="Knowledge DNA",
    author_email="hello@aikdna.com",
    description="KDNA Python SDK — Load domain cognition for AI agents",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/knowledge-dna/KDNA",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[],
    extras_require={
        "dev": ["pytest", "black", "mypy"],
    },
)
