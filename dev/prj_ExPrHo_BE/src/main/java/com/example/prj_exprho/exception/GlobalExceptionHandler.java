package com.example.prj_exprho.exception;

import com.example.prj_exprho.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException e) {
        log.error("API Exception ({}): {}", e.getCode(), e.getMessage());
        HttpStatus status;
        
        switch (e.getCode()) {
            case "ERR_AUTH_01":
            case "ERR_AUTH_03":
            case "ERR_AUTH_05":
                status = HttpStatus.UNAUTHORIZED;
                break;
            case "ERR_AUTH_02":
                status = HttpStatus.FORBIDDEN;
                break;
            case "ERR_AUTH_04":
                status = HttpStatus.NOT_FOUND;
                break;
            default:
                status = HttpStatus.BAD_REQUEST;
                break;
        }

        ErrorResponse response = ErrorResponse.builder()
                .code(e.getCode())
                .message(e.getMessage())
                .build();
        return new ResponseEntity<>(response, status);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<ErrorResponse> handleValidationException(Exception e) {
        log.error("Validation error: ", e);
        String code = "ERR_VAL_05";
        String message = "Thông tin nhập vào không đúng định dạng hoặc để trống trường bắt buộc.";

        org.springframework.validation.BindingResult bindingResult = null;
        if (e instanceof MethodArgumentNotValidException) {
            bindingResult = ((MethodArgumentNotValidException) e).getBindingResult();
        } else if (e instanceof BindException) {
            bindingResult = ((BindException) e).getBindingResult();
        }

        if (bindingResult != null && bindingResult.getTarget() != null) {
            String targetClassName = bindingResult.getTarget().getClass().getSimpleName();
            if ("CustomerCreateRequest".equals(targetClassName) || "CustomerUpdateRequest".equals(targetClassName)) {
                code = "ERR_VAL_07";
                message = "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.";
            }
        }

        ErrorResponse response = ErrorResponse.builder()
                .code(code)
                .message(message)
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException e) {
        log.error("Access Denied: ", e);
        ErrorResponse response = ErrorResponse.builder()
                .code("ERR_AUTH_02")
                .message("Tài khoản không có quyền hạn truy cập chức năng này.")
                .build();
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception e) {
        log.error("Unhandled Exception: ", e);
        ErrorResponse response = ErrorResponse.builder()
                .code("ERR_SYS_01")
                .message("Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại sau.")
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
