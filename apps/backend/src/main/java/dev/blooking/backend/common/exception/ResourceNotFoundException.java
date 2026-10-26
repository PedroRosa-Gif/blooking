package dev.blooking.backend.common.exception;

/**
 * Thrown when a requested resource does not exist. Mapped to HTTP 404 by the
 * global exception handler.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
