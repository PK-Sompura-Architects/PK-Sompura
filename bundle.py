import os

# Root directory
ROOT_DIR = '.'
OUTPUT_FILE = 'master_codebase.txt'

# Directories to exclude
EXCLUDE_DIRS = {
    'node_modules', 'venv', 'env', '.git', '__pycache__', 
    '.idea', '.vscode', 'dist', 'build', 'coverage', 
    'public', 'assets', '__mocks__'
}

# File extensions to exclude (binaries, locks, images, fonts)
EXCLUDE_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.svg',
    '.db', '.sqlite', '.sqlite3',
    '.pyc', '.exe', '.dll', '.so', '.dylib',
    '.pdf', '.zip', '.tar', '.gz', '.mp4', '.webm',
    '.ttf', '.woff', '.woff2', '.eot',
    '.DS_Store', '.log'
}

# Specific files to exclude
EXCLUDE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    OUTPUT_FILE, os.path.basename(__file__), '.env', '.env.local'
}

print("Scanning project and generating master codebase file...")

with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
    for root, dirs, files in os.walk(ROOT_DIR):
        # Modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            # Skip excluded files
            if file in EXCLUDE_FILES or file.startswith('.env'):
                continue
            
            # Skip excluded extensions
            _, ext = os.path.splitext(file)
            if ext.lower() in EXCLUDE_EXTENSIONS:
                continue

            filepath = os.path.join(root, file)
            
            # Write a clear, highly visible header for each file
            outfile.write(f"\n{'='*80}\n")
            outfile.write(f"FILE: {filepath}\n")
            outfile.write(f"{'='*80}\n\n")
            
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as infile:
                    outfile.write(infile.read())
                    outfile.write("\n")
            except Exception as e:
                outfile.write(f"// ERROR: Could not read file: {e}\n")

print(f"\nSUCCESS! All project files have been securely bundled into '{OUTPUT_FILE}'.")
print("You can now copy the contents of that file and share it.")