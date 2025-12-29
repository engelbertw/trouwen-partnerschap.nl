-- Add afbeelding_url column to locatie table
ALTER TABLE ihw.locatie 
ADD COLUMN IF NOT EXISTS afbeelding_url TEXT;

-- Add placeholder images from Unsplash for existing locations
UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1519167758481-83f29da8ae8d?w=800&auto=format&fit=crop'
WHERE code = 'stadhuis_dam' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop'
WHERE code = 'stadhuis_graafzaal' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop'
WHERE code = 'loket_west' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop'
WHERE code = 'loket_oost' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop'
WHERE code = 'loket_noord' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop'
WHERE code = 'loket_zuid' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop'
WHERE code = 'loket_zuidoost' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop'
WHERE code = 'hermitage' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop'
WHERE code = 'scheepvaartmuseum' AND afbeelding_url IS NULL;

UPDATE ihw.locatie 
SET afbeelding_url = 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop'
WHERE code = 'tropenmuseum' AND afbeelding_url IS NULL;

