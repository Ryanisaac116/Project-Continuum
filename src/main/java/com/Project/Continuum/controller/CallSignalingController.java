package com.Project.Continuum.controller;

import com.Project.Continuum.dto.call.CallSignalMessage;
import com.Project.Continuum.service.CallSignalingService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class CallSignalingController {

    private final CallSignalingService callSignalingService;

    public CallSignalingController(CallSignalingService callSignalingService) {
        this.callSignalingService = callSignalingService;
    }

    @MessageMapping("/call.signal")
    public void handleSignal(@Payload CallSignalMessage message, Principal principal) {
        Long senderId = Long.parseLong(principal.getName());
        callSignalingService.handleSignal(senderId, message);
    }
}
