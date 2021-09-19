DELIMITER //

CREATE TRIGGER manual_insert
BEFORE INSERT
ON manual FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        SET msg = CONCAT('ManualInsertError: Trying to add a manual without a role or department ', CAST(NEW.id AS CHAR));
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
        SET msg = CONCAT('ManualDeleteError: Manual has delete prevention on.', CAST(OLD.id AS CHAR));
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
        SET msg = CONCAT('ManualUpdateError: Trying to update a manual without a role and department ', CAST(NEW.id AS CHAR));
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
ON manual FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        SET msg = CONCAT('ManualAssignmentInsertError: Trying to add a manual_ASsignment without a role or department ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

CREATE TRIGGER manual_assignment_update
BEFORE UPDATE
ON manual FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    IF (NEW.role_id IS NULL OR NEW.role_id = '') AND (NEW.department_id IS NULL OR NEW.department_id = '') THEN
        SET msg = CONCAT('ManualAssignmentUpdateError: Trying to update a manual_assignment without a role or department ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
    SET NEW.updated_on = NOW();
END;

//

CREATE TRIGGER section_update
BEFORE UPDATE
ON section FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (SELECT prevent_edit FROM manual WHERE manual.id = OLD.manual_id);

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ManualSectionUpdateError: Trying to update a section while the manual is locked from editing.', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

CREATE TRIGGER section_delete
BEFORE DELETE
ON section FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);
    SET prevent_edit = (SELECT prevent_edit FROM manual WHERE manual.id = OLD.manual_id);

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ManualSectionDeleteError: Trying to delete a section while the manual is locked from editing.', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
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
        FROM section AS s 
        JOIN manual AS m 
        ON m.id = s.manual_id
        HAVING s.id = OLD.id
    );

    IF prevent_edit = 1 THEN
        SET msg = CONCAT('PolicyUpdateError: Trying to update a policy while the manual is locked from editing.', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
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
        FROM section AS s
        JOIN manual AS m ON m.id = s.manual_id
        HAVING s.id = OLD.section_id
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('PolicyDeleteError: Trying to delete a policy while the manual is locked from editing.', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
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
        JOIN section AS s ON s.id = p.section_id
        JOIN manual AS m ON m.id = s.manual_id
        HAVING p.id = OLD.policy_id
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ContentUpdateError: Trying to update a section while the manual is locked ffrom editing.', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
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
        JOIN section AS s ON s.id = p.section_id
        JOIN manual AS m ON m.id = s.manual_id
        HAVING p.id = OLD.policy_id
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('ContentDeleteError: Trying to delete content while the manual is locked ffrom editing.', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

DELIMITER ;