DELIMITER //

CREATE TRIGGER quiz_update
BEFORE UPDATE
ON quiz FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF OLD.prevent_edit = 1 AND NEW.prevent_edit = 1 THEN
        SET msg = CONCAT('QuizUpdateError: Quiz is locked for editing. ', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
    
    SET NEW.updated_on = NOW();
END

//

CREATE TRIGGER quiz_delete
BEFORE DELETE
ON quiz FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF OLD.prevent_delete = 1 THEN
        SET msg = CONCAT('QuizDeleteError: Cannot delete quiz while delete lock is set ', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

CREATE TRIGGER quiz_section_update
BEFORE UPDATE
ON quiz_section FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (SELECT prevent_edit FROM quiz WHERE quiz.id = OLD.quiz_id);

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('QuizSectionUpdateError: Trying to update a section while the quiz is locked from editing.', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

CREATE TRIGGER quiz_section_delete
BEFORE DELETE
ON quiz_section FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (SELECT prevent_edit FROM quiz AS q WHERE q.id = OLD.quiz_id);

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('QuizSectionDeleteError: Trying to delete a section while the quiz is locked from editing.', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END;

//

CREATE TRIGGER quiz_question_update
BEFORE UPDATE
ON quiz_question FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (
        SELECT q.prevent_edit 
        FROM quiz AS q
        JOIN quiz_section AS qs ON q.id = qs.quiz_id
        WHERE qs.id = OLD.quiz_section_id 
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('QuestionUpdateError: Trying to update a question while the quiz is locked from editing.', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END

//

CREATE TRIGGER quiz_question_delete
BEFORE DELETE 
ON quiz_question FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (
        SELECT q.prevent_edit 
        FROM quiz AS q
        JOIN quiz_section AS qs ON q.id = qs.quiz_id
        WHERE qs.id = OLD.quiz_section_id 
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('QuestionDeleteError: Trying to delete a question while the quiz is locked from editing.', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END

//

CREATE TRIGGER quiz_answer_update
BEFORE UPDATE
ON quiz_answer FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (
        SELECT q.prevent_edit
        FROM quiz AS q
        JOIN quiz_section AS qs ON q.id = qs.quiz_id
        JOIN quiz_question AS qq ON qs.id = qq.quiz_section_id
        WHERE qq.id = OLD.quiz_question_id
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('AnswerUpdateError: Trying to update an answer while the quiz is locked from editing.', CAST(NEW.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;

    SET NEW.updated_on = NOW();
END

//

CREATE TRIGGER quiz_answer_delete
BEFORE DELETE 
ON quiz_answer FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE prevent_edit TINYINT(1);

    SET prevent_edit = (
        SELECT q.prevent_edit
        FROM quiz AS q
        JOIN quiz_section AS qs ON q.id = qs.quiz_id
        JOIN quiz_question AS qq ON qs.id = qq.quiz_section_id
        WHERE qq.id = OLD.quiz_question_id
    );

    IF (prevent_edit = 1) THEN
        SET msg = CONCAT('AnswerDeleteError: Trying to delete an answer while the quiz is locked from editing.', CAST(OLD.id AS CHAR));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END

//

DELIMITER ;