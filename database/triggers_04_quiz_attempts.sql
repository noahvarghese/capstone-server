-- USE capstone;

DELIMITER //

DROP TRIGGER IF EXISTS quiz_attempt_update //

CREATE TRIGGER quiz_attempt_update
BEFORE UPDATE
ON quiz_attempt FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);

    IF OLD.created_on < OLD.updated_on THEN
        SET msg = CONCAT('QuizAttemptUpdateError: quiz_attempt_id ', CAST(OLD.id AS CHAR), ' has been completed.');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    ELSE
        /* Not allowed to change the details of the quiz attempt */
        IF NEW.quiz_id != OLD.quiz_id THEN
            SET NEW.quiz_id = OLD.quiz_id;
        END IF;

        IF NEW.user_id != OLD.user_id THEN
            SET NEW.user_id = OLD.user_id;
        END IF;
    END IF;

    SET NEW.updated_on = NOW();
END;

//

DROP TRIGGER IF EXISTS quiz_result_update //

CREATE TRIGGER quiz_result_update
BEFORE UPDATE
ON quiz_result FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    SET msg = 'QuizResultUpdateError: Cannot update quiz_result';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
END;

//

/* Don't allow more than the max attempts per user */

DROP TRIGGER IF EXISTS quiz_max_attempts //

CREATE TRIGGER quiz_max_attempts
BEFORE INSERT
ON quiz_attempt FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(128);
    DECLARE max_attempts INT;
    DECLARE user_attempts INT;

    SET max_attempts = (SELECT q.max_attempts FROM quiz q WHERE q.id = NEW.quiz_id);
    SET user_attempts = (SELECT COUNT(*) FROM quiz_attempt q WHERE q.quiz_id = NEW.quiz_id AND q.user_id = NEW.user_id);

    IF max_attempts IS NOT NULL THEN
        IF user_attempts = max_attempts THEN
            SET msg = CONCAT('QuizAttemptInsertError: Max quiz attempts reached for user ', CAST(NEW.user_id AS CHAR), ' number of attempts ', CAST(user_attempts AS CHAR), ' max attempts ', CAST(max_attempts AS CHAR));
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
        END IF;
    END IF;
END;

//

DELIMITER ;