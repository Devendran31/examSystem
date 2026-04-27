package com.examportal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class NlpService {

    @Value("${nlp.service.url}")
    private String nlpServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public static class NlpResult {
        public double score;
        public double similarity;
        public String feedback;
        public String level;

        public NlpResult() {}
        public NlpResult(double score, double similarity, String feedback, String level) {
            this.score = score;
            this.similarity = similarity;
            this.feedback = feedback;
            this.level = level;
        }
    }

    public NlpResult evaluate(String studentAnswer, String modelAnswer, int maxMarks) {
        try {
            String url = nlpServiceUrl + "/evaluate";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("student_answer", studentAnswer);
            body.put("model_answer", modelAnswer);
            body.put("max_marks", maxMarks);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                double score = ((Number) result.getOrDefault("score", 0)).doubleValue();
                double similarity = ((Number) result.getOrDefault("similarity", 0)).doubleValue();
                String feedback = (String) result.getOrDefault("feedback", "No feedback available");
                String level = (String) result.getOrDefault("level", "unknown");
                return new NlpResult(score, similarity, feedback, level);
            }
        } catch (Exception e) {
            // NLP service unavailable - fallback scoring
            return fallbackEvaluate(studentAnswer, modelAnswer, maxMarks);
        }
        return new NlpResult(0, 0, "Evaluation failed", "error");
    }

    // Fallback basic evaluation if NLP service is down
    private NlpResult fallbackEvaluate(String studentAnswer, String modelAnswer, int maxMarks) {
        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            return new NlpResult(0, 0, "No answer provided.", "no_answer");
        }

        String sa = studentAnswer.toLowerCase().trim();
        String ma = modelAnswer.toLowerCase().trim();

        // Simple word overlap scoring
        String[] studentWords = sa.split("\\s+");
        String[] modelWords = ma.split("\\s+");

        int matches = 0;
        for (String sw : studentWords) {
            for (String mw : modelWords) {
                if (sw.equals(mw) && sw.length() > 3) matches++;
            }
        }

        double similarity = Math.min(1.0, (double) matches / Math.max(modelWords.length, 1));
        double score = Math.round(similarity * maxMarks * 10.0) / 10.0;
        String level = similarity >= 0.7 ? "high" : similarity >= 0.4 ? "medium" : "low";
        String feedback = similarity >= 0.7 ? "Good answer! Key concepts covered."
                : similarity >= 0.4 ? "Partial answer. Some key points missing."
                : "Answer needs improvement. Review the topic.";

        return new NlpResult(score, similarity, feedback + " (Fallback evaluation - NLP service offline)", level);
    }
}
