"""
Test the NLP evaluator directly (without Flask).
Run: python test_nlp.py
"""
from nlp_evaluator import NLPEvaluator

evaluator = NLPEvaluator()

test_cases = [
    {
        "name": "Excellent Answer",
        "student": "Inheritance in Java is a mechanism where a child class acquires properties and behaviors of a parent class using the extends keyword. It promotes code reusability and establishes an IS-A relationship. The subclass can override methods of the parent class.",
        "model": "Inheritance is a mechanism in Java where a child class acquires the properties and behaviors of a parent class using the 'extends' keyword. It promotes code reusability and establishes an IS-A relationship. For example, class Dog extends Animal means Dog inherits all non-private members of Animal. Java supports single inheritance through classes but multiple inheritance through interfaces. The subclass can override methods of the parent class to provide specific behavior.",
        "max_marks": 10
    },
    {
        "name": "Average Answer",
        "student": "Inheritance allows one class to get properties of another class. It helps reuse code.",
        "model": "Inheritance is a mechanism in Java where a child class acquires the properties and behaviors of a parent class using the 'extends' keyword. It promotes code reusability and establishes an IS-A relationship.",
        "max_marks": 10
    },
    {
        "name": "Poor Answer",
        "student": "It is a java feature.",
        "model": "Inheritance is a mechanism in Java where a child class acquires the properties and behaviors of a parent class using the extends keyword.",
        "max_marks": 10
    },
    {
        "name": "Empty Answer",
        "student": "",
        "model": "Inheritance allows a class to inherit properties from another class.",
        "max_marks": 10
    }
]

print("=" * 60)
print("NLP EVALUATOR TEST RESULTS")
print("=" * 60)

for tc in test_cases:
    result = evaluator.evaluate(tc["student"], tc["model"], tc["max_marks"])
    print(f"\n📝 Test: {tc['name']}")
    print(f"   Score:      {result['score']} / {tc['max_marks']}")
    print(f"   Similarity: {result['similarity'] * 100:.1f}%")
    print(f"   Level:      {result['level']}")
    print(f"   Feedback:   {result['feedback'][:80]}...")

print("\n" + "=" * 60)
print("All tests completed.")
