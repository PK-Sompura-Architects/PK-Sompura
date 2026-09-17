import os
import math

def split_file(input_file, max_size_mb=40, max_files=10):
    # Check if file exists without or with .txt extension
    if not os.path.exists(input_file):
        if os.path.exists(f"{input_file}.txt"):
            input_file = f"{input_file}.txt"
        else:
            print(f"Error: File '{input_file}' not found.")
            return

    file_size = os.path.getsize(input_file)
    max_bytes = max_size_mb * 1024 * 1024
    
    # Calculate chunk size to minimize number of files (and keep <= 10 files)
    min_chunk_for_max_files = math.ceil(file_size / max_files)
    chunk_size = min(max_bytes, max(max_bytes, min_chunk_for_max_files))

    base_name, ext = os.path.splitext(input_file)
    if not ext:
        ext = ".txt"

    file_number = 1
    with open(input_file, 'rb') as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            
            output_file = f"{base_name}_part_{file_number}{ext}"
            with open(output_file, 'wb') as out_f:
                out_f.write(chunk)
            
            written_mb = len(chunk) / (1024 * 1024)
            print(f"Written {output_file} ({written_mb:.2f} MB)")
            file_number += 1

    print(f"\nSuccessfully split '{input_file}' into {file_number - 1} parts.")

if __name__ == "__main__":
    # Detect file name automatically
    filename = "project_bundle" if os.path.exists("project_bundle") else "project_bundle.txt"
    split_file(filename, max_size_mb=40, max_files=10)