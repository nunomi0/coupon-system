package com.fcfs.coupon.service;

import com.fcfs.coupon.entity.Coupon;
import com.fcfs.coupon.entity.User;
import com.fcfs.coupon.repository.CouponIssueRepository;
import com.fcfs.coupon.repository.CouponRepository;
import com.fcfs.coupon.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertTrue;

@Slf4j
@SpringBootTest(properties = {
        "spring.jpa.show-sql=false",
        "logging.level.org.hibernate.SQL=OFF"
})
public class CouponServiceConcurrencyTest {

    @Autowired
    private CouponService couponService;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CouponIssueRepository couponIssueRepository;

    private Coupon testCoupon;
    private List<User> testUsers = new ArrayList<>();

    @BeforeEach
    void setUp() {
        // 기존 데이터 클렌징 (자식 테이블부터)
        couponIssueRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        couponRepository.deleteAllInBatch();

        // 100개 제한 수량을 가진 테스트 쿠폰 생성 및 저장
        testCoupon = Coupon.builder()
                .name("선착순 100명 50% 할인 쿠폰")
                .totalQuantity(100)
                .remainingQuantity(100)
                .build();
        testCoupon = couponRepository.save(testCoupon);

        // 테스트에 사용할 사용자 1000명 사전 가입
        List<User> users = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            users.add(User.builder()
                    .username("user" + i)
                    .password("password" + i)
                    .role("USER")
                    .build());
        }
        testUsers = userRepository.saveAll(users);
    }

    @AfterEach
    void cleanUp() {
        couponIssueRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        couponRepository.deleteAllInBatch();
    }

    @Test
    void 동시에_1000명이_쿠폰을_발급받으면_동시성_이슈로_100개보다_많은_쿠폰이_발급된다() throws InterruptedException {
        // Given
        int threadCount = 1000;
        ExecutorService executorService = Executors.newFixedThreadPool(32);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threadCount);

        // When
        for (int i = 0; i < threadCount; i++) {
            final String username = testUsers.get(i).getUsername();
            final Long couponId = testCoupon.getId();
            executorService.submit(() -> {
                try {
                    startLatch.await(); // 모든 스레드가 대기하다가 한 번에 출발
                    couponService.issueCoupon(username, couponId);
                } catch (Exception e) {
                    // 수량 초과 예외 등은 무시 (여기서는 얼마나 많이 성공했는지가 중요)
                } finally {
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // 대기 중인 모든 스레드 동시 시작
        endLatch.await(); // 모든 스레드 작업 완료될 때까지 대기
        executorService.shutdown();

        // Then
        long issuedCount = couponIssueRepository.countByCouponId(testCoupon.getId());
        Coupon updatedCoupon = couponRepository.findById(testCoupon.getId()).orElseThrow();

        log.info("=================================================");
        log.info("발급 성공한 총 쿠폰 수 (CouponIssue 개수): {}", issuedCount);
        log.info("실제 DB에 남은 쿠폰 수량: {}", updatedCoupon.getRemainingQuantity());
        log.info("=================================================");

        // 동시성 이슈로 인해 100개를 초과하여 발급되었는지 검증
        assertTrue(issuedCount > 100, 
                "락을 사용하지 않으므로 발급된 쿠폰 개수(" + issuedCount + ")는 100개보다 많아야 합니다.");
    }
}
