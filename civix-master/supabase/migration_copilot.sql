-- Function to execute read-only SQL queries from the Copilot
-- SECURITY: Only allows SELECT statements

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  clean_query text;
BEGIN
  -- Trim and uppercase for checking
  clean_query := upper(trim(query));
  
  -- SECURITY: Only allow SELECT
  IF NOT (clean_query LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Block dangerous keywords
  IF clean_query LIKE '%INSERT%' OR clean_query LIKE '%UPDATE%' OR clean_query LIKE '%DELETE%' 
     OR clean_query LIKE '%DROP%' OR clean_query LIKE '%ALTER%' OR clean_query LIKE '%CREATE%'
     OR clean_query LIKE '%TRUNCATE%' OR clean_query LIKE '%GRANT%' OR clean_query LIKE '%REVOKE%' THEN
    RAISE EXCEPTION 'Modification queries are not allowed';
  END IF;

  -- Execute and return as JSON
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
