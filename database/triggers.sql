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

CREATE TRIGGER manual_insert
BEFORE INSERT
ON manual FOR EACH ROW
BEGIN
    declare msg varchar(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        set msg = concat('ManualInsertError: Trying to add a manual without a role or department ', cast(new.id as char));
        signal sqlstate '45000' set message_text = msg;
    END IF;
END

//

CREATE TRIGGER manual_update
BEFORE UPDATE
ON manual FOR EACH ROW
BEGIN
    declare msg varchar(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '' OR NEW.role_id = 'null' OR NEW.role_id = 'undefined') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        set msg = concat('ManualUpdateError: Trying to update a manual without a role or department ', cast(new.id as char));
        signal sqlstate '45000' set message_text = msg;
    END IF;
    SET NEW.updated_on = NOW();
END

//

CREATE TRIGGER manual_assignment_insert
BEFORE INSERT
ON manual FOR EACH ROW
BEGIN
    declare msg varchar(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        set msg = concat('ManualAssignmentInsertError: Trying to add a manual_assignment without a role or department ', cast(new.id as char));
        signal sqlstate '45000' set message_text = msg;
    END IF;
END

//

CREATE TRIGGER manual_assignment_update
BEFORE UPDATE
ON manual FOR EACH ROW
BEGIN
    declare msg varchar(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        set msg = concat('ManualAssignmentUpdateError: Trying to update a manual_assignment without a role or department ', cast(new.id as char));
        signal sqlstate '45000' set message_text = msg;
    END IF;
    SET NEW.updated_on = NOW();
END

//

DELIMITER ;

CREATE TRIGGER section_update
BEFORE UPDATE
ON section FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER policy_update
BEFORE UPDATE
ON policy FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER content_update
BEFORE UPDATE
ON content FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER quiz_update
BEFORE UPDATE
ON quiz FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER quiz_section_update
BEFORE UPDATE
ON quiz_section FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER quiz_question_update
BEFORE UPDATE
ON quiz_question FOR EACH ROW
SET NEW.updated_on = NOW();

CREATE TRIGGER quiz_answer_update
BEFORE UPDATE
ON quiz_answer FOR EACH ROW
SET NEW.updated_on = NOW();

DELIMITER //

CREATE TRIGGER quiz_attempt_update
BEFORE UPDATE
ON quiz_attempt FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'QuizAttemptUpdateError: Cannot update quiz_attempt';
    signal sqlstate '45000' SET message_text = msg;
END

//

CREATE TRIGGER quiz_result_update
BEFORE UPDATE
ON quiz_result FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'QuizResultUpdateError: Cannot update quiz_result';
    signal sqlstate '45000' SET message_text = msg;
END

//

CREATE TRIGGER policy_read_update
BEFORE UPDATE
ON policy_read FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'PolicyReadUpdateError: Cannot update policy_read';
    signal sqlstate '45000' SET message_text = msg;
END

//

CREATE TRIGGER event_insert
BEFORE INSERT
ON event FOR EACH ROW
BEGIN
    IF ((NEW.user_id IS NULL OR NEW.user_id = -1 OR NEW.user_id = '') AND (NEW.business_id IS NULL OR NEW.business_id = -1 OR NEW.business_id = '') THEN
        declare msg varchar(128);
        set msg = 'EventInsertError: Must have either business_id or user_id';
        signal sqlstate '45000' set message_text = msg;
    END IF;
END

//
    
CREATE TRIGGER event_update
BEFORE UPDATE
ON event FOR EACH ROW
BEGIN
    declare msg varchar(128);
    set msg = 'EventUpdateError: Cannot update events';
    signal sqlstate '45000' set message_text = msg;
END

//

DELIMITER ;