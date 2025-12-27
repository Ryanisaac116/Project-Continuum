package com.Project.Continuum.controller;

import com.Project.Continuum.dto.exchange.ExchangeRequestCreateRequest;
import com.Project.Continuum.dto.exchange.ExchangeRequestResponse;
import com.Project.Continuum.dto.exchange.ExchangeRequestUpdateRequest;
import com.Project.Continuum.security.SecurityUtils;
import com.Project.Continuum.service.SkillExchangeRequestService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exchanges")
public class SkillExchangeRequestController {

    private final SkillExchangeRequestService exchangeService;

    public SkillExchangeRequestController(
            SkillExchangeRequestService exchangeService) {
        this.exchangeService = exchangeService;
    }

    @PostMapping
    public ExchangeRequestResponse sendRequest(
            @RequestBody ExchangeRequestCreateRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        return exchangeService.sendRequest(userId, request);
    }

    @GetMapping
    public List<ExchangeRequestResponse> getRequests() {
        Long userId = SecurityUtils.getCurrentUserId();
        return exchangeService.getRequests(userId);
    }

    @PutMapping("/{requestId}")
    public ExchangeRequestResponse updateStatus(
            @PathVariable Long requestId,
            @RequestBody ExchangeRequestUpdateRequest request) {

        Long userId = SecurityUtils.getCurrentUserId();
        return exchangeService.updateStatus(
                requestId,
                userId,
                request.getStatus()
        );
    }

    @DeleteMapping("/{requestId}")
    public void cancelRequest(@PathVariable Long requestId) {
        Long userId = SecurityUtils.getCurrentUserId();
        exchangeService.cancelRequest(requestId, userId);
    }
}
