package com.fcfs.coupon.service;

import com.fcfs.coupon.entity.Role;
import com.fcfs.coupon.entity.User;
import com.fcfs.coupon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * [Spring Boot / Service - UserService]
 * 
 * - 사용자 회원가입(signUp)과 로그인(login) 비즈니스 로직을 제공합니다.
 * - 초보자를 위해 스프링 시큐리티 없이 순수 JPA 로직과 간단한 비밀번호 비교로 인증을 구현했습니다.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * 회원 가입 비즈니스 로직
     */
    @Transactional
    public User signUp(String username, String password, String role) {
        // 1. 중복 사용자 검사
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalStateException("이미 존재하는 사용자 이름입니다.");
        }

        // 2. 권한 기본값 검증 (USER 또는 ADMIN이 아니면 기본적으로 USER로 설정)
        Role userRole = "ADMIN".equalsIgnoreCase(role) ? Role.ADMIN : Role.USER;

        // 3. 빌더 패턴으로 User 객체 생성 및 저장
        User user = User.builder()
                .username(username)
                .password(password) // 실습 편의상 평문 비밀번호 저장
                .role(userRole)
                .build();

        return userRepository.save(user);
    }

    /**
     * 로그인 비즈니스 로직
     */
    @Transactional(readOnly = true)
    public User login(String username, String password) {
        // 1. 사용자 존재 여부 조회
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 2. 비밀번호 일치 확인
        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. 로그인 성공 시 유저 정보 반환
        return user;
    }
}
