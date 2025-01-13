CREATE OR REPLACE PROCEDURE public.sp_insert_into_invitations(
	IN _invited_user_email text,
	IN _invite_by_user_id integer)
LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    -- Insert the new invite into the table and return the inserted data
    INSERT INTO public."invitations" 
    (invited_user_email, invite_by_user_id)
    VALUES
    (_invited_user_email, _invite_by_user_id);
END;
$BODY$;
ALTER PROCEDURE public.sp_insert_into_invitations(text, integer)
    OWNER TO postgres;

