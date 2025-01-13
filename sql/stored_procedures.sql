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


CREATE OR REPLACE PROCEDURE public.sp_insert_into_profiles(
	IN _profile_photo_link text,
	IN _age integer,
	IN _language text,
	IN _name text,
	IN _userid integer,
	IN _family text)
LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    -- Insert the new profile into the table and return the inserted data
    INSERT INTO public."Profiles" 
    (profile_photo_link, age, language, name, userid, family)
    VALUES
    (_profile_photo_link, _age, _language, _name, _userid, _family);
END;
$BODY$;
ALTER PROCEDURE public.sp_insert_into_profiles(text, integer, text, text, integer, text)
    OWNER TO postgres;

CREATE OR REPLACE PROCEDURE public.sp_insert_subscription(
	IN _subscription_type_id integer,
	IN _subscription_name text,
	IN _subscription_price_euro real
)
LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    -- Insert the new subscription into the table and return the inserted data
    INSERT INTO public."Subscriptions" 
    (subscription_type_id, subscription_name, subscription_price_euro)
    VALUES
    (_subscription_type_id, _subscription_name, _subscription_price_euro);
END;
$BODY$;
ALTER PROCEDURE public.sp_insert_subscription(integer, text, real)
    OWNER TO postgres;