package dev.blooking.backend.search;

/**
 * Helpers for converting a {@code float[]} embedding to the textual literal
 * that pgvector accepts, e.g. {@code [0.1,0.2,0.3]}. The value is bound as a
 * string parameter and cast to {@code ::vector} in SQL.
 */
public final class VectorLiterals {

    private VectorLiterals() {
    }

    public static String toVectorLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 8 + 2);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(vector[i]);
        }
        sb.append(']');
        return sb.toString();
    }
}
