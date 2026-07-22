package com.example.prj_exprho.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String status;
    private List<String> roles;
}
