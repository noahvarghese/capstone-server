-- -- DECLARE @business_id INT;
-- -- DECLARE @user_id INT;
-- -- DECLARE @department_id INT;
-- -- DECLARE @permission_id INT;
-- -- DECLARE @role_id INT;
-- -- DECLARE @user_role_id INT;

-- INSERT INTO business (name, phone, email, code, address, city, postal_code, province, country) VALUES (
--     "Oakville Windows & Doors",
--     9053393294,
--     "varghese.noah@gmail.com",
--     "OAKVILLE3294",
--     "1380 Speers Rd",
--     "Oakville",
--     "L6H 1X1",
--     "ON",
--     "Canada"
-- );

-- SET @business_id = (SELECT id FROM business WHERE name = "Oakville Windows & Doors")

-- INSERT INTO user (
--     first_name,
--     last_name,
--     email,
--     phone,
--     address,
--     city,
--     postal_code,
--     province,
--     country,
--     birthday,
--     password,
--     business_id
-- ) VALUES (
--     "Noah",
--     "Varghese",
--     "varghese.noah@gmail.com",
--     9053393294,
--     "1380 Speers Rd",
--     "Oakville",
--     "L6H 1X1",
--     "ON",
--     "Canada",
--     NOW(),
--     "password",
--     @business_id
-- );

-- SET @user_id = (SELECT id FROM user WHERE name = "varghese.noah@gmail.com")

-- INSERT INTO department (
--     name,
--     prevent_delete,
--     business_id,
--     updated_by_user_id
-- ) VALUES ( "Admin", 1, @business_id, @user_id);

-- SET @department_id = (SELECT id FROM department WHERE business_id = @business_id AND name = "Admin" );

-- INSERT INTO permission (
--     add_users_to_business,
--     assign_users_to_department,
--     assign_users_to_role,
--     create_resources,
--     assign_resources_to_department,
--     assign_resources_to_role,
--     updated_by_user_id
-- ) VALUES (1,1,1,1,1,1,@user_id);

-- SET @permission_id = (SELECT id FROM permission WHERE updated_by_user_id = @user_id);

-- INSERT INTO role (
--     name,
--     prevent_delete,
--     department_id,
--     permission_id,
--     updated_by_user_id
-- ) VALUES (
--     "General",
--     1,
--     @department_id,
--     @permission_id,
--     @user_id
-- );

-- SET @role_id = (SELECT id FROM role WHERE department_id = @department_id AND permission_id = @permission_id AND updated_by_user_id = @user_id);

-- INSERT INTO user_role (
--     user_id,
--     role_id,
--     updated_by_user_id
-- ) VALUES (
--     @user_id,
--     @role_id,
--     @user_id
-- );

-- SET @user_role_id = (SELECT id FROM user_role WHERE user_id = @user_id AND role_id = @role_id AND updated_by_user_id = @user_id);