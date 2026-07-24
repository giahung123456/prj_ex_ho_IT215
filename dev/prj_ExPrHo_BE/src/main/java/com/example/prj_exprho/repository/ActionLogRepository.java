package com.example.prj_exprho.repository;

import com.example.prj_exprho.entity.ActionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActionLogRepository extends JpaRepository<ActionLog, Long> {
    Page<ActionLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
