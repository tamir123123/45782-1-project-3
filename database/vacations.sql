-- Drop existing database if exists
DROP DATABASE IF EXISTS vacations;

-- Create database
CREATE DATABASE vacations;

-- Use the database
USE vacations;

-- Users table
CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('User', 'Admin') NOT NULL DEFAULT 'User',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vacations table
CREATE TABLE vacations (
    vacation_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    destination VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0 AND price <= 10000),
    image_file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Followers table (many-to-many relationship between users and vacations)
CREATE TABLE followers (
    user_id CHAR(36) NOT NULL,
    vacation_id CHAR(36) NOT NULL,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, vacation_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (vacation_id) REFERENCES vacations(vacation_id) ON DELETE CASCADE
);

-- Insert admin user (password: admin123)
-- Password is hashed using bcrypt
INSERT INTO users (first_name, last_name, email, password, role) VALUES
('Admin', 'User', 'admin@vacations.com', '$2b$10$Viuv20lj9LJZcUcVyK1rWuRmvhBaxKWLHtQFj4Rx1doL5A865.Iqm', 'Admin');

-- Insert sample users (password: john123, jane123, michael123)
INSERT INTO users (first_name, last_name, email, password, role) VALUES
('John', 'Doe', 'john@example.com', '$2b$10$Ze7DO5gLl6IDmGyJen8KLe2pQQ.v9/5GQMYNMJbdgTJn1TaZWrJVq', 'User'),
('Jane', 'Smith', 'jane@example.com', '$2b$10$29MzqMaEMxnqrcpR7Ma6Ae7WlZywipsCPcRLUIrPnrbirXyWsEMSq', 'User'),
('Michael', 'Johnson', 'michael@example.com', '$2b$10$jpUA7sqBTuVHEWqqYHAbi.xXIyJ8KPkBbf97.46xeSlqjU6mWQ3.G', 'User');

-- Insert 12 vacations with real data
INSERT INTO vacations (destination, description, start_date, end_date, price, image_file_name) VALUES
('Rome, Italy', 'You can create a dream vacation of famous artistic wonders and historic hidden gems punctuated by top-notch dining in fabulous restaurants with a Rome vacation package. Fill your days with tours of the Roman Forum, the Pantheon, the Colosseum, all the show-off Rome sights, then meander down cobbled streets to find a pretty basement.', '2025-10-28', '2025-11-09', 1931, NULL),

('Rhodes, Greece', 'It''s time to take a break and enjoy a cocktail by the sea on a Rhodes vacation. Incredible seaside views are there for the taking on a trip to Rhodes — Pefkos Beach (28 miles / 45 km away) is a well-known example. We recommend staying close by. If you want other options, a lot of travelers also book Rhodes vacation packages in the vicinity.', '2025-08-11', '2025-11-22', 462, NULL),

('Lahaina, Hawaii', 'It''s time to take a break and relax by the ocean on a Lahaina vacation. Incredible seaside views are in plentiful supply on a trip to Lahaina — Kaanapali Beach (3 miles / 5 km away) is the perfect example. We recommend staying close by. If you want other options, loads of travelers also book Lahaina packages around Black Rock a.', '2025-11-15', '2025-11-30', 1049, NULL),

('Corfu, Greece', 'Discover the enchanting island of Corfu with its stunning beaches, Venetian architecture, and lush green landscapes. Explore the UNESCO World Heritage old town, visit the Achilleion Palace, and relax on beautiful beaches like Paleokastritsa. Enjoy authentic Greek cuisine and experience the island''s vibrant nightlife.', '2025-12-13', '2025-12-27', 1299, NULL),

('Hilo, Hawaii', 'Experience the natural beauty of Hilo on the Big Island of Hawaii. Visit stunning waterfalls like Rainbow Falls and Akaka Falls, explore Hawaii Volcanoes National Park, and stroll through the beautiful botanical gardens. Enjoy black sand beaches, local farmers markets, and the unique culture of this tropical paradise.', '2025-12-17', '2025-12-31', 1599, NULL),

('Montego Bay, Jamaica', 'Relax in the Caribbean paradise of Montego Bay with its pristine white sand beaches, crystal-clear waters, and vibrant culture. Enjoy water sports, explore the famous Doctor''s Cave Beach, visit historic Rose Hall Great House, and experience authentic Jamaican cuisine and reggae music in this tropical haven.', '2026-01-03', '2026-01-17', 899, NULL),

('Puerto Rico Island', 'Discover the magic of Puerto Rico with its diverse landscapes, rich history, and vibrant culture. Explore the colorful streets of Old San Juan, relax on beautiful beaches like Flamenco Beach, hike through El Yunque rainforest, and experience the bioluminescent bays. Enjoy delicious Puerto Rican cuisine and warm hospitality.', '2025-11-20', '2025-12-05', 1450, NULL),

('Las Vegas, Nevada', 'Experience the entertainment capital of the world in Las Vegas. Enjoy world-class shows, casinos, fine dining, and luxury hotels. Visit the iconic Strip, see the Bellagio Fountains, explore nearby Red Rock Canyon, and experience the vibrant nightlife that makes Vegas a unique destination.', '2025-12-01', '2025-12-08', 799, NULL),

('Honolulu, Hawaii', 'Discover the beauty of Honolulu, the capital of Hawaii. Relax on the famous Waikiki Beach, visit Pearl Harbor and the USS Arizona Memorial, hike up Diamond Head for panoramic views, and explore the vibrant local culture. Enjoy surfing, shopping, and authentic Hawaiian cuisine in this tropical paradise.', '2025-11-25', '2025-12-10', 1850, NULL),

('Kailua-Kona, Hawaii', 'Experience the sunny Kona coast of the Big Island. Enjoy world-famous Kona coffee, snorkel in crystal-clear waters, visit historic sites like Pu''uhonua o Honaunau, and witness spectacular sunsets. Explore volcanic landscapes, go whale watching (seasonal), and relax on beautiful beaches in this Hawaiian gem.', '2025-12-05', '2025-12-20', 1699, NULL),

('Port Antonio, Jamaica', 'Discover the unspoiled beauty of Port Antonio on Jamaica''s northeast coast. Visit the stunning Blue Lagoon, relax on pristine Frenchman''s Cove beach, explore lush rainforests, and experience authentic Jamaican culture away from the crowds. Enjoy fresh seafood, visit historic sites, and take a bamboo rafting trip on the Rio Grande.', '2026-01-10', '2026-01-25', 1199, NULL),

('Maui, Hawaii', 'Experience the magic of Maui, the Valley Isle. Drive the scenic Road to Hana, watch the sunrise from Haleakala volcano, snorkel at Molokini Crater, and relax on world-famous beaches like Wailea and Kaanapali. Enjoy whale watching (seasonal), explore charming towns, and experience the true spirit of Aloha.', '2025-12-20', '2026-01-05', 2100, NULL);

-- Sample followers removed due to UUID implementation
-- Users can follow vacations through the application UI
