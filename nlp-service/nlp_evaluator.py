"""
NLP Evaluator Module
Implements:
- Text preprocessing (tokenization, stopword removal, stemming)
- TF-IDF vectorization
- Cosine similarity scoring
- Feedback generation
"""

import re
import math
import string
from collections import Counter


class NLPEvaluator:
    """
    Core NLP evaluation engine using TF-IDF and Cosine Similarity.
    Built from scratch without heavy ML dependencies for portability.
    Falls back to NLTK/sklearn if available for better accuracy.
    """

    # Common English stopwords
    STOPWORDS = {
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'shall', 'should', 'may', 'might', 'must', 'can', 'could', 'not',
        'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each',
        'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
        'you', 'your', 'he', 'she', 'it', 'its', 'they', 'their', 'what',
        'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'all', 'any',
        'both', 'few', 'more', 'most', 'other', 'some', 'such', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'between',
        'out', 'off', 'over', 'under', 'again', 'then', 'once', 'here',
        'there', 'while', 'as', 'if', 'also', 'about', 'up', 'very', 'just'
    }

    def __init__(self):
        self._use_advanced = self._try_load_advanced()

    def _try_load_advanced(self):
        """Try to use sklearn + NLTK for better accuracy."""
        try:
            import nltk
            import sklearn
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np

            # Download NLTK data silently
            try:
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                nltk.download('wordnet', quiet=True)
                nltk.download('averaged_perceptron_tagger', quiet=True)
            except:
                pass

            self._sklearn_available = True
            return True
        except ImportError:
            self._sklearn_available = False
            return False

    def preprocess(self, text: str) -> str:
        """
        Full NLP preprocessing pipeline:
        1. Lowercase
        2. Remove punctuation
        3. Tokenize
        4. Remove stopwords
        5. Stem / lemmatize
        """
        if not text:
            return ""

        if self._sklearn_available:
            return self._advanced_preprocess(text)
        return self._basic_preprocess(text)

    def _basic_preprocess(self, text: str) -> str:
        """Basic preprocessing without external libraries."""
        # Lowercase
        text = text.lower()
        # Remove punctuation and numbers
        text = re.sub(r'[^a-z\s]', ' ', text)
        # Tokenize
        tokens = text.split()
        # Remove stopwords and short tokens
        tokens = [t for t in tokens if t not in self.STOPWORDS and len(t) > 2]
        # Simple stemming (suffix removal)
        tokens = [self._simple_stem(t) for t in tokens]
        return ' '.join(tokens)

    def _simple_stem(self, word: str) -> str:
        """Very basic suffix removal stemmer."""
        suffixes = ['ing', 'tion', 'ness', 'ment', 'able', 'ible',
                    'ful', 'less', 'ous', 'ive', 'ly', 'ed', 'er', 'est', 'es', 's']
        for suffix in suffixes:
            if word.endswith(suffix) and len(word) - len(suffix) >= 3:
                return word[:-len(suffix)]
        return word

    def _advanced_preprocess(self, text: str) -> str:
        """Advanced preprocessing with NLTK."""
        try:
            import nltk
            from nltk.tokenize import word_tokenize
            from nltk.corpus import stopwords
            from nltk.stem import PorterStemmer, WordNetLemmatizer

            stop_words = set(stopwords.words('english'))
            stemmer = PorterStemmer()
            lemmatizer = WordNetLemmatizer()

            text = text.lower()
            text = re.sub(r'[^a-z\s]', ' ', text)
            try:
                tokens = word_tokenize(text)
            except:
                tokens = text.split()

            tokens = [t for t in tokens if t not in stop_words and len(t) > 2]
            tokens = [lemmatizer.lemmatize(stemmer.stem(t)) for t in tokens]
            return ' '.join(tokens)
        except Exception:
            return self._basic_preprocess(text)

    def _tfidf_cosine_similarity_basic(self, text1: str, text2: str) -> float:
        """
        Compute TF-IDF based cosine similarity from scratch.
        Works without any external dependencies.
        """
        if not text1.strip() or not text2.strip():
            return 0.0

        def tokenize(text):
            return text.lower().split()

        def compute_tf(tokens):
            tf = Counter(tokens)
            total = len(tokens)
            return {word: count / total for word, count in tf.items()}

        def compute_idf(documents):
            num_docs = len(documents)
            idf = {}
            all_words = set(word for doc in documents for word in doc)
            for word in all_words:
                containing = sum(1 for doc in documents if word in doc)
                idf[word] = math.log((num_docs + 1) / (containing + 1)) + 1
            return idf

        tokens1 = tokenize(text1)
        tokens2 = tokenize(text2)

        idf = compute_idf([tokens1, tokens2])
        tf1 = compute_tf(tokens1)
        tf2 = compute_tf(tokens2)

        vocab = set(tokens1 + tokens2)

        vec1 = {word: tf1.get(word, 0) * idf.get(word, 0) for word in vocab}
        vec2 = {word: tf2.get(word, 0) * idf.get(word, 0) for word in vocab}

        dot_product = sum(vec1[w] * vec2[w] for w in vocab)
        mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

        if mag1 == 0 or mag2 == 0:
            return 0.0

        return dot_product / (mag1 * mag2)

    def _tfidf_cosine_similarity_advanced(self, text1: str, text2: str) -> float:
        """Use sklearn's TF-IDF + cosine similarity for better accuracy."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np

            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                min_df=1,
                sublinear_tf=True
            )
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except Exception:
            return self._tfidf_cosine_similarity_basic(text1, text2)

    def _keyword_overlap_score(self, student_text: str, model_text: str) -> float:
        """Calculate keyword overlap ratio."""
        model_words = set(model_text.split())
        student_words = set(student_text.split())
        if not model_words:
            return 0.0
        overlap = len(model_words & student_words)
        return overlap / len(model_words)

    def _length_penalty(self, student_answer: str, model_answer: str) -> float:
        """Apply penalty for very short answers relative to model."""
        student_len = len(student_answer.split())
        model_len = len(model_answer.split())
        if model_len == 0:
            return 1.0
        ratio = student_len / model_len
        if ratio >= 0.3:
            return 1.0
        # Penalize very short answers
        return max(0.3, ratio / 0.3)

    def evaluate(self, student_answer: str, model_answer: str, max_marks: int) -> dict:
        """
        Main evaluation function.
        Returns score, similarity, feedback, and level.
        """
        # Handle empty answers
        if not student_answer or not student_answer.strip():
            return {
                "score": 0.0,
                "similarity": 0.0,
                "feedback": "No answer was provided. Please attempt all questions.",
                "level": "no_answer",
                "details": {
                    "tfidf_similarity": 0.0,
                    "keyword_overlap": 0.0,
                    "length_ratio": 0.0,
                    "preprocessed_student": "",
                    "preprocessed_model": ""
                }
            }

        # Preprocess both answers
        processed_student = self.preprocess(student_answer)
        processed_model = self.preprocess(model_answer)

        # Compute TF-IDF cosine similarity
        if self._sklearn_available:
            tfidf_sim = self._tfidf_cosine_similarity_advanced(processed_student, processed_model)
        else:
            tfidf_sim = self._tfidf_cosine_similarity_basic(processed_student, processed_model)

        # Compute keyword overlap
        keyword_sim = self._keyword_overlap_score(processed_student, processed_model)

        # Weighted similarity (TF-IDF weighted more)
        combined_similarity = (tfidf_sim * 0.7) + (keyword_sim * 0.3)

        # Apply length penalty
        length_factor = self._length_penalty(student_answer, model_answer)
        final_similarity = combined_similarity * length_factor

        # Clamp to [0, 1]
        final_similarity = max(0.0, min(1.0, final_similarity))

        # Calculate score
        raw_score = final_similarity * max_marks
        score = round(raw_score * 2) / 2  # Round to nearest 0.5
        score = max(0.0, min(float(max_marks), score))

        # Determine level and feedback
        level, feedback = self._generate_feedback(
            final_similarity, processed_student, processed_model,
            student_answer, max_marks, score
        )

        return {
            "score": score,
            "similarity": round(final_similarity, 4),
            "feedback": feedback,
            "level": level,
            "details": {
                "tfidf_similarity": round(tfidf_sim, 4),
                "keyword_overlap": round(keyword_sim, 4),
                "length_ratio": round(length_factor, 4),
                "preprocessed_student": processed_student[:200],
                "preprocessed_model": processed_model[:200]
            }
        }

    def _generate_feedback(self, similarity: float, processed_student: str,
                            processed_model: str, raw_student: str,
                            max_marks: int, score: float) -> tuple:
        """Generate human-readable feedback based on similarity score."""

        # Find missing key concepts
        model_tokens = set(processed_model.split())
        student_tokens = set(processed_student.split())
        missing = model_tokens - student_tokens

        # Pick top 3 missing important words (longer words = more likely key terms)
        missing_keywords = sorted([w for w in missing if len(w) > 4], key=len, reverse=True)[:3]
        missing_str = ", ".join(missing_keywords) if missing_keywords else ""

        if similarity >= 0.85:
            level = "excellent"
            feedback = (
                f"Excellent answer! Your response covers all key concepts comprehensively. "
                f"Score: {score}/{max_marks}. "
                f"You demonstrated strong understanding of the topic."
            )
        elif similarity >= 0.70:
            level = "good"
            feedback = (
                f"Good answer! Most key concepts are addressed well. "
                f"Score: {score}/{max_marks}. "
            )
            if missing_str:
                feedback += f"You could strengthen your answer by including concepts related to: {missing_str}."
        elif similarity >= 0.50:
            level = "average"
            feedback = (
                f"Average answer. You have covered some important points, but several key concepts are missing. "
                f"Score: {score}/{max_marks}. "
            )
            if missing_str:
                feedback += f"Focus on elaborating: {missing_str}."
        elif similarity >= 0.30:
            level = "below_average"
            feedback = (
                f"Below average. Your answer touches on some relevant points but lacks depth and key information. "
                f"Score: {score}/{max_marks}. "
            )
            if missing_str:
                feedback += f"Review the following concepts: {missing_str}."
        elif similarity >= 0.10:
            level = "poor"
            feedback = (
                f"Poor answer. Very few relevant points were addressed. "
                f"Score: {score}/{max_marks}. "
                f"Please review the topic thoroughly. "
            )
            if missing_str:
                feedback += f"Key concepts to study: {missing_str}."
        else:
            level = "very_poor"
            if len(raw_student.split()) < 5:
                feedback = (
                    f"Answer is too brief to be evaluated properly. "
                    f"Score: {score}/{max_marks}. Please provide a more detailed answer."
                )
            else:
                feedback = (
                    f"The answer does not appear to address the question correctly. "
                    f"Score: {score}/{max_marks}. Please review the topic and try again."
                )

        return level, feedback
