-- Fill missing imagen fields for caminantes and servidores using ui-avatars.com
    -- This is idempotent: it only updates rows where imagen IS NULL or empty.

    -- Define urlencode(text). CREATE OR REPLACE is safe to run multiple times.
    CREATE OR REPLACE FUNCTION urlencode(input_text text) RETURNS text AS $$
    DECLARE
    s alias for $1;
    i integer;
    j integer;
    c text;
    b bytea;
    hex text;
    out text := '';
    BEGIN
    IF s IS NULL THEN
        RETURN NULL;
    END IF;
    FOR i IN 1..char_length(s) LOOP
        c := substr(s, i, 1);
        -- unreserved characters per RFC 3986
        IF c ~ '[A-Za-z0-9._~-]' THEN
        out := out || c;
        ELSE
        b := convert_to(c, 'UTF8');
        FOR j IN 0..octet_length(b)-1 LOOP
            hex := lpad(to_hex(get_byte(b, j)), 2, '0');
            out := out || '%' || upper(hex);
        END LOOP;
        END IF;
    END LOOP;
    RETURN out;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE STRICT;

    -- Update caminantes
    UPDATE caminantes
    SET imagen = (
    'https://ui-avatars.com/api/?name=' || urlencode(nombre_completo) || '&background=random&rounded=true&size=256'
    )
    WHERE imagen IS NULL OR imagen = '';

    -- Update servidores
    UPDATE servidores
    SET imagen = (
    'https://ui-avatars.com/api/?name=' || urlencode(nombre_completo) || '&background=random&rounded=true&size=256'
    )
    WHERE imagen IS NULL OR imagen = '';

    -- Note: Supabase Postgres may not include urlencode() by default. If not available,
    -- use a simple replacement function or run this from a client script that generates the URLs.

    -- Example alternative (run from Node):
    -- SELECT id, nombre_completo FROM caminantes WHERE imagen IS NULL OR imagen = '';
    -- then for each row, generate the URL in application code and UPDATE caminantes SET imagen = '<url>' WHERE id = '<id>';
