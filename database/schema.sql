DROP DATABASE IF EXISTS capstone;
CREATE DATABASE capstone;
USE capstone;

CREATE TABLE business (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    address VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    city VARCHAR(50) COLLATE UTF8_GENERAL_CI NOT NULL,
    postal_code VARCHAR(6) COLLATE UTF8_GENERAL_CI NOT NULL,
    province VARCHAR(2) COLLATE UTF8_GENERAL_CI NOT NULL,
    country VARCHAR(50) COLLATE UTF8_GENERAL_CI NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE user (
    id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    last_name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    email VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    original_phone VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    city VARCHAR(50) COLLATE UTF8_GENERAL_CI NOT NULL,
    postal_code VARCHAR(6) COLLATE UTF8_GENERAL_CI NOT NULL,
    province VARCHAR(2) COLLATE UTF8_GENERAL_CI NOT NULL,
    country VARCHAR(50) COLLATE UTF8_GENERAL_CI NOT NULL,
    birthday DATETIME NOT NULL,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(32) DEFAULT NULL,
    token_expiry DATETIME DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    business_id INT NOT NULL,
    /* access_level_id INT NOT NULL, */
    FOREIGN KEY (business_id) REFERENCES business(id),
    /* FOREIGN KEY (access_level_id) REFERENCES access_level(id), */
    PRIMARY KEY (id)
);

CREATE TABLE department (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    business_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (business_id) REFERENCES business(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

/* Each role will have a set of permissions */

CREATE TABLE permission (
    id INT NOT NULL AUTO_INCREMENT,
    view_users TINYINT(1) NOT NULL,
    edit_users TINYINT(1) NOT NULL,
    remove_users TINYINT(1) NOT NULL,
    edit_policies TINYINT(1) NOT NULL,
    updated_by_user_id INT NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE role (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    department_id INT NOT NULL,
    permission_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES department(id),
    FOREIGN KEY (permission_id) REFERENCES permission(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE user_role (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    FOREIGN KEY(user_id) REFERENCES user(id),
    FOREIGN KEY(role_id) REFERENCES role(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE manual (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    /* NEEDS DEPARTMENT OR ROLE */
    /* THIS IS FOR THE OWNER OF the MANUAL */
    role_id INT DEFAULT NULL,
    department_id INT DEFAULT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (department_id) REFERENCES department(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE manual_assignment (
    id INT NOT NULL AUTO_INCREMENT,
    role_id INT,
    department_id INT,
    manual_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (department_id) REFERENCES department(id),
    FOREIGN KEY (manual_id) REFERENCES manual(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE section (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    manual_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (manual_id) REFERENCES manual(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE policy (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    section_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (section_id) REFERENCES section(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE content (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    content LONGTEXT COLLATE UTF8_GENERAL_CI NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    policy_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (policy_id) REFERENCES policy(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE quiz (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    max_attempts INT DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    manual_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (manual_id) REFERENCES manual(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY(id)
);

CREATE TABLE quiz_section (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    quiz_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY(id)
);

CREATE TABLE quiz_question (
    id INT NOT NULL AUTO_INCREMENT,
    question LONGTEXT COLLATE UTF8_GENERAL_CI NOT NULL,
    type VARCHAR(50) COLLATE UTF8_GENERAL_CI NOT NULL, 
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    quiz_section_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (quiz_section_id) REFERENCES quiz_section(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE quiz_answer (
    id INT NOT NULL AUTO_INCREMENT,
    answer VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    correct TINYINT(1) NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    quiz_question_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (quiz_question_id) REFERENCES quiz_question(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE quiz_attempt (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (quiz_id) REFERENCES quiz(id),
    PRIMARY KEY (id)
);

CREATE TABLE quiz_result (
    id INT NOT NULL AUTO_INCREMENT,
    quiz_attempt_id INT NOT NULL,
    quiz_question_id INT NOT NULL,
    /* If value is null, then incorrect */
    /* Else check corresponding quiz_answer.correct */
    quiz_answer_id INT DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempt(id),
    FOREIGN KEy (quiz_question_id) REFERENCES quiz_question(id),
    FOREIGN KEY (quiz_answer_id) REFERENCES quiz_answer(id),
    PRIMARY KEY (id)
);

CREATE TABLE policy_read (
    policy_id INT NOT NULL,
    user_id INT NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    FOREIGN KEY (policy_id) REFERENCES policy(id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    PRIMARY KEY (user_id, policy_id)
);