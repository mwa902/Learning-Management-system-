-- ==========================================
-- URGENT FIX: RESET SIGNUP TRIGGER
-- ==========================================
-- This script completely removes old triggers and replaces them 
-- with a collision-resistant version that prevents the "duplicate key" error.

-- 1. REMOVE OLD TRIGGER AND FUNCTION
DROP TRIGGER IF EXISTS student_after_insert ON student;
DROP FUNCTION IF EXISTS trg_create_login();

-- 2. CREATE ROBUST FUNCTION
CREATE OR REPLACE FUNCTION trg_create_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Only attempt insertion if no login record exists for this student_id (redundant check)
    IF NOT EXISTS (SELECT 1 FROM user_auth WHERE student_id = NEW.student_id) THEN
        
        -- AND only if the trigger-generated username is not already taken
        -- This prevents the "duplicate key violates unique constraint user_auth_username_key"
        IF NOT EXISTS (
            SELECT 1 FROM user_auth WHERE username = 
            lower(replace(NEW.name,' ','')) || NEW.student_id
        ) THEN
            INSERT INTO user_auth(student_id, username, password_hash, role)
            VALUES (
                NEW.student_id,
                lower(replace(NEW.name,' ','')) || NEW.student_id,
                'default_hash', -- This is updated by the frontend later
                'Student'
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RE-APPLY TRIGGER
CREATE TRIGGER student_after_insert
AFTER INSERT ON student
FOR EACH ROW EXECUTE FUNCTION trg_create_login();

-- ==========================================
-- INSTRUCTIONS:
-- 1. Copy the ENTIRE script above.
-- 2. Go to your Supabase Dashboard -> SQL Editor.
-- 3. Paste and click "Run".
-- ==========================================
