DROP TABLE aps;
CREATE TABLE aps (
	ID int NOT NULL PRIMARY KEY auto_increment,
    identity VARCHAR(255) NOT NULL,
    bssid binary(6) NOT NULL,
    essid VARCHAR(255)
    );