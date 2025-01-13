CREATE OR REPLACE FUNCTION public.increase_credit_on_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    inviter_user_id INT;
    invite_creation_date TIMESTAMP;
BEGIN

	-- Get Inviter Info
	SELECT invite_by_user_id, created_at
	INTO inviter_user_id, invite_creation_date
	FROM public."invitations"
	WHERE invited_user_email = NEW.email
	ORDER BY created_at ASC
	LIMIT 1;

	inviter_user_id := COALESCE(inviter_user_id, -1);
	invite_creation_date := COALESCE(invite_creation_date, '1970-01-01 00:00:00');

	-- If Inviter Found
	IF FOUND THEN
		-- Check Invitation Date
		IF invite_creation_date < NOW() THEN

			IF EXISTS (
				SELECT 1
				FROM public."Users"
				WHERE user_id = inviter_user_id
				  AND subscription_type_id > 1
				  AND subscription_end_date > NOW()
			) THEN

				-- Begin Transaction
				BEGIN

					-- Increase the credibility of the inviter
					UPDATE public."Users"
					SET credit = credit + 2
					WHERE user_id = inviter_user_id;

					-- Increase the credit of the new user
					UPDATE public."Users"
					SET credit = credit + 2
					WHERE user_id = NEW.user_id;

					-- Confirm the transaction
					COMMIT;

				EXCEPTION

					WHEN OTHERS THEN
						-- Revert changes in case of error
						ROLLBACK;
						RAISE NOTICE 'An error occurred: %', SQLERRM;
						RETURN NULL; -- Stop the operation
				END;

			END IF;
		END IF;
	END IF;

    RETURN NEW; -- Continue user registration
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER after_user_insert
AFTER INSERT ON public."Users"
FOR EACH ROW
EXECUTE FUNCTION public.increase_credit_on_user_registration();