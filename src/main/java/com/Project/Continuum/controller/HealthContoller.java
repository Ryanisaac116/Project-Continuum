package com.Project.Continuum.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthContoller {
    
    @GetMapping("/ping")
    public String healthCheck() {
        return "backend is running";
    }
}
