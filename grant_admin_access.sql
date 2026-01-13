-- Grant admin access to darktidesresearch@protonmail.com
INSERT INTO admin_users (user_id, email) 
VALUES ('922cd408-6905-4ab8-a72e-e52383f493b5', 'darktidesresearch@protonmail.com');

-- Verify the admin user was created
SELECT * FROM admin_users WHERE email = 'darktidesresearch@protonmail.com';