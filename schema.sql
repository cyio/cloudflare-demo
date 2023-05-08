DROP TABLE IF EXISTS Comments;
CREATE TABLE Comments(
  id          TEXT NOT NULL PRIMARY KEY,
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT,
  content     TEXT NOT NULL,
  nickname    TEXT NOT NULL
);
INSERT INTO Comments(id,createdAt,updatedAt,content,nickname) VALUES ('989c9329-e989-46a7-87ab-dee178aa417a','2022-12-10T12:37:40.106Z','2022-12-10T12:37:40.106Z','first!','test');
