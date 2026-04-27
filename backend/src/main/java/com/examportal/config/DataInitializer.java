package com.examportal.config;

import com.examportal.entity.*;
import com.examportal.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private UserRepository userRepository;
    @Autowired private ExamRepository examRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create admin
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .email("admin@examportal.com")
                    .fullName("System Administrator")
                    .role(User.Role.ADMIN)
                    .build();
            userRepository.save(admin);

            // Create student
            User student = User.builder()
                    .username("student1")
                    .password(passwordEncoder.encode("student123"))
                    .email("student1@examportal.com")
                    .fullName("John Doe")
                    .role(User.Role.STUDENT)
                    .build();
            userRepository.save(student);

            User student2 = User.builder()
                    .username("student2")
                    .password(passwordEncoder.encode("student123"))
                    .email("student2@examportal.com")
                    .fullName("Jane Smith")
                    .role(User.Role.STUDENT)
                    .build();
            userRepository.save(student2);

            // Create sample exam
            Exam exam = Exam.builder()
                    .title("Java Programming Fundamentals")
                    .description("Test your knowledge of core Java programming concepts including OOP, collections, and exception handling.")
                    .durationMinutes(30)
                    .totalMarks(50)
                    .passingMarks(25)
                    .startTime(LocalDateTime.now().minusDays(1))
                    .endTime(LocalDateTime.now().plusDays(30))
                    .isActive(true)
                    .isRandom(false)
                    .createdBy(admin)
                    .build();
            exam = examRepository.save(exam);

            // MCQ Questions
            questionRepository.save(Question.builder()
                    .questionText("Which of the following is NOT a feature of Object-Oriented Programming?")
                    .type(Question.QuestionType.MCQ).marks(5)
                    .optionA("Encapsulation").optionB("Polymorphism")
                    .optionC("Compilation").optionD("Inheritance")
                    .correctAnswer("C")
                    .explanation("OOP features are Encapsulation, Polymorphism, Inheritance, and Abstraction. Compilation is not an OOP feature.")
                    .exam(exam).build());

            questionRepository.save(Question.builder()
                    .questionText("What does JVM stand for?")
                    .type(Question.QuestionType.MCQ).marks(5)
                    .optionA("Java Virtual Machine").optionB("Java Variable Method")
                    .optionC("Java Verified Module").optionD("Java Visual Manager")
                    .correctAnswer("A")
                    .explanation("JVM stands for Java Virtual Machine, which executes Java bytecode.")
                    .exam(exam).build());

            questionRepository.save(Question.builder()
                    .questionText("Which keyword is used to prevent method overriding in Java?")
                    .type(Question.QuestionType.MCQ).marks(5)
                    .optionA("static").optionB("abstract")
                    .optionC("final").optionD("private")
                    .correctAnswer("C")
                    .explanation("The 'final' keyword prevents a method from being overridden in subclasses.")
                    .exam(exam).build());

            questionRepository.save(Question.builder()
                    .questionText("Which collection allows duplicate elements and maintains insertion order?")
                    .type(Question.QuestionType.MCQ).marks(5)
                    .optionA("HashSet").optionB("TreeSet")
                    .optionC("ArrayList").optionD("HashMap")
                    .correctAnswer("C")
                    .explanation("ArrayList allows duplicates and maintains insertion order.")
                    .exam(exam).build());

            // Subjective Questions
            questionRepository.save(Question.builder()
                    .questionText("Explain the concept of Inheritance in Java with an example.")
                    .type(Question.QuestionType.SUBJECTIVE).marks(10)
                    .modelAnswer("Inheritance is a mechanism in Java where a child class acquires the properties and behaviors of a parent class using the 'extends' keyword. It promotes code reusability and establishes an IS-A relationship. For example, class Dog extends Animal means Dog inherits all non-private members of Animal. Java supports single inheritance through classes but multiple inheritance through interfaces. The subclass can override methods of the parent class to provide specific behavior.")
                    .explanation("Key points: extends keyword, IS-A relationship, code reusability, method overriding")
                    .exam(exam).build());

            questionRepository.save(Question.builder()
                    .questionText("What is Exception Handling in Java? Describe try-catch-finally blocks.")
                    .type(Question.QuestionType.SUBJECTIVE).marks(10)
                    .modelAnswer("Exception handling in Java is a mechanism to handle runtime errors gracefully and maintain normal program flow. Java uses try-catch-finally blocks. The 'try' block contains code that might throw an exception. The 'catch' block catches and handles the exception. The 'finally' block always executes whether or not an exception occurs, typically used for cleanup. Java has checked exceptions (must be handled or declared) and unchecked exceptions (RuntimeException subclasses). The 'throw' keyword explicitly throws an exception, and 'throws' declares exceptions a method can throw.")
                    .explanation("Key concepts: try, catch, finally, throw, throws, checked vs unchecked exceptions")
                    .exam(exam).build());

            questionRepository.save(Question.builder()
                    .questionText("Differentiate between ArrayList and LinkedList in Java.")
                    .type(Question.QuestionType.SUBJECTIVE).marks(10)
                    .modelAnswer("ArrayList and LinkedList both implement the List interface. ArrayList uses a dynamic array internally, providing O(1) random access but O(n) for insertions/deletions in the middle. LinkedList uses a doubly linked list, providing O(1) insertions/deletions but O(n) for random access. ArrayList is better for read-heavy operations while LinkedList is better for frequent insertions and deletions. ArrayList has better cache locality and memory efficiency for most cases. LinkedList also implements Deque interface for queue operations.")
                    .explanation("Compare: internal structure, time complexity for operations, use cases")
                    .exam(exam).build());

            // Second Exam
            Exam exam2 = Exam.builder()
                    .title("Cloud Computing Concepts")
                    .description("Assess your understanding of cloud computing models, services, and deployment strategies.")
                    .durationMinutes(20)
                    .totalMarks(30)
                    .passingMarks(15)
                    .startTime(LocalDateTime.now().minusDays(1))
                    .endTime(LocalDateTime.now().plusDays(30))
                    .isActive(true)
                    .isRandom(false)
                    .createdBy(admin)
                    .build();
            exam2 = examRepository.save(exam2);

            questionRepository.save(Question.builder()
                    .questionText("What does IaaS stand for in cloud computing?")
                    .type(Question.QuestionType.MCQ).marks(5)
                    .optionA("Internet as a Service").optionB("Infrastructure as a Service")
                    .optionC("Integration as a Service").optionD("Intelligence as a Service")
                    .correctAnswer("B")
                    .explanation("IaaS = Infrastructure as a Service. Provides virtualized computing resources over the internet.")
                    .exam(exam2).build());

            questionRepository.save(Question.builder()
                    .questionText("Which of the following is a characteristic of cloud computing?")
                    .type(Question.QuestionType.MCQ).marks(5)
                    .optionA("Fixed resource allocation").optionB("On-demand self-service")
                    .optionC("Single tenancy only").optionD("Manual scaling")
                    .correctAnswer("B")
                    .explanation("On-demand self-service is a core characteristic of cloud computing per NIST definition.")
                    .exam(exam2).build());

            questionRepository.save(Question.builder()
                    .questionText("Explain the difference between Public Cloud, Private Cloud, and Hybrid Cloud.")
                    .type(Question.QuestionType.SUBJECTIVE).marks(10)
                    .modelAnswer("Public Cloud is owned and operated by third-party providers like AWS, Azure, or GCP, offering resources over the internet to multiple organizations. It provides cost efficiency and scalability but less control. Private Cloud is dedicated infrastructure for a single organization, offering more control, security, and customization but higher cost. Hybrid Cloud combines public and private clouds, allowing data and applications to be shared between them. Organizations use hybrid clouds to keep sensitive data on-premise while leveraging public cloud for scalable workloads. This approach offers flexibility, security, and cost optimization.")
                    .explanation("Key: ownership, control, security, cost, scalability for each type")
                    .exam(exam2).build());

            questionRepository.save(Question.builder()
                    .questionText("What is containerization and how does Docker enable it?")
                    .type(Question.QuestionType.SUBJECTIVE).marks(10)
                    .modelAnswer("Containerization is an OS-level virtualization method to deploy and run applications without launching an entire virtual machine. Containers package code and all its dependencies so the application runs consistently across different environments. Docker is an open platform for developing, shipping, and running applications in containers. Docker uses images as blueprints to create containers. A Dockerfile defines instructions to build an image. Docker Hub is a registry for sharing images. Containers are lightweight, start quickly, and use fewer resources than VMs because they share the host OS kernel. Docker Compose manages multi-container applications.")
                    .explanation("Key: OS-level virtualization, Docker images/containers, Dockerfile, consistency across environments")
                    .exam(exam2).build());

            System.out.println("========================================");
            System.out.println("Sample data initialized successfully!");
            System.out.println("Admin login: admin / admin123");
            System.out.println("Student login: student1 / student123");
            System.out.println("Student login: student2 / student123");
            System.out.println("========================================");
        }
    }
}
