-- USE capstone;

DROP TRIGGER IF EXISTS business_update;
CREATE TRIGGER business_update
BEFORE UPDATE
ON business FOR EACH ROW
SET NEW.updated_on = NOW();

DROP TRIGGER IF EXISTS user_update;
CREATE TRIGGER user_update
BEFORE UPDATE
ON user FOR EACH ROW
SET NEW.updated_on = NOW();

DELIMITER //

DROP TRIGGER IF EXISTS membership_update //

CREATE TRIGGER membership_update
BEFORE UPDATE 
ON membership FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF OLD.prevent_delete = 1 AND NEW.deleted_on IS NOT NULL THEN
        SET msg = CONCAT('MembershipDeleteError: Cannot delete membership while delete lock is set. business: ', CAST(OLD.business_id AS CHAR), ' user: ', CAST(OLD.user_id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS membership_delete //

CREATE TRIGGER membership_delete
BEFORE DELETE
ON membership FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF OLD.prevent_delete = 1 THEN
        SET msg = CONCAT('MembershipDeleteError: Cannot delete membership while delete lock is set. business: ', CAST(OLD.business_id AS CHAR), ' user: ', CAST(OLD.user_id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS users_forgot_password_token_created //

CREATE TRIGGER users_forgot_password_token_created
BEFORE UPDATE
ON user FOR EACH ROW
BEGIN
    IF NEW.token IS NOT NULL THEN
        SET NEW.token_expiry = NOW() + INTERVAL 1 HOUR;
    END IF;
END;

//

DROP TRIGGER IF EXISTS department_delete //

CREATE TRIGGER department_delete
BEFORE DELETE
ON department FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF OLD.prevent_delete = 1 THEN
        SET msg = CONCAT('DepartmentDeleteError: Cannot delete department while delete lock is set. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS department_update //

CREATE TRIGGER department_update
BEFORE UPDATE 
ON department FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF OLD.prevent_edit = 1 AND OLD.prevent_edit = NEW.prevent_edit THEN
        SET msg = CONCAT('DepartmentUpdateError: Cannot edit department while edit lock is set. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    IF OLD.prevent_delete = 1 AND NEW.deleted_on IS NOT NULL THEN
        SET msg = CONCAT('DepartmentDeleteError: Cannot delete department while delete lock is set. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS role_delete //

CREATE TRIGGER role_delete
BEFORE DELETE
ON role FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF OLD.prevent_delete = 1 THEN
        SET msg = CONCAT('RoleDeleteError: Cannot delete role while delete lock is set. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS role_update //

CREATE TRIGGER role_update
BEFORE UPDATE 
ON role FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF OLD.prevent_edit = 1 AND OLD.prevent_edit = NEW.prevent_edit THEN
        SET msg = CONCAT('RoleUpdateError: Cannot edit role while edit lock is set. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    IF OLD.prevent_delete = 1 AND NEW.deleted_on IS NOT NULL THEN
        SET msg = CONCAT('RoleDeleteError: Cannot delete role while delete lock is set. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS user_role_update //

CREATE TRIGGER user_role_update
BEFORE UPDATE
ON user_role FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = CONCAT('UserRoleUpdateError: Cannot update user role. user_id: ', CAST(OLD.user_id AS CHAR), ' role_id: ', CAST(OLD.role_id AS CHAR));
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

DROP TRIGGER IF EXISTS content_read_update //

CREATE TRIGGER content_read_update
BEFORE UPDATE
ON content_read FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'ContentReadUpdateError: Cannot update content_read';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

DROP TRIGGER IF EXISTS event_insert //

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

DROP TRIGGER IF EXISTS event_update //
    
CREATE TRIGGER event_update
BEFORE UPDATE
ON event FOR EACH ROW
BEGIN
    declare msg varchar(128);
    SET msg = 'EventUpdateError: Cannot update events';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

DROP TRIGGER IF EXISTS event_delete //
CREATE TRIGGER event_delete
BEFORE DELETE
ON event FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'EventDeleteError: Cannot delete events';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

DELIMITER ;