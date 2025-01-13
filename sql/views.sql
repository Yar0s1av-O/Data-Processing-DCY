CREATE OR REPLACE VIEW public."UserProfiles"
AS
SELECT u.user_id,
	p.profile_name,
	u.email,
	p.age,
	p.profile_photo_link,
	u.subscription_type_id,
	u.subscription_end_date
FROM public."Users" u
JOIN public."Profiles" p ON u.user_id = p.user_id;

ALTER TABLE public."UserProfiles"
OWNER TO postgres;
