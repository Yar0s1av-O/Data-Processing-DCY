
    SELECT EXISTS (SELECT 1 FROM public."Subscriptions" WHERE subscription_type_id = _subscription_type_id) INTO subscription_exists;
    IF NOT subscription_exists THEN
        RETURN 422;
    END IF;

    SELECT subscription_end_date INTO user_subscription_end_date FROM public."Users" WHERE user_id = _user_id;

    IF user_subscription_end_date IS NOT NULL AND user_subscription_end_date > NOW() THEN
        RETURN 403;
    END IF;

    UPDATE public."Users"
    SET 
        subscription_type_id = _subscription_type_id,
        subscription_end_date = NOW() + INTERVAL '30 days'
    WHERE user_id = _user_id;

    RETURN 200;
END;
$$ LANGUAGE plpgsql;