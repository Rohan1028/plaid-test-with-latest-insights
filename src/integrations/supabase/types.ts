export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intake_responses: {
        Row: {
          answer: string
          created_at: string
          id: string
          question_id: string
          question_text: string
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question_id: string
          question_text: string
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question_id?: string
          question_text?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_intake_responses_session_id"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "intake_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_intake_responses_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "intake_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mem0_committed: boolean | null
          mem0_session_id: string | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mem0_committed?: boolean | null
          mem0_session_id?: string | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mem0_committed?: boolean | null
          mem0_session_id?: string | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_intake_sessions_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          intervention_id: string
          progress_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          intervention_id: string
          progress_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          intervention_id?: string
          progress_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      intervention_milestones: {
        Row: {
          completion_criteria: string
          created_at: string
          id: string
          intervention_id: string
          milestone_description: string
          milestone_name: string
          milestone_prompt: string
          order_sequence: number
        }
        Insert: {
          completion_criteria: string
          created_at?: string
          id?: string
          intervention_id: string
          milestone_description: string
          milestone_name: string
          milestone_prompt: string
          order_sequence: number
        }
        Update: {
          completion_criteria?: string
          created_at?: string
          id?: string
          intervention_id?: string
          milestone_description?: string
          milestone_name?: string
          milestone_prompt?: string
          order_sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "intervention_milestones_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          completion_indicator: string
          created_at: string
          description: string
          id: string
          intervention_prompt: string
          name: string
        }
        Insert: {
          completion_indicator: string
          created_at?: string
          description: string
          id?: string
          intervention_prompt: string
          name: string
        }
        Update: {
          completion_indicator?: string
          created_at?: string
          description?: string
          id?: string
          intervention_prompt?: string
          name?: string
        }
        Relationships: []
      }
      milestone_completions: {
        Row: {
          completed_at: string
          id: string
          insights_extracted: string[] | null
          intervention_progress_id: string
          milestone_id: string
          reflection_quality_score: number | null
          response_text: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          insights_extracted?: string[] | null
          intervention_progress_id: string
          milestone_id: string
          reflection_quality_score?: number | null
          response_text?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          insights_extracted?: string[] | null
          intervention_progress_id?: string
          milestone_id?: string
          reflection_quality_score?: number | null
          response_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_completions_intervention_progress_id_fkey"
            columns: ["intervention_progress_id"]
            isOneToOne: false
            referencedRelation: "user_intervention_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_completions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "intervention_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_intervention_history: {
        Row: {
          completed_at: string | null
          conversation_context: string | null
          id: string
          intervention_id: string
          trigger_reason: string
          triggered_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          conversation_context?: string | null
          id?: string
          intervention_id: string
          trigger_reason: string
          triggered_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          conversation_context?: string | null
          id?: string
          intervention_id?: string
          trigger_reason?: string
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_intervention_history_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_intervention_progress: {
        Row: {
          completed_at: string | null
          completion_type: string | null
          created_at: string
          current_milestone_id: string | null
          exit_reason: string | null
          exited_at: string | null
          id: string
          intervention_id: string
          notes: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_type?: string | null
          created_at?: string
          current_milestone_id?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          id?: string
          intervention_id: string
          notes?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_type?: string | null
          created_at?: string
          current_milestone_id?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          id?: string
          intervention_id?: string
          notes?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_intervention_progress_current_milestone_id_fkey"
            columns: ["current_milestone_id"]
            isOneToOne: false
            referencedRelation: "intervention_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_intervention_progress_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_message_counters: {
        Row: {
          current_session_id: string | null
          last_intervention_at: string | null
          last_message_at: string | null
          message_count: number
          pending_intervention_consent: boolean | null
          pending_intervention_focus: string | null
          pending_intervention_id: string | null
          pending_intervention_reason: string | null
          session_start_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_session_id?: string | null
          last_intervention_at?: string | null
          last_message_at?: string | null
          message_count?: number
          pending_intervention_consent?: boolean | null
          pending_intervention_focus?: string | null
          pending_intervention_id?: string | null
          pending_intervention_reason?: string | null
          session_start_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_session_id?: string | null
          last_intervention_at?: string | null
          last_message_at?: string | null
          message_count?: number
          pending_intervention_consent?: boolean | null
          pending_intervention_focus?: string | null
          pending_intervention_id?: string | null
          pending_intervention_reason?: string | null
          session_start_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_money_stories: {
        Row: {
          created_at: string | null
          data_sources: string[] | null
          expires_at: string
          generated_at: string | null
          id: string
          insights_count: number | null
          is_active: boolean | null
          story_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_sources?: string[] | null
          expires_at: string
          generated_at?: string | null
          id?: string
          insights_count?: number | null
          is_active?: boolean | null
          story_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_sources?: string[] | null
          expires_at?: string
          generated_at?: string | null
          id?: string
          insights_count?: number | null
          is_active?: boolean | null
          story_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_money_stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          session_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      chat_messages_optimized: {
        Row: {
          content: string | null
          created_at: string | null
          day_created: string | null
          id: string | null
          role: string | null
          session_id: string | null
          timestamp_epoch: number | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          day_created?: never
          id?: string | null
          role?: string | null
          session_id?: string | null
          timestamp_epoch?: never
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          day_created?: never
          id?: string | null
          role?: string | null
          session_id?: string | null
          timestamp_epoch?: never
          user_id?: string | null
        }
        Relationships: []
      }
      intervention_feedback_optimized: {
        Row: {
          completed_at: string | null
          completion_timestamp: number | null
          id: string | null
          insights_extracted: string[] | null
          intervention_description: string | null
          intervention_id: string | null
          intervention_name: string | null
          intervention_progress_id: string | null
          milestone_id: string | null
          response_length: number | null
          response_text: string | null
          trigger_reason: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_completions_intervention_progress_id_fkey"
            columns: ["intervention_progress_id"]
            isOneToOne: false
            referencedRelation: "user_intervention_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_completions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "intervention_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_intervention_progress_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_metadata_cache: {
        Row: {
          cached_at: string | null
          estimated_rows: number | null
          schemaname: unknown | null
          size_bytes: number | null
          size_formatted: string | null
          tablename: unknown | null
        }
        Relationships: []
      }
      user_intervention_history_optimized: {
        Row: {
          completed_at: string | null
          completion_duration_seconds: number | null
          conversation_context: string | null
          id: string | null
          intervention_description: string | null
          intervention_id: string | null
          intervention_name: string | null
          is_completed: boolean | null
          trigger_reason: string | null
          triggered_at: string | null
          triggered_timestamp: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_intervention_history_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_intervention_progress_optimized: {
        Row: {
          completed_at: string | null
          intervention_id: string | null
          intervention_name: string | null
          last_milestone_date: string | null
          latest_insights: string[] | null
          latest_milestone_completed_at: string | null
          latest_milestone_response: string | null
          status: string | null
          total_milestones_completed: number | null
          trigger_reason: string | null
          triggered_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_intervention_history_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_money_stories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_table_metadata_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
