"""
Run this script once after installing requirements to download NLTK data.
"""
import nltk

packages = ['punkt', 'stopwords', 'wordnet', 'averaged_perceptron_tagger', 'punkt_tab']
for pkg in packages:
    print(f"Downloading {pkg}...")
    nltk.download(pkg, quiet=False)

print("\nAll NLTK packages downloaded successfully!")
