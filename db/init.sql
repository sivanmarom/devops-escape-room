-- יצירת טבלה לשחקנים
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- יצירת טבלה לשלבים במשחק
CREATE TABLE IF NOT EXISTS stages (
    id SERIAL PRIMARY KEY,
    stage_name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty INT
);

-- יצירת טבלה לפתרונות
CREATE TABLE IF NOT EXISTS solutions (
    id SERIAL PRIMARY KEY,
    stage_id INT REFERENCES stages(id) ON DELETE CASCADE,
    answer VARCHAR(255) NOT NULL
);

-- הכנסת שלבי דמו
INSERT INTO stages (stage_name, description, difficulty) VALUES
('שלב 1', 'מצא את הקוד בקובץ הלוג', 1),
('שלב 2', 'פתור את חידת הרשת', 2),
('שלב 3', 'פענח את הודעת ה־API', 3);

-- הכנסת פתרונות דמו
INSERT INTO solutions (stage_id, answer) VALUES
(1, '1234'),
(2, 'ping_success'),
(3, 'devops_rules');