package com.fcfs.coupon.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * [Spring Boot / JPA / Lombok 학습 가이드]
 * 
 * 1. Lombok 어노테이션 (보일러플레이트 코드 자동 생성)
 *    - @Getter / @Setter: 각 필드의 getter, setter 메서드를 컴파일 시점에 자동으로 생성합니다.
 *    - @NoArgsConstructor: JPA 엔티티 기본 요구사항인 파라미터가 없는 '기본 생성자'를 생성합니다.
 *    - @AllArgsConstructor: 모든 필드를 파라미터로 받는 생성자를 생성합니다.
 *    - @Builder: 빌더 패턴을 구현해 객체 생성 시 가독성을 높여줍니다. (예: User.builder().username("name").build())
 * 
 * 2. JPA 어노테이션 (데이터베이스 테이블 매핑)
 *    - @Entity: 이 클래스가 데이터베이스의 테이블과 매핑되는 JPA 엔티티 객체임을 선언합니다.
 *    - @Table: 매핑할 데이터베이스 테이블의 이름을 지정합니다. (여기선 "users" 테이블)
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseTimeEntity {
    
    /**
     * - @Id: 테이블의 Primary Key (기본키) 필드임을 선언합니다.
     * - @GeneratedValue: 기본키 생성 전략을 설정합니다. 
     *   GenerationType.IDENTITY는 MySQL/MariaDB의 AUTO_INCREMENT와 같이 DB가 기본키 생성을 담당하게 합니다.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * - @Column: 테이블 컬럼과 매핑 설정을 정의합니다.
     *   nullable = false: NOT NULL 제약조건 추가
     *   unique = true: 해당 컬럼에 UNIQUE(유니크) 제약조건 추가 (중복 사용자명 방지)
     */
    @Column(nullable = false, unique = true)
    private String username;

    /**
     * - password: 로그인 검증에 사용하는 비밀번호 필드입니다.
     *   (실습 편의상 평문 텍스트로 보관하지만, 실무에서는 반드시 해시 암호화해야 합니다.)
     */
    @Column(nullable = false)
    private String password;

    /**
     * - role: 사용자의 권한 등급을 지정합니다. (예: 일반 사용자 "USER", 관리자 "ADMIN")
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

}

