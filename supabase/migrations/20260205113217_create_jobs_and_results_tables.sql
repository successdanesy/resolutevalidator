/*
  # Create jobs and validation_results tables for async batch processing
  
  1. New Tables
    - `jobs`: Tracks the status of batch validation jobs
      - `id` (uuid, primary key)
      - `status` (enum: pending, processing, completed, failed)
      - `total_records` (number of records to process)
      - `processed_count` (number of records processed so far)
      - `failed_count` (number of records that failed)
      - `created_at` (timestamp when job was created)
      - `updated_at` (timestamp of last update)
    
    - `validation_results`: Stores individual validation results
      - `id` (uuid, primary key)
      - `job_id` (foreign key to jobs)
      - `account_no` (padded account number)
      - `bank_code` (padded bank code)
      - `account_name` (returned from Remita API)
      - `validation_status` (success, invalid, error)
      - `error_message` (error details if applicable)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add public policy for reading results (jobs can be read by anyone with jobId)
*/

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_records integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.validation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  account_no text NOT NULL,
  bank_code text NOT NULL,
  account_name text DEFAULT '',
  validation_status text NOT NULL CHECK (validation_status IN ('success', 'invalid', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view jobs"
  ON public.jobs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update jobs"
  ON public.jobs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view validation results"
  ON public.validation_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert validation results"
  ON public.validation_results FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_validation_results_job_id ON public.validation_results(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
