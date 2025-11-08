export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      plants: {
        Row: {
          id: string
          name: string
          category: string
          base_points: number
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          base_points?: number
          emoji?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          base_points?: number
          emoji?: string
          created_at?: string
        }
      }
      user_plants: {
        Row: {
          id: string
          user_id: string
          plant_id: string
          points_earned: number
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plant_id: string
          points_earned?: number
          logged_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plant_id?: string
          points_earned?: number
          logged_at?: string
          created_at?: string
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          emoji: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          emoji?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          emoji?: string
          created_at?: string
          updated_at?: string
        }
      }
      meal_plants: {
        Row: {
          id: string
          meal_id: string
          plant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          meal_id: string
          plant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          meal_id?: string
          plant_id?: string
          created_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          week_start: string
          total_points: number
          unique_plants: number
          goal_reached: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          total_points?: number
          unique_plants?: number
          goal_reached?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          total_points?: number
          unique_plants?: number
          goal_reached?: boolean
          created_at?: string
        }
      }
    }
  }
}
