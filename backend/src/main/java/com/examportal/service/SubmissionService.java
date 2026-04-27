package com.examportal.service;

import com.examportal.dto.SubmissionDTO;
import com.examportal.entity.*;
import com.examportal.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NlpService nlpService;

    @Transactional
    public SubmissionDTO.SubmissionResult submitExam(SubmissionDTO.SubmitExamRequest request, String username) {
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        // Check if already submitted
        submissionRepository.findByStudentAndExam(student, exam).ifPresent(s -> {
            throw new RuntimeException("You have already submitted this exam.");
        });

        // Create submission
        Submission submission = Submission.builder()
                .student(student)
                .exam(exam)
                .startedAt(LocalDateTime.now().minusMinutes(1))
                .status(Submission.SubmissionStatus.PENDING)
                .build();
        submission = submissionRepository.save(submission);

        // Evaluate each answer
        double totalScore = 0;
        double maxScore = 0;
        List<SubmissionDTO.AnswerResult> answerResults = new ArrayList<>();

        for (SubmissionDTO.AnswerRequest ar : request.getAnswers()) {
            Question question = questionRepository.findById(ar.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found: " + ar.getQuestionId()));

            Answer answer = Answer.builder()
                    .submission(submission)
                    .question(question)
                    .studentAnswer(ar.getStudentAnswer())
                    .maxScore((double) question.getMarks())
                    .build();

            // Evaluate based on type
            if (question.getType() == Question.QuestionType.MCQ) {
                boolean correct = ar.getStudentAnswer() != null &&
                        ar.getStudentAnswer().equalsIgnoreCase(question.getCorrectAnswer());
                answer.setIsCorrect(correct);
                answer.setScoreObtained(correct ? (double) question.getMarks() : 0.0);
                answer.setNlpSimilarity(correct ? 1.0 : 0.0);
                answer.setFeedback(correct ? "Correct!" : "Incorrect. The correct answer is " + question.getCorrectAnswer());
                answer.setEvaluated(true);
            } else {
                // Subjective - use NLP
                String studentAns = ar.getStudentAnswer() != null ? ar.getStudentAnswer() : "";
                String modelAns = question.getModelAnswer() != null ? question.getModelAnswer() : "";

                NlpService.NlpResult nlpResult = nlpService.evaluate(studentAns, modelAns, question.getMarks());

                answer.setIsCorrect(nlpResult.similarity >= 0.6);
                answer.setScoreObtained(nlpResult.score);
                answer.setNlpSimilarity(nlpResult.similarity);
                answer.setFeedback(nlpResult.feedback);
                answer.setEvaluated(true);
            }

            answer = answerRepository.save(answer);
            totalScore += answer.getScoreObtained();
            maxScore += answer.getMaxScore();

            answerResults.add(SubmissionDTO.AnswerResult.builder()
                    .questionId(question.getId())
                    .questionText(question.getQuestionText())
                    .studentAnswer(ar.getStudentAnswer())
                    .correctAnswer(question.getCorrectAnswer())
                    .modelAnswer(question.getModelAnswer())
                    .scoreObtained(answer.getScoreObtained())
                    .maxScore(answer.getMaxScore())
                    .isCorrect(answer.getIsCorrect())
                    .nlpSimilarity(answer.getNlpSimilarity())
                    .feedback(answer.getFeedback())
                    .type(question.getType().name())
                    .explanation(question.getExplanation())
                    .build());
        }

        double percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000.0) / 10.0 : 0;
        boolean passed = exam.getPassingMarks() != null ? totalScore >= exam.getPassingMarks() : percentage >= 40;

        submission.setTotalScore(totalScore);
        submission.setMaxScore(maxScore);
        submission.setPercentage(percentage);
        submission.setPassed(passed);
        submission.setStatus(Submission.SubmissionStatus.EVALUATED);
        submissionRepository.save(submission);

        return SubmissionDTO.SubmissionResult.builder()
                .submissionId(submission.getId())
                .examTitle(exam.getTitle())
                .totalScore(totalScore)
                .maxScore(maxScore)
                .percentage(percentage)
                .passed(passed)
                .submittedAt(submission.getSubmittedAt())
                .answerResults(answerResults)
                .status("EVALUATED")
                .build();
    }

    public SubmissionDTO.SubmissionResult getSubmissionResult(Long submissionId, String username) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        List<Answer> answers = answerRepository.findBySubmissionId(submissionId);

        List<SubmissionDTO.AnswerResult> answerResults = answers.stream().map(a -> {
            Question q = a.getQuestion();
            return SubmissionDTO.AnswerResult.builder()
                    .questionId(q.getId())
                    .questionText(q.getQuestionText())
                    .studentAnswer(a.getStudentAnswer())
                    .correctAnswer(q.getCorrectAnswer())
                    .modelAnswer(q.getModelAnswer())
                    .scoreObtained(a.getScoreObtained())
                    .maxScore(a.getMaxScore())
                    .isCorrect(a.getIsCorrect())
                    .nlpSimilarity(a.getNlpSimilarity())
                    .feedback(a.getFeedback())
                    .type(q.getType().name())
                    .explanation(q.getExplanation())
                    .build();
        }).collect(Collectors.toList());

        return SubmissionDTO.SubmissionResult.builder()
                .submissionId(submission.getId())
                .examTitle(submission.getExam().getTitle())
                .totalScore(submission.getTotalScore())
                .maxScore(submission.getMaxScore())
                .percentage(submission.getPercentage())
                .passed(submission.getPassed())
                .submittedAt(submission.getSubmittedAt())
                .answerResults(answerResults)
                .status(submission.getStatus().name())
                .build();
    }

    public List<SubmissionDTO.SubmissionSummary> getStudentSubmissions(String username) {
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return submissionRepository.findByStudentId(student.getId()).stream()
                .map(s -> SubmissionDTO.SubmissionSummary.builder()
                        .submissionId(s.getId())
                        .examId(s.getExam().getId())
                        .examTitle(s.getExam().getTitle())
                        .studentName(s.getStudent().getFullName())
                        .studentUsername(s.getStudent().getUsername())
                        .totalScore(s.getTotalScore())
                        .maxScore(s.getMaxScore())
                        .percentage(s.getPercentage())
                        .passed(s.getPassed())
                        .submittedAt(s.getSubmittedAt())
                        .status(s.getStatus() != null ? s.getStatus().name() : "N/A")
                        .build())
                .collect(Collectors.toList());
    }

    public List<SubmissionDTO.SubmissionSummary> getAllSubmissions() {
        return submissionRepository.findAll().stream()
                .map(s -> SubmissionDTO.SubmissionSummary.builder()
                        .submissionId(s.getId())
                        .examId(s.getExam().getId())
                        .examTitle(s.getExam().getTitle())
                        .studentName(s.getStudent().getFullName())
                        .studentUsername(s.getStudent().getUsername())
                        .totalScore(s.getTotalScore())
                        .maxScore(s.getMaxScore())
                        .percentage(s.getPercentage())
                        .passed(s.getPassed())
                        .submittedAt(s.getSubmittedAt())
                        .status(s.getStatus() != null ? s.getStatus().name() : "N/A")
                        .build())
                .collect(Collectors.toList());
    }

    public List<SubmissionDTO.SubmissionSummary> getSubmissionsByExam(Long examId) {
        return submissionRepository.findByExamId(examId).stream()
                .map(s -> SubmissionDTO.SubmissionSummary.builder()
                        .submissionId(s.getId())
                        .examId(s.getExam().getId())
                        .examTitle(s.getExam().getTitle())
                        .studentName(s.getStudent().getFullName())
                        .studentUsername(s.getStudent().getUsername())
                        .totalScore(s.getTotalScore())
                        .maxScore(s.getMaxScore())
                        .percentage(s.getPercentage())
                        .passed(s.getPassed())
                        .submittedAt(s.getSubmittedAt())
                        .status(s.getStatus() != null ? s.getStatus().name() : "N/A")
                        .build())
                .collect(Collectors.toList());
    }
}
