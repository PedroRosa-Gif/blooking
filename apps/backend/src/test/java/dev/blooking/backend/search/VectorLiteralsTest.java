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

    @Test
    void fromVectorLiteral_parsesBracketedCommaList() {
        assertThat(VectorLiterals.fromVectorLiteral("[0.1,0.2,0.3]"))
                .containsExactly(0.1f, 0.2f, 0.3f);
    }

    @Test
    void fromVectorLiteral_handlesWhitespaceAroundValues() {
        assertThat(VectorLiterals.fromVectorLiteral(" [1.0, 2.0 , 3.0] "))
                .containsExactly(1.0f, 2.0f, 3.0f);
    }

    @Test
    void fromVectorLiteral_handlesEmptyAndNull() {
        assertThat(VectorLiterals.fromVectorLiteral("[]")).isEmpty();
        assertThat(VectorLiterals.fromVectorLiteral(null)).isNull();
        assertThat(VectorLiterals.fromVectorLiteral("   ")).isNull();
    }

    @Test
    void roundTrip_preservesValues() {
        float[] original = new float[]{0.5f, -1.25f, 3.0f};
        String literal = VectorLiterals.toVectorLiteral(original);
        assertThat(VectorLiterals.fromVectorLiteral(literal)).containsExactly(original);
    }
}
