package com.elearning.models.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartPriceResponse {
    private Double totalOriginalPrice;
    private Double discountAmount;
    private Double finalPrice;
    private String appliedCode;
}
