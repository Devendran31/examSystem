package com.examportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class SubmissionDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerRequest {
        private Long questionId;
        private String studentAnswer;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitExamRequest {
        private Long examId;
        private List<AnswerRequest> answers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerResult {
        private Long questionId;
        private String questionText;
        private String studentAnswer;
        private String correctAnswer;
        private String modelAnswer;
        private Double scoreObtained;
        private Double maxScore;
        private Boolean isCorrect;
        private Double nlpSimilarity;
        private String feedback;
        private String type;
        private String explanation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionResult {
        private Long submissionId;
        private String examTitle;
        private Double totalScore;
        private Double maxScore;
        private Double percentage;
        private Boolean passed;
        private LocalDateTime submittedAt;
        private List<AnswerResult> answerResults;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionSummary {
        private Long submissionId;
        private Long examId;
        private String examTitle;
        private String studentName;
        private String studentUsername;
        private Double totalScore;
        private Double maxScore;
        private Double percentage;
        private Boolean passed;
        private LocalDateTime submittedAt;
        private String status;
    }
}
