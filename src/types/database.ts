
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "checklist_items": {
                  Row: {
                    "created_at": string,"id": string,"is_standard": boolean,"name": string,"sort_order": number,"standard_key": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_standard"?: boolean,"name": string,"sort_order": number,"standard_key"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_standard"?: boolean,"name"?: string,"sort_order"?: number,"standard_key"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "checklist_items_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"checklist_ticks": {
                  Row: {
                    "created_at": string,"id": string,"item_id": string,"tick_date": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"item_id": string,"tick_date"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"item_id"?: string,"tick_date"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "checklist_ticks_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "checklist_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "checklist_ticks_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"family_tips": {
                  Row: {
                    "id": string,"is_published": boolean,"review_due": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"sort_order": number,"text_en": string,"text_tn": string | null,"text_zu": string | null,"tn_reviewed_at": string | null,"zu_reviewed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_published"?: boolean,"review_due"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sort_order": number,"text_en": string,"text_tn"?: string | null,"text_zu"?: string | null,"tn_reviewed_at"?: string | null,"zu_reviewed_at"?: string | null
                  }
                  Update: {
                    "id"?: string,"is_published"?: boolean,"review_due"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sort_order"?: number,"text_en"?: string,"text_tn"?: string | null,"text_zu"?: string | null,"tn_reviewed_at"?: string | null,"zu_reviewed_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"login_attempts": {
                  Row: {
                    "attempted_at": string,"email": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempted_at"?: string,"email": string,"id"?: string
                  }
                  Update: {
                    "attempted_at"?: string,"email"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"readings": {
                  Row: {
                    "created_at": string,"id": string,"note": string | null,"reading_when": string,"taken_at": string,"updated_at": string,"user_id": string,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"note"?: string | null,"reading_when": string,"taken_at"?: string,"updated_at"?: string,"user_id": string,"value": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"note"?: string | null,"reading_when"?: string,"taken_at"?: string,"updated_at"?: string,"user_id"?: string,"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "readings_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"resources": {
                  Row: {
                    "description_en": string,"description_tn": string | null,"description_zu": string | null,"id": string,"is_published": boolean,"name": string,"review_due": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"sort_order": number,"tn_reviewed_at": string | null,"url": string,"zu_reviewed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "description_en": string,"description_tn"?: string | null,"description_zu"?: string | null,"id"?: string,"is_published"?: boolean,"name": string,"review_due"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sort_order": number,"tn_reviewed_at"?: string | null,"url": string,"zu_reviewed_at"?: string | null
                  }
                  Update: {
                    "description_en"?: string,"description_tn"?: string | null,"description_zu"?: string | null,"id"?: string,"is_published"?: boolean,"name"?: string,"review_due"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sort_order"?: number,"tn_reviewed_at"?: string | null,"url"?: string,"zu_reviewed_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"safety_items": {
                  Row: {
                    "id": string,"is_published": boolean,"review_due": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"section": string,"sort_order": number,"text_en": string,"text_tn": string | null,"text_zu": string | null,"tn_reviewed_at": string | null,"zu_reviewed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_published"?: boolean,"review_due"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"section": string,"sort_order": number,"text_en": string,"text_tn"?: string | null,"text_zu"?: string | null,"tn_reviewed_at"?: string | null,"zu_reviewed_at"?: string | null
                  }
                  Update: {
                    "id"?: string,"is_published"?: boolean,"review_due"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"section"?: string,"sort_order"?: number,"text_en"?: string,"text_tn"?: string | null,"text_zu"?: string | null,"tn_reviewed_at"?: string | null,"zu_reviewed_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"topics": {
                  Row: {
                    "body_en": string,"body_tn": string | null,"body_zu": string | null,"id": string,"is_published": boolean,"reading_minutes": number,"review_due": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"slug": string,"sort_order": number,"summary_en": string,"summary_tn": string | null,"summary_zu": string | null,"title_en": string,"title_tn": string | null,"title_zu": string | null,"tn_reviewed_at": string | null,"updated_at": string,"zu_reviewed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body_en": string,"body_tn"?: string | null,"body_zu"?: string | null,"id"?: string,"is_published"?: boolean,"reading_minutes": number,"review_due"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"slug": string,"sort_order": number,"summary_en": string,"summary_tn"?: string | null,"summary_zu"?: string | null,"title_en": string,"title_tn"?: string | null,"title_zu"?: string | null,"tn_reviewed_at"?: string | null,"updated_at"?: string,"zu_reviewed_at"?: string | null
                  }
                  Update: {
                    "body_en"?: string,"body_tn"?: string | null,"body_zu"?: string | null,"id"?: string,"is_published"?: boolean,"reading_minutes"?: number,"review_due"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"slug"?: string,"sort_order"?: number,"summary_en"?: string,"summary_tn"?: string | null,"summary_zu"?: string | null,"title_en"?: string,"title_tn"?: string | null,"title_zu"?: string | null,"tn_reviewed_at"?: string | null,"updated_at"?: string,"zu_reviewed_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"users": {
                  Row: {
                    "age_confirmed_at": string,"created_at": string,"email": string,"id": string,"language": string,"privacy_agreed_at": string,"privacy_notice_version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "age_confirmed_at"?: string,"created_at"?: string,"email": string,"id": string,"language"?: string,"privacy_agreed_at"?: string,"privacy_notice_version": string
                  }
                  Update: {
                    "age_confirmed_at"?: string,"created_at"?: string,"email"?: string,"id"?: string,"language"?: string,"privacy_agreed_at"?: string,"privacy_notice_version"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "check_login_allowed":
{ Args: { "p_email": string }; Returns: boolean
                           },
"clear_my_login_attempts":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"record_failed_login":
{ Args: { "p_email": string }; Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
