package com.Project.Continuum.service;

import com.Project.Continuum.dto.exchange.ExchangeRequestCreateRequest;
import com.Project.Continuum.dto.exchange.ExchangeRequestResponse;
import com.Project.Continuum.entity.*;
import com.Project.Continuum.enums.ExchangeRequestStatus;

import com.Project.Continuum.enums.SkillType;
import com.Project.Continuum.exception.BadRequestException;
import com.Project.Continuum.exception.ResourceNotFoundException;
import com.Project.Continuum.repository.SkillExchangeRequestRepository;
import com.Project.Continuum.repository.UserRepository;
import com.Project.Continuum.repository.UserSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class SkillExchangeRequestService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillExchangeRequestRepository requestRepository;

    public SkillExchangeRequestService(
            UserRepository userRepository,
            UserSkillRepository userSkillRepository,
            SkillExchangeRequestRepository requestRepository) {
        this.userRepository = userRepository;
        this.userSkillRepository = userSkillRepository;
        this.requestRepository = requestRepository;
    }

    // ---------------- SEND REQUEST ----------------

    public ExchangeRequestResponse sendRequest(
            Long senderId,
            ExchangeRequestCreateRequest request) {

        if (senderId.equals(request.getReceiverId())) {
            throw new BadRequestException("Cannot send request to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        UserSkill senderSkill = userSkillRepository.findById(request.getSenderSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender skill not found"));

        UserSkill receiverSkill = userSkillRepository.findById(request.getReceiverSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver skill not found"));

        // 🔒 Ownership
        if (!senderSkill.getUser().getId().equals(senderId)) {
            throw new BadRequestException("Sender does not own this skill");
        }

        if (!receiverSkill.getUser().getId().equals(receiver.getId())) {
            throw new BadRequestException("Receiver does not own this skill");
        }

        // 🔑 TEACH → LEARN enforcement
        if (senderSkill.getSkillType() != SkillType.TEACH) {
            throw new BadRequestException("Sender skill must be TEACH type");
        }

        if (receiverSkill.getSkillType() != SkillType.LEARN) {
            throw new BadRequestException("Receiver skill must be LEARN type");
        }

        // 🔁 Duplicate prevention
        requestRepository
                .findBySender_IdAndReceiver_IdAndSenderSkill_IdAndReceiverSkill_Id(
                        senderId,
                        receiver.getId(),
                        senderSkill.getId(),
                        receiverSkill.getId())
                .ifPresent(r -> {
                    throw new BadRequestException("Exchange request already exists");
                });

        SkillExchangeRequest exchange = new SkillExchangeRequest();
        exchange.setSender(sender);
        exchange.setReceiver(receiver);
        exchange.setSenderSkill(senderSkill);
        exchange.setReceiverSkill(receiverSkill);
        exchange.setStatus(ExchangeRequestStatus.PENDING);

        return mapToResponse(requestRepository.save(exchange));
    }

    // ---------------- GET REQUESTS ----------------

    @Transactional(readOnly = true)
    public List<ExchangeRequestResponse> getRequests(Long userId) {

        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return requestRepository
                .findBySender_IdOrReceiver_Id(userId, userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ---------------- UPDATE STATUS ----------------

    public ExchangeRequestResponse updateStatus(
            Long requestId,
            Long currentUserId,
            ExchangeRequestStatus status) {

        SkillExchangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));

        if (request.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new BadRequestException("Request already processed");
        }

        // 🔐 Only receiver can accept / reject
        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new BadRequestException("Only receiver can update request status");
        }

        request.setStatus(status);
        return mapToResponse(requestRepository.save(request));
    }

    // ---------------- CANCEL REQUEST ----------------

    public void cancelRequest(Long requestId, Long userId) {

        SkillExchangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found"));

        // Only sender can cancel
        if (!request.getSender().getId().equals(userId)) {
            throw new BadRequestException("Only sender can cancel the request");
        }

        // Only pending requests can be cancelled
        if (request.getStatus() != ExchangeRequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be cancelled");
        }

        // Cancel == REJECTED (by sender)
        request.setStatus(ExchangeRequestStatus.REJECTED);
        requestRepository.save(request);
    }

    // ---------------- MAPPER ----------------

    private ExchangeRequestResponse mapToResponse(SkillExchangeRequest r) {
        return new ExchangeRequestResponse(
                r.getId(),
                r.getSender().getName(),
                r.getReceiver().getName(),
                r.getSenderSkill().getSkill().getName(),
                r.getReceiverSkill().getSkill().getName(),
                r.getStatus().name());
    }
}
