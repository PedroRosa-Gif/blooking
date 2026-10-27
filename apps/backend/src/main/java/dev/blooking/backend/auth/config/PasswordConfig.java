package dev.blooking.backend.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Provides the {@link PasswordEncoder} bean.
 *
 * <p>Kept separate from {@code SecurityConfig} (which is web-only) because the
 * encoder is also needed by {@code AuthService} in non-web contexts (e.g.
 * integration tests that boot without a servlet environment).
 */
@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
