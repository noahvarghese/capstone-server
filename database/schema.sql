DROP DATABASE IF EXISTS capstone;
CREATE DATABASE capstone;
USE capstone;

CREATE TABLE sessions (
    session_id VARCHAR(128) NOT NULL,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT DEFAULT NULL,
    PRIMARY KEY(session_id)
);

CREATE TABLE business (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    address VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    city VARCHAR(50) COLLATE UTF8_GENERAL_CI NOT NULL,
    postal_code VARCHAR(6) COLLATE UTF8_GENERAL_CI NOT NULL,
    province VARCHAR(2) COLLATE UTF8_GENERAL_CI NOT NULL,
    country VARCHAR(50) COLLATE UTF8_GENERAL_CI DEFAULT("CA"),
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    UNIQUE(name),
    PRIMARY KEY(id)
);

CREATE TABLE user (
    id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    last_name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    email VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    city VARCHAR(50) COLLATE UTF8_GENERAL_CI NOT NULL,
    postal_code VARCHAR(6) COLLATE UTF8_GENERAL_CI NOT NULL,
    province VARCHAR(2) COLLATE UTF8_GENERAL_CI NOT NULL,
    country VARCHAR(50) COLLATE UTF8_GENERAL_CI DEFAULT("CA"),
    birthday DATETIME NOT NULL,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(32) DEFAULT NULL,
    token_expiry DATETIME DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    UNIQUE (email),
    PRIMARY KEY (id)
);

CREATE TABLE membership_request (
    user_id INT NOT NULL,
    business_id INT NOT NULL,
    token VARCHAR(32) NOT NULL,
    token_expiry DATETIME NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    UNIQUE(token),
    FOREIGN KEY (business_id) REFERENCES business(id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    PRIMARY KEY (business_id, user_id)
);

CREATE TABLE membership (
    business_id INT NOT NULL,
    user_id INT NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    default_option TINYINT(1) NOT NULL,
    updated_by_user_id INT NULL,
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    FOREIGN KEY (business_id) REFERENCES business(id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    PRIMARY KEY (business_id, user_id)
);

CREATE TABLE department (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    prevent_delete TINYINT(1) NOT NULL DEFAULT 0,
    prevent_edit TINYINT(1) NOT NULL DEFAULT 0,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    business_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (business_id) REFERENCES business(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE permission (
    id INT NOT NULL AUTO_INCREMENT,
    /* Global settings */
    /* level_type_item */
    global_crud_users TINYINT(1) NOT NULL,
    global_crud_department TINYINT(1) NOT NULL,
    global_crud_role TINYINT(1) NOT NULL,
    global_crud_resources TINYINT(1) NOT NULL,
    global_assign_users_to_department TINYINT(1) NOT NULL,
    global_assign_users_to_role TINYINT(1) NOT NULL,
    global_assign_resources_to_department TINYINT(1) NOT NULL,
    global_assign_resources_to_role TINYINT(1) NOT NULL,
    global_view_reports TINYINT(1) NOT NULL,
    dept_crud_role TINYINT(1) NOT NULL,
    dept_crud_resources TINYINT(1) NOT NULL,
    dept_assign_users_to_role TINYINT(1) NOT NULL,
    dept_assign_resources_to_role TINYINT(1) NOT NULL,
    dept_view_reports TINYINT(1) NOT NULL,
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
    prevent_edit TINYINT(1) NOT NULL DEFAULT 0,
    prevent_delete TINYINT(1) NOT NULL DEFAULT 0,
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
    primary_role_for_user TINYINT(1) NOT NULL,
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
    prevent_delete TINYINT(1)  DEFAULT 0 NOT NULL,
    prevent_edit TINYINT(1) DEFAULT 0 NOT NULL,
    published TINYINT(1) DEFAULT 0 NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE manual_assignment (
    id INT NOT NULL AUTO_INCREMENT,
    role_id INT DEFAULT NULL,
    department_id INT DEFAULT NULL,
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

CREATE TABLE manual_section (
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
    manual_section_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (manual_section_id) REFERENCES manual_section(id),
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
    prevent_delete TINYINT(1) NOT NULL DEFAULT 0,
    prevent_edit TINYINT(1) NOT NULL DEFAULT 0,
    published TINYINT(1) NOT NULL DEFAULT 0,
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
    question_type_id INT NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    quiz_section_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (question_type_id) REFERENCES quiz_question_types(id),
    FOREIGN KEY (quiz_section_id) REFERENCES quiz_section(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    PRIMARY KEY (id)
);

CREATE TABLE quiz_question_types (
    id INT NOT NULL AUTO_INCREMENT,
    question_type ENUM("multiple choice", "single choice") COLLATE UTF8_GENERAL_CI NOT NULL,
    html_tag VARCHAR(50) COLLATE UTF8_GENERAL_CI NOT NULL,
    html_attributes LONGTEXT COLLATE UTF8_GENERAL_CI NOT NULL,
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
    updated_by_user_id INT NOT NULL,
    FOREIGN KEY (updated_by_user_id) REFERENCES user(id),
    FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempt(id),
    FOREIGN KEY (quiz_question_id) REFERENCES quiz_question(id),
    FOREIGN KEY (quiz_answer_id) REFERENCES quiz_answer(id),
    PRIMARY KEY (id)
);

CREATE TABLE content_read (
    content_id INT NOT NULL,
    user_id INT NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    FOREIGN KEY (content_id) REFERENCES content(id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    PRIMARY KEY (user_id, content_id)
);

CREATE TABLE event (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50),
    reason MEDIUMTEXT DEFAULT NULL,
    status ENUM("PASS", "FAIL"),
    user_id INT DEFAULT NULL,
    business_id INT DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (business_id) REFERENCES business(id),
    PRIMARY KEY (id)
);