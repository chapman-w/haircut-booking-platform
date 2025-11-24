-- Add customer_name and details fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS details TEXT;

-- Update existing bookings to use profile name if customer_name is null
UPDATE public.bookings b
SET customer_name = p.full_name
FROM public.profiles p
WHERE b.user_id = p.id AND b.customer_name IS NULL;

