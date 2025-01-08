-- View: public.UserProfiles

-- DROP VIEW public."UserProfiles";

CREATE OR REPLACE VIEW public."UserProfiles"
 AS
 SELECT u.user_id,
    p.name,
    p.family,
    u.email,
    p.age,
    p.profile_photo_link,
    u.subscription_type_id,
    u.subscription_end_date
   FROM "Users" u
     JOIN "Profiles" p ON u.user_id = p.userid;

ALTER TABLE public."UserProfiles"
    OWNER TO postgres;

