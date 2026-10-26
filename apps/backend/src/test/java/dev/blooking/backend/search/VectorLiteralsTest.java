package dev.blooking.backend.search;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class VectorLiteralsTest {

    @Test
    void toVectorLiteral_formatsAsBracketedCommaList() {
        assertThat(VectorLiterals.toVectorLiteral(new float[]{0.1f, 0.2f, 0.3f}))
                .isEqualTo("[0.1,0.2,0.3]");
    }

    @Test
    void toVectorLiteral_handlesSingleElement() {
        assertThat(VectorLiterals.toVectorLiteral(new float[]{1.0f})).isEqualTo("[1.0]");
    }

    @Test
    void toVectorLiteral_handlesEmptyVector() {
        assertThat(VectorLiterals.toVectorLiteral(new float[]{})).isEqualTo("[]");
    }
}
