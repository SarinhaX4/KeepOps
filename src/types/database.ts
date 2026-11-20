// Hand-written in the `supabase gen types typescript` format.
// Mirrors supabase/migrations. Regenerate with the Supabase CLI if the schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          team_id: string;
          full_name: string;
          role: Database['public']['Enums']['user_role'];
          avatar_color: string;
          created_at: string;
        };
        Insert: {
          id: string;
          team_id: string;
          full_name: string;
          role: Database['public']['Enums']['user_role'];
          avatar_color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          full_name?: string;
          role?: Database['public']['Enums']['user_role'];
          avatar_color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      applications: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          short_name: string;
          description: string | null;
          criticality: Database['public']['Enums']['app_criticality'];
          health_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          short_name: string;
          description?: string | null;
          criticality?: Database['public']['Enums']['app_criticality'];
          health_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          short_name?: string;
          description?: string | null;
          criticality?: Database['public']['Enums']['app_criticality'];
          health_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'applications_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      validation_steps: {
        Row: {
          id: string;
          application_id: string;
          position: number;
          title: string;
          kind: Database['public']['Enums']['step_kind'];
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          position: number;
          title: string;
          kind?: Database['public']['Enums']['step_kind'];
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          position?: number;
          title?: string;
          kind?: Database['public']['Enums']['step_kind'];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'validation_steps_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
        ];
      };
      changes: {
        Row: {
          id: string;
          team_id: string;
          change_number: string;
          title: string;
          description: string | null;
          window_start: string;
          window_end: string;
          executor_team: string | null;
          executor_contact: string | null;
          status: Database['public']['Enums']['change_status'];
          conclusion_note: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          change_number: string;
          title: string;
          description?: string | null;
          window_start: string;
          window_end: string;
          executor_team?: string | null;
          executor_contact?: string | null;
          status?: Database['public']['Enums']['change_status'];
          conclusion_note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          change_number?: string;
          title?: string;
          description?: string | null;
          window_start?: string;
          window_end?: string;
          executor_team?: string | null;
          executor_contact?: string | null;
          status?: Database['public']['Enums']['change_status'];
          conclusion_note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'changes_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'changes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      change_events: {
        Row: {
          id: string;
          change_id: string;
          from_status: Database['public']['Enums']['change_status'] | null;
          to_status: Database['public']['Enums']['change_status'];
          note: string | null;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          change_id: string;
          from_status?: Database['public']['Enums']['change_status'] | null;
          to_status: Database['public']['Enums']['change_status'];
          note?: string | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          change_id?: string;
          from_status?: Database['public']['Enums']['change_status'] | null;
          to_status?: Database['public']['Enums']['change_status'];
          note?: string | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'change_events_change_id_fkey';
            columns: ['change_id'];
            isOneToOne: false;
            referencedRelation: 'changes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'change_events_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      change_applications: {
        Row: {
          change_id: string;
          application_id: string;
        };
        Insert: {
          change_id: string;
          application_id: string;
        };
        Update: {
          change_id?: string;
          application_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'change_applications_change_id_fkey';
            columns: ['change_id'];
            isOneToOne: false;
            referencedRelation: 'changes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'change_applications_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
        ];
      };
      validations: {
        Row: {
          id: string;
          change_id: string;
          application_id: string;
          step_id: string | null;
          step_title: string;
          position: number;
          result: Database['public']['Enums']['validation_result'];
          note: string | null;
          evidence_path: string | null;
          performed_by: string | null;
          performed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          change_id: string;
          application_id: string;
          step_id?: string | null;
          step_title: string;
          position?: number;
          result?: Database['public']['Enums']['validation_result'];
          note?: string | null;
          evidence_path?: string | null;
          performed_by?: string | null;
          performed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          change_id?: string;
          application_id?: string;
          step_id?: string | null;
          step_title?: string;
          position?: number;
          result?: Database['public']['Enums']['validation_result'];
          note?: string | null;
          evidence_path?: string | null;
          performed_by?: string | null;
          performed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'validations_change_id_fkey';
            columns: ['change_id'];
            isOneToOne: false;
            referencedRelation: 'changes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'validations_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'validations_step_id_fkey';
            columns: ['step_id'];
            isOneToOne: false;
            referencedRelation: 'validation_steps';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'validations_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      health_checks: {
        Row: {
          id: string;
          application_id: string;
          change_id: string | null;
          phase: Database['public']['Enums']['health_phase'];
          http_status: number | null;
          latency_ms: number | null;
          ok: boolean;
          error_message: string | null;
          checked_by: string | null;
          checked_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          change_id?: string | null;
          phase: Database['public']['Enums']['health_phase'];
          http_status?: number | null;
          latency_ms?: number | null;
          ok: boolean;
          error_message?: string | null;
          checked_by?: string | null;
          checked_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          change_id?: string | null;
          phase?: Database['public']['Enums']['health_phase'];
          http_status?: number | null;
          latency_ms?: number | null;
          ok?: boolean;
          error_message?: string | null;
          checked_by?: string | null;
          checked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'health_checks_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'health_checks_change_id_fkey';
            columns: ['change_id'];
            isOneToOne: false;
            referencedRelation: 'changes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'health_checks_checked_by_fkey';
            columns: ['checked_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      incidents: {
        Row: {
          id: string;
          team_id: string;
          change_id: string | null;
          application_id: string | null;
          validation_id: string | null;
          title: string;
          severity: Database['public']['Enums']['incident_severity'];
          status: Database['public']['Enums']['incident_status'];
          external_ticket: string | null;
          opened_by: string | null;
          opened_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          change_id?: string | null;
          application_id?: string | null;
          validation_id?: string | null;
          title: string;
          severity: Database['public']['Enums']['incident_severity'];
          status?: Database['public']['Enums']['incident_status'];
          external_ticket?: string | null;
          opened_by?: string | null;
          opened_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          change_id?: string | null;
          application_id?: string | null;
          validation_id?: string | null;
          title?: string;
          severity?: Database['public']['Enums']['incident_severity'];
          status?: Database['public']['Enums']['incident_status'];
          external_ticket?: string | null;
          opened_by?: string | null;
          opened_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'incidents_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_change_id_fkey';
            columns: ['change_id'];
            isOneToOne: false;
            referencedRelation: 'changes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_validation_id_fkey';
            columns: ['validation_id'];
            isOneToOne: false;
            referencedRelation: 'validations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incidents_opened_by_fkey';
            columns: ['opened_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      incident_events: {
        Row: {
          id: string;
          incident_id: string;
          kind: Database['public']['Enums']['incident_event_kind'];
          description: string;
          channel: string | null;
          contact: string | null;
          responded_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          kind: Database['public']['Enums']['incident_event_kind'];
          description: string;
          channel?: string | null;
          contact?: string | null;
          responded_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          kind?: Database['public']['Enums']['incident_event_kind'];
          description?: string;
          channel?: string | null;
          contact?: string | null;
          responded_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'incident_events_incident_id_fkey';
            columns: ['incident_id'];
            isOneToOne: false;
            referencedRelation: 'incidents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'incident_events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      shifts: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          kind: Database['public']['Enums']['shift_kind'];
          status: Database['public']['Enums']['shift_status'];
          notes: string | null;
          next_steps: string | null;
          handover_snapshot: Json | null;
          received_by: string | null;
          received_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          started_at?: string;
          ended_at?: string | null;
          kind: Database['public']['Enums']['shift_kind'];
          status?: Database['public']['Enums']['shift_status'];
          notes?: string | null;
          next_steps?: string | null;
          handover_snapshot?: Json | null;
          received_by?: string | null;
          received_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string | null;
          kind?: Database['public']['Enums']['shift_kind'];
          status?: Database['public']['Enums']['shift_status'];
          notes?: string | null;
          next_steps?: string | null;
          handover_snapshot?: Json | null;
          received_by?: string | null;
          received_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shifts_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shifts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shifts_received_by_fkey';
            columns: ['received_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      follow_ups: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          description: string | null;
          source_type: Database['public']['Enums']['follow_up_source'];
          source_id: string | null;
          application_id: string | null;
          created_in_shift_id: string | null;
          status: Database['public']['Enums']['follow_up_status'];
          assigned_to: string | null;
          assigned_at: string | null;
          resolution_note: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          description?: string | null;
          source_type?: Database['public']['Enums']['follow_up_source'];
          source_id?: string | null;
          application_id?: string | null;
          created_in_shift_id?: string | null;
          status?: Database['public']['Enums']['follow_up_status'];
          assigned_to?: string | null;
          assigned_at?: string | null;
          resolution_note?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          description?: string | null;
          source_type?: Database['public']['Enums']['follow_up_source'];
          source_id?: string | null;
          application_id?: string | null;
          created_in_shift_id?: string | null;
          status?: Database['public']['Enums']['follow_up_status'];
          assigned_to?: string | null;
          assigned_at?: string | null;
          resolution_note?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follow_ups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follow_ups_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follow_ups_created_in_shift_id_fkey';
            columns: ['created_in_shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follow_ups_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follow_ups_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follow_ups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      current_team_id: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: {
      user_role: 'plantonista' | 'analista';
      app_criticality: 'alta' | 'media' | 'baixa';
      step_kind: 'manual' | 'http_check';
      change_status:
        | 'agendada'
        | 'aguardando_liberacao'
        | 'em_validacao'
        | 'validada'
        | 'validada_com_ressalvas'
        | 'reprovada'
        | 'cancelada';
      validation_result: 'pendente' | 'aprovado' | 'reprovado' | 'na';
      health_phase: 'baseline' | 'pos' | 'avulso';
      incident_severity: 'sev1' | 'sev2' | 'sev3' | 'sev4';
      incident_status: 'aberta' | 'em_acompanhamento' | 'resolvida';
      incident_event_kind: 'nota' | 'acionamento' | 'atualizacao' | 'resolucao';
      shift_kind: 'noturno' | 'diurno' | 'fim_de_semana';
      shift_status: 'aberto' | 'encerrado' | 'recebido';
      follow_up_source: 'change' | 'incident' | 'validation' | 'manual';
      follow_up_status: 'aberta' | 'em_andamento' | 'concluida';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
