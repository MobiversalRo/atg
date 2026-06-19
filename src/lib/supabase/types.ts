export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string | null
          at: string
          diff: Json | null
          entity: string
          entity_id: string
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          at?: string
          diff?: Json | null
          entity: string
          entity_id: string
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          color: string
          id: string
          name: string
          name_en: string
        }
        Insert: {
          color?: string
          id?: string
          name: string
          name_en: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          name_en?: string
        }
        Relationships: []
      }
      document_types: {
        Row: {
          code: string
          id: string
          name: string
          name_en: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          name_en: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      land_categories: {
        Row: {
          code: string
          id: string
          name: string
          name_en: string
        }
        Insert: {
          code: string
          id?: string
          name: string
          name_en: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
          name_en?: string
        }
        Relationships: []
      }
      leases: {
        Row: {
          amount: number | null
          contract_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          owner_id_code: string | null
          owner_name: string
          parcel_id: string | null
          payment_method: Database["public"]["Enums"]["lease_payment_method"]
          payment_status: Database["public"]["Enums"]["lease_payment_status"]
          start_date: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          contract_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          owner_id_code?: string | null
          owner_name: string
          parcel_id?: string | null
          payment_method?: Database["public"]["Enums"]["lease_payment_method"]
          payment_status?: Database["public"]["Enums"]["lease_payment_status"]
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          contract_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          owner_id_code?: string | null
          owner_name?: string
          parcel_id?: string | null
          payment_method?: Database["public"]["Enums"]["lease_payment_method"]
          payment_status?: Database["public"]["Enums"]["lease_payment_status"]
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      parcel_crop_history: {
        Row: {
          crop_id: string
          id: string
          parcel_id: string
          season_year: number
        }
        Insert: {
          crop_id: string
          id?: string
          parcel_id: string
          season_year: number
        }
        Update: {
          crop_id?: string
          id?: string
          parcel_id?: string
          season_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcel_crop_history_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcel_crop_history_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      parcels: {
        Row: {
          area_ha: number
          created_at: string
          current_crop_id: string | null
          id: string
          notes: string | null
          property_id: string | null
          topo_code: string
          updated_at: string
        }
        Insert: {
          area_ha?: number
          created_at?: string
          current_crop_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          topo_code: string
          updated_at?: string
        }
        Update: {
          area_ha?: number
          created_at?: string
          current_crop_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          topo_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcels_current_crop_id_fkey"
            columns: ["current_crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      properties: {
        Row: {
          accounting_value: number
          area_unit: Database["public"]["Enums"]["area_unit"]
          area_value: number
          created_at: string
          currency: Database["public"]["Enums"]["currency"]
          energy_class: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["property_status"]
          thermal_insulation: boolean | null
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
          year_built: number | null
        }
        Insert: {
          accounting_value?: number
          area_unit?: Database["public"]["Enums"]["area_unit"]
          area_value?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          energy_class?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["property_status"]
          thermal_insulation?: boolean | null
          type: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          accounting_value?: number
          area_unit?: Database["public"]["Enums"]["area_unit"]
          area_value?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency"]
          energy_class?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["property_status"]
          thermal_insulation?: boolean | null
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          year_built?: number | null
        }
        Relationships: []
      }
      stock_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          crop_id: string
          facility_id: string
          id: string
          quantity_ton: number
          txn_date: string
          txn_type: Database["public"]["Enums"]["stock_txn_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crop_id: string
          facility_id: string
          id?: string
          quantity_ton: number
          txn_date?: string
          txn_type: Database["public"]["Enums"]["stock_txn_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crop_id?: string
          facility_id?: string
          id?: string
          quantity_ton?: number
          txn_date?: string
          txn_type?: Database["public"]["Enums"]["stock_txn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "storage_facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_facilities: {
        Row: {
          created_at: string
          current_load_ton: number
          id: string
          max_capacity_ton: number
          name: string
          property_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_load_ton?: number
          id?: string
          max_capacity_ton?: number
          name: string
          property_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_load_ton?: number
          id?: string
          max_capacity_ton?: number
          name?: string
          property_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_facilities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      yard_trucks: {
        Row: {
          arrived_at: string | null
          cargo_crop_id: string | null
          created_at: string
          direction: Database["public"]["Enums"]["yard_direction"]
          driver: string | null
          exited_at: string | null
          facility_id: string | null
          gross_weight: number | null
          id: string
          net_weight: number | null
          plate_number: string
          status: Database["public"]["Enums"]["yard_status"]
          tare_weight: number | null
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          cargo_crop_id?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["yard_direction"]
          driver?: string | null
          exited_at?: string | null
          facility_id?: string | null
          gross_weight?: number | null
          id?: string
          net_weight?: number | null
          plate_number: string
          status?: Database["public"]["Enums"]["yard_status"]
          tare_weight?: number | null
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          cargo_crop_id?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["yard_direction"]
          driver?: string | null
          exited_at?: string | null
          facility_id?: string | null
          gross_weight?: number | null
          id?: string
          net_weight?: number | null
          plate_number?: string
          status?: Database["public"]["Enums"]["yard_status"]
          tare_weight?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yard_trucks_cargo_crop_id_fkey"
            columns: ["cargo_crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yard_trucks_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "storage_facilities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      area_unit: "sqm" | "hectare"
      currency: "RON" | "EUR"
      lease_payment_method: "cash" | "in_kind"
      lease_payment_status: "paid" | "unpaid"
      property_status: "rented" | "vacant" | "conservation" | "own_use"
      property_type:
        | "residential"
        | "industrial_hall"
        | "agricultural_land"
        | "silo_storage"
      stock_txn_type: "in" | "out"
      user_role: "admin" | "manager" | "operator"
      yard_direction: "inbound" | "outbound"
      yard_status: "gate" | "scale" | "dock" | "exited"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      area_unit: ["sqm", "hectare"],
      currency: ["RON", "EUR"],
      lease_payment_method: ["cash", "in_kind"],
      lease_payment_status: ["paid", "unpaid"],
      property_status: ["rented", "vacant", "conservation", "own_use"],
      property_type: [
        "residential",
        "industrial_hall",
        "agricultural_land",
        "silo_storage",
      ],
      stock_txn_type: ["in", "out"],
      user_role: ["admin", "manager", "operator"],
      yard_direction: ["inbound", "outbound"],
      yard_status: ["gate", "scale", "dock", "exited"],
    },
  },
} as const

