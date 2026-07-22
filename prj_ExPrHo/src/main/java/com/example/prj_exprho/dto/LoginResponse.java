package com.example.prj_exprho.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String code;
    private String message;
    private String token;
    private String role;
}
