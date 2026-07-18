export interface RoomRow {
  id: string;
  name: string;
  duration_days: number;
  max_members: number;
  day_index: number;
  created_at: string;
}

export interface RoomMemberRow {
  id: string;
  room_id: string;
  nickname: string;
  cup_ml: number;
  daily_goal_ml: number;
  cups_logged_today: number;
  today_progress_percent: number;
  contributed_drops_today: number;
  last_active_at: string | null;
  created_at: string;
  toss_anonymous_key: string | null;
  eligible_from_day_index: number;
}

export interface DayRecordRow {
  id: string;
  room_id: string;
  day_index: number;
  date: string;
  shared_progress_percent: number;
  total_drops: number;
  member_count_snapshot: number;
  max_drops_snapshot: number;
  participating_member_count: number;
  is_complete: boolean;
  is_full_complete: boolean;
  all_participated: boolean;
}

export interface WaterLogRow {
  id: string;
  room_id: string;
  member_id: string;
  recorded_at: string;
  confirmed_at: string | null;
  new_personal_progress_percent: number | null;
  drops_contributed: number | null;
  new_shared_progress_percent: number | null;
  new_consumed_ml: number | null;
  contribution_drops_total: number | null;
  local_date: string | null;
}
