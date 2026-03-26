import pandas as pd
from pydriller import Repository

REPOS = ["https://github.com/angular/angular",
    "https://github.com/tiangolo/fastapi",
    "https://github.com/nestjs/nest"
    ]

def extract_label(message: str) -> str:
    msg_lower = message.lower().strip()

    if "breaking change" in msg_lower or "breaking:" in msg_lower:
        return "breaking_change"
    
    if msg_lower.startswith("fix"):
        return "bug_fix"
    if msg_lower.startswith("feat"):
        return "feature"
    if msg_lower.startswith("docs"):
        return "docs"
    if msg_lower.startswith("refactor"):
        return "refactor"
    if msg_lower.startswith("test"):
        return "test"
    
    return None

def main():
    print(f"Starting repository extraction from {len(REPOS)} sources...")
    print("This may take some time depending on your network connection...")
    
    data = []

    try:
        for commit in Repository(REPOS, order='reverse').traverse_commits():
            label = extract_label(commit.msg)

            if label:
                data.append({
                    "message": commit.msg,
                    "additions": commit.insertions,
                    "deletions" : commit.deletions,
                    "files_changed" : commit.files,
                    "label" : label
                })

            if len(data) > 0 and len(data) % 500 == 0:
                print(f"Collected {len(data)} valid commits...")

                if len(data) >= 50000:
                    break
    
    except KeyboardInterrupt:
        print("\nHalting extraction early. Saving what we have...")
        pass
    except Exception as e:
        print(f"\nEncountered an error: {e}")
        print("Saving current progress...")

    df = pd.DataFrame(data)

    output_path = "commits_dataset.csv"
    df.to_csv(output_path, index=False)

    print(f"\nDone! Successfully generated a dataset with {len(df)} rows.")
    print(f"Saved into {output_path}")
    print("You can now run 'python train.py' to generate your scikit-learn model.")

if __name__ == "__main__":
    main()
