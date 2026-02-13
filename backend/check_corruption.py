import os

def check_files(directory):
    for root, dirs, files in os.walk(directory):
        if 'venv' in root or '.git' in root or '__pycache__' in root:
            continue
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'rb') as f:
                        content = f.read()
                        if b'\x00' in content:
                            print(f"NULL_BYTE: {path}")
                        try:
                            content.decode('utf-8')
                        except UnicodeDecodeError:
                            print(f"ENCODING_ERROR: {path}")
                except Exception as e:
                    print(f"ERROR reading {path}: {e}")

if __name__ == "__main__":
    check_files('D:\\MarketScoutAgent\\backend')
