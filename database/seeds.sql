-- Seed data for Automated Student ID Card Registration, Batching, and Notification System
-- Run this after creating the database schema

USE student_id_system;

-- Insert default admin users (password: admin123 - CHANGE IN PRODUCTION)
INSERT IGNORE INTO staff_users (username, password_hash, full_name, email, role) VALUES
('admin', '$2a$10$7D8clT24KXvhLA7c.Hu8xO8iLC4MGhMkY4Dgc.PVWFmZkZ7eg4i0K', 'System Administrator', 'admin@example.edu.ng', 'admin'),
('registry', '$2a$10$7D8clT24KXvhLA7c.Hu8xO8iLC4MGhMkY4Dgc.PVWFmZkZ7eg4i0K', 'Registry Officer', 'registry@example.edu.ng', 'registry'),
('ict', '$2a$10$7D8clT24KXvhLA7c.Hu8xO8iLC4MGhMkY4Dgc.PVWFmZkZ7eg4i0K', 'ICT Support', 'ict@example.edu.ng', 'ict');

-- Insert sample students for testing
INSERT IGNORE INTO students (matric_no, first_name, last_name, email, phone, faculty, department, level) VALUES
('CSC/22/001', 'John', 'Doe', 'john.doe@example.edu.ng', '+2348012345678', 'Computing', 'Computer Science', '200'),
('CSC/22/002', 'Jane', 'Smith', 'jane.smith@example.edu.ng', '+2348023456789', 'Computing', 'Computer Science', '200'),
('CSC/22/003', 'Michael', 'Johnson', 'michael.johnson@example.edu.ng', '+2348034567890', 'Computing', 'Computer Science', '200'),
('CSC/22/004', 'Stone', 'Tree', 'stone.tree@example.edu.ng', '+2348038475626', 'Computing', 'Computer Science', '200'),
('CSC/22/005', 'Raymond', 'Reddinton', 'raymond.reddinton@example.edu.ng', '+2348038475626', 'Computing', 'Computer Science', '200'),
('CSC/22/006', 'Micheal', 'Scotfield', 'micheal.scotfield@example.edu.ng', '+2348038475626', 'Computing', 'Computer Science', '200'),
('CSC/22/007', 'Tariq', 'Patrick', 'tariq.patrick@example.edu.ng', '+2348038475626', 'Computing', 'Computer Science', '200'),
('CSC/22/008', 'James', 'Patrick', 'james.patrick@example.edu.ng', '+2348038475626', 'Computing', 'Computer Science', '200'),
('CSC/22/009', 'Franklin', 'Saint', 'franklin.saint@example.edu.ng', '+2348038475626', 'Computing', 'Computer Science', '200'),
('CSC/22/0010', 'Tommy', 'Egan', 'tommy.egan@example.edu.ng', '+2348038475626', 'Computing', 'Computer Science', '200'),
('ENG/22/001', 'Sarah', 'Williams', 'sarah.williams@example.edu.ng', '+2348045678901', 'Engineering', 'Electrical Engineering', '200'),
('ENG/22/002', 'David', 'Brown', 'david.brown@example.edu.ng', '+2348056789012', 'Engineering', 'Mechanical Engineering', '200'),
('SCI/22/001', 'Emily', 'Davis', 'emily.davis@example.edu.ng', '+2348067890123', 'Science', 'Physics', '200'),
('SCI/22/002', 'James', 'Miller', 'james.miller@example.edu.ng', '+2348078901234', 'Science', 'Chemistry', '200'),
('CSC/21/001', 'Robert', 'Wilson', 'robert.wilson@example.edu.ng', '+2348089012345', 'Computing', 'Computer Science', '300'),
('CSC/21/002', 'Lisa', 'Moore', 'lisa.moore@example.edu.ng', '+2348090123456', 'Computing', 'Computer Science', '300'),
('CSC/20/001', 'William', 'Taylor', 'william.taylor@example.edu.ng', '+2348101234567', 'Computing', 'Computer Science', '400');

-- Note: In a real application, you would not include sample students with real data.
-- This is only for development and testing purposes.

-- Password hashes shown above are for 'admin123' using bcrypt
-- To generate new password hashes, use: bcrypt.hash('your_password', 10)