-- 1. Add category column
ALTER TABLE skills ADD COLUMN category VARCHAR(100) DEFAULT 'Programming' NOT NULL;

-- 2. Drop old unique constraint on name
ALTER TABLE skills DROP INDEX UK_name;

-- 3. Add new unique constraint on (name, category)
ALTER TABLE skills ADD CONSTRAINT UK_name_category UNIQUE (name, category);

-- 4. Seed Data: Add duplicate names in different categories
INSERT INTO skills (name, category) VALUES ('Composition', 'Music');
INSERT INTO skills (name, category) VALUES ('Composition', 'Design');
INSERT INTO skills (name, category) VALUES ('Scales', 'Music');
INSERT INTO skills (name, category) VALUES ('Fitness', 'Health');
INSERT INTO skills (name, category) VALUES ('Yoga', 'Health');
