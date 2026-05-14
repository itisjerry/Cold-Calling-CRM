export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      lead_history: {
        Row: {
          by_user: string | null
          created_at: string | null
          disposition: string | null
          id: string
          lead_id: string
          meta: Json | null
          note: string | null
          org_id: string
          type: Database["public"]["Enums"]["history_type"]
        }
        Insert: {
          by_user?: string | null
          created_at?: string | null
          disposition?: string | null
          id?: string
          lead_id: string
          meta?: Json | null
          note?: string | null
          org_id: string
          type: Database["public"]["Enums"]["history_type"]
        }
        Update: {
          by_user?: string | null
          created_at?: string | null
          disposition?: string | null
          id?: string
          lead_id?: string
          meta?: Json | null
          note?: string | null
          org_id?: string
          type?: Database["public"]["Enums"]["history_type"]
        }
        Relationships: [
          { foreignKeyName: "lead_history_by_user_fkey"; columns: ["by_user"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "lead_history_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "lead_history_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
        ]
      }
      leads: {
        Row: {
          attempts: number | null
          budget: number | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          decision_maker: boolean | null
          email: string | null
          id: string
          industry: string | null
          last_contact_at: string | null
          name: string
          next_callback_at: string | null
          notes: string | null
          org_id: string
          owner_id: string | null
          phone: string | null
          phone_normalized: string | null
          pipeline: Database["public"]["Enums"]["pipeline_stage"] | null
          score: number | null
          service_interest: string | null
          source: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          tags: string[] | null
          temperature: Database["public"]["Enums"]["lead_temp"] | null
          timezone: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          budget?: number | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          decision_maker?: boolean | null
          email?: string | null
          id?: string
          industry?: string | null
          last_contact_at?: string | null
          name: string
          next_callback_at?: string | null
          notes?: string | null
          org_id: string
          owner_id?: string | null
          phone?: string | null
          phone_normalized?: string | null
          pipeline?: Database["public"]["Enums"]["pipeline_stage"] | null
          score?: number | null
          service_interest?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: string[] | null
          temperature?: Database["public"]["Enums"]["lead_temp"] | null
          timezone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          budget?: number | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          decision_maker?: boolean | null
          email?: string | null
          id?: string
          industry?: string | null
          last_contact_at?: string | null
          name?: string
          next_callback_at?: string | null
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          phone?: string | null
          phone_normalized?: string | null
          pipeline?: Database["public"]["Enums"]["pipeline_stage"] | null
          score?: number | null
          service_interest?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: string[] | null
          temperature?: Database["public"]["Enums"]["lead_temp"] | null
          timezone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "leads_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      org_settings: {
        Row: {
          boost_tue_thu: boolean | null
          call_window_end: number | null
          call_window_start: number | null
          old_days: number | null
          org_id: string
          revival_attempts: number | null
          scoring: Json | null
          updated_at: string | null
        }
        Insert: {
          boost_tue_thu?: boolean | null
          call_window_end?: number | null
          call_window_start?: number | null
          old_days?: number | null
          org_id: string
          revival_attempts?: number | null
          scoring?: Json | null
          updated_at?: string | null
        }
        Update: {
          boost_tue_thu?: boolean | null
          call_window_end?: number | null
          call_window_start?: number | null
          old_days?: number | null
          org_id?: string
          revival_attempts?: number | null
          scoring?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "org_settings_org_id_fkey"; columns: ["org_id"]; isOneToOne: true; referencedRelation: "orgs"; referencedColumns: ["id"] },
        ]
      }
      orgs: {
        Row: { created_at: string | null; id: string; name: string; plan: string | null; settings: Json | null }
        Insert: { created_at?: string | null; id?: string; name: string; plan?: string | null; settings?: Json | null }
        Update: { created_at?: string | null; id?: string; name?: string; plan?: string | null; settings?: Json | null }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          org_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          { foreignKeyName: "profiles_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          name: string
          notes: string | null
          org_id: string
          owner_id: string | null
          stage: Database["public"]["Enums"]["project_stage"] | null
          start_date: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          name: string
          notes?: string | null
          org_id: string
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["project_stage"] | null
          start_date?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["project_stage"] | null
          start_date?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          { foreignKeyName: "projects_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "projects_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
          { foreignKeyName: "projects_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      reminders: {
        Row: {
          created_at: string | null
          done: boolean | null
          fires_at: string
          id: string
          lead_id: string | null
          message: string
          org_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          done?: boolean | null
          fires_at: string
          id?: string
          lead_id?: string | null
          message: string
          org_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          done?: boolean | null
          fires_at?: string
          id?: string
          lead_id?: string | null
          message?: string
          org_id?: string
          user_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "reminders_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "reminders_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
          { foreignKeyName: "reminders_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          done: boolean | null
          due_at: string | null
          id: string
          lead_id: string | null
          org_id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          org_id: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          done?: boolean | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          org_id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "tasks_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "orgs"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_org_id: { Args: Record<string, never>; Returns: string }
      current_user_role: { Args: Record<string, never>; Returns: Database["public"]["Enums"]["user_role"] }
    }
    Enums: {
      history_type: "call" | "note" | "status" | "stage" | "import"
      lead_status: "New" | "Attempting" | "Connected" | "In Discussion" | "Follow-up" | "Qualified" | "Not Interested" | "Dead"
      lead_temp: "Hot" | "Warm" | "Cold"
      pipeline_stage: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost"
      project_stage: "Discovery" | "Proposal" | "Contract" | "Kickoff" | "Active" | "Delivered" | "On Hold"
      task_priority: "low" | "medium" | "high" | "urgent"
      user_role: "admin" | "manager" | "caller"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
