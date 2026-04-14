package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    Optional<Otp> findByEmail(String email);

    @Transactional
    void deleteByEmail(String email);

    @Transactional
    void deleteByExpiresAtBefore(LocalDateTime now);
}
