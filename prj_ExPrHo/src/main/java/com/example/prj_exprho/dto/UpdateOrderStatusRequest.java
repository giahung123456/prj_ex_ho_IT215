package com.example.prj_exprho.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateOrderStatusRequest {
    @NotBlank(message = "Trạng thái không được để trống.")
    private String status;
}
