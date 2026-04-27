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
@RequestMapping("/api/student")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private ExamService examService;

    @Autowired
    private SubmissionService submissionService;

    @GetMapping("/exams")
    public ResponseEntity<List<ExamDTO.ExamResponse>> getAvailableExams() {
        return ResponseEntity.ok(examService.getActiveExams());
    }

    @GetMapping("/exams/{examId}/start")
    public ResponseEntity<?> startExam(@PathVariable Long examId) {
        try {
            ExamDTO.ExamWithQuestionsResponse exam = examService.getExamWithQuestions(examId, true);
            return ResponseEntity.ok(exam);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    @PostMapping("/exams/submit")
    public ResponseEntity<?> submitExam(@RequestBody SubmissionDTO.SubmitExamRequest request,
                                         Authentication auth) {
        try {
            SubmissionDTO.SubmissionResult result = submissionService.submitExam(request, auth.getName());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/submissions")
    public ResponseEntity<List<SubmissionDTO.SubmissionSummary>> getMySubmissions(Authentication auth) {
        return ResponseEntity.ok(submissionService.getStudentSubmissions(auth.getName()));
    }

    @GetMapping("/submissions/{submissionId}")
    public ResponseEntity<?> getSubmissionDetail(@PathVariable Long submissionId, Authentication auth) {
        try {
            return ResponseEntity.ok(submissionService.getSubmissionResult(submissionId, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthDTO.ApiResponse(false, e.getMessage(), null));
        }
    }
}
