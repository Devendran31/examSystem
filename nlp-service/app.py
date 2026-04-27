"""
Cloud-Based Online Examination System
NLP Auto-Evaluation Microservice
Using: Flask, TF-IDF, Cosine Similarity, NLTK
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os

from nlp_evaluator import NLPEvaluator

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

evaluator = NLPEvaluator()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "NLP Evaluation Microservice",
        "version": "1.0.0"
    })

@app.route('/evaluate', methods=['POST'])
def evaluate():
    """
    Evaluate a student's subjective answer against a model answer.
    
    Request body:
    {
        "student_answer": "string",
        "model_answer": "string",
        "max_marks": int
    }
    
    Response:
    {
        "score": float,
        "similarity": float,
        "feedback": "string",
        "level": "string",
        "details": { ... }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400
        
        student_answer = data.get('student_answer', '').strip()
        model_answer = data.get('model_answer', '').strip()
        max_marks = int(data.get('max_marks', 10))
        
        if not model_answer:
            return jsonify({"error": "Model answer is required"}), 400
        
        result = evaluator.evaluate(student_answer, model_answer, max_marks)
        logger.info(f"Evaluated answer | Score: {result['score']}/{max_marks} | Similarity: {result['similarity']:.2f}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Evaluation error: {str(e)}")
        return jsonify({"error": str(e), "score": 0, "similarity": 0.0, "feedback": "Evaluation failed", "level": "error"}), 500

@app.route('/batch-evaluate', methods=['POST'])
def batch_evaluate():
    """
    Evaluate multiple answers at once.
    """
    try:
        data = request.get_json()
        answers = data.get('answers', [])
        
        results = []
        for item in answers:
            result = evaluator.evaluate(
                item.get('student_answer', ''),
                item.get('model_answer', ''),
                int(item.get('max_marks', 10))
            )
            result['question_id'] = item.get('question_id')
            results.append(result)
        
        return jsonify({"results": results})
    
    except Exception as e:
        logger.error(f"Batch evaluation error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/preprocess', methods=['POST'])
def preprocess():
    """Debug endpoint to see NLP preprocessing output."""
    try:
        data = request.get_json()
        text = data.get('text', '')
        result = evaluator.preprocess(text)
        return jsonify({"original": text, "processed": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    logger.info(f"Starting NLP Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
