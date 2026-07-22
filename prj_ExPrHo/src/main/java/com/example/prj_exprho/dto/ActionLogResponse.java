package com.example.prj_exprho.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionLogResponse {
    private String id;
    private String username;
    private String action;
    private String ipAddress;
    private LocalDateTime createdAt;
}
