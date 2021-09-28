DROP DATABASE IF EXISTS ${DATABASE};
CREATE DATABASE ${DATABASE};
USE ${DATABASE};

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
    password VARCHAR(255) NOT NULL,
    token VARCHAR(32) DEFAULT NULL,
    token_expiry DATETIME DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    UNIQUE (email),
    PRIMARY KEY (id)
);

CREATE TABLE membership (
    business_id INT NOT NULL,
    user_id INT NOT NULL,
    deactivated TINYINT(1) NOT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    updated_on DATETIME NOT NULL DEFAULT NOW(),
    deleted_on DATETIME DEFAULT NULL,
    FOREIGN KEY (business_id) REFERENCES business(id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    PRIMARY KEY (business_id, user_id)
);

CREATE TABLE department (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) COLLATE UTF8_GENERAL_CI NOT NULL,
    prevent_delete TINYINT(1) NOT NULL DEFAULT 0,
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
    add_users_to_business TINYINT(1) NOT NULL,
    assign_users_to_department TINYINT(1) NOT NULL,
    assign_users_to_role TINYINT(1) NOT NULL,
    create_resources TINYINT(1) NOT NULL,
    assign_resources_to_department TINYINT(1) NOT NULL,
    assign_resources_to_role TINYINT(1) NOT NULL,
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
    FOREIGN KEY (quiz_question_id) REFERENCES quiz_question(id),
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

CREATE TABLE event (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50),
    status ENUM("PASS", "FAIL"),
    user_id INT DEFAULT NULL,
    business_id INT DEFAULT NULL,
    created_on DATETIME NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (business_id) REFERENCES business(id),
    PRIMARY KEY (id)
);