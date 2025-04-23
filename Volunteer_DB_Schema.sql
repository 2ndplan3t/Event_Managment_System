CREATE TABLE LoginInfo(
	UserID int AUTO_INCREMENT,
    email varchar(70) NOT NULL UNIQUE,
	UserPass varchar(72) NOT NULL,
    CONSTRAINT Pass_Min_Length CHECK (LENGTH(UserPass) > 7),
	UserRole enum("Volunteer", "Manager"),
    PRIMARY KEY (UserID)
);

CREATE TABLE UserProfile(
    FullName varchar(50),
	AddressLine varchar(50),
    AddressLine2 varchar(50),
    City varchar(30),
    State varchar(2),
    ZipCode varchar(9),
    CONSTRAINT Zip_Min_Length CHECK(Length(ZipCode) > 4),
	Preferences varchar(500),
    UserID int, 
    PRIMARY KEY (UserID),
    FOREIGN KEY(UserID) REFERENCES LoginInfo(UserID) ON DELETE CASCADE
);

CREATE TABLE UserSkills(
	UserID int NOT NULL,
    SkillName enum("First-Aid", "Animal Handling", "Cooking", "Sewing", "Communication", "Fundraising"),
    CONSTRAINT Identifier PRIMARY KEY(UserID, SkillName),
    FOREIGN KEY(UserID) REFERENCES UserProfile(UserID)
);

CREATE TABLE UserAvailability(
	UserID int NOT NULL,
    DateAvail date NOT NULL,
    CONSTRAINT Identifier PRIMARY KEY(UserID, DateAvail),
    FOREIGN KEY(UserID) REFERENCES UserProfile(UserID)
);

CREATE TABLE EventList(
	EventID int AUTO_INCREMENT,
    EventName varchar(60),
    EventDesc varchar(600),
    EventLocation varchar(120),
    EventUrgency enum("Low", "Medium", "High"),
    EventDate date NOT NULL,
    EventManager varchar(60),
    EventStatus enum("In Progress", "Cancelled", "Finished"),
    PRIMARY KEY (EventID)
);

CREATE TABLE EventSkills(
	EventID int NOT NULL,
    SkillName enum("First-Aid", "Animal Handling", "Cooking", "Sewing", "Communication", "Fundraising") NOT NULL,
    CONSTRAINT Identifier PRIMARY KEY(EventID, SkillName),
    FOREIGN KEY(EventID) REFERENCES EventList(EventID)
);

CREATE TABLE EventVolMatch(
	EventID int NOT NULL,
    UserID int NOT NULL,
    CONSTRAINT Identifier PRIMARY KEY(EventID, UserID),
    FOREIGN KEY(EventID) REFERENCES EventList(EventID),
    FOREIGN KEY(UserID) REFERENCES UserProfile(UserID)
);

CREATE TABLE UserNotifs(
	NotifID int AUTO_INCREMENT,
	UserID int NOT NULL,
    EventID int NOT NULL,
    NotifType enum("Assigned", "Removed", "Cancelled", "24HReminder", "7DReminder") NOT NULL,
    isCleared bool DEFAULT FALSE,
    PRIMARY KEY(NotifID),
    FOREIGN KEY(UserID) REFERENCES UserProfile(UserID),
    FOREIGN KEY(EventID) REFERENCES EventList(EventID)
);

DROP EVENT IF EXISTS Reminders;
DELIMITER $$
CREATE EVENT IF NOT EXISTS Reminders
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 0 HOUR
DO
BEGIN
  INSERT INTO usernotifs (UserID, EventID, NotifType) 
  SELECT 
    evm.UserID,
    e.EventID,
    "24HReminder"
  FROM EventList e
  JOIN EventVolMatch evm ON e.EventID = evm.EventID
  WHERE DATE(e.EventDate) = CURRENT_DATE + INTERVAL 1 DAY
    AND NOT EXISTS (
      SELECT 1 FROM usernotifs n
      WHERE n.UserID = evm.UserID
        AND n.EventID = e.EventID
        AND n.notiftype = "24HReminder"
    );
END$$
DELIMITER ;


DROP EVENT IF EXISTS finished_events;
DELIMITER $$
CREATE EVENT IF NOT EXISTS finished_events
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 0 HOUR
DO
  BEGIN
    UPDATE EventList
    SET EventStatus = 'Finished'
    WHERE EventDate < CURRENT_DATE
      AND EventStatus != 'Finished'
      AND EventStatus != 'Cancelled'; 
	END$$
DELIMITER ;

SET GLOBAL event_scheduler = ON;

SHOW EVENTS;