package com.fcfs.coupon.controller;

import com.fcfs.coupon.entity.User;
import com.fcfs.coupon.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [Spring Boot / RestController - UserController]
 * 
 * - 회원가입 및 로그인을 처리하는 REST API 컨트롤러입니다.
 * - @CrossOrigin(origins = "*"): 프론트엔드 React 개발 서버(포트 5173 등)와의 교차 출처 리소스 공유(CORS)를 허용합니다.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 회원 가입 API
     * POST http://localhost:8080/api/users/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody SignUpRequest request) {
        try {
            User registeredUser = userService.signUp(
                    request.getUsername(),
                    request.getPassword(),
                    request.getRole()
            );
            return ResponseEntity.ok(registeredUser);
        } catch (IllegalStateException e) {
            // 중복 사용자 존재 시 400 Bad Request
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 로그인 API
     * POST http://localhost:8080/api/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.getUsername(), request.getPassword());
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            // 유저가 없거나 비밀번호가 다를 시 400 Bad Request
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // DTO (Data Transfer Object)
    @Data
    public static class SignUpRequest {
        private String username;
        private String password;
        private String role;
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    @RequiredArgsConstructor
    public static class ErrorResponse {
        private final String message;
    }
}
