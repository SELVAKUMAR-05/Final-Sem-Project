package com.securedms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SecureDmsApplication {
    public static void main(String[] args) {
        SpringApplication.run(SecureDmsApplication.class, args);
        System.out.println("NCRB Secure DMS Spring Boot Backend initialized.");
    }
}
