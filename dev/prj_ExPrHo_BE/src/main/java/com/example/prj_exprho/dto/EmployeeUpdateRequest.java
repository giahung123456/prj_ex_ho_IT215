package com.example.prj_exprho.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeUpdateRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String fullName;

    private String phone;

    @NotBlank
    private String role; // STOREKEEPER or SALES
}
