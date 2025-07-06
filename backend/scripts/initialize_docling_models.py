#!/usr/bin/env python3
"""
Script to initialize Docling models by downloading required model artifacts.
This will ensure all necessary Hugging Face models are properly cached.
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

def initialize_docling_models():
    """Initialize Docling models by creating a DocumentConverter instance."""
    try:
        print("Initializing Docling models...")
        
        # Import docling components
        from docling.document_converter import DocumentConverter
        
        print("Creating DocumentConverter instance...")
        # This will trigger the download of required models
        converter = DocumentConverter()
        
        print("✅ Docling models initialized successfully!")
        print("Models have been downloaded and cached.")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize Docling models: {str(e)}")
        return False

def test_docling_conversion():
    """Test docling conversion with a simple text file."""
    try:
        print("\nTesting Docling conversion...")
        
        # Create a simple test file
        test_file = Path("test_document.txt")
        test_file.write_text("This is a test document for Docling.")
        
        from docling.document_converter import DocumentConverter
        
        converter = DocumentConverter()
        result = converter.convert(source=str(test_file))
        
        # Clean up test file
        test_file.unlink()
        
        print("✅ Docling conversion test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Docling conversion test failed: {str(e)}")
        # Clean up test file if it exists
        test_file = Path("test_document.txt")
        if test_file.exists():
            test_file.unlink()
        return False

if __name__ == "__main__":
    print("Docling Model Initialization Script")
    print("=" * 40)
    
    # Initialize models
    init_success = initialize_docling_models()
    
    if init_success:
        # Test conversion
        test_success = test_docling_conversion()
        
        if test_success:
            print("\n🎉 All tests passed! Docling is ready to use.")
            sys.exit(0)
        else:
            print("\n⚠️  Model initialization succeeded but conversion test failed.")
            sys.exit(1)
    else:
        print("\n❌ Model initialization failed.")
        sys.exit(1)
