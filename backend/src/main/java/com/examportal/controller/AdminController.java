package com.examportal.controller;

import com.examportal.dto.AuthDTO;
import com.examportal.dto.ExamDTO;
import com.examportal.dto.SubmissionDTO;
import com.examportal.service.ExamService;
import com.examportal.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private ExamService examService;

    @Autowired
    private SubmissionService submissionService;

    // ---- Exam Management ----

    @PostMapping("/exams")
    public ResponseEntity<?> createExam(@RequestBody ExamDTO.CreateExamRequest request,
                                         Authentication auth) {
        try {
            ExamDTO.ExamResponse exam = examService.createExam(request, auth.getName());
            return ResponseEntity.ok(new AuthDTO.ApiResponse(true, "Exam created successfully", exam));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/exams")
    public ResponseEntity<List<ExamDTO.ExamResponse>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams());
    }

    @GetMapping("/exams/{examId}")
    public ResponseEntity<?> getExam(@PathVariable Long examId) {
        try {
            return ResponseEntity.ok(examService.getExamById(examId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    @PutMapping("/exams/{examId}/toggle")
    public ResponseEntity<?> toggleExam(@PathVariable Long examId) {
        try {
            examService.toggleExamStatus(examId);
            return ResponseEntity.ok(new AuthDTO.ApiResponse(true, "Exam status toggled", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    @DeleteMapping("/exams/{examId}")
    public ResponseEntity<?> deleteExam(@PathVariable Long examId) {
        try {
            examService.deleteExam(examId);
            return ResponseEntity.ok(new AuthDTO.ApiResponse(true, "Exam deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    // ---- Question Management ----

    @PostMapping("/exams/{examId}/questions")
    public ResponseEntity<?> addQuestion(@PathVariable Long examId,
                                          @RequestBody ExamDTO.QuestionRequest request) {
        try {
            ExamDTO.QuestionResponse question = examService.addQuestion(examId, request);
            return ResponseEntity.ok(new AuthDTO.ApiResponse(true, "Question added", question));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/exams/{examId}/questions")
    public ResponseEntity<List<ExamDTO.QuestionResponse>> getQuestions(@PathVariable Long examId) {
        return ResponseEntity.ok(examService.getQuestionsByExam(examId));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long questionId) {
        try {
            examService.deleteQuestion(questionId);
            return ResponseEntity.ok(new AuthDTO.ApiResponse(true, "Question deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    // ---- Submissions / Results ----

    @GetMapping("/submissions")
    public ResponseEntity<List<SubmissionDTO.SubmissionSummary>> getAllSubmissions() {
        return ResponseEntity.ok(submissionService.getAllSubmissions());
    }

    @GetMapping("/submissions/{submissionId}")
    public ResponseEntity<?> getSubmission(@PathVariable Long submissionId, Authentication auth) {
        try {
            return ResponseEntity.ok(submissionService.getSubmissionResult(submissionId, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/exams/{examId}/submissions")
    public ResponseEntity<List<SubmissionDTO.SubmissionSummary>> getExamSubmissions(@PathVariable Long examId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByExam(examId));
    }
}
