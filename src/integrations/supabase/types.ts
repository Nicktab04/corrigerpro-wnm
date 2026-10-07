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
      app_settings: {
        Row: {
          id: number
          subscription_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          id?: number
          subscription_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          id?: number
          subscription_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      document_unlocks: {
        Row: {
          created_at: string
          document_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_unlocks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          is_free: boolean
          kind: Database["public"]["Enums"]["doc_kind"]
          level: number
          major: Database["public"]["Enums"]["major"]
          price: number | null
          resume_id: string | null
          storage_path: string
          subject: string
          td_id: string | null
          title: string
          uploaded_by: string | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_free?: boolean
          kind: Database["public"]["Enums"]["doc_kind"]
          level: number
          major: Database["public"]["Enums"]["major"]
          price?: number | null
          resume_id?: string | null
          storage_path: string
          subject: string
          td_id?: string | null
          title: string
          uploaded_by?: string | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_free?: boolean
          kind?: Database["public"]["Enums"]["doc_kind"]
          level?: number
          major?: Database["public"]["Enums"]["major"]
          price?: number | null
          resume_id?: string | null
          storage_path?: string
          subject?: string
          td_id?: string | null
          title?: string
          uploaded_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_td_id_fkey"
            columns: ["td_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          created_at: string
          document_id: string | null
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          screenshot_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_seen: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          document_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_seen?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          document_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_seen?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          gmail: string
          id: string
          level: number
          major: Database["public"]["Enums"]["major"]
          nom: string
          plan: Database["public"]["Enums"]["access_plan"]
          prenom: string
          status: Database["public"]["Enums"]["access_status"]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          gmail: string
          id: string
          level: number
          major: Database["public"]["Enums"]["major"]
          nom: string
          plan?: Database["public"]["Enums"]["access_plan"]
          prenom: string
          status?: Database["public"]["Enums"]["access_status"]
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          gmail?: string
          id?: string
          level?: number
          major?: Database["public"]["Enums"]["major"]
          nom?: string
          plan?: Database["public"]["Enums"]["access_plan"]
          prenom?: string
          status?: Database["public"]["Enums"]["access_status"]
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
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
      can_access_file: {
        Args: { _path: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      mark_payment_seen: { Args: { _id: string }; Returns: undefined }
      review_payment: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      submit_payment_proof: {
        Args: { _id: string; _path: string }
        Returns: undefined
      }
    }
    Enums: {
      access_plan: "free" | "paid"
      access_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "uploader"
      doc_kind: "exam" | "correction" | "cours" | "td" | "resume"
      major: "SEG" | "PC" | "AGRO"
      payment_kind: "document" | "subscription"
      payment_status: "awaiting_proof" | "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      access_plan: ["free", "paid"],
      access_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "uploader"],
      doc_kind: ["exam", "correction", "cours", "td", "resume"],
      major: ["SEG", "PC", "AGRO"],
      payment_kind: ["document", "subscription"],
      payment_status: ["awaiting_proof", "pending", "approved", "rejected"],
    },
  },
} as const
