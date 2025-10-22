-- Function to approve teacher and create user role
CREATE OR REPLACE FUNCTION approve_teacher(teacher_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_school_id UUID;
BEGIN
  -- Get user_id and school_id from teacher
  SELECT user_id, school_id INTO v_user_id, v_school_id
  FROM teachers
  WHERE id = teacher_id_param;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Teacher not found or no user_id associated';
  END IF;

  -- Update teacher to approved
  UPDATE teachers
  SET is_approved = true
  WHERE id = teacher_id_param;

  -- Create teacher role if it doesn't exist
  INSERT INTO user_roles (user_id, role, school_id)
  VALUES (v_user_id, 'teacher', v_school_id)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_teacher(UUID) TO authenticated;