package com.examportal.service;

import com.examportal.dto.ExamDTO;
import com.examportal.entity.Exam;
import com.examportal.entity.Question;
import com.examportal.entity.User;
import com.examportal.repository.ExamRepository;
import com.examportal.repository.QuestionRepository;
import com.examportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExamService {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    public ExamDTO.ExamResponse createExam(ExamDTO.CreateExamRequest request, String username) {
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Exam exam = Exam.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .totalMarks(request.getTotalMarks())
                .passingMarks(request.getPassingMarks())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isRandom(request.getIsRandom() != null ? request.getIsRandom() : false)
                .randomQuestionCount(request.getRandomQuestionCount())
                .createdBy(admin)
                .build();

        exam = examRepository.save(exam);
        return mapToExamResponse(exam);
    }

    public ExamDTO.QuestionResponse addQuestion(Long examId, ExamDTO.QuestionRequest request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        Question question = Question.builder()
                .questionText(request.getQuestionText())
                .type(request.getType())
                .marks(request.getMarks())
                .optionA(request.getOptionA())
                .optionB(request.getOptionB())
                .optionC(request.getOptionC())
                .optionD(request.getOptionD())
                .correctAnswer(request.getCorrectAnswer())
                .modelAnswer(request.getModelAnswer())
                .explanation(request.getExplanation())
                .exam(exam)
                .build();

        question = questionRepository.save(question);
        return mapToQuestionResponse(question);
    }

    public List<ExamDTO.ExamResponse> getAllExams() {
        return examRepository.findAll().stream()
                .map(this::mapToExamResponse)
                .collect(Collectors.toList());
    }

    public List<ExamDTO.ExamResponse> getActiveExams() {
        return examRepository.findByIsActiveTrue().stream()
                .map(this::mapToExamResponse)
                .collect(Collectors.toList());
    }

    public ExamDTO.ExamWithQuestionsResponse getExamWithQuestions(Long examId, boolean forStudent) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        List<Question> questions = questionRepository.findByExamId(examId);

        // If random, shuffle and pick subset
        if (Boolean.TRUE.equals(exam.getIsRandom()) && exam.getRandomQuestionCount() != null
                && exam.getRandomQuestionCount() < questions.size()) {
            Collections.shuffle(questions);
            questions = questions.subList(0, exam.getRandomQuestionCount());
        }

        List<ExamDTO.QuestionResponse> questionResponses = questions.stream()
                .map(q -> mapToQuestionResponseForStudent(q, forStudent))
                .collect(Collectors.toList());

        return ExamDTO.ExamWithQuestionsResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .durationMinutes(exam.getDurationMinutes())
                .totalMarks(exam.getTotalMarks())
                .passingMarks(exam.getPassingMarks())
                .isRandom(exam.getIsRandom())
                .questions(questionResponses)
                .build();
    }

    public void toggleExamStatus(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        exam.setIsActive(!exam.getIsActive());
        examRepository.save(exam);
    }

    public void deleteExam(Long examId) {
        examRepository.deleteById(examId);
    }

    public ExamDTO.ExamResponse getExamById(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        return mapToExamResponse(exam);
    }

    public List<ExamDTO.QuestionResponse> getQuestionsByExam(Long examId) {
        return questionRepository.findByExamId(examId).stream()
                .map(this::mapToQuestionResponse)
                .collect(Collectors.toList());
    }

    public void deleteQuestion(Long questionId) {
        questionRepository.deleteById(questionId);
    }

    private ExamDTO.ExamResponse mapToExamResponse(Exam exam) {
        Long count = questionRepository.countByExamId(exam.getId());
        return ExamDTO.ExamResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .durationMinutes(exam.getDurationMinutes())
                .totalMarks(exam.getTotalMarks())
                .passingMarks(exam.getPassingMarks())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .isActive(exam.getIsActive())
                .isRandom(exam.getIsRandom())
                .randomQuestionCount(exam.getRandomQuestionCount())
                .createdBy(exam.getCreatedBy() != null ? exam.getCreatedBy().getUsername() : "N/A")
                .createdAt(exam.getCreatedAt())
                .questionCount(count)
                .build();
    }

    private ExamDTO.QuestionResponse mapToQuestionResponse(Question q) {
        return ExamDTO.QuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .type(q.getType())
                .marks(q.getMarks())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .correctAnswer(q.getCorrectAnswer())
                .modelAnswer(q.getModelAnswer())
                .explanation(q.getExplanation())
                .build();
    }

    // For students, hide correct answers
    private ExamDTO.QuestionResponse mapToQuestionResponseForStudent(Question q, boolean forStudent) {
        return ExamDTO.QuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .type(q.getType())
                .marks(q.getMarks())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .correctAnswer(forStudent ? null : q.getCorrectAnswer())
                .modelAnswer(forStudent ? null : q.getModelAnswer())
                .explanation(forStudent ? null : q.getExplanation())
                .build();
    }
}
