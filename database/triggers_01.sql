CREATE TRIGGER business_update
BEFORE UPDATE
ON business FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER user_update
BEFORE UPDATE
ON user FOR EACH ROW
SET NEW.updated_on = NOW();

DELIMITER //


CREATE TRIGGER users_forgot_password_token_created
BEFORE UPDATE
ON user FOR EACH ROW
BEGIN
    IF NEW.token IS NOT NULL THEN
        SET NEW.token_expiry = NOW() + INTERVAL 1 HOUR;
    END IF;
END;

//

CREATE TRIGGER users_created_token_expiry
BEFORE INSERT
ON user FOR EACH ROW
BEGIN
    IF NEW.token IS NOT NULL THEN
        SET NEW.token_expiry = NOW() + INTERVAL 1 DAY;
    END IF;
END;

//

DELIMITER ;

CREATE TRIGGER department_update
BEFORE UPDATE
ON department FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER permission_update
BEFORE UPDATE
ON permission FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER role_update
BEFORE UPDATE
ON role FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER user_role_update
BEFORE UPDATE
ON user_role FOR EACH ROW
SET NEW.updated_on = NOW();

DELIMITER //

CREATE TRIGGER quiz_attempt_update
BEFORE UPDATE
ON quiz_attempt FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'QuizAttemptUpdateError: Cannot update quiz_attempt';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

CREATE TRIGGER quiz_result_update
BEFORE UPDATE
ON quiz_result FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'QuizResultUpdateError: Cannot update quiz_result';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

CREATE TRIGGER policy_read_update
BEFORE UPDATE
ON policy_read FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'PolicyReadUpdateError: Cannot update policy_read';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

CREATE TRIGGER event_insert
BEFORE INSERT
ON event FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF (NEW.user_id IS NULL OR NEW.user_id = -1 OR NEW.user_id = '') AND (NEW.business_id IS NULL OR NEW.business_id = -1 OR NEW.business_id = '') THEN
        SET msg = 'EventInsertError: Must have either business_id or user_id';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//
    
CREATE TRIGGER event_update
BEFORE UPDATE
ON event FOR EACH ROW
BEGIN
    declare msg varchar(128);
    SET msg = 'EventUpdateError: Cannot update events';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

DELIMITER ;