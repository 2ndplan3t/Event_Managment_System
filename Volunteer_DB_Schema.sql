CREATE TABLE LoginInfo(
	UserID int AUTO_INCREMENT,
	UserPass varchar(30) NOT NULL,
    CONSTRAINT Pass_Min_Length CHECK (LENGTH(UserPass) > 7),
	UserRole enum("Volunteer", "Manager"),
    PRIMARY KEY (UserID)
);

CREATE TABLE UserProfile(
    FullName varchar(50) NOT NULL,
	AddressLine varchar(50),
    AddressLine2 varchar(50),
    City varchar(30),
    State varchar(2),
    ZipCode varchar(9),
    CONSTRAINT Zip_Min_Length CHECK(Length(ZipCode) > 4),
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