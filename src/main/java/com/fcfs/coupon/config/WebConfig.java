package com.fcfs.coupon.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * [Spring Boot / Configuration - WebConfig]
 * 
 * - 애플리케이션 전체에 적용되는 웹 관련 전역 설정을 정의하는 클래스입니다.
 * - 여기서는 CORS(Cross-Origin Resource Sharing) 글로벌 설정을 정의하여, 
 *   각 컨트롤러마다 @CrossOrigin 어노테이션을 달지 않고도 외부 도메인(React 포트 등)과의 통신을 일괄 허용합니다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든 API 엔드포인트 경로에 대해 허용
                .allowedOrigins("*") // 모든 원격 도메인 허용 (실무에서는 특정 프론트 주소만 작성)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 허용할 HTTP 메서드 목록
                .allowedHeaders("*"); // 모든 HTTP Request Header 허용
    }
}
