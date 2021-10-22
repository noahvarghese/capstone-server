DELIMITER //

CREATE TRIGGER manual_insert
BEFORE INSERT
ON manual FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        SET msg = CONCAT('ManualInsertError: Cannot add a manual without a role or department ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

// 

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

CREATE TRIGGER manual_update
BEFORE UPDATE
ON manual FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        SET msg = CONCAT('ManualUpdateError: Cannot update a manual without a role and department ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    ELSEIF OLD.prevent_edit = 1 AND NEW.prevent_edit = 1 THEN
        SET msg = CONCAT('ManualUpdateError: Manual is locked from editing. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    ELSE 
        SET NEW.updated_on = NOW();
    END IF;
END;

//

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

CREATE TRIGGER manual_section_update
BEFORE UPDATE
ON manual_section FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (SELECT manual.prevent_edit FROM manual WHERE manual.id = OLD.manual_id);

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ManualSectionUpdateError: Cannot update a section while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    ELSEIF (OLD.manual_id != NEW.manual_id) THEN
        SET prevent_edit = (SELECT manual.prevent_edit FROM manual WHERE manual.id = NEW.manual_id);
        IF (prevent_edit = 1) THEN
            SET msg = CONCAT('ManualSectionUpdateError: Cannot update a section while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
        END IF;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

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
        SET msg = CONCAT('PolicyUpdateError: Cannot update a policy while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    ELSEIF (OLD.manual_section_id != NEW.manual_section_id) THEN

        SET prevent_edit = (
            SELECT m.prevent_edit 
            FROM manual_section AS ms 
            JOIN manual AS m 
            ON m.id = ms.manual_id
            WHERE ms.id = NEW.manual_section_id
        );

        IF prevent_edit = 1 THEN
            SET msg = CONCAT('PolicyUpdateError: Cannot update a policy while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
        END IF;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

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
        SET msg = CONCAT('ContentUpdateError: Cannot update content while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    ELSEIF (OLD.policy_id != NEW.policy_id) THEN
        SET prevent_edit = (
            SELECT m.prevent_edit
            FROM policy AS p 
            JOIN manual_section AS ms ON ms.id = p.manual_section_id
            JOIN manual AS m ON m.id = ms.manual_id
            WHERE p.id = NEW.policy_id
        );
    
        IF (prevent_edit = 1) THEN
            SET msg = CONCAT('ContentUpdateError: Cannot update content while the manual is locked from editing. ', CAST(NEW.id AS CHAR));
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
        END IF;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

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