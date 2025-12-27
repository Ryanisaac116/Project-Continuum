package com.Project.Continuum.dto.exchange;

public class ExchangeRequestResponse {
    private Long id;
    private String sender;
    private String receiver;
    private String senderSkill;
    private String receiverSkill;
    private String status;

    public ExchangeRequestResponse(
            Long id,
            String sender,
            String receiver,
            String senderSkill,
            String receiverSkill,
            String status) {

        this.id = id;
        this.sender = sender;
        this.receiver = receiver;
        this.senderSkill = senderSkill;
        this.receiverSkill = receiverSkill;
        this.status = status;
    }

    public Long getId() { return id; }
    public String getSender() { return sender; }
    public String getReceiver() { return receiver; }
    public String getSenderSkill() { return senderSkill; }
    public String getReceiverSkill() { return receiverSkill; }
    public String getStatus() { return status; }
}
