DROP TABLE units;
CREATE TABLE units (
	ID int NOT NULL PRIMARY KEY auto_increment,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    address VARCHAR(255),
	country VARCHAR(255),
	name VARCHAR(255) NOT NULL,
    identity VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
	data JSON
    );