
CREATE UNIQUE INDEX idx_users_user_id_unique ON public."Users" (user_id);
CREATE UNIQUE INDEX idx_users_email_unique ON public."Users" (email);
CREATE INDEX idx_users_email_subscription ON public."Users" (email, subscription_type_id);

CREATE INDEX idx_Subscriptions_subscription ON public."Subscriptions" (subscription_type_id);

CREATE INDEX idx_invitations_invited_user ON public."invitations" (invited_user_email);
