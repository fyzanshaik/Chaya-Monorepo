import os
import argparse

# --- Configuration ---
# Directories to always exclude
EXCLUDED_DIRS = {
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "out",
    ".vscode",
    ".idea",
    "__pycache__",
    ".DS_Store",
    "migrations",  # User request
}

# File extensions to include (focused on core web app files)
INCLUDED_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx",  # JavaScript/TypeScript
    ".css", ".scss", ".less",     # Stylesheets
    ".html", ".htm",              # HTML
}

# Specific filenames (without extension, or full names) to include
# Based on your new requirements, this is likely empty or very specific.
# For example, if you wanted 'package.json' despite '.json' being generally excluded,
# you would add "package.json" here.
SPECIFIC_FILENAMES_TO_INCLUDE = {
    # e.g., "package.json" if you still need it
}

# List of specific filenames to EXCLUDE (case-sensitive)
# This is more direct for files like next.config.js without relying on extension exclusion alone
SPECIFIC_FILENAMES_TO_EXCLUDE = {
    "Dockerfile",               # Exclude Dockerfile by name
    "LICENSE",                  # Exclude LICENSE by name
    ".gitignore",               # Exclude .gitignore by name
    ".eslintrc.js",             # Exclude specific JS config file
    "prettier.config.js",       # Common prettier config name
    ".prettierrc.js",
    "tailwind.config.js",
    "tailwind.config.ts",
    "next.config.js",
    "next.config.mjs",
    "postcss.config.js",
    # Add any other specific config file names you want to ensure are excluded
}
# Patterns for filenames to exclude (e.g., all .env files)
FILENAME_PATTERNS_TO_EXCLUDE = [
    lambda name: name.startswith(".env") # Excludes .env, .env.local, etc.
]


def should_include_file(file_name, file_path): # file_path included for context if needed later
    """Checks if a file should be included based on its extension or name, and exclusion lists."""
    
    # 1. Check specific filename exclusions
    if file_name in SPECIFIC_FILENAMES_TO_EXCLUDE:
        return False
        
    # 2. Check filename pattern exclusions
    for pattern_checker in FILENAME_PATTERNS_TO_EXCLUDE:
        if pattern_checker(file_name):
            return False

    # 3. Check specific filenames to INCLUDE (overrides general extension logic if needed)
    # Note: Current global variable access might need refactoring if this function is moved.
    if file_name in SPECIFIC_FILENAMES_TO_INCLUDE:
        return True
    
    # 4. Check included extensions
    _, ext = os.path.splitext(file_name)
    if ext.lower() in INCLUDED_EXTENSIONS: # Using the global INCLUDED_EXTENSIONS
        return True
        
    return False

