package main

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

type Config struct {
	Addr         string
	DBPath       string
	FrontendDir  string
}

type Server struct {
	db *sql.DB
}

type UserRecord struct {
	ID              int64  `json:"-"`
	UID             string `json:"uid"`
	RegisteredAtUTC string `json:"registeredAtUtc"`
	Revision        int64  `json:"revision"`
}

type StateResponse struct {
	Revision int64           `json:"revision"`
	State    AppStatePayload `json:"state"`
	User     UserRecord      `json:"user"`
}

type SaveStateRequest struct {
	BaseRevision int64           `json:"baseRevision"`
	State        AppStatePayload `json:"state"`
}

type CreateUserRequest struct {
	State AppStatePayload `json:"state"`
}

type CreateUserResponse struct {
	APIKey   string     `json:"apiKey"`
	Revision int64      `json:"revision"`
	User     UserRecord `json:"user"`
}

type AppStatePayload struct {
	Attempts []ExerciseAttemptPayload `json:"attempts"`
	Cards    []LanguageCardPayload    `json:"cards"`
	CardSets []CardSetPayload         `json:"cardSets"`
	Settings SettingsPayload          `json:"settings"`
	Stats    []CardStatsPayload       `json:"stats"`
}

type SettingsPayload struct {
	ComplementaryLanguages map[string][]string     `json:"complementaryLanguages,omitempty"`
	InterfaceLanguage      string                  `json:"interfaceLanguage"`
	PlayerProfile          *PlayerProfilePayload   `json:"playerProfile,omitempty"`
	PracticeSettings       PracticeSettingsPayload `json:"practiceSettings"`
	SelectedCardSetID      string                  `json:"selectedCardSetId,omitempty"`
	TargetLanguage         string                  `json:"targetLanguage"`
}

type PlayerProfilePayload struct {
	DisplayName string `json:"displayName,omitempty"`
	IsAnonymous bool   `json:"isAnonymous"`
}

type PracticeSettingsPayload struct {
	CorrectStreakCooldownMonths         map[string]float64 `json:"correctStreakCooldownMonths"`
	NewCardMixFrequencyPercent          int                `json:"newCardMixFrequencyPercent"`
	RecentMistakeRepeatFrequencyPercent int                `json:"recentMistakeRepeatFrequencyPercent"`
}

type LanguageExamplePayload struct {
	Answer   string `json:"answer"`
	Sentence string `json:"sentence"`
}

type LanguageCardPayload struct {
	CreatedAt            string                              `json:"createdAt"`
	Definitions          map[string]string                   `json:"definitions,omitempty"`
	Difficulty           string                              `json:"difficulty,omitempty"`
	Examples             map[string][]LanguageExamplePayload `json:"examples,omitempty"`
	ID                   string                              `json:"id"`
	KnownTargetLanguages []string                            `json:"knownTargetLanguages,omitempty"`
	Tags                 []string                            `json:"tags,omitempty"`
	Translations         map[string]string                   `json:"translations"`
	UpdatedAt            string                              `json:"updatedAt"`
}

type CardSetPayload struct {
	ArchivedAt string            `json:"archivedAt,omitempty"`
	CardIDs    []string          `json:"cardIds"`
	CreatedAt  string            `json:"createdAt"`
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Names      map[string]string `json:"names,omitempty"`
	UpdatedAt  string            `json:"updatedAt"`
}

type CardSnapshotPayload struct {
	Definitions  map[string]string `json:"definitions,omitempty"`
	Difficulty   string            `json:"difficulty,omitempty"`
	ID           string            `json:"id"`
	Tags         []string          `json:"tags,omitempty"`
	Translations map[string]string `json:"translations"`
}

type TranslationHintPayload struct {
	Language string `json:"language"`
	Value    string `json:"value"`
}

type ExercisePromptPayload struct {
	CardID           string                   `json:"cardId"`
	DefinitionHint   string                   `json:"definitionHint,omitempty"`
	ExpectedAnswer   string                   `json:"expectedAnswer"`
	Prompt           string                   `json:"prompt"`
	TranslationHints []TranslationHintPayload `json:"translationHints"`
}

type ExerciseAttemptPayload struct {
	Answers             map[string]string       `json:"answers"`
	CardSetID           string                  `json:"cardSetId"`
	CardSnapshots       []CardSnapshotPayload   `json:"cardSnapshots"`
	CoachComment        string                  `json:"coachComment,omitempty"`
	CompletedAt         string                  `json:"completedAt,omitempty"`
	Correctness         map[string]bool         `json:"correctness"`
	CreatedAt           string                  `json:"createdAt"`
	CrosswordSnapshot   json.RawMessage         `json:"crosswordSnapshot,omitempty"`
	ExerciseSessionID   string                  `json:"exerciseSessionId,omitempty"`
	ExerciseType        string                  `json:"exerciseType"`
	HintsUsed           map[string]int          `json:"hintsUsed"`
	ID                  string                  `json:"id"`
	IsExerciseCompleted *bool                   `json:"isExerciseCompleted,omitempty"`
	Prompts             []ExercisePromptPayload `json:"prompts"`
	TargetLanguage      string                  `json:"targetLanguage"`
	WeightedScore       *float64                `json:"weightedScore,omitempty"`
}

