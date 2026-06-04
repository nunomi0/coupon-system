package com.fcfs.coupon.service;

import com.fcfs.coupon.entity.Coupon;
import com.fcfs.coupon.entity.CouponIssue;
import com.fcfs.coupon.entity.Role;
import com.fcfs.coupon.entity.User;
import com.fcfs.coupon.entity.CouponWithVersion;
import com.fcfs.coupon.repository.CouponIssueRepository;
import com.fcfs.coupon.repository.CouponRepository;
import com.fcfs.coupon.repository.CouponWithVersionRepository;
import com.fcfs.coupon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * [Spring Boot / Service / Dependency Injection / Transaction]
 * 
 * 1. @Service
 *    - 이 클래스가 비즈니스 로직을 처리하는 '서비스 레이어'의 빈(Bean)임을 스프링 컨테이너에 등록합니다.
 * 
 * 2. 의존성 주입 (Dependency Injection - DI)과 lombok @RequiredArgsConstructor
 *    - final로 선언된 필드(Repository 등)를 매개변수로 갖는 생성자를 생성해 줍니다.
 *    - 스프링은 생성자가 하나이고 매개변수가 빈(Bean)으로 등록되어 있으면 자동으로 의존성을 주입(Constructor Injection)해줍니다.
 * 
 * 3. @Transactional
 *    - 데이터베이스 트랜잭션을 관리합니다. 메서드 안의 모든 DB 작업이 하나의 단위로 묶여,
 *      모든 연산이 성공해야 Commit(최종 데이터 반영)이 일어나고, 중간에 예외가 발생하면 Rollback(원래대로 되돌림)됩니다.
 *    - readOnly = true: 읽기 전용 작업에 설정하여 트랜잭션 성능을 최적화합니다.
 */
@Service
@RequiredArgsConstructor
public class CouponService {

    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final CouponIssueRepository couponIssueRepository;
    private final CouponWithVersionRepository couponWithVersionRepository;

    /**
     * 전체 쿠폰 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    /**
     * 쿠폰 단건 조회
     */
    @Transactional(readOnly = true)
    public Coupon getCoupon(Long couponId) {
        return couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));
    }

    /**
     * [관리자 전용] 쿠폰 생성 비즈니스 로직
     */
    @Transactional
    public Coupon createCoupon(String name, int totalQuantity, Long adminId) {
        // 1. 요청한 사용자 정보 조회
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 2. 관리자 권한 검증
        if (admin.getRole() != Role.ADMIN) {
            throw new IllegalStateException("관리자 권한을 가진 사용자만 쿠폰을 생성할 수 있습니다.");
        }

        // 3. 중복 쿠폰명 검사
        if (couponRepository.findByName(name).isPresent()) {
            throw new IllegalStateException("이미 존재하는 쿠폰 이름입니다.");
        }

        // 4. 쿠폰 정보 등록 및 저장
        Coupon coupon = Coupon.builder()
                .name(name)
                .totalQuantity(totalQuantity)
                .remainingQuantity(totalQuantity)
                .build();

        return couponRepository.save(coupon);
    }

    /**
     * [핵심] 단일 사용자 쿠폰 발급 (동시성 처리 없는 단순 비즈니스 로직)
     * 
     * * 변경 사항:
     *   - 회원가입과 로그인이 완전히 분리되었으므로, 더 이상 유저를 자동 생성(getOrCreateUser)하지 않습니다.
     *   - 이미 존재해야 하는 유저를 조회한 뒤, 없을 경우 예외를 던집니다.
     */
    @Transactional
    public CouponIssue issueCoupon(String username, Long couponId) {
        // 1. 유저 조회 (없으면 예외 발생)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. 로그인 후 다시 이용해주세요."));

        // 2. 쿠폰 존재 확인 (데이터베이스에서 쿠폰 정보를 읽어옴)
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));

        // 3. 중복 발급 여부 확인 (한 유저가 동일한 쿠폰을 이미 받았는지 검증)
        if (couponIssueRepository.existsByUserIdAndCouponId(user.getId(), coupon.getId())) {
            throw new IllegalStateException("이미 쿠폰을 발급받았습니다.");
        }

        // 4. 쿠폰 잔여 수량 감소 및 저장 (동시성 제어가 없는 순수 로직)
        coupon.decreaseQuantity();
        couponRepository.save(coupon);

        // 5. 쿠폰 발급 이력 객체 생성 및 저장
        CouponIssue couponIssue = CouponIssue.builder()
                .userId(user.getId())
                .couponId(coupon.getId())
                .build();

        return couponIssueRepository.save(couponIssue);
    }

    /**
     * [비관적 락] 쿠폰 발급 비즈니스 로직
     * - select ... for update 쿼리를 날려서 해당 로우에 쓰기 락을 걸고 수량을 감소시킵니다.
     */
    @Transactional
    public CouponIssue issueCouponWithPessimisticLock(String username, Long couponId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 비관적 락이 적용된 조회 메서드 호출
        Coupon coupon = couponRepository.findByIdWithPessimisticLock(couponId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));

        if (couponIssueRepository.existsByUserIdAndCouponId(user.getId(), coupon.getId())) {
            throw new IllegalStateException("이미 쿠폰을 발급받았습니다.");
        }

        coupon.decreaseQuantity();
        couponRepository.save(coupon);

        CouponIssue couponIssue = CouponIssue.builder()
                .userId(user.getId())
                .couponId(coupon.getId())
                .build();

        return couponIssueRepository.save(couponIssue);
    }

    /**
     * [낙관적 락] 쿠폰 발급 비즈니스 로직 (단일 시도용)
     * - 엔티티의 @Version 필드를 통해 JPA가 트랜잭션 종료 시점에 버전 일치 여부를 검증합니다.
     */
    @Transactional
    public CouponIssue issueCouponWithOptimisticLock(String username, Long couponId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 낙관적 락 전용 엔티티 조회
        CouponWithVersion coupon = couponWithVersionRepository.findById(couponId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 쿠폰입니다."));

        if (couponIssueRepository.existsByUserIdAndCouponId(user.getId(), coupon.getId())) {
            throw new IllegalStateException("이미 쿠폰을 발급받았습니다.");
        }

        coupon.decreaseQuantity();
        couponWithVersionRepository.save(coupon);

        CouponIssue couponIssue = CouponIssue.builder()
                .userId(user.getId())
                .couponId(coupon.getId())
                .build();

        return couponIssueRepository.save(couponIssue);
    }
}

