import io
import os
from typing import List, Dict, Any
from pypdf import PdfReader

class DocumentChunker:
    @staticmethod
    def parse_pdf(file_bytes: bytes) -> str:
        """Parses text content from PDF file bytes."""
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            full_text = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    full_text.append(text)
            return "\n\n".join(full_text)
        except Exception as e:
            print(f"Error parsing PDF: {e}")
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    @staticmethod
    def parse_txt(file_bytes: bytes) -> str:
        """Parses text content from TXT/Markdown file bytes."""
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"Error parsing text file: {e}")
            raise ValueError(f"Failed to parse text document: {str(e)}")

    @staticmethod
    def parse_document(file_bytes: bytes, filename: str) -> str:
        """Determines document type and extracts plain text."""
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            return DocumentChunker.parse_pdf(file_bytes)
        elif ext in [".txt", ".md", ".json", ".csv"]:
            return DocumentChunker.parse_txt(file_bytes)
        else:
            # Fallback to UTF-8 decoding
            return DocumentChunker.parse_txt(file_bytes)

    @staticmethod
    def split_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> List[str]:
        """Recursively splits text into overlapping chunks, trying to preserve structural boundaries."""
        if not text or not text.strip():
            return []
            
        separators = ["\n\n", "\n", " ", ""]
        chunks = []
        
        # Simple recursive splitting implementation
        def split_recursive(sub_text: str, sep_idx: int) -> List[str]:
            if len(sub_text) <= chunk_size:
                return [sub_text]
            
            if sep_idx >= len(separators):
                # Hard cut if no more separators
                return [sub_text[i:i + chunk_size] for i in range(0, len(sub_text), chunk_size - chunk_overlap)]
            
            separator = separators[sep_idx]
            parts = sub_text.split(separator)
            
            temp_chunks = []
            current_chunk = ""
            
            for part in parts:
                # Add back the separator if it's not empty/end
                part_to_add = part + separator if separator != "" else part
                
                if len(current_chunk) + len(part_to_add) <= chunk_size:
                    current_chunk += part_to_add
                else:
                    if current_chunk:
                        temp_chunks.append(current_chunk.strip())
                    
                    # If single part exceeds chunk size, split it with next separator
                    if len(part_to_add) > chunk_size:
                        temp_chunks.extend(split_recursive(part_to_add, sep_idx + 1))
                        current_chunk = ""
                    else:
                        current_chunk = part_to_add
            
            if current_chunk:
                temp_chunks.append(current_chunk.strip())
                
            return temp_chunks

        raw_chunks = split_recursive(text, 0)
        
        # Apply overlapping logic to stitch together chunks where possible
        final_chunks = []
        for i, chunk in enumerate(raw_chunks):
            if i == 0:
                final_chunks.append(chunk)
                continue
            
            # Find overlap from previous chunk
            prev_chunk = raw_chunks[i-1]
            overlap_text = prev_chunk[-chunk_overlap:] if len(prev_chunk) >= chunk_overlap else prev_chunk
            
            # Combine to ensure context carries over
            combined = (overlap_text + "\n" + chunk)[:chunk_size]
            final_chunks.append(combined)
            
        return final_chunks
