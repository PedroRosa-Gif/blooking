package dev.blooking.backend.events.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * RabbitMQ topology for interaction events.
 *
 * <pre>
 *   Publisher ──► topic exchange "blooking.events"
 *                      │  routing key = book.viewed | book.searched | book.favorited | book.unfavorited
 *                      ▼  binding "book.*"
 *                 queue "book.events" ──► InteractionConsumer
 *                      │  (on repeated failure, dead-letter)
 *                      ▼
 *                 DLX "blooking.events.dlx" ──► queue "book.events.dlq"
 * </pre>
 *
 * Design choices:
 * <ul>
 *   <li><b>Topic exchange:</b> routing keys like {@code book.*} let future
 *       consumers subscribe to subsets of events without code changes here.</li>
 *   <li><b>Durable queues + persistent JSON messages:</b> survive a broker
 *       restart.</li>
 *   <li><b>Dead Letter Queue:</b> messages that keep failing are routed to a DLQ
 *       instead of being lost or retried forever (poison-message handling).</li>
 * </ul>
 */
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "blooking.events";
    public static final String QUEUE = "book.events";
    public static final String ROUTING_PATTERN = "book.*";

    public static final String DLX = "blooking.events.dlx";
    public static final String DLQ = "book.events.dlq";

    @Bean
    public TopicExchange eventsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange deadLetterExchange() {
        return new TopicExchange(DLX, true, false);
    }

    /** Main queue; failed messages are dead-lettered to the DLX. */
    @Bean
    public Queue eventsQueue() {
        return QueueBuilder.durable(QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", DLQ)
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ).build();
    }

    @Bean
    public Binding eventsBinding() {
        return BindingBuilder.bind(eventsQueue()).to(eventsExchange()).with(ROUTING_PATTERN);
    }

    @Bean
    public Binding deadLetterBinding() {
        // Catch everything dead-lettered into the DLX.
        return BindingBuilder.bind(deadLetterQueue()).to(deadLetterExchange()).with("#");
    }

    /** JSON (de)serialization for message bodies, reusing Spring's ObjectMapper. */
    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        template.setExchange(EXCHANGE);
        return template;
    }
}
