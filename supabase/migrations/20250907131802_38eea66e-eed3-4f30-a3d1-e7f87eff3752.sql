-- Rename the reserved keyword 'case' column to 'pc_case' in pc_details table
ALTER TABLE pc_details RENAME COLUMN "case" TO pc_case;