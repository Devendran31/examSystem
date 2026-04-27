package com.examportal.repository;

import com.examportal.entity.Answer;
import com.examportal.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findBySubmission(Submission submission);
    List<Answer> findBySubmissionId(Long submissionId);
}
