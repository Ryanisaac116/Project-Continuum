package com.Project.Continuum.dto.exchange;

public class ExchangeRequestCreateRequest {
    private Long receiverId;
    private Long senderSkillId;
    private Long receiverSkillId;

    public Long getReceiverId() { return receiverId; }
    public Long getSenderSkillId() { return senderSkillId; }
    public Long getReceiverSkillId() { return receiverSkillId; }
}
