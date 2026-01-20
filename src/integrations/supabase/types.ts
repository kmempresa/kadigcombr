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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      global_assets: {
        Row: {
          category: string
          created_at: string
          currency: string
          exchange_rate: number | null
          id: string
          name: string
          notes: string | null
          original_value: number
          updated_at: string
          user_id: string
          value_brl: number
        }
        Insert: {
          category?: string
          created_at?: string
          currency?: string
          exchange_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          original_value?: number
          updated_at?: string
          user_id: string
          value_brl?: number
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          exchange_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          original_value?: number
          updated_at?: string
          user_id?: string
          value_brl?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_value: number | null
          id: string
          portfolio_id: string | null
          target_date: string | null
          target_value: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          id?: string
          portfolio_id?: string | null
          target_date?: string | null
          target_value?: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          id?: string
          portfolio_id?: string | null
          target_date?: string | null
          target_value?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          asset_name: string
          asset_type: string
          created_at: string
          current_price: number | null
          current_value: number | null
          gain_percent: number | null
          id: string
          maturity_date: string | null
          pluggy_investment_id: string | null
          portfolio_id: string
          purchase_price: number | null
          quantity: number | null
          source: string | null
          ticker: string | null
          total_invested: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_name: string
          asset_type: string
          created_at?: string
          current_price?: number | null
          current_value?: number | null
          gain_percent?: number | null
          id?: string
          maturity_date?: string | null
          pluggy_investment_id?: string | null
          portfolio_id: string
          purchase_price?: number | null
          quantity?: number | null
          source?: string | null
          ticker?: string | null
          total_invested?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_name?: string
          asset_type?: string
          created_at?: string
          current_price?: number | null
          current_value?: number | null
          gain_percent?: number | null
          id?: string
          maturity_date?: string | null
          pluggy_investment_id?: string | null
          portfolio_id?: string
          purchase_price?: number | null
          quantity?: number | null
          source?: string | null
          ticker?: string | null
          total_invested?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          asset_name: string
          asset_type: string | null
          created_at: string
          id: string
          investment_id: string | null
          movement_date: string
          notes: string | null
          portfolio_id: string | null
          portfolio_name: string | null
          quantity: number | null
          target_portfolio_name: string | null
          ticker: string | null
          total_value: number
          type: string
          unit_price: number | null
          user_id: string
        }
        Insert: {
          asset_name: string
          asset_type?: string | null
          created_at?: string
          id?: string
          investment_id?: string | null
          movement_date?: string
          notes?: string | null
          portfolio_id?: string | null
          portfolio_name?: string | null
          quantity?: number | null
          target_portfolio_name?: string | null
          ticker?: string | null
          total_value?: number
          type: string
          unit_price?: number | null
          user_id: string
        }
        Update: {
          asset_name?: string
          asset_type?: string | null
          created_at?: string
          id?: string
          investment_id?: string | null
          movement_date?: string
          notes?: string | null
          portfolio_id?: string | null
          portfolio_name?: string | null
          quantity?: number | null
          target_portfolio_name?: string | null
          ticker?: string | null
          total_value?: number
          type?: string
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      pluggy_connections: {
        Row: {
          connector_id: number | null
          connector_image_url: string | null
          connector_name: string | null
          connector_primary_color: string | null
          created_at: string
          id: string
          item_id: string
          last_updated_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connector_id?: number | null
          connector_image_url?: string | null
          connector_name?: string | null
          connector_primary_color?: string | null
          created_at?: string
          id?: string
          item_id: string
          last_updated_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connector_id?: number | null
          connector_image_url?: string | null
          connector_name?: string | null
          connector_primary_color?: string | null
          created_at?: string
          id?: string
          item_id?: string
          last_updated_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_history: {
        Row: {
          cdi_accumulated: number | null
          created_at: string
          gain_percent: number
          id: string
          ipca_accumulated: number | null
          portfolio_id: string
          snapshot_date: string
          total_gain: number
          total_invested: number
          total_value: number
          user_id: string
        }
        Insert: {
          cdi_accumulated?: number | null
          created_at?: string
          gain_percent?: number
          id?: string
          ipca_accumulated?: number | null
          portfolio_id: string
          snapshot_date?: string
          total_gain?: number
          total_invested?: number
          total_value?: number
          user_id: string
        }
        Update: {
          cdi_accumulated?: number | null
          created_at?: string
          gain_percent?: number
          id?: string
          ipca_accumulated?: number | null
          portfolio_id?: string
          snapshot_date?: string
          total_gain?: number
          total_invested?: number
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_history_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          cdi_percent: number | null
          created_at: string
          id: string
          name: string
          total_gain: number | null
          total_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cdi_percent?: number | null
          created_at?: string
          id?: string
          name?: string
          total_gain?: number | null
          total_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cdi_percent?: number | null
          created_at?: string
          id?: string
          name?: string
          total_gain?: number | null
          total_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          investment_goal: string | null
          investor_profile: string | null
          monthly_income: number | null
          phone: string | null
          risk_tolerance: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          investment_goal?: string | null
          investor_profile?: string | null
          monthly_income?: number | null
          phone?: string | null
          risk_tolerance?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          investment_goal?: string | null
          investor_profile?: string | null
          monthly_income?: number | null
          phone?: string | null
          risk_tolerance?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          price_monthly: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          price_monthly?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          price_monthly?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
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