type ChatMessagePayload struct {
	ID        string `json:"id"`
	Role      string `json:"role"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
}

type ChatMessagesResponse struct {
	Messages []ChatMessagePayload `json:"messages"`
}

type SaveChatMessagesRequest struct {
	Messages []ChatMessagePayload `json:"messages"`
}

type CardStatsPayload struct {
	Accuracy        float64 `json:"accuracy"`
	Attempts        int     `json:"attempts"`
	CardID          string  `json:"cardId"`
	Correct         int     `json:"correct"`
	HintsUsed       int     `json:"hintsUsed"`
	Incorrect       int     `json:"incorrect"`
	LastPracticedAt string  `json:"lastPracticedAt"`
	RecentMistakes  int     `json:"recentMistakes"`
	Stability       string  `json:"stability"`
	TargetLanguage  string  `json:"targetLanguage"`
}

var defaultState = AppStatePayload{
	Attempts: []ExerciseAttemptPayload{},
	Cards:    []LanguageCardPayload{},
	CardSets: []CardSetPayload{},
	Settings: SettingsPayload{
		ComplementaryLanguages: map[string][]string{
			"en": {"ru", "es", "uk"},
			"es": {"ru", "en", "uk"},
			"ru": {"en", "es", "uk"},
			"uk": {"ru", "en", "es"},
		},
		InterfaceLanguage: "en",
		PracticeSettings: PracticeSettingsPayload{
			CorrectStreakCooldownMonths: map[string]float64{
				"three":    0.5,
				"four":     1,
				"fivePlus": 2,
			},
			NewCardMixFrequencyPercent:          25,
			RecentMistakeRepeatFrequencyPercent: 25,
		},
		TargetLanguage: "en",
	},
	Stats: []CardStatsPayload{},
}

func NewHandler(config Config) (http.Handler, error) {
	dbPath := config.DBPath
	if dbPath == "" {
		dbPath = filepath.Join("data", "language-lab.sqlite")
	}
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		db.Close()
		return nil, fmt.Errorf("enable sqlite foreign keys: %w", err)
	}

	server := &Server{db: db}
	if err := server.migrate(); err != nil {
		db.Close()
		return nil, err
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", server.handleHealth)
	mux.HandleFunc("/api/state", server.handleState)
	mux.HandleFunc("/api/users", server.handleUsers)
	mux.HandleFunc("/api/chat", server.handleChat)

	if frontendDir := config.FrontendDir; frontendDir != "" {
		mux.Handle("/", frontendFileServer(frontendDir))
	}

	return server.withCORS(mux), nil
}

func main() {
	config := Config{
		Addr:        getenv("LANG_LAB_ADDR", "127.0.0.1:8090"),
		DBPath:      getenv("LANG_LAB_DB_PATH", filepath.Join("data", "language-lab.sqlite")),
		FrontendDir: getenv("LANG_LAB_FRONTEND_DIR", ""),
	}
	handler, err := NewHandler(config)
	if err != nil {
		log.Fatalf("create server: %v", err)
	}
	log.Printf("Language Lab backend listening on http://%s", config.Addr)
	if err := http.ListenAndServe(config.Addr, handler); err != nil {
		log.Fatalf("serve: %v", err)
	}
}

// frontendFileServer serves the built frontend SPA.
// For any non-file request, it falls back to index.html for client-side routing.
func frontendFileServer(frontendDir string) http.Handler {
	fs := http.FileServer(http.Dir(frontendDir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(frontendDir, r.URL.Path)
		if _, err := os.Stat(path); err == nil {
			fs.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(frontendDir, "index.html"))
	})
}

func (server *Server) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("Access-Control-Allow-Origin", "*")
		response.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-API-Key")
		response.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
		if request.Method == http.MethodOptions {
			response.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(response, request)
	})
}

func (server *Server) handleHealth(response http.ResponseWriter, _ *http.Request) {
	writeJSON(response, http.StatusOK, map[string]any{"ok": true})
}

func (server *Server) handleState(response http.ResponseWriter, request *http.Request) {
	apiKey := apiKeyFromRequest(request)
	if apiKey == "" {
		writeJSON(response, http.StatusUnauthorized, map[string]any{"error": "api key is required"})
		return
	}

	user, err := server.findUser(apiKey)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(response, http.StatusUnauthorized, map[string]any{"error": "api key was not found"})
		return
	}
	if err != nil {
		writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	switch request.Method {
	case http.MethodGet:
		state, err := server.loadState(user.ID)
		if err != nil {
			writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(response, http.StatusOK, StateResponse{
			Revision: user.Revision,
			State:    state,
			User:     user,
		})
	case http.MethodPut:
		var input SaveStateRequest
		if err := json.NewDecoder(request.Body).Decode(&input); err != nil {
			writeJSON(response, http.StatusBadRequest, map[string]any{"error": "invalid json body"})
			return
		}
		nextRevision, err := server.saveState(user.ID, input.BaseRevision, input.State)
		if errors.Is(err, errRevisionConflict) {
			currentRevision, revisionErr := server.currentRevision(user.ID)
			if revisionErr != nil {
				writeJSON(response, http.StatusInternalServerError, map[string]any{"error": revisionErr.Error()})
				return
			}
			writeJSON(response, http.StatusConflict, map[string]any{
				"currentRevision": currentRevision,
				"error":           "state revision conflict",
			})
			return
		}
		if err != nil {
			writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(response, http.StatusOK, map[string]any{"revision": nextRevision})
	default:
		writeJSON(response, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

func (server *Server) handleUsers(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		writeJSON(response, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}

	var input CreateUserRequest
	if err := json.NewDecoder(request.Body).Decode(&input); err != nil {
		writeJSON(response, http.StatusBadRequest, map[string]any{"error": "invalid json body"})
		return
	}

	apiKey, user, err := server.createUser(input.State)
	if err != nil {
		writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(response, http.StatusCreated, CreateUserResponse{
		APIKey:   apiKey,
		Revision: user.Revision,
		User:     user,
	})
}

func (server *Server) handleChat(response http.ResponseWriter, request *http.Request) {
	apiKey := apiKeyFromRequest(request)
	if apiKey == "" {
		writeJSON(response, http.StatusUnauthorized, map[string]any{"error": "api key is required"})
		return
	}

	user, err := server.findUser(apiKey)
	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(response, http.StatusUnauthorized, map[string]any{"error": "api key was not found"})
		return
	}
	if err != nil {
		writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	switch request.Method {
	case http.MethodGet:
		messages, err := server.loadChatMessages(user.ID)
		if err != nil {
			writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(response, http.StatusOK, ChatMessagesResponse{Messages: messages})
	case http.MethodPut:
		var input SaveChatMessagesRequest
		if err := json.NewDecoder(request.Body).Decode(&input); err != nil {
			writeJSON(response, http.StatusBadRequest, map[string]any{"error": "invalid json body"})
			return
		}
		if err := server.saveChatMessages(user.ID, input.Messages); err != nil {
			writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(response, http.StatusOK, map[string]any{"ok": true})
	default:
		writeJSON(response, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

var errRevisionConflict = errors.New("revision conflict")

func (server *Server) migrate() error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			api_key_hash TEXT NOT NULL UNIQUE,
			user_uid TEXT NOT NULL,
			user_reg_datetime TEXT NOT NULL,
			revision INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS app_settings (
			user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
			interface_language TEXT NOT NULL,
			target_language TEXT NOT NULL,
			selected_card_set_id TEXT,
			display_name TEXT,
			is_anonymous INTEGER NOT NULL,
			cooldown_three REAL NOT NULL,
			cooldown_four REAL NOT NULL,
			cooldown_five_plus REAL NOT NULL,
			new_card_mix_frequency_percent INTEGER NOT NULL,
			recent_mistake_repeat_frequency_percent INTEGER NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS complementary_languages (
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			target_language TEXT NOT NULL,
			position INTEGER NOT NULL,
			language TEXT NOT NULL,
			PRIMARY KEY (user_id, target_language, position)
		)`,
		`CREATE TABLE IF NOT EXISTS cards (
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			id TEXT NOT NULL,
			position INTEGER NOT NULL,
			difficulty TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			PRIMARY KEY (user_id, id)
		)`,
		`CREATE TABLE IF NOT EXISTS card_translations (
			user_id INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			language TEXT NOT NULL,
			value TEXT NOT NULL,
			PRIMARY KEY (user_id, card_id, language),
			FOREIGN KEY (user_id, card_id) REFERENCES cards(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS card_definitions (
			user_id INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			language TEXT NOT NULL,
			value TEXT NOT NULL,
			PRIMARY KEY (user_id, card_id, language),
			FOREIGN KEY (user_id, card_id) REFERENCES cards(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS card_examples (
			user_id INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			language TEXT NOT NULL,
			position INTEGER NOT NULL,
			sentence TEXT NOT NULL,
			answer TEXT NOT NULL,
			PRIMARY KEY (user_id, card_id, language, position),
			FOREIGN KEY (user_id, card_id) REFERENCES cards(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS card_tags (
			user_id INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			tag TEXT NOT NULL,
			PRIMARY KEY (user_id, card_id, position),
			FOREIGN KEY (user_id, card_id) REFERENCES cards(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS card_known_languages (
			user_id INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			language TEXT NOT NULL,
			PRIMARY KEY (user_id, card_id, language),
			FOREIGN KEY (user_id, card_id) REFERENCES cards(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS card_sets (
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			id TEXT NOT NULL,
			position INTEGER NOT NULL,
			name TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			archived_at TEXT,
			PRIMARY KEY (user_id, id)
		)`,
		`CREATE TABLE IF NOT EXISTS card_set_names (
			user_id INTEGER NOT NULL,
			card_set_id TEXT NOT NULL,
			language TEXT NOT NULL,
			name TEXT NOT NULL,
			PRIMARY KEY (user_id, card_set_id, language),
			FOREIGN KEY (user_id, card_set_id) REFERENCES card_sets(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS card_set_cards (
			user_id INTEGER NOT NULL,
			card_set_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			PRIMARY KEY (user_id, card_set_id, position),
			FOREIGN KEY (user_id, card_set_id) REFERENCES card_sets(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS exercise_attempts (
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			id TEXT NOT NULL,
			position INTEGER NOT NULL,
			exercise_session_id TEXT,
			exercise_type TEXT NOT NULL,
			card_set_id TEXT NOT NULL,
			target_language TEXT NOT NULL,
			created_at TEXT NOT NULL,
			completed_at TEXT,
			is_exercise_completed INTEGER,
			weighted_score REAL,
			coach_comment TEXT,
			crossword_snapshot_json TEXT,
			PRIMARY KEY (user_id, id)
		)`,
		`CREATE TABLE IF NOT EXISTS attempt_card_snapshots (
			user_id INTEGER NOT NULL,
			attempt_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			translations_json TEXT NOT NULL,
			definitions_json TEXT,
			tags_json TEXT,
			difficulty TEXT,
			PRIMARY KEY (user_id, attempt_id, position),
			FOREIGN KEY (user_id, attempt_id) REFERENCES exercise_attempts(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS attempt_prompts (
			user_id INTEGER NOT NULL,
			attempt_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			prompt TEXT NOT NULL,
			expected_answer TEXT NOT NULL,
			definition_hint TEXT,
			PRIMARY KEY (user_id, attempt_id, position),
			FOREIGN KEY (user_id, attempt_id) REFERENCES exercise_attempts(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS attempt_prompt_hints (
			user_id INTEGER NOT NULL,
			attempt_id TEXT NOT NULL,
			prompt_position INTEGER NOT NULL,
			position INTEGER NOT NULL,
			language TEXT NOT NULL,
			value TEXT NOT NULL,
			PRIMARY KEY (user_id, attempt_id, prompt_position, position),
			FOREIGN KEY (user_id, attempt_id, prompt_position) REFERENCES attempt_prompts(user_id, attempt_id, position) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS attempt_answers (
			user_id INTEGER NOT NULL,
			attempt_id TEXT NOT NULL,
			card_id TEXT NOT NULL,
			answer TEXT NOT NULL,
			PRIMARY KEY (user_id, attempt_id, card_id),
			FOREIGN KEY (user_id, attempt_id) REFERENCES exercise_attempts(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS attempt_correctness (
			user_id INTEGER NOT NULL,
			attempt_id TEXT NOT NULL,
			card_id TEXT NOT NULL,
			is_correct INTEGER NOT NULL,
			PRIMARY KEY (user_id, attempt_id, card_id),
			FOREIGN KEY (user_id, attempt_id) REFERENCES exercise_attempts(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS attempt_hints_used (
			user_id INTEGER NOT NULL,
			attempt_id TEXT NOT NULL,
			card_id TEXT NOT NULL,
			hints_used INTEGER NOT NULL,
			PRIMARY KEY (user_id, attempt_id, card_id),
			FOREIGN KEY (user_id, attempt_id) REFERENCES exercise_attempts(user_id, id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS card_stats (
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			position INTEGER NOT NULL,
			card_id TEXT NOT NULL,
			target_language TEXT NOT NULL,
			attempts INTEGER NOT NULL,
			correct INTEGER NOT NULL,
			incorrect INTEGER NOT NULL,
			hints_used INTEGER NOT NULL,
			accuracy REAL NOT NULL,
			recent_mistakes INTEGER NOT NULL,
			last_practiced_at TEXT NOT NULL,
			stability TEXT NOT NULL,
			PRIMARY KEY (user_id, card_id, target_language)
		)`,
		`CREATE TABLE IF NOT EXISTS chat_messages (
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			id TEXT NOT NULL,
			position INTEGER NOT NULL,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at TEXT NOT NULL,
			PRIMARY KEY (user_id, id)
		)`,
	}

	for _, statement := range statements {
		if _, err := server.db.Exec(statement); err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
	}
	return nil
}

