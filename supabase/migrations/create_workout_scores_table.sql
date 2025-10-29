-- Create workout_scores table for storing Strava workout quality analysis
CREATE TABLE IF NOT EXISTS workout_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Workout identification
    history_key TEXT NOT NULL, -- Format: "week-dayIndex" (e.g., "1-0")
    activity_id BIGINT NOT NULL, -- Strava activity ID

    -- Quality scores (0-10 scale)
    total_score NUMERIC(4,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 10),
    duration_score NUMERIC(4,2) CHECK (duration_score >= 0 AND duration_score <= 10),
    power_zones_score NUMERIC(4,2) CHECK (power_zones_score >= 0 AND power_zones_score <= 10),
    completion_score NUMERIC(4,2) CHECK (completion_score >= 0 AND completion_score <= 10),

    -- Metadata
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one score per workout per user
    UNIQUE(user_id, history_key)
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_workout_scores_user_id ON workout_scores(user_id);

-- Create index for activity lookups
CREATE INDEX IF NOT EXISTS idx_workout_scores_activity_id ON workout_scores(activity_id);

-- Enable Row Level Security
ALTER TABLE workout_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own scores
CREATE POLICY "Users can view their own workout scores"
    ON workout_scores
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own scores
CREATE POLICY "Users can insert their own workout scores"
    ON workout_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own scores
CREATE POLICY "Users can update their own workout scores"
    ON workout_scores
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own scores
CREATE POLICY "Users can delete their own workout scores"
    ON workout_scores
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workout_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER update_workout_scores_timestamp
    BEFORE UPDATE ON workout_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_scores_updated_at();

-- Create a view for easy score analytics
CREATE OR REPLACE VIEW workout_scores_summary AS
SELECT
    user_id,
    COUNT(*) as total_workouts,
    ROUND(AVG(total_score)::numeric, 2) as avg_total_score,
    ROUND(AVG(duration_score)::numeric, 2) as avg_duration_score,
    ROUND(AVG(power_zones_score)::numeric, 2) as avg_power_zones_score,
    ROUND(AVG(completion_score)::numeric, 2) as avg_completion_score,
    MIN(synced_at) as first_sync,
    MAX(synced_at) as last_sync
FROM workout_scores
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON workout_scores_summary TO authenticated;