def process_directory(root_dir, output_file_path, custom_excluded_dirs_cmd=None, custom_included_exts_cmd=None, custom_specific_files_cmd=None):
    """
    Walks through the directory, reads specified files, and appends their content
    to the output file in the desired format.
    """
    all_content_parts = []
    
    # Combine default and command-line provided exclusions/inclusions
    current_excluded_dirs = EXCLUDED_DIRS.copy()
    if custom_excluded_dirs_cmd:
        current_excluded_dirs.update(custom_excluded_dirs_cmd)

    # These globals are used by should_include_file.
    # If modified by command line, we update the global version for this run.
    # This is a simplification; for more complex scenarios, pass config dicts around.
    global INCLUDED_EXTENSIONS, SPECIFIC_FILENAMES_TO_INCLUDE
    _original_included_exts = INCLUDED_EXTENSIONS.copy()
    _original_specific_files = SPECIFIC_FILENAMES_TO_INCLUDE.copy()

    if custom_included_exts_cmd:
        INCLUDED_EXTENSIONS.update(custom_included_exts_cmd)
    if custom_specific_files_cmd:
        SPECIFIC_FILENAMES_TO_INCLUDE.update(custom_specific_files_cmd)

    print(f"Starting to process directory: {os.path.abspath(root_dir)}")
    print(f"Output file: {os.path.abspath(output_file_path)}")
    print(f"Excluding directories: {sorted(list(current_excluded_dirs))}")
    print(f"Including extensions: {sorted(list(INCLUDED_EXTENSIONS))}")
    print(f"Including specific files by name: {sorted(list(SPECIFIC_FILENAMES_TO_INCLUDE))}")
    print(f"Excluding specific files by name: {sorted(list(SPECIFIC_FILENAMES_TO_EXCLUDE))}")
    print(f"Excluding files by pattern: (e.g., .env*)")


    for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
        # Modify dirnames in-place to exclude specified directories from traversal
        dirnames[:] = [d for d in dirnames if d not in current_excluded_dirs and not d.startswith('.')]

        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            
            if should_include_file(filename, file_path):
                relative_path = os.path.relpath(file_path, root_dir)
                # Ensure backslashes for the header, as in your example
                header_path = relative_path.replace(os.sep, '\\')
                # For consistency on Unix when running from root:
                if header_path.startswith('.\\'):
                    header_path = header_path[2:]

                print(f"Processing: {header_path}")

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f_content:
                        content = f_content.read()
                    
                    file_entry = f"### {header_path}:\n```\n{content}\n```\n\n"
                    all_content_parts.append(file_entry)
                except Exception as e:
                    print(f"  Could not read file: {file_path} due to {e}")
            else:
                # For debugging excluded files if needed
                # relative_debug_path = os.path.relpath(file_path, root_dir)
                # if not any(excluded_dir in relative_debug_path for excluded_dir in current_excluded_dirs):
                #     print(f"Skipping: {relative_debug_path}")
                pass
    
    # Restore original global sets if they were modified for this run
    INCLUDED_EXTENSIONS = _original_included_exts
    SPECIFIC_FILENAMES_TO_INCLUDE = _original_specific_files


    if not all_content_parts:
        print("No files found to process based on current filters.")
        return

    print(f"\nWriting {len(all_content_parts)} file entries to {output_file_path}...")
    with open(output_file_path, 'w', encoding='utf-8') as outfile:
        outfile.write("".join(all_content_parts))
    
    print(f"Successfully created {os.path.abspath(output_file_path)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Consolidate code files from a directory into a single text document.",
        formatter_class=argparse.RawTextHelpFormatter # To show default lists correctly
    )
    parser.add_argument(
        "root_dir", 
        help="The root directory of your monorepo project (e.g., '.' if script is in root)."
    )
    parser.add_argument(
        "-o", "--output",
        default="consolidated_code.txt",
        help="The path to the output text file (default: consolidated_code.txt in current dir)."
    )
    # Optional arguments to ADD to the default lists
    parser.add_argument(
        "--add-exclude-dirs",
        nargs='*',
        help="Additional directories to exclude beyond defaults.",
        default=[]
    )
    parser.add_argument(
        "--add-include-exts",
        nargs='*',
        help="Additional file extensions to include beyond defaults (e.g., '.vue'). \nMake sure to include the leading dot.",
        default=[]
    )
    parser.add_argument(
        "--add-include-files",
        nargs='*',
        help="Additional specific filenames to include beyond defaults (e.g., 'custom_file').",
        default=[]
    )

    args = parser.parse_args()

    custom_excluded_dirs_set = set(args.add_exclude_dirs)
    custom_included_exts_set = set(args.add_include_exts)
    custom_specific_files_set = set(args.add_include_files)

    # Ensure root_dir is processed correctly (e.g. if '.' is given)
    root_dir_abs = os.path.abspath(args.root_dir)
    
    # Ensure output path is relative to CWD if not absolute
    output_path_abs = os.path.abspath(args.output)


    process_directory(
        root_dir_abs, 
        output_path_abs,
        custom_excluded_dirs_cmd=custom_excluded_dirs_set,
        custom_included_exts_cmd=custom_included_exts_set,
        custom_specific_files_cmd=custom_specific_files_set
    )