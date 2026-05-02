-- =====================================================
-- PaperPrint Vendor Dashboard — Seed Data
-- =====================================================

-- 1. Make existing user "Anujj Pal" a vendor
UPDATE users SET role = 'vendor' WHERE id = '2fbb8961-d697-4259-af3e-c343d46d38d4';

-- 2. Create the vendor shop for Anujj
INSERT INTO vendors (id, user_id, shop_name, owner_name, phone, email, address, location_lat, location_lng, is_active, is_verified, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '2fbb8961-d697-4259-af3e-c343d46d38d4',
  'PaperPrint Express',
  'Anujj Pal',
  '+91 9876543210',
  'vasupal772@gmail.com',
  'Sector 62, Noida, UP',
  28.6270, 77.3649,
  TRUE, TRUE,
  NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- 3. Create vendor settings
INSERT INTO vendor_settings (id, vendor_id, price_bw, price_color, price_double_sided, opening_time, closing_time, max_file_size_mb, avg_processing_min, capabilities, updated_at)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  2.00, 10.00, 0.50,
  '09:00', '21:00',
  50, 15,
  ARRAY['color', 'binding', 'lamination'],
  NOW()
)
ON CONFLICT DO NOTHING;

-- 4. Create some customer users
INSERT INTO users (id, name, email, phone, role, created_at, updated_at) VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Rahul Sharma', 'rahul.sharma@gmail.com', '+91 9812345670', 'user', NOW() - INTERVAL '10 days', NOW()),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Priya Gupta', 'priya.gupta@gmail.com', '+91 9823456780', 'user', NOW() - INTERVAL '8 days', NOW()),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Amit Kumar', 'amit.kumar@gmail.com', '+91 9834567890', 'user', NOW() - INTERVAL '5 days', NOW()),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'Sneha Verma', 'sneha.verma@gmail.com', '+91 9845678901', 'user', NOW() - INTERVAL '3 days', NOW()),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'Vikram Singh', 'vikram.singh@gmail.com', '+91 9856789012', 'user', NOW() - INTERVAL '1 day', NOW())
ON CONFLICT DO NOTHING;

-- 5. Create some files (simulated uploads)
INSERT INTO files (id, user_id, file_url, s3_key, file_name, file_size_bytes, total_pages, uploaded_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-9012-cdef-123456789012', '/uploads/resume_rahul.pdf', 'uploads/resume_rahul.pdf', 'Resume_Rahul_Sharma.pdf', 524288, 3, NOW() - INTERVAL '10 days'),
  ('22222222-2222-2222-2222-222222222222', 'd4e5f6a7-b8c9-0123-defa-234567890123', '/uploads/thesis_priya.pdf', 'uploads/thesis_priya.pdf', 'MSc_Thesis_Chapter4.pdf', 2097152, 28, NOW() - INTERVAL '8 days'),
  ('33333333-3333-3333-3333-333333333333', 'e5f6a7b8-c9d0-1234-efab-345678901234', '/uploads/id_cards.pdf', 'uploads/id_cards.pdf', 'Employee_ID_Cards.pdf', 1048576, 6, NOW() - INTERVAL '5 days'),
  ('44444444-4444-4444-4444-444444444444', 'f6a7b8c9-d0e1-2345-fabc-456789012345', '/uploads/notes_sneha.pdf', 'uploads/notes_sneha.pdf', 'Physics_Notes_Unit5.pdf', 3145728, 42, NOW() - INTERVAL '3 days'),
  ('55555555-5555-5555-5555-555555555555', 'a7b8c9d0-e1f2-3456-abcd-567890123456', '/uploads/wedding_card.pdf', 'uploads/wedding_card.pdf', 'Wedding_Invitation.pdf', 4194304, 2, NOW() - INTERVAL '1 day'),
  ('66666666-6666-6666-6666-666666666666', 'c3d4e5f6-a7b8-9012-cdef-123456789012', '/uploads/project_report.pdf', 'uploads/project_report.pdf', 'Project_Report_Final.pdf', 5242880, 55, NOW() - INTERVAL '6 hours'),
  ('77777777-7777-7777-7777-777777777777', 'd4e5f6a7-b8c9-0123-defa-234567890123', '/uploads/assignment.pdf', 'uploads/assignment.pdf', 'Math_Assignment_3.pdf', 262144, 8, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- 6. Create orders in various statuses
INSERT INTO orders (id, order_number, user_id, vendor_id, file_id, status, copies, is_double_sided, total_price, estimated_time, qr_code_url, created_at, updated_at) VALUES
  -- PENDING orders (2)
  ('aaaa1111-1111-1111-1111-111111111111', 'PP-20260502-A1B2', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '66666666-6666-6666-6666-666666666666', 'PENDING', 3, false, 330.00, NULL, NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
  ('aaaa2222-2222-2222-2222-222222222222', 'PP-20260502-C3D4', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '77777777-7777-7777-7777-777777777777', 'PENDING', 1, false, 16.00, NULL, NULL, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),

  -- ACCEPTED order (1)
  ('bbbb1111-1111-1111-1111-111111111111', 'PP-20260501-E5F6', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '33333333-3333-3333-3333-333333333333', 'ACCEPTED', 10, false, 120.00, 20, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),

  -- PROCESSING order (1)
  ('cccc1111-1111-1111-1111-111111111111', 'PP-20260501-G7H8', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '44444444-4444-4444-4444-444444444444', 'PROCESSING', 2, true, 252.00, 30, NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours'),

  -- READY order (1)
  ('dddd1111-1111-1111-1111-111111111111', 'PP-20260501-I9J0', 'a7b8c9d0-e1f2-3456-abcd-567890123456', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '55555555-5555-5555-5555-555555555555', 'READY', 50, false, 1000.00, 15, 'https://example.com/qr/dddd1111', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours'),

  -- COMPLETED orders (2)
  ('eeee1111-1111-1111-1111-111111111111', 'PP-20260430-K1L2', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-1111-1111-1111-111111111111', 'COMPLETED', 5, false, 30.00, 10, 'https://example.com/qr/eeee1111', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('eeee2222-2222-2222-2222-222222222222', 'PP-20260429-M3N4', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '22222222-2222-2222-2222-222222222222', 'COMPLETED', 1, true, 294.00, 25, 'https://example.com/qr/eeee2222', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  -- REJECTED order (1)
  ('ffff1111-1111-1111-1111-111111111111', 'PP-20260430-O5P6', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '33333333-3333-3333-3333-333333333333', 'REJECTED', 1, false, 12.00, NULL, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')

ON CONFLICT DO NOTHING;

-- Verify
SELECT 'Users: ' || count(*) FROM users;
SELECT 'Vendors: ' || count(*) FROM vendors;
SELECT 'Orders: ' || count(*) FROM orders;
SELECT 'Files: ' || count(*) FROM files;
