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

    /**
     * Parses a pgvector text literal (e.g. {@code [0.1,0.2,0.3]}) back into a
     * {@code float[]}. This is how pgvector renders a {@code vector} column when
     * read as a string via JDBC. A {@code null} or blank input yields
     * {@code null}.
     */
    public static float[] fromVectorLiteral(String literal) {
        if (literal == null) {
            return null;
        }
        String trimmed = literal.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        // Strip the surrounding brackets.
        if (trimmed.startsWith("[")) {
            trimmed = trimmed.substring(1);
        }
        if (trimmed.endsWith("]")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        if (trimmed.isEmpty()) {
            return new float[0];
        }
        String[] parts = trimmed.split(",");
        float[] vector = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            vector[i] = Float.parseFloat(parts[i].trim());
        }
        return vector;
    }
}