func (server *Server) findUser(apiKey string) (UserRecord, error) {
	apiKeyHash := hashAPIKey(apiKey)
	var user UserRecord
	err := server.db.QueryRow(
		`SELECT id, user_uid, user_reg_datetime, revision FROM users WHERE api_key_hash = ?`,
		apiKeyHash,
	).Scan(&user.ID, &user.UID, &user.RegisteredAtUTC, &user.Revision)
	return user, err
}

func (server *Server) createUser(state AppStatePayload) (string, UserRecord, error) {
	if state.Settings.InterfaceLanguage == "" {
		state.Settings = defaultState.Settings
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	uid, err := randomUID("user")
	if err != nil {
		return "", UserRecord{}, err
	}
	apiKey, err := randomAPIKey()
	if err != nil {
		return "", UserRecord{}, err
	}

	tx, err := server.db.Begin()
	if err != nil {
		return "", UserRecord{}, err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		`INSERT INTO users (api_key_hash, user_uid, user_reg_datetime, revision, created_at, updated_at)
		 VALUES (?, ?, ?, 0, ?, ?)`,
		hashAPIKey(apiKey),
		uid,
		now,
		now,
		now,
	)
	if err != nil {
		return "", UserRecord{}, err
	}
	userID, err := result.LastInsertId()
	if err != nil {
		return "", UserRecord{}, err
	}
	if err := insertSettings(tx, userID, state.Settings); err != nil {
		return "", UserRecord{}, err
	}
	for position, card := range state.Cards {
		if err := insertCard(tx, userID, position, card); err != nil {
			return "", UserRecord{}, err
		}
	}
	for position, cardSet := range state.CardSets {
		if err := insertCardSet(tx, userID, position, cardSet); err != nil {
			return "", UserRecord{}, err
		}
	}
	for position, attempt := range state.Attempts {
		if err := insertAttempt(tx, userID, position, attempt); err != nil {
			return "", UserRecord{}, err
		}
	}
	for position, stats := range state.Stats {
		if err := insertStats(tx, userID, position, stats); err != nil {
			return "", UserRecord{}, err
		}
	}
	if err := tx.Commit(); err != nil {
		return "", UserRecord{}, err
	}
	return apiKey, UserRecord{ID: userID, UID: uid, RegisteredAtUTC: now, Revision: 0}, nil
}

func (server *Server) currentRevision(userID int64) (int64, error) {
	var revision int64
	err := server.db.QueryRow(`SELECT revision FROM users WHERE id = ?`, userID).Scan(&revision)
	return revision, err
}

func (server *Server) saveState(userID int64, baseRevision int64, state AppStatePayload) (int64, error) {
	tx, err := server.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	var currentRevision int64
	if err := tx.QueryRow(`SELECT revision FROM users WHERE id = ?`, userID).Scan(&currentRevision); err != nil {
		return 0, err
	}
	if currentRevision != baseRevision {
		return 0, errRevisionConflict
	}

	if err := deleteState(tx, userID); err != nil {
		return 0, err
	}
	if err := insertSettings(tx, userID, state.Settings); err != nil {
		return 0, err
	}
	for position, card := range state.Cards {
		if err := insertCard(tx, userID, position, card); err != nil {
			return 0, err
		}
	}
	for position, cardSet := range state.CardSets {
		if err := insertCardSet(tx, userID, position, cardSet); err != nil {
			return 0, err
		}
	}
	for position, attempt := range state.Attempts {
		if err := insertAttempt(tx, userID, position, attempt); err != nil {
			return 0, err
		}
	}
	for position, stats := range state.Stats {
		if err := insertStats(tx, userID, position, stats); err != nil {
			return 0, err
		}
	}

	nextRevision := currentRevision + 1
	_, err = tx.Exec(
		`UPDATE users SET revision = ?, updated_at = ? WHERE id = ?`,
		nextRevision,
		time.Now().UTC().Format(time.RFC3339Nano),
		userID,
	)
	if err != nil {
		return 0, err
	}
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return nextRevision, nil
}

func (server *Server) loadState(userID int64) (AppStatePayload, error) {
	settings, err := loadSettings(server.db, userID)
	if err != nil {
		return AppStatePayload{}, err
	}
	cards, err := loadCards(server.db, userID)
	if err != nil {
		return AppStatePayload{}, err
	}
	cardSets, err := loadCardSets(server.db, userID)
	if err != nil {
		return AppStatePayload{}, err
	}
	attempts, err := loadAttempts(server.db, userID)
	if err != nil {
		return AppStatePayload{}, err
	}
	stats, err := loadStats(server.db, userID)
	if err != nil {
		return AppStatePayload{}, err
	}
	return AppStatePayload{
		Attempts: attempts,
		Cards:    cards,
		CardSets: cardSets,
		Settings: settings,
		Stats:    stats,
	}, nil
}

type dbRunner interface {
	Exec(query string, args ...any) (sql.Result, error)
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
}

func (server *Server) insertSettings(runner dbRunner, userID int64, settings SettingsPayload) error {
	return insertSettings(runner, userID, settings)
}

func insertSettings(runner dbRunner, userID int64, settings SettingsPayload) error {
	if settings.InterfaceLanguage == "" {
		settings.InterfaceLanguage = defaultState.Settings.InterfaceLanguage
	}
	if settings.TargetLanguage == "" {
		settings.TargetLanguage = defaultState.Settings.TargetLanguage
	}
	if settings.PracticeSettings.CorrectStreakCooldownMonths == nil {
		settings.PracticeSettings = defaultState.Settings.PracticeSettings
	}

	displayName := ""
	isAnonymous := 1
	if settings.PlayerProfile != nil {
		displayName = settings.PlayerProfile.DisplayName
		if !settings.PlayerProfile.IsAnonymous {
			isAnonymous = 0
		}
	}
	_, err := runner.Exec(
		`INSERT INTO app_settings (
			user_id, interface_language, target_language, selected_card_set_id,
			display_name, is_anonymous, cooldown_three, cooldown_four, cooldown_five_plus,
			new_card_mix_frequency_percent, recent_mistake_repeat_frequency_percent
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		userID,
		settings.InterfaceLanguage,
		settings.TargetLanguage,
		nullString(settings.SelectedCardSetID),
		nullString(displayName),
		isAnonymous,
		settings.PracticeSettings.CorrectStreakCooldownMonths["three"],
		settings.PracticeSettings.CorrectStreakCooldownMonths["four"],
		settings.PracticeSettings.CorrectStreakCooldownMonths["fivePlus"],
		settings.PracticeSettings.NewCardMixFrequencyPercent,
		settings.PracticeSettings.RecentMistakeRepeatFrequencyPercent,
	)
	if err != nil {
		return err
	}

	for _, targetLanguage := range sortedKeys(settings.ComplementaryLanguages) {
		for position, language := range settings.ComplementaryLanguages[targetLanguage] {
			if _, err := runner.Exec(
				`INSERT INTO complementary_languages (user_id, target_language, position, language)
				 VALUES (?, ?, ?, ?)`,
				userID,
				targetLanguage,
				position,
				language,
			); err != nil {
				return err
			}
		}
	}
	return nil
}

func insertCard(runner dbRunner, userID int64, position int, card LanguageCardPayload) error {
	if _, err := runner.Exec(
		`INSERT INTO cards (user_id, id, position, difficulty, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		userID,
		card.ID,
		position,
		nullString(card.Difficulty),
		card.CreatedAt,
		card.UpdatedAt,
	); err != nil {
		return err
	}
	for _, language := range sortedKeys(card.Translations) {
		if _, err := runner.Exec(
			`INSERT INTO card_translations (user_id, card_id, language, value) VALUES (?, ?, ?, ?)`,
			userID,
			card.ID,
			language,
			card.Translations[language],
		); err != nil {
			return err
		}
	}
	for _, language := range sortedKeys(card.Definitions) {
		if _, err := runner.Exec(
			`INSERT INTO card_definitions (user_id, card_id, language, value) VALUES (?, ?, ?, ?)`,
			userID,
			card.ID,
			language,
			card.Definitions[language],
		); err != nil {
			return err
		}
	}
	for _, language := range sortedKeys(card.Examples) {
		for position, example := range card.Examples[language] {
			if _, err := runner.Exec(
				`INSERT INTO card_examples (user_id, card_id, language, position, sentence, answer)
				 VALUES (?, ?, ?, ?, ?, ?)`,
				userID,
				card.ID,
				language,
				position,
				example.Sentence,
				example.Answer,
			); err != nil {
				return err
			}
		}
	}
	for position, tag := range card.Tags {
		if _, err := runner.Exec(
			`INSERT INTO card_tags (user_id, card_id, position, tag) VALUES (?, ?, ?, ?)`,
			userID,
			card.ID,
			position,
			tag,
		); err != nil {
			return err
		}
	}
	for _, language := range card.KnownTargetLanguages {
		if _, err := runner.Exec(
			`INSERT INTO card_known_languages (user_id, card_id, language) VALUES (?, ?, ?)`,
			userID,
			card.ID,
			language,
		); err != nil {
			return err
		}
	}
	return nil
}

func insertCardSet(runner dbRunner, userID int64, position int, cardSet CardSetPayload) error {
	if _, err := runner.Exec(
		`INSERT INTO card_sets (user_id, id, position, name, created_at, updated_at, archived_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		userID,
		cardSet.ID,
		position,
		cardSet.Name,
		cardSet.CreatedAt,
		cardSet.UpdatedAt,
		nullString(cardSet.ArchivedAt),
	); err != nil {
		return err
	}
	for _, language := range sortedKeys(cardSet.Names) {
		if _, err := runner.Exec(
			`INSERT INTO card_set_names (user_id, card_set_id, language, name) VALUES (?, ?, ?, ?)`,
			userID,
			cardSet.ID,
			language,
			cardSet.Names[language],
		); err != nil {
			return err
		}
	}
	for position, cardID := range cardSet.CardIDs {
		if _, err := runner.Exec(
			`INSERT INTO card_set_cards (user_id, card_set_id, position, card_id) VALUES (?, ?, ?, ?)`,
			userID,
			cardSet.ID,
			position,
			cardID,
		); err != nil {
			return err
		}
	}
	return nil
}

func insertAttempt(runner dbRunner, userID int64, position int, attempt ExerciseAttemptPayload) error {
	var isCompleted any
	if attempt.IsExerciseCompleted != nil {
		isCompleted = boolToInt(*attempt.IsExerciseCompleted)
	}
	var weightedScore any
	if attempt.WeightedScore != nil {
		weightedScore = *attempt.WeightedScore
	}
	var crosswordSnapshot any
	if len(attempt.CrosswordSnapshot) > 0 {
		crosswordSnapshot = string(attempt.CrosswordSnapshot)
	}
	if _, err := runner.Exec(
		`INSERT INTO exercise_attempts (
			user_id, id, position, exercise_session_id, exercise_type, card_set_id, target_language,
			created_at, completed_at, is_exercise_completed, weighted_score, coach_comment, crossword_snapshot_json
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		userID,
		attempt.ID,
		position,
		nullString(attempt.ExerciseSessionID),
		attempt.ExerciseType,
		attempt.CardSetID,
		attempt.TargetLanguage,
		attempt.CreatedAt,
		nullString(attempt.CompletedAt),
		isCompleted,
		weightedScore,
		nullString(attempt.CoachComment),
		crosswordSnapshot,
	); err != nil {
		return err
	}
	for position, snapshot := range attempt.CardSnapshots {
		translationsJSON, err := jsonText(snapshot.Translations)
		if err != nil {
			return err
		}
		definitionsJSON, err := optionalJSONText(snapshot.Definitions)
		if err != nil {
			return err
		}
		tagsJSON, err := optionalJSONText(snapshot.Tags)
		if err != nil {
			return err
		}
		if _, err := runner.Exec(
			`INSERT INTO attempt_card_snapshots (
				user_id, attempt_id, position, card_id, translations_json, definitions_json, tags_json, difficulty
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			userID,
			attempt.ID,
			position,
			snapshot.ID,
			translationsJSON,
			definitionsJSON,
			tagsJSON,
			nullString(snapshot.Difficulty),
		); err != nil {
			return err
		}
	}
	for position, prompt := range attempt.Prompts {
		if _, err := runner.Exec(
			`INSERT INTO attempt_prompts (
				user_id, attempt_id, position, card_id, prompt, expected_answer, definition_hint
			) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			userID,
			attempt.ID,
			position,
			prompt.CardID,
			prompt.Prompt,
			prompt.ExpectedAnswer,
			nullString(prompt.DefinitionHint),
		); err != nil {
			return err
		}
		for hintPosition, hint := range prompt.TranslationHints {
			if _, err := runner.Exec(
				`INSERT INTO attempt_prompt_hints (
					user_id, attempt_id, prompt_position, position, language, value
				) VALUES (?, ?, ?, ?, ?, ?)`,
				userID,
				attempt.ID,
				position,
				hintPosition,
				hint.Language,
				hint.Value,
			); err != nil {
				return err
			}
		}
	}
	for _, cardID := range sortedKeys(attempt.Answers) {
		if _, err := runner.Exec(
			`INSERT INTO attempt_answers (user_id, attempt_id, card_id, answer) VALUES (?, ?, ?, ?)`,
			userID,
			attempt.ID,
			cardID,
			attempt.Answers[cardID],
		); err != nil {
			return err
		}
	}
	for _, cardID := range sortedKeys(attempt.Correctness) {
		if _, err := runner.Exec(
			`INSERT INTO attempt_correctness (user_id, attempt_id, card_id, is_correct) VALUES (?, ?, ?, ?)`,
			userID,
			attempt.ID,
			cardID,
			boolToInt(attempt.Correctness[cardID]),
		); err != nil {
			return err
		}
	}
	for _, cardID := range sortedKeys(attempt.HintsUsed) {
		if _, err := runner.Exec(
			`INSERT INTO attempt_hints_used (user_id, attempt_id, card_id, hints_used) VALUES (?, ?, ?, ?)`,
			userID,
			attempt.ID,
			cardID,
			attempt.HintsUsed[cardID],
		); err != nil {
			return err
		}
	}
	return nil
}

func insertStats(runner dbRunner, userID int64, position int, stats CardStatsPayload) error {
	_, err := runner.Exec(
		`INSERT INTO card_stats (
			user_id, position, card_id, target_language, attempts, correct, incorrect,
			hints_used, accuracy, recent_mistakes, last_practiced_at, stability
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		userID,
		position,
		stats.CardID,
		stats.TargetLanguage,
		stats.Attempts,
		stats.Correct,
		stats.Incorrect,
		stats.HintsUsed,
		stats.Accuracy,
		stats.RecentMistakes,
		stats.LastPracticedAt,
		stats.Stability,
	)
	return err
}

func deleteState(runner dbRunner, userID int64) error {
	tables := []string{
		"card_stats",
		"attempt_hints_used",
		"attempt_correctness",
		"attempt_answers",
		"attempt_prompt_hints",
		"attempt_prompts",
		"attempt_card_snapshots",
		"exercise_attempts",
		"card_set_cards",
		"card_set_names",
		"card_sets",
		"card_known_languages",
		"card_tags",
		"card_examples",
		"card_definitions",
		"card_translations",
		"cards",
		"complementary_languages",
		"app_settings",
	}
	for _, table := range tables {
		if _, err := runner.Exec("DELETE FROM "+table+" WHERE user_id = ?", userID); err != nil {
			return err
		}
	}
	return nil
}

func loadSettings(runner dbRunner, userID int64) (SettingsPayload, error) {
	settings := defaultState.Settings
	var selectedCardSetID sql.NullString
	var displayName sql.NullString
	var isAnonymous int
	var cooldownThree, cooldownFour, cooldownFivePlus float64
	err := runner.QueryRow(
		`SELECT interface_language, target_language, selected_card_set_id, display_name, is_anonymous,
			cooldown_three, cooldown_four, cooldown_five_plus,
			new_card_mix_frequency_percent, recent_mistake_repeat_frequency_percent
		 FROM app_settings WHERE user_id = ?`,
		userID,
	).Scan(
		&settings.InterfaceLanguage,
		&settings.TargetLanguage,
		&selectedCardSetID,
		&displayName,
		&isAnonymous,
		&cooldownThree,
		&cooldownFour,
		&cooldownFivePlus,
		&settings.PracticeSettings.NewCardMixFrequencyPercent,
		&settings.PracticeSettings.RecentMistakeRepeatFrequencyPercent,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return settings, nil
	}
	if err != nil {
		return SettingsPayload{}, err
	}
	settings.SelectedCardSetID = selectedCardSetID.String
	settings.PracticeSettings.CorrectStreakCooldownMonths = map[string]float64{
		"three":    cooldownThree,
		"four":     cooldownFour,
		"fivePlus": cooldownFivePlus,
	}
	if displayName.Valid || isAnonymous == 0 {
		settings.PlayerProfile = &PlayerProfilePayload{
			DisplayName: displayName.String,
			IsAnonymous: isAnonymous != 0,
		}
	}

	rows, err := runner.Query(
		`SELECT target_language, language FROM complementary_languages
		 WHERE user_id = ? ORDER BY target_language, position`,
		userID,
	)
	if err != nil {
		return SettingsPayload{}, err
	}
	defer rows.Close()
	complementaryLanguages := map[string][]string{}
	for rows.Next() {
		var targetLanguage, language string
		if err := rows.Scan(&targetLanguage, &language); err != nil {
			return SettingsPayload{}, err
		}
		complementaryLanguages[targetLanguage] = append(complementaryLanguages[targetLanguage], language)
	}
	if err := rows.Err(); err != nil {
		return SettingsPayload{}, err
	}
	settings.ComplementaryLanguages = complementaryLanguages
	return settings, nil
}

func loadCards(runner dbRunner, userID int64) ([]LanguageCardPayload, error) {
	rows, err := runner.Query(
		`SELECT id, difficulty, created_at, updated_at FROM cards
		 WHERE user_id = ? ORDER BY position, id`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cards := []LanguageCardPayload{}
	for rows.Next() {
		var card LanguageCardPayload
		var difficulty sql.NullString
		if err := rows.Scan(&card.ID, &difficulty, &card.CreatedAt, &card.UpdatedAt); err != nil {
			return nil, err
		}
		card.Difficulty = difficulty.String
		var err error
		card.Translations, err = loadStringMap(runner, `SELECT language, value FROM card_translations WHERE user_id = ? AND card_id = ?`, userID, card.ID)
		if err != nil {
			return nil, err
		}
		card.Definitions, err = loadStringMap(runner, `SELECT language, value FROM card_definitions WHERE user_id = ? AND card_id = ?`, userID, card.ID)
		if err != nil {
			return nil, err
		}
		card.Examples, err = loadExamples(runner, userID, card.ID)
		if err != nil {
			return nil, err
		}
		card.Tags, err = loadStringSlice(runner, `SELECT tag FROM card_tags WHERE user_id = ? AND card_id = ? ORDER BY position`, userID, card.ID)
		if err != nil {
			return nil, err
		}
		card.KnownTargetLanguages, err = loadStringSlice(runner, `SELECT language FROM card_known_languages WHERE user_id = ? AND card_id = ? ORDER BY language`, userID, card.ID)
		if err != nil {
			return nil, err
		}
		cards = append(cards, card)
	}
	return cards, rows.Err()
}

func loadCardSets(runner dbRunner, userID int64) ([]CardSetPayload, error) {
	rows, err := runner.Query(
		`SELECT id, name, created_at, updated_at, archived_at FROM card_sets
		 WHERE user_id = ? ORDER BY position, id`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cardSets := []CardSetPayload{}
	for rows.Next() {
		var cardSet CardSetPayload
		var archivedAt sql.NullString
		if err := rows.Scan(&cardSet.ID, &cardSet.Name, &cardSet.CreatedAt, &cardSet.UpdatedAt, &archivedAt); err != nil {
			return nil, err
		}
		cardSet.ArchivedAt = archivedAt.String
		var err error
		cardSet.Names, err = loadStringMap(runner, `SELECT language, name FROM card_set_names WHERE user_id = ? AND card_set_id = ?`, userID, cardSet.ID)
		if err != nil {
			return nil, err
		}
		cardSet.CardIDs, err = loadStringSlice(runner, `SELECT card_id FROM card_set_cards WHERE user_id = ? AND card_set_id = ? ORDER BY position`, userID, cardSet.ID)
		if err != nil {
			return nil, err
		}
		if cardSet.CardIDs == nil {
			cardSet.CardIDs = []string{}
		}
		cardSets = append(cardSets, cardSet)
	}
	return cardSets, rows.Err()
}

func loadAttempts(runner dbRunner, userID int64) ([]ExerciseAttemptPayload, error) {
	rows, err := runner.Query(
		`SELECT id, exercise_session_id, exercise_type, card_set_id, target_language, created_at,
			completed_at, is_exercise_completed, weighted_score, coach_comment, crossword_snapshot_json
		 FROM exercise_attempts WHERE user_id = ? ORDER BY position, id`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	attempts := []ExerciseAttemptPayload{}
	for rows.Next() {
		var attempt ExerciseAttemptPayload
		var exerciseSessionID, completedAt, coachComment, crosswordSnapshot sql.NullString
		var isExerciseCompleted sql.NullInt64
		var weightedScore sql.NullFloat64
		if err := rows.Scan(
			&attempt.ID,
			&exerciseSessionID,
			&attempt.ExerciseType,
			&attempt.CardSetID,
			&attempt.TargetLanguage,
			&attempt.CreatedAt,
			&completedAt,
			&isExerciseCompleted,
			&weightedScore,
			&coachComment,
			&crosswordSnapshot,
		); err != nil {
			return nil, err
		}
		attempt.ExerciseSessionID = exerciseSessionID.String
		attempt.CompletedAt = completedAt.String
		attempt.CoachComment = coachComment.String
		if isExerciseCompleted.Valid {
			value := isExerciseCompleted.Int64 != 0
			attempt.IsExerciseCompleted = &value
		}
		if weightedScore.Valid {
			value := weightedScore.Float64
			attempt.WeightedScore = &value
		}
		if crosswordSnapshot.Valid {
			attempt.CrosswordSnapshot = json.RawMessage(crosswordSnapshot.String)
		}

		var err error
		attempt.CardSnapshots, err = loadAttemptSnapshots(runner, userID, attempt.ID)
		if err != nil {
			return nil, err
		}
		attempt.Prompts, err = loadAttemptPrompts(runner, userID, attempt.ID)
		if err != nil {
			return nil, err
		}
		attempt.Answers, err = loadStringMap(runner, `SELECT card_id, answer FROM attempt_answers WHERE user_id = ? AND attempt_id = ?`, userID, attempt.ID)
		if err != nil {
			return nil, err
		}
		if attempt.Answers == nil {
			attempt.Answers = map[string]string{}
		}
		attempt.Correctness, err = loadBoolMap(runner, userID, attempt.ID)
		if err != nil {
			return nil, err
		}
		attempt.HintsUsed, err = loadIntMap(runner, userID, attempt.ID)
		if err != nil {
			return nil, err
		}
		attempts = append(attempts, attempt)
	}
	return attempts, rows.Err()
}

func (server *Server) loadChatMessages(userID int64) ([]ChatMessagePayload, error) {
	rows, err := server.db.Query(
		`SELECT id, role, content, created_at FROM chat_messages
		 WHERE user_id = ? ORDER BY position, id`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := []ChatMessagePayload{}
	for rows.Next() {
		var msg ChatMessagePayload
		if err := rows.Scan(&msg.ID, &msg.Role, &msg.Content, &msg.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, rows.Err()
}

func (server *Server) saveChatMessages(userID int64, messages []ChatMessagePayload) error {
	tx, err := server.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM chat_messages WHERE user_id = ?", userID); err != nil {
		return err
	}

	for position, msg := range messages {
		if _, err := tx.Exec(
			`INSERT INTO chat_messages (user_id, id, position, role, content, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			userID, msg.ID, position, msg.Role, msg.Content, msg.CreatedAt,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func loadStats(runner dbRunner, userID int64) ([]CardStatsPayload, error) {
	rows, err := runner.Query(
		`SELECT card_id, target_language, attempts, correct, incorrect, hints_used,
			accuracy, recent_mistakes, last_practiced_at, stability
		 FROM card_stats WHERE user_id = ? ORDER BY position, card_id`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := []CardStatsPayload{}
	for rows.Next() {
		var item CardStatsPayload
		if err := rows.Scan(
			&item.CardID,
			&item.TargetLanguage,
			&item.Attempts,
			&item.Correct,
			&item.Incorrect,
			&item.HintsUsed,
			&item.Accuracy,
			&item.RecentMistakes,
			&item.LastPracticedAt,
			&item.Stability,
		); err != nil {
			return nil, err
		}
		stats = append(stats, item)
	}
	return stats, rows.Err()
}

func loadExamples(runner dbRunner, userID int64, cardID string) (map[string][]LanguageExamplePayload, error) {
	rows, err := runner.Query(
		`SELECT language, sentence, answer FROM card_examples
		 WHERE user_id = ? AND card_id = ? ORDER BY language, position`,
		userID,
		cardID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	examples := map[string][]LanguageExamplePayload{}
	for rows.Next() {
		var language string
		var example LanguageExamplePayload
		if err := rows.Scan(&language, &example.Sentence, &example.Answer); err != nil {
			return nil, err
		}
		examples[language] = append(examples[language], example)
	}
	if len(examples) == 0 {
		return nil, rows.Err()
	}
	return examples, rows.Err()
}

func loadAttemptSnapshots(runner dbRunner, userID int64, attemptID string) ([]CardSnapshotPayload, error) {
	rows, err := runner.Query(
		`SELECT card_id, translations_json, definitions_json, tags_json, difficulty
		 FROM attempt_card_snapshots WHERE user_id = ? AND attempt_id = ? ORDER BY position`,
		userID,
		attemptID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	snapshots := []CardSnapshotPayload{}
	for rows.Next() {
		var snapshot CardSnapshotPayload
		var translationsJSON string
		var definitionsJSON, tagsJSON, difficulty sql.NullString
		if err := rows.Scan(&snapshot.ID, &translationsJSON, &definitionsJSON, &tagsJSON, &difficulty); err != nil {
			return nil, err
		}
		if err := json.Unmarshal([]byte(translationsJSON), &snapshot.Translations); err != nil {
			return nil, err
		}
		if definitionsJSON.Valid {
			if err := json.Unmarshal([]byte(definitionsJSON.String), &snapshot.Definitions); err != nil {
				return nil, err
			}
		}
		if tagsJSON.Valid {
			if err := json.Unmarshal([]byte(tagsJSON.String), &snapshot.Tags); err != nil {
				return nil, err
			}
		}
		snapshot.Difficulty = difficulty.String
		snapshots = append(snapshots, snapshot)
	}
	return snapshots, rows.Err()
}

func loadAttemptPrompts(runner dbRunner, userID int64, attemptID string) ([]ExercisePromptPayload, error) {
	rows, err := runner.Query(
		`SELECT position, card_id, prompt, expected_answer, definition_hint
		 FROM attempt_prompts WHERE user_id = ? AND attempt_id = ? ORDER BY position`,
		userID,
		attemptID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	prompts := []ExercisePromptPayload{}
	for rows.Next() {
		var position int
		var prompt ExercisePromptPayload
		var definitionHint sql.NullString
		if err := rows.Scan(&position, &prompt.CardID, &prompt.Prompt, &prompt.ExpectedAnswer, &definitionHint); err != nil {
			return nil, err
		}
		prompt.DefinitionHint = definitionHint.String
		hints, err := loadPromptHints(runner, userID, attemptID, position)
		if err != nil {
			return nil, err
		}
		prompt.TranslationHints = hints
		prompts = append(prompts, prompt)
	}
	return prompts, rows.Err()
}

func loadPromptHints(runner dbRunner, userID int64, attemptID string, promptPosition int) ([]TranslationHintPayload, error) {
	rows, err := runner.Query(
		`SELECT language, value FROM attempt_prompt_hints
		 WHERE user_id = ? AND attempt_id = ? AND prompt_position = ? ORDER BY position`,
		userID,
		attemptID,
		promptPosition,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	hints := []TranslationHintPayload{}
	for rows.Next() {
		var hint TranslationHintPayload
		if err := rows.Scan(&hint.Language, &hint.Value); err != nil {
			return nil, err
		}
		hints = append(hints, hint)
	}
	return hints, rows.Err()
}

func loadStringMap(runner dbRunner, query string, userID int64, entityID string) (map[string]string, error) {
	rows, err := runner.Query(query+` ORDER BY 1`, userID, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	values := map[string]string{}
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		values[key] = value
	}
	if len(values) == 0 {
		return nil, rows.Err()
	}
	return values, rows.Err()
}

func loadStringSlice(runner dbRunner, query string, userID int64, entityID string) ([]string, error) {
	rows, err := runner.Query(query, userID, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	values := []string{}
	for rows.Next() {
		var value string
		if err := rows.Scan(&value); err != nil {
			return nil, err
		}
		values = append(values, value)
	}
	if len(values) == 0 {
		return nil, rows.Err()
	}
	return values, rows.Err()
}

func loadBoolMap(runner dbRunner, userID int64, attemptID string) (map[string]bool, error) {
	rows, err := runner.Query(
		`SELECT card_id, is_correct FROM attempt_correctness
		 WHERE user_id = ? AND attempt_id = ? ORDER BY card_id`,
		userID,
		attemptID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	values := map[string]bool{}
	for rows.Next() {
		var key string
		var value int
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		values[key] = value != 0
	}
	return values, rows.Err()
}

func loadIntMap(runner dbRunner, userID int64, attemptID string) (map[string]int, error) {
	rows, err := runner.Query(
		`SELECT card_id, hints_used FROM attempt_hints_used
		 WHERE user_id = ? AND attempt_id = ? ORDER BY card_id`,
		userID,
		attemptID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	values := map[string]int{}
	for rows.Next() {
		var key string
		var value int
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		values[key] = value
	}
	return values, rows.Err()
}

func writeJSON(response http.ResponseWriter, status int, value any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	_ = json.NewEncoder(response).Encode(value)
}

func apiKeyFromRequest(request *http.Request) string {
	if value := strings.TrimSpace(request.Header.Get("X-API-Key")); value != "" {
		return value
	}
	const bearerPrefix = "Bearer "
	if value := strings.TrimSpace(request.Header.Get("Authorization")); strings.HasPrefix(value, bearerPrefix) {
		return strings.TrimSpace(strings.TrimPrefix(value, bearerPrefix))
	}
	return ""
}

func hashAPIKey(apiKey string) string {
	sum := sha256.Sum256([]byte(apiKey))
	return hex.EncodeToString(sum[:])
}

func randomUID(prefix string) (string, error) {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "", err
	}
	return prefix + "-" + hex.EncodeToString(bytes[:]), nil
}

func randomAPIKey() (string, error) {
	return randomUID("ll")
}

func nullString(value string) any {
	if value == "" {
		return nil
	}
	return value
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func jsonText(value any) (string, error) {
	encoded, err := json.Marshal(value)
	if err != nil {
		return "", err
	}
	return string(encoded), nil
}

func optionalJSONText(value any) (any, error) {
	if isEmptyJSONValue(value) {
		return nil, nil
	}
	encoded, err := jsonText(value)
	if err != nil {
		return nil, err
	}
	return encoded, nil
}

func isEmptyJSONValue(value any) bool {
	switch typed := value.(type) {
	case nil:
		return true
	case map[string]string:
		return len(typed) == 0
	case []string:
		return len(typed) == 0
	default:
		return false
	}
}

func sortedKeys[V any](values map[string]V) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func getenv(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func parseInt(value string) (int, error) {
	if value == "" {
		return 0, nil
	}
	return strconv.Atoi(value)
}
