import os

def bundle_project(output_file="project_bundle.txt"):
    # List of directories to include (add or remove as needed)
    target_dirs = ["pages", "."]
    # File extensions to include
    include_exts = [".py", ".html", ".css", ".md", ".txt", ".json", ".jsx", ".js"]
    
    with open(output_file, "w", encoding="utf-8") as outfile:
        for folder in target_dirs:
            if not os.path.exists(folder):
                continue
                
            for root, dirs, files in os.walk(folder):
                for file in files:
                    if any(file.endswith(ext) for ext in include_exts):
                        file_path = os.path.join(root, file)
                        
                        # Skip this bundle script itself
                        if file == "bundle.py":
                            continue
                            
                        outfile.write(f"\n{'='*20}\n")
                        outfile.write(f"FILE: {file_path}\n")
                        outfile.write(f"{'='*20}\n\n")
                        
                        try:
                            with open(file_path, "r", encoding="utf-8") as infile:
                                outfile.write(infile.read())
                        except Exception as e:
                            outfile.write(f"Could not read file: {e}")
                            
                        outfile.write("\n")

    print(f"Successfully bundled your project into {output_file}")

if __name__ == "__main__":
    bundle_project()