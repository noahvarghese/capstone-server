USE capstone;

DELIMITER //

DROP TRIGGER IF EXISTS manual_delete //

CREATE TRIGGER manual_delete
BEFORE DELETE
ON manual FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF (OLD.prevent_delete = 1) THEN
        SET msg = CONCAT('ManualDeleteError: Cannot delete manual while delete lock is set ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS manual_update //

CREATE TRIGGER manual_update
BEFORE UPDATE
ON manual FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF OLD.prevent_edit = 1 AND NEW.prevent_edit = 1 THEN
        SET msg = CONCAT('ManualUpdateError: Manual is locked from editing. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    ELSEIF OLD.prevent_delete = 1 AND NEW.deleted_on IS NOT NULL THEN
        SET msg = CONCAT('ManualDeleteError: Cannot delete manual while delete lock is set ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    ELSE 
        SET NEW.updated_on = NOW();
    END IF;
END;

//

DROP TRIGGER IF EXISTS manual_assignment_insert //

CREATE TRIGGER manual_assignment_insert
BEFORE INSERT
ON manual_assignment FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        SET msg = CONCAT('ManualAssignmentInsertError: Cannot add a manual_assignment without a role or department ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS manual_assignment_update //

CREATE TRIGGER manual_assignment_update
BEFORE UPDATE
ON manual_assignment FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        SET msg = CONCAT('ManualAssignmentUpdateError: Cannot update a manual_assignment without a role or department ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS manual_section_insert //

CREATE TRIGGER manual_section_insert
BEFORE INSERT
ON manual_section FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (SELECT manual.prevent_edit FROM manual WHERE manual.id = NEW.manual_id);

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ManualSectionInsertError: Cannot insert a section while the manual is locked. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS manual_section_update //

CREATE TRIGGER manual_section_update
BEFORE UPDATE
ON manual_section FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (SELECT manual.prevent_edit FROM manual WHERE manual.id = OLD.manual_id);

    IF (prevent_edit = 1) THEN
        IF NEW.deleted_on IS NOT NULL THEN
            SET msg = CONCAT('ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        ELSE
            SET msg = CONCAT('ManualSectionUpdateError: Cannot update a section while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        END IF;

        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS manual_section_delete //

CREATE TRIGGER manual_section_delete
BEFORE DELETE
ON manual_section FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (SELECT manual.prevent_edit FROM manual WHERE manual.id = OLD.manual_id);

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ManualSectionDeleteError: Cannot delete a section while the manual is locked from editing. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS policy_insert //

CREATE TRIGGER policy_insert
BEFORE INSERT 
ON policy FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (
        SELECT m.prevent_edit 
        FROM manual_section AS ms 
        JOIN manual AS m 
        ON m.id = ms.manual_id
        WHERE ms.id = NEW.manual_section_id
    );

    IF prevent_edit = 1 THEN
        SET msg = CONCAT('PolicyInsertError: Cannot insert a policy while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS policy_update //

CREATE TRIGGER policy_update
BEFORE UPDATE
ON policy FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (
        SELECT m.prevent_edit 
        FROM manual_section AS ms 
        JOIN manual AS m 
        ON m.id = ms.manual_id
        WHERE ms.id = OLD.manual_section_id
    );

    IF prevent_edit = 1 THEN
        IF NEW.deleted_on IS NOT NULL THEN
            SET msg = CONCAT('PolicyDeleteError: Cannot delete a policy while the manual is locked from editing. ', CAST(OLD.id AS CHAR));
        ELSE
            SET msg = CONCAT('PolicyUpdateError: Cannot update a policy while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        END IF;

        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS policy_delete //

CREATE TRIGGER policy_delete
BEFORE DELETE 
ON policy FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (
        SELECT m.prevent_edit 
        FROM manual_section AS ms
        JOIN manual AS m ON m.id = ms.manual_id
        WHERE ms.id = OLD.manual_section_id
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('PolicyDeleteError: Cannot delete a policy while the manual is locked from editing. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DROP TRIGGER IF EXISTS content_insert //

CREATE TRIGGER content_insert
BEFORE INSERT 
ON content FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (
        SELECT m.prevent_edit
        FROM policy AS p 
        JOIN manual_section AS ms ON ms.id = p.manual_section_id
        JOIN manual AS m ON m.id = ms.manual_id
        WHERE p.id = NEW.policy_id
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ContentInsertError: Cannot insert content while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS content_update //

CREATE TRIGGER content_update
BEFORE UPDATE
ON content FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (
        SELECT m.prevent_edit
        FROM policy AS p 
        JOIN manual_section AS ms ON ms.id = p.manual_section_id
        JOIN manual AS m ON m.id = ms.manual_id
        WHERE p.id = OLD.policy_id
    );

    IF (prevent_edit = 1) THEN
        IF NEW.deleted_on IS NOT NULL THEN
            SET msg = CONCAT('ContentDeleteError: Cannot delete content while the manual is locked from editing. ', CAST(OLD.id AS CHAR));
        ELSE 
            SET msg = CONCAT('ContentUpdateError: Cannot update content while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        END IF;

        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS content_delete //

CREATE TRIGGER content_delete
BEFORE DELETE 
ON content FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (
        SELECT m.prevent_edit
        FROM policy AS p 
        JOIN manual_section AS ms ON ms.id = p.manual_section_id
        JOIN manual AS m ON m.id = ms.manual_id
        WHERE p.id = OLD.policy_id
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ContentDeleteError: Cannot delete content while the manual is locked from editing. ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DELIMITER ;