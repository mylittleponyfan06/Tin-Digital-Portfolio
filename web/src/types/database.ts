export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      imposter_topics: TableDefinition<
        {
          category: string;
          created_at: string;
          id: string;
          is_active: boolean;
          prompt: string;
        },
        {
          category?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          prompt: string;
        },
        {
          category?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          prompt?: string;
        }
      >;
      leaderboard_entries: TableDefinition<
        {
          crew_wins: number;
          display_name: string;
          game_slug: "imposter";
          id: string;
          imposter_wins: number;
          rounds_played: number;
          updated_at: string;
          user_id: string;
          wins: number;
        },
        {
          crew_wins?: number;
          display_name: string;
          game_slug?: "imposter";
          id?: string;
          imposter_wins?: number;
          rounds_played?: number;
          updated_at?: string;
          user_id: string;
          wins?: number;
        },
        {
          crew_wins?: number;
          display_name?: string;
          game_slug?: "imposter";
          id?: string;
          imposter_wins?: number;
          rounds_played?: number;
          updated_at?: string;
          user_id?: string;
          wins?: number;
        }
      >;
      player_prompts: TableDefinition<
        {
          created_at: string;
          id: string;
          is_imposter: boolean;
          prompt: string;
          room_player_id: string;
          round_id: string;
          submitted_at: string | null;
          submitted_clue: string | null;
        },
        {
          created_at?: string;
          id?: string;
          is_imposter?: boolean;
          prompt: string;
          room_player_id: string;
          round_id: string;
          submitted_at?: string | null;
          submitted_clue?: string | null;
        },
        {
          created_at?: string;
          id?: string;
          is_imposter?: boolean;
          prompt?: string;
          room_player_id?: string;
          round_id?: string;
          submitted_at?: string | null;
          submitted_clue?: string | null;
        }
      >;
      profiles: TableDefinition<
        {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
          username: string | null;
        },
        {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
          username?: string | null;
        },
        {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          username?: string | null;
        }
      >;
      room_players: TableDefinition<
        {
          display_name: string;
          has_left: boolean;
          id: string;
          is_host: boolean;
          is_ready: boolean;
          joined_at: string;
          room_id: string;
          score: number;
          updated_at: string;
          user_id: string;
        },
        {
          display_name: string;
          has_left?: boolean;
          id?: string;
          is_host?: boolean;
          is_ready?: boolean;
          joined_at?: string;
          room_id: string;
          score?: number;
          updated_at?: string;
          user_id: string;
        },
        {
          display_name?: string;
          has_left?: boolean;
          id?: string;
          is_host?: boolean;
          is_ready?: boolean;
          joined_at?: string;
          room_id?: string;
          score?: number;
          updated_at?: string;
          user_id?: string;
        }
      >;
      rooms: TableDefinition<
        {
          code: string;
          created_at: string;
          game_slug: "imposter";
          host_user_id: string;
          id: string;
          status: "lobby" | "collecting_clues" | "voting" | "results" | "closed";
          updated_at: string;
        },
        {
          code: string;
          created_at?: string;
          game_slug?: "imposter";
          host_user_id: string;
          id?: string;
          status?: "lobby" | "collecting_clues" | "voting" | "results" | "closed";
          updated_at?: string;
        },
        {
          code?: string;
          created_at?: string;
          game_slug?: "imposter";
          host_user_id?: string;
          id?: string;
          status?: "lobby" | "collecting_clues" | "voting" | "results" | "closed";
          updated_at?: string;
        }
      >;
      rounds: TableDefinition<
        {
          ended_at: string | null;
          id: string;
          imposter_room_player_id: string;
          results: Json;
          room_id: string;
          round_number: number;
          started_at: string;
          status: "collecting_clues" | "voting" | "results" | "completed";
          topic: string;
          winner: "crew" | "imposter" | "draw" | null;
        },
        {
          ended_at?: string | null;
          id?: string;
          imposter_room_player_id: string;
          results?: Json;
          room_id: string;
          round_number: number;
          started_at?: string;
          status?: "collecting_clues" | "voting" | "results" | "completed";
          topic: string;
          winner?: "crew" | "imposter" | "draw" | null;
        },
        {
          ended_at?: string | null;
          id?: string;
          imposter_room_player_id?: string;
          results?: Json;
          room_id?: string;
          round_number?: number;
          started_at?: string;
          status?: "collecting_clues" | "voting" | "results" | "completed";
          topic?: string;
          winner?: "crew" | "imposter" | "draw" | null;
        }
      >;
      votes: TableDefinition<
        {
          created_at: string;
          id: string;
          round_id: string;
          target_room_player_id: string;
          voter_room_player_id: string;
        },
        {
          created_at?: string;
          id?: string;
          round_id: string;
          target_room_player_id: string;
          voter_room_player_id: string;
        },
        {
          created_at?: string;
          id?: string;
          round_id?: string;
          target_room_player_id?: string;
          voter_room_player_id?: string;
        }
      >;
    };
    Views: Record<never, never>;
    Functions: {
      cast_imposter_vote: {
        Args: {
          p_room_code: string;
          p_target_room_player_id: string;
        };
        Returns: Json;
      };
      create_imposter_room: {
        Args: {
          p_display_name?: string | null;
        };
        Returns: {
          room_code: string;
          room_id: string;
        }[];
      };
      get_imposter_room_snapshot: {
        Args: {
          p_room_code: string;
        };
        Returns: Json;
      };
      join_imposter_room: {
        Args: {
          p_display_name?: string | null;
          p_room_code: string;
        };
        Returns: {
          room_code: string;
          room_id: string;
        }[];
      };
      leave_imposter_room: {
        Args: {
          p_room_code: string;
        };
        Returns: boolean;
      };
      set_imposter_ready: {
        Args: {
          p_ready: boolean;
          p_room_code: string;
        };
        Returns: boolean;
      };
      start_imposter_round: {
        Args: {
          p_room_code: string;
        };
        Returns: string;
      };
      submit_imposter_clue: {
        Args: {
          p_clue: string;
          p_room_code: string;
        };
        Returns: string;
      };
    };
    Enums: {
      game_slug: "imposter";
      room_status: "lobby" | "collecting_clues" | "voting" | "results" | "closed";
      round_status: "collecting_clues" | "voting" | "results" | "completed";
      round_winner: "crew" | "imposter" | "draw";
    };
    CompositeTypes: Record<never, never>;
  };
};

export type PublicSchema = Database["public"];
export type TableName = keyof PublicSchema["Tables"];
export type TableRow<T extends TableName> = PublicSchema["Tables"][T]["Row"];
