package dev.blooking.backend.events;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InteractionRepository extends JpaRepository<Interaction, Long> {

    boolean existsByEventId(UUID eventId);
}
