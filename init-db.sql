-- Initialize database for Debug Player Framework

-- Grant necessary permissions to the debug_user
GRANT ALL PRIVILEGES ON DATABASE debug_player_framework TO debug_user;
GRANT ALL ON SCHEMA public TO debug_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO debug_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO debug_user;

-- Ensure future tables/sequences have proper permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO debug_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO debug_user;