package dev.blooking.backend.common.exception;

/** Thrown when a resource conflicts with existing state (HTTP 409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
