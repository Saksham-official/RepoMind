import pandas as pd
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
from imblearn.over_sampling import SMOTE
import scipy.sparse as sp
import os

def main():
    dataset_path = "commits_dataset.csv"

    if not os.path.exists(dataset_path):
        print(f"Error: {dataset_path} does not exist.")
        print("Please run 'python collect_data.py' first to generate your dataset.")
        return

    print("Loading dataset...")
    df = pd.read_csv(dataset_path)

    if len(df) == 0:
        print("dataset is empty...")
        return
    
    print(f"Dataset Loaded with {len(df)} records. Traning the model...")

    X_text = df['message'].fillna("")
    X_num = df[["additions", "deletions", "files_changed"]].fillna(0).values
    y = df["label"]

    print("Vectorizing commit messages using TF-IDF...")
    tfidf = TfidfVectorizer(ngram_range=(1,2), max_features=5000)
    X_tfidf = tfidf.fit_transform(X_text)

    #combining text + numbers
    X = sp.hstack([X_tfidf, X_num])

    #handle class imbalance using SMOTE
    print("Balancing dataset logic using SMOTE...")
    sm = SMOTE(random_state=42)
    X_res, y_res = sm.fit_resample(X, y)

    print("Splitting datasets for validation...")
    X_train, X_test, y_train, y_test = train_test_split(X_res, y_res, test_size=0.2, random_state=42)

    print("Fitting Random forest classifier...")

    clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs= -1)
    clf.fit(X_train, y_train)

    print("\nModel trained successfully. Evaluating test segment:")
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred))
    print(f"Macro F1 score: {f1_score(y_test, y_pred, average='macro'):.3f}")
    print("\nSaving the trained artifact...")

    joblib.dump({"tfidf":tfidf, "clf": clf}, "commit_classifier.pkl")
    print("✓ Model saved successfully to 'commit_classifier.pkl'")
    print("You're ready to integrate this into your FastAPI backend!")

if __name__ == "__main__":
    main()