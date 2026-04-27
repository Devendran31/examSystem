package com.examportal.dto;

import com.examportal.entity.Question;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class ExamDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateExamRequest {
        private String title;
        private String description;
        private Integer durationMinutes;
        private Integer totalMarks;
        private Integer passingMarks;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean isRandom;
        private Integer randomQuestionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamResponse {
        private Long id;
        private String title;
        private String description;
        private Integer durationMinutes;
        private Integer totalMarks;
        private Integer passingMarks;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean isActive;
        private Boolean isRandom;
        private Integer randomQuestionCount;
        private String createdBy;
        private LocalDateTime createdAt;
        private Long questionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionRequest {
        private String questionText;
        private Question.QuestionType type;
        private Integer marks;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctAnswer;
        private String modelAnswer;
        private String explanation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private Long id;
        private String questionText;
        private Question.QuestionType type;
        private Integer marks;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctAnswer;
        private String modelAnswer;
        private String explanation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamWithQuestionsResponse {
        private Long id;
        private String title;
        private String description;
        private Integer durationMinutes;
        private Integer totalMarks;
        private Integer passingMarks;
        private Boolean isRandom;
        private List<QuestionResponse> questions;
    }
}
