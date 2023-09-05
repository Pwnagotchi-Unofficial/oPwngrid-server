DROP TABLE messages;
CREATE TABLE messages (
	id int NOT NULL PRIMARY KEY auto_increment,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    seen_at TIMESTAMP,
	SenderID VARCHAR(255),
	receiver VARCHAR(255),
    sender_name VARCHAR(255) NOT NULL,
    sender VARCHAR(255) NOT NULL,
	data TEXT,
    signature TEXT
    );
