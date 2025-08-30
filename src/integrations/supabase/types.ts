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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string
          employee_id: string
          id: string
          overtime_in_time: string | null
          overtime_out_time: string | null
          record_date: string
          updated_at: string
          work_log: string | null
        }
        Insert: {
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          employee_id: string
          id?: string
          overtime_in_time?: string | null
          overtime_out_time?: string | null
          record_date?: string
          updated_at?: string
          work_log?: string | null
        }
        Update: {
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          overtime_in_time?: string | null
          overtime_out_time?: string | null
          record_date?: string
          updated_at?: string
          work_log?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      containers: {
        Row: {
          color: string | null
          created_at: string | null
          department: string
          height: number
          id: string
          max_height: number | null
          max_width: number | null
          min_height: number | null
          min_width: number | null
          name: string
          updated_at: string | null
          width: number
          x: number
          y: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          department: string
          height?: number
          id?: string
          max_height?: number | null
          max_width?: number | null
          min_height?: number | null
          min_width?: number | null
          name: string
          updated_at?: string | null
          width?: number
          x: number
          y: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          department?: string
          height?: number
          id?: string
          max_height?: number | null
          max_width?: number | null
          min_height?: number | null
          min_width?: number | null
          name?: string
          updated_at?: string | null
          width?: number
          x?: number
          y?: number
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          extension: string | null
          id: string
          is_active: boolean | null
          name: string
          password_hash: string
          photo: string | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          extension?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          password_hash: string
          photo?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          extension?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string
          photo?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          contact_person: string | null
          created_at: string
          id: string
          ip: string | null
          mac_adds: string | null
          notes: string | null
          photo: string | null
          product: string
          purchase_date: string | null
          sn: string | null
          supplier: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          mac_adds?: string | null
          notes?: string | null
          photo?: string | null
          product: string
          purchase_date?: string | null
          sn?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          mac_adds?: string | null
          notes?: string | null
          photo?: string | null
          product?: string
          purchase_date?: string | null
          sn?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      floor_containers: {
        Row: {
          color: string | null
          created_at: string | null
          floor: string
          height: number
          id: string
          max_height: number | null
          max_width: number | null
          min_height: number | null
          min_width: number | null
          name: string
          updated_at: string | null
          width: number
          x: number
          y: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          floor?: string
          height?: number
          id?: string
          max_height?: number | null
          max_width?: number | null
          min_height?: number | null
          min_width?: number | null
          name: string
          updated_at?: string | null
          width?: number
          x?: number
          y?: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          floor?: string
          height?: number
          id?: string
          max_height?: number | null
          max_width?: number | null
          min_height?: number | null
          min_width?: number | null
          name?: string
          updated_at?: string | null
          width?: number
          x?: number
          y?: number
        }
        Relationships: []
      }
      pc_details: {
        Row: {
          brand: string | null
          case: string | null
          cpu_fan: string | null
          created_at: string | null
          id: string
          mac_add: string | null
          main_board: string | null
          notes: string | null
          os: string | null
          pc_id: string | null
          psu: string | null
          purchase_date: string | null
          serial_number: string | null
          warranty_expiry: string | null
        }
        Insert: {
          brand?: string | null
          case?: string | null
          cpu_fan?: string | null
          created_at?: string | null
          id?: string
          mac_add?: string | null
          main_board?: string | null
          notes?: string | null
          os?: string | null
          pc_id?: string | null
          psu?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          brand?: string | null
          case?: string | null
          cpu_fan?: string | null
          created_at?: string | null
          id?: string
          mac_add?: string | null
          main_board?: string | null
          notes?: string | null
          os?: string | null
          pc_id?: string | null
          psu?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_details_pc_id_fkey"
            columns: ["pc_id"]
            isOneToOne: false
            referencedRelation: "pcs"
            referencedColumns: ["id"]
          },
        ]
      }
      pcs: {
        Row: {
          case_photo: string | null
          cpu: string | null
          created_at: string | null
          graphics: string | null
          id: string
          memory: string | null
          monitor_a: string | null
          monitor_a_photo: string | null
          monitor_b: string | null
          monitor_b_photo: string | null
          name: string
          storage: string | null
        }
        Insert: {
          case_photo?: string | null
          cpu?: string | null
          created_at?: string | null
          graphics?: string | null
          id?: string
          memory?: string | null
          monitor_a?: string | null
          monitor_a_photo?: string | null
          monitor_b?: string | null
          monitor_b_photo?: string | null
          name: string
          storage?: string | null
        }
        Update: {
          case_photo?: string | null
          cpu?: string | null
          created_at?: string | null
          graphics?: string | null
          id?: string
          memory?: string | null
          monitor_a?: string | null
          monitor_a_photo?: string | null
          monitor_b?: string | null
          monitor_b_photo?: string | null
          name?: string
          storage?: string | null
        }
        Relationships: []
      }
      seat_coordinates: {
        Row: {
          container: string
          container_id: string | null
          created_at: string | null
          employee_id: string | null
          equipment_id: string | null
          id: string
          is_empty: boolean | null
          pc_id: string | null
          pixel_x: number | null
          pixel_y: number | null
          seat_template: string
          updated_at: string | null
          x: number
          y: number
        }
        Insert: {
          container: string
          container_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          equipment_id?: string | null
          id: string
          is_empty?: boolean | null
          pc_id?: string | null
          pixel_x?: number | null
          pixel_y?: number | null
          seat_template?: string
          updated_at?: string | null
          x: number
          y: number
        }
        Update: {
          container?: string
          container_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          equipment_id?: string | null
          id?: string
          is_empty?: boolean | null
          pc_id?: string | null
          pixel_x?: number | null
          pixel_y?: number | null
          seat_template?: string
          updated_at?: string | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "seat_coordinates_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_coordinates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seat_coordinates_pc_id_fkey"
            columns: ["pc_id"]
            isOneToOne: false
            referencedRelation: "pcs"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          container_id: string | null
          employee_id: string | null
          floor: string
          id: string
          is_empty: boolean | null
          pc_id: string | null
          pixel_x: number | null
          pixel_y: number | null
          seat_template: string
          x: number
          y: number
        }
        Insert: {
          container_id?: string | null
          employee_id?: string | null
          floor: string
          id: string
          is_empty?: boolean | null
          pc_id?: string | null
          pixel_x?: number | null
          pixel_y?: number | null
          seat_template?: string
          x: number
          y: number
        }
        Update: {
          container_id?: string | null
          employee_id?: string | null
          floor?: string
          id?: string
          is_empty?: boolean | null
          pc_id?: string | null
          pixel_x?: number | null
          pixel_y?: number | null
          seat_template?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "seats_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seats_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seats_pc_id_fkey"
            columns: ["pc_id"]
            isOneToOne: false
            referencedRelation: "pcs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_auth_for_existing_employees: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "employee"
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
      user_role: ["admin", "employee"],
    },
  },
} as const
