package com.Project.Continuum.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import java.util.TimeZone;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        JavaTimeModule module = new JavaTimeModule();
        // Custom Serializer for Instant to force 3 decimal places (milliseconds)
        module.addSerializer(java.time.Instant.class,
                new com.fasterxml.jackson.databind.JsonSerializer<java.time.Instant>() {
                    @Override
                    public void serialize(java.time.Instant value, com.fasterxml.jackson.core.JsonGenerator gen,
                            com.fasterxml.jackson.databind.SerializerProvider serializers) throws java.io.IOException {
                        gen.writeString(java.time.format.DateTimeFormatter.ISO_INSTANT
                                .format(value.truncatedTo(java.time.temporal.ChronoUnit.MILLIS)));
                    }
                });

        mapper.registerModule(module);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.setTimeZone(TimeZone.getTimeZone("UTC"));
        return mapper;
    }
}
