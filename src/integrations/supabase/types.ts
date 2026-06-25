export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          amount_cents: number | null
          business_id: string
          created_at: string
          customer_id: string | null
          detail: string | null
          engine_type: Database["public"]["Enums"]["engine_type"] | null
          headline: string
          id: string
          kind: Database["public"]["Enums"]["activity_kind"]
          occurred_at: string
        }
        Insert: {
          amount_cents?: number | null
          business_id: string
          created_at?: string
          customer_id?: string | null
          detail?: string | null
          engine_type?: Database["public"]["Enums"]["engine_type"] | null
          headline: string
          id?: string
          kind: Database["public"]["Enums"]["activity_kind"]
          occurred_at?: string
        }
        Update: {
          amount_cents?: number | null
          business_id?: string
          created_at?: string
          customer_id?: string | null
          detail?: string | null
          engine_type?: Database["public"]["Enums"]["engine_type"] | null
          headline?: string
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      attention_items: {
        Row: {
          business_id: string
          created_at: string
          cta_label: string | null
          description: string | null
          id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["attention_severity"]
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          cta_label?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["attention_severity"]
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          cta_label?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["attention_severity"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string
          deployed_at: string | null
          id: string
          industry: string | null
          monthly_recovered_cents: number
          name: string
          owner_name: string | null
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["business_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deployed_at?: string | null
          id?: string
          industry?: string | null
          monthly_recovered_cents?: number
          name: string
          owner_name?: string | null
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["business_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deployed_at?: string | null
          id?: string
          industry?: string | null
          monthly_recovered_cents?: number
          name?: string
          owner_name?: string | null
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["business_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          last_interaction_summary: string | null
          last_visit_at: string | null
          lifetime_value_cents: number
          phone: string | null
          revenue_opportunity_cents: number
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          last_interaction_summary?: string | null
          last_visit_at?: string | null
          lifetime_value_cents?: number
          phone?: string | null
          revenue_opportunity_cents?: number
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          last_interaction_summary?: string | null
          last_visit_at?: string | null
          lifetime_value_cents?: number
          phone?: string | null
          revenue_opportunity_cents?: number
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_deployments: {
        Row: {
          business_id: string
          created_at: string
          deployed_at: string | null
          engine_type: Database["public"]["Enums"]["engine_type"]
          id: string
          internal_config: Json
          notes: string | null
          phone_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          deployed_at?: string | null
          engine_type: Database["public"]["Enums"]["engine_type"]
          id?: string
          internal_config?: Json
          notes?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          deployed_at?: string | null
          engine_type?: Database["public"]["Enums"]["engine_type"]
          id?: string
          internal_config?: Json
          notes?: string | null
          phone_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engine_deployments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          business_id: string
          config: Json
          connected_at: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["integration_kind"]
          provider: string
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          config?: Json
          connected_at?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["integration_kind"]
          provider: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          config?: Json
          connected_at?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["integration_kind"]
          provider?: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          attention_alerts: boolean
          email_enabled: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
          weekly_summary: boolean
        }
        Insert: {
          attention_alerts?: boolean
          email_enabled?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
          weekly_summary?: boolean
        }
        Update: {
          attention_alerts?: boolean
          email_enabled?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
          weekly_summary?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          business_id: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          bookings_recovered: number
          business_id: string
          created_at: string
          customers_returned: number
          id: string
          period_end: string
          period_start: string
          period_type: Database["public"]["Enums"]["report_period"]
          recovered_cents: number
          reviews_generated: number
          summary_markdown: string | null
        }
        Insert: {
          bookings_recovered?: number
          business_id: string
          created_at?: string
          customers_returned?: number
          id?: string
          period_end: string
          period_start: string
          period_type: Database["public"]["Enums"]["report_period"]
          recovered_cents?: number
          reviews_generated?: number
          summary_markdown?: string | null
        }
        Update: {
          bookings_recovered?: number
          business_id?: string
          created_at?: string
          customers_returned?: number
          id?: string
          period_end?: string
          period_start?: string
          period_type?: Database["public"]["Enums"]["report_period"]
          recovered_cents?: number
          reviews_generated?: number
          summary_markdown?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_engines: {
        Row: {
          business_id: string
          created_at: string
          engine_type: Database["public"]["Enums"]["engine_type"]
          health: Database["public"]["Enums"]["engine_health"]
          id: string
          last_outcome_at: string | null
          notes: string | null
          opportunities_in_motion: number
          recovered_cents_mtd: number
          status: Database["public"]["Enums"]["engine_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          engine_type: Database["public"]["Enums"]["engine_type"]
          health?: Database["public"]["Enums"]["engine_health"]
          id?: string
          last_outcome_at?: string | null
          notes?: string | null
          opportunities_in_motion?: number
          recovered_cents_mtd?: number
          status?: Database["public"]["Enums"]["engine_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          engine_type?: Database["public"]["Enums"]["engine_type"]
          health?: Database["public"]["Enums"]["engine_health"]
          id?: string
          last_outcome_at?: string | null
          notes?: string | null
          opportunities_in_motion?: number
          recovered_cents_mtd?: number
          status?: Database["public"]["Enums"]["engine_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_engines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_business_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member_of_business: {
        Args: { _business_id: string }
        Returns: boolean
      }
      is_ops: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_kind:
        | "recovered_booking"
        | "customer_returned"
        | "review_generated"
        | "appointment_confirmed"
        | "reminder_sent"
        | "opportunity_opened"
      app_role: "customer_owner" | "customer_staff" | "ops_admin" | "ops_staff"
      attention_severity: "info" | "action"
      business_status: "onboarding" | "live" | "paused"
      customer_status: "new" | "active" | "vip" | "lapsed"
      engine_health: "healthy" | "attention" | "offline"
      engine_status: "live" | "paused" | "deploying"
      engine_type:
        | "missed_call"
        | "after_hours"
        | "reactivation"
        | "no_show"
        | "reputation"
      integration_kind: "crm" | "calendar" | "phone" | "reviews"
      integration_status: "connected" | "pending" | "disconnected"
      report_period: "weekly" | "monthly" | "quarterly"
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
    Enums: {
      activity_kind: [
        "recovered_booking",
        "customer_returned",
        "review_generated",
        "appointment_confirmed",
        "reminder_sent",
        "opportunity_opened",
      ],
      app_role: ["customer_owner", "customer_staff", "ops_admin", "ops_staff"],
      attention_severity: ["info", "action"],
      business_status: ["onboarding", "live", "paused"],
      customer_status: ["new", "active", "vip", "lapsed"],
      engine_health: ["healthy", "attention", "offline"],
      engine_status: ["live", "paused", "deploying"],
      engine_type: [
        "missed_call",
        "after_hours",
        "reactivation",
        "no_show",
        "reputation",
      ],
      integration_kind: ["crm", "calendar", "phone", "reviews"],
      integration_status: ["connected", "pending", "disconnected"],
      report_period: ["weekly", "monthly", "quarterly"],
    },
  },
} as const
