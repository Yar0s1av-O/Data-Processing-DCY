CREATE OR REPLACE VIEW public."UserProfiles" AS
SELECT u.user_id,
       p.profile_name,
       u.email,
       p.age,
       p.profile_photo_link,
       u.subscription_type_id,
       u.subscription_end_date
FROM public."Users" u
JOIN public."Profiles" p ON u.user_id = p.user_id;

ALTER TABLE public."UserProfiles" OWNER TO postgres;


-- View for Movies
CREATE OR REPLACE VIEW movies AS
SELECT
    watchable_id,
    title,
    description,
    genre_id,
    duration
FROM "Watchable"
WHERE season IS NULL AND episode IS NULL;

ALTER TABLE public."movies"
OWNER TO postgres;

-- View for Series
CREATE OR REPLACE VIEW series AS
SELECT
    watchable_id,
    title,
    description,
    genre_id,
    duration,
    season,
    episode
FROM "Watchable"
WHERE season IS NOT NULL AND episode IS NOT NULL;

ALTER TABLE public."series"
OWNER TO postgres;