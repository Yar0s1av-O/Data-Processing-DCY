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


CREATE OR REPLACE PROCEDURE SP_insert_into_profiles(
    _user_id INTEGER,
    _profile_name TEXT,
    _profile_photo_link TEXT,
    _age SMALLINT,
    _language TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
    -- Insert the new profile
    INSERT INTO public."Profiles" 
    (user_id, profile_name, profile_photo_link, age, language)
    VALUES
    (_user_id, _profile_name, _profile_photo_link, _age, _language);
END;
$$;
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


CREATE OR REPLACE PROCEDURE public.sp_pay_subscription(
    IN _user_id integer,
    IN _subscription_type_id smallint,
    OUT status_code integer
)
LANGUAGE 'plpgsql'
AS $$
DECLARE
    user_subscription_end_date TIMESTAMP;
    user_exists BOOLEAN;
    subscription_exists BOOLEAN;
BEGIN

    SELECT EXISTS (
        SELECT 1
        FROM public."Users"
        WHERE user_id = _user_id
    ) INTO user_exists;

    IF NOT user_exists THEN
        status_code := 404;
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public."Subscriptions"
        WHERE subscription_type_id = _subscription_type_id
    ) INTO subscription_exists;

    IF NOT subscription_exists THEN
        status_code := 422;
        RETURN;
    END IF;

    SELECT subscription_end_date
    INTO user_subscription_end_date
    FROM public."Users"
    WHERE user_id = _user_id;

    IF user_subscription_end_date IS NULL THEN
        status_code := 404;
        RETURN;
    END IF;

    IF user_subscription_end_date > NOW() THEN
        status_code := 403;
        RETURN;
    END IF;

    UPDATE public."Users"
    SET 
        subscription_type_id = _subscription_type_id,
        subscription_end_date = NOW() + INTERVAL '30 days'
    WHERE user_id = _user_id;

    status_code := 200;
END;
$$;


ALTER PROCEDURE public.sp_pay_subscription(integer, smallint)
    OWNER TO postgres;
