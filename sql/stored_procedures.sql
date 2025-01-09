-- PROCEDURE: public.sp_insert_into_profiles(text, integer, text, text, integer, text)

-- DROP PROCEDURE IF EXISTS public.sp_insert_into_profiles(text, integer, text, text, integer, text);

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
