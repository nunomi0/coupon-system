package com.fcfs.coupon.config;

import com.fcfs.coupon.entity.Coupon;
import com.fcfs.coupon.entity.Role;
import com.fcfs.coupon.entity.User;
import com.fcfs.coupon.repository.CouponRepository;
import com.fcfs.coupon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CouponRepository couponRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        // 1. 테스트용 기본 계정 생성 (없을 경우)
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .password("1234")
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("테스트용 관리자 계정이 생성되었습니다: admin / 1234");
        }

        if (userRepository.findByUsername("user").isEmpty()) {
            User user = User.builder()
                    .username("user")
                    .password("1234")
                    .role(Role.USER)
                    .build();
            userRepository.save(user);
            log.info("테스트용 일반 사용자 계정이 생성되었습니다: user / 1234");
        }

        // 2. 기초 쿠폰 데이터 생성 (없을 경우)
        if (couponRepository.count() == 0) {
            Coupon testCoupon = Coupon.builder()
                    .name("선착순 100명 특별 쿠폰")
                    .totalQuantity(100)
                    .remainingQuantity(100)
                    .build();
            couponRepository.save(testCoupon);
            log.info("기초 쿠폰 데이터가 생성되었습니다: ID=1, {}", testCoupon.getName());
        }
    }
}

