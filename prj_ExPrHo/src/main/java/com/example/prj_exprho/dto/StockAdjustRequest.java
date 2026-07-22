package com.example.prj_exprho.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustRequest {
    @NotBlank(message = "Loại điều chỉnh không được để trống")
    private String type; // IMPORT, EXPORT, ADJUST

    @NotNull(message = "Số lượng điều chỉnh không được để trống")
    private Integer quantity;

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    private String reason;
}
