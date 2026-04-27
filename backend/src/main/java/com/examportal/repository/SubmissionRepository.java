package com.examportal.repository;

import com.examportal.entity.Exam;
import com.examportal.entity.Submission;
import com.examportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStudent(User student);
    List<Submission> findByExam(Exam exam);
    Optional<Submission> findByStudentAndExam(User student, Exam exam);
    List<Submission> findByStudentId(Long studentId);
    List<Submission> findByExamId(Long examId);
}
