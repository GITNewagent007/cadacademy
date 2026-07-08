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
      article_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      article_category_assignments: {
        Row: {
          article_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          article_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          article_id?: string
          category_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_category_assignments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          content: Json
          created_at: string
          html: string
          id: string
          image_overrides: Json
          slug: string
          source_file_name: string | null
          source_file_path: string | null
          source_kind: string
          source_uploaded_at: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          html?: string
          id?: string
          image_overrides?: Json
          slug: string
          source_file_name?: string | null
          source_file_path?: string | null
          source_kind?: string
          source_uploaded_at?: string | null
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          html?: string
          id?: string
          image_overrides?: Json
          slug?: string
          source_file_name?: string | null
          source_file_path?: string | null
          source_kind?: string
          source_uploaded_at?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_emojis: {
        Row: {
          created_at: string
          id: string
          name: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      guides: {
        Row: {
          button_id: string
          description: string
          id: string
          label: string
          modules: Json
          program_id: string
          updated_at: string
        }
        Insert: {
          button_id: string
          description?: string
          id?: string
          label: string
          modules?: Json
          program_id: string
          updated_at?: string
        }
        Update: {
          button_id?: string
          description?: string
          id?: string
          label?: string
          modules?: Json
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guides_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_problem_progress: {
        Row: {
          completed_at: string
          id: string
          problem_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          problem_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_problem_progress_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_problems: {
        Row: {
          certification: string | null
          collection: string | null
          created_at: string
          drawing_url: string | null
          duration_minutes: number
          features_used: string[]
          id: string
          instructions: Json
          level: string
          model_url: string | null
          name: string
          problem_type: string
          program_slug: string
          slug: string
          sort_order: number
          sponsor: string | null
          summary: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          certification?: string | null
          collection?: string | null
          created_at?: string
          drawing_url?: string | null
          duration_minutes?: number
          features_used?: string[]
          id?: string
          instructions?: Json
          level?: string
          model_url?: string | null
          name: string
          problem_type?: string
          program_slug?: string
          slug: string
          sort_order?: number
          sponsor?: string | null
          summary?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          certification?: string | null
          collection?: string | null
          created_at?: string
          drawing_url?: string | null
          duration_minutes?: number
          features_used?: string[]
          id?: string
          instructions?: Json
          level?: string
          model_url?: string | null
          name?: string
          problem_type?: string
          program_slug?: string
          slug?: string
          sort_order?: number
          sponsor?: string | null
          summary?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      practice_taxonomy: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string
          logo_url: string | null
          program_slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          label: string
          logo_url?: string | null
          program_slug?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string
          logo_url?: string | null
          program_slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          id: string
          layout: Json
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutorial_module_problems: {
        Row: {
          created_at: string
          id: string
          module_id: string
          problem_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          problem_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          problem_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_module_problems_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "tutorial_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_module_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_module_progress: {
        Row: {
          completed_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "tutorial_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_modules: {
        Row: {
          content: Json
          created_at: string
          html: string
          id: string
          image_overrides: Json
          slug: string
          sort_order: number
          source_file_name: string | null
          source_file_path: string | null
          source_kind: string
          source_uploaded_at: string | null
          summary: string
          title: string
          tutorial_id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          html?: string
          id?: string
          image_overrides?: Json
          slug: string
          sort_order?: number
          source_file_name?: string | null
          source_file_path?: string | null
          source_kind?: string
          source_uploaded_at?: string | null
          summary?: string
          title: string
          tutorial_id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          html?: string
          id?: string
          image_overrides?: Json
          slug?: string
          sort_order?: number
          source_file_name?: string | null
          source_file_path?: string | null
          source_kind?: string
          source_uploaded_at?: string | null
          summary?: string
          title?: string
          tutorial_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_modules_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          created_at: string
          id: string
          program_slug: string
          published: boolean
          slug: string
          sort_order: number
          summary: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_slug?: string
          published?: boolean
          slug: string
          sort_order?: number
          summary?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          program_slug?: string
          published?: boolean
          slug?: string
          sort_order?: number
          summary?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
