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
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

type Config struct {
	Addr                string
	AdminToken          string
	BackupDir           string
	DBPath              string
	FrontendDir         string
	OpenRouterModelsURL string
}

type Server struct {
	adminToken                 string
	backupDir                  string
	db                         *sql.DB
	dbPath                     string
	openRouterModelsURL        string
	backupMu                   sync.Mutex
	openRouterModelsMu         sync.Mutex
	openRouterModelsCache      *OpenRouterModelsResponse
	openRouterModelsCacheError string
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
	AssistantID            string                  `json:"assistantId,omitempty"`
	ComplementaryLanguages map[string][]string     `json:"complementaryLanguages,omitempty"`
	InterfaceLanguage      string                  `json:"interfaceLanguage"`
	OpenRouterAPIKey       string                  `json:"openRouterApiKey,omitempty"`
	PlayerProfile          *PlayerProfilePayload   `json:"playerProfile,omitempty"`
	PracticeSettings       PracticeSettingsPayload `json:"practiceSettings"`
	SelectedCardSetID      string                  `json:"selectedCardSetId,omitempty"`
	TargetLanguage         string                  `json:"targetLanguage"`
	WorldID                string                  `json:"worldId,omitempty"`
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

type BackupSettingsPayload struct {
	BackupDir     string `json:"backupDir"`
	Enabled       bool   `json:"enabled"`
	IntervalHours int    `json:"intervalHours"`
	LastError     string `json:"lastError,omitempty"`
	LastRunAt     string `json:"lastRunAt,omitempty"`
	NextRunAt     string `json:"nextRunAt,omitempty"`
}

type BackupFilePayload struct {
	CreatedAt string `json:"createdAt"`
	Name      string `json:"name"`
	Path      string `json:"path"`
	SizeBytes int64  `json:"sizeBytes"`
}

type BackupListResponse struct {
	Backups  []BackupFilePayload   `json:"backups"`
	Settings BackupSettingsPayload `json:"settings"`
}

type LocalizedModelDescriptions struct {
	EN string `json:"en"`
	ES string `json:"es"`
	RU string `json:"ru"`
	UK string `json:"uk"`
}

type OpenRouterModelPayload struct {
	ContextTokens         int64                      `json:"contextTokens,omitempty"`
	CostRating            *int                       `json:"costRating,omitempty"`
	Descriptions          LocalizedModelDescriptions `json:"descriptions"`
	ID                    string                     `json:"id"`
	InputPricePerMillion  *float64                   `json:"inputPricePerMillion,omitempty"`
	Label                 string                     `json:"label"`
	MaxOutputTokens       int64                      `json:"maxOutputTokens,omitempty"`
	OutputPricePerMillion *float64                   `json:"outputPricePerMillion,omitempty"`
	SpeedRating           *int                       `json:"speedRating,omitempty"`
}

type OpenRouterModelsResponse struct {
	CachedAt  string                   `json:"cachedAt"`
	ExpiresAt string                   `json:"expiresAt"`
	Models    []OpenRouterModelPayload `json:"models"`
	Source    string                   `json:"source"`
}

type openRouterModelMetadata struct {
	ContextTokens         int64
	CostRating            *int
	Descriptions          LocalizedModelDescriptions
	ID                    string
	InputPricePerMillion  *float64
	Label                 string
	MaxOutputTokens       int64
	OutputPricePerMillion *float64
	SpeedRating           *int
}

type openRouterModelLiveData struct {
	ContextTokens         int64
	MaxOutputTokens       int64
	InputPricePerMillion  *float64
	OutputPricePerMillion *float64
}

const (
	defaultOpenRouterModelsURL = "https://openrouter.ai/api/v1/models"
	openRouterModelsCacheTTL   = 4 * time.Hour
)

type SaveBackupSettingsRequest struct {
	Enabled       bool `json:"enabled"`
	IntervalHours int  `json:"intervalHours"`
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

var openRouterModelCatalog = []openRouterModelMetadata{
	{
		ID:                    "deepseek/deepseek-chat-v3.1",
		Label:                 "DeepSeek V3.1",
		InputPricePerMillion:  floatPointer(0.25),
		OutputPricePerMillion: floatPointer(0.95),
		ContextTokens:         163840,
		MaxOutputTokens:       32768,
		SpeedRating:           intPointer(7),
		CostRating:            intPointer(8),
		Descriptions: LocalizedModelDescriptions{
			EN: "Balanced DeepSeek chat model for structured card edits and learning-stat summaries.",
			ES: "Modelo de chat DeepSeek equilibrado para editar tarjetas estructuradas y resumir estadisticas de aprendizaje.",
			RU: "Сбалансированная чат-модель DeepSeek для структурного редактирования карточек и сводок по учебной статистике.",
			UK: "Збалансована чат-модель DeepSeek для структурованого редагування карток і підсумків навчальної статистики.",
		},
	},
	{
		ID:                    "deepseek/deepseek-v4-flash",
		Label:                 "DeepSeek V4 Flash",
		InputPricePerMillion:  floatPointer(0.098),
		OutputPricePerMillion: floatPointer(0.196),
		ContextTokens:         1048576,
		SpeedRating:           intPointer(6),
		CostRating:            intPointer(10),
		Descriptions: LocalizedModelDescriptions{
			EN: "Lowest-cost default model with a very large context window; best for budget-sensitive card generation and background work.",
			ES: "Modelo predeterminado mas economico con una ventana de contexto muy grande; ideal para generar tarjetas con bajo coste y tareas en segundo plano.",
			RU: "Самая экономичная модель по умолчанию с очень большим контекстом; подходит для бюджетной генерации карточек и фоновых задач.",
			UK: "Найекономніша модель за замовчуванням з дуже великим контекстом; підходить для бюджетної генерації карток і фонових задач.",
		},
	},
	{
		ID:                    "deepseek/deepseek-v4-pro",
		Label:                 "DeepSeek V4 Pro",
		InputPricePerMillion:  floatPointer(0.435),
		OutputPricePerMillion: floatPointer(0.87),
		ContextTokens:         1048576,
		MaxOutputTokens:       384000,
		SpeedRating:           intPointer(6),
		CostRating:            intPointer(8),
		Descriptions: LocalizedModelDescriptions{
			EN: "Higher-capacity DeepSeek model for deeper analysis and large responses when latency is less important.",
			ES: "Modelo DeepSeek de mayor capacidad para analisis mas profundo y respuestas grandes cuando la latencia importa menos.",
			RU: "Более мощная модель DeepSeek для глубокого анализа и больших ответов, когда задержка менее важна.",
			UK: "Потужніша модель DeepSeek для глибшого аналізу й великих відповідей, коли затримка менш важлива.",
		},
	},
	{
		ID:                    "z-ai/glm-4.5",
		Label:                 "GLM 4.5",
		InputPricePerMillion:  floatPointer(0.6),
		OutputPricePerMillion: floatPointer(2.2),
		ContextTokens:         131072,
		MaxOutputTokens:       98304,
		SpeedRating:           intPointer(6),
		CostRating:            intPointer(5),
		Descriptions: LocalizedModelDescriptions{
			EN: "General Chinese model with tool support; useful as a secondary comparison model.",
			ES: "Modelo chino general con soporte de herramientas; util como modelo secundario para comparar.",
			RU: "Универсальная китайская модель с поддержкой инструментов; полезна как запасной вариант для сравнения.",
			UK: "Універсальна китайська модель з підтримкою інструментів; корисна як запасний варіант для порівняння.",
		},
	},
	{
		ID:    "openai/gpt-5.5",
		Label: "GPT-5.5",
		Descriptions: LocalizedModelDescriptions{
			EN: "Existing ChatGPT option kept unchanged; check OpenRouter for live availability, price, and limits.",
			ES: "Opcion ChatGPT existente sin cambios; consulta OpenRouter para disponibilidad, precio y limites actuales.",
			RU: "Существующая опция ChatGPT оставлена без изменений; актуальные цену, доступность и лимиты смотрите в OpenRouter.",
			UK: "Наявну опцію ChatGPT залишено без змін; актуальні ціну, доступність і ліміти дивіться в OpenRouter.",
		},
	},
	{
		ID:                    "moonshotai/kimi-k2",
		Label:                 "Kimi K2",
		InputPricePerMillion:  floatPointer(0.57),
		OutputPricePerMillion: floatPointer(2.3),
		ContextTokens:         131072,
		MaxOutputTokens:       100352,
		SpeedRating:           intPointer(6),
		CostRating:            intPointer(5),
		Descriptions: LocalizedModelDescriptions{
			EN: "Moonshot model with long-output tool workflows; better as a comparison than a default here.",
			ES: "Modelo Moonshot para flujos con herramientas y salidas largas; aqui encaja mejor como comparacion que como predeterminado.",
			RU: "Модель Moonshot для tool-workflow и длинных ответов; здесь скорее вариант для сравнения, чем модель по умолчанию.",
			UK: "Модель Moonshot для tool-workflow і довгих відповідей; тут радше варіант для порівняння, ніж модель за замовчуванням.",
		},
	},
	{
		ID:                    "qwen/qwen3.6-35b-a3b",
		Label:                 "Qwen3.6 35B A3B",
		InputPricePerMillion:  floatPointer(0.14),
		OutputPricePerMillion: floatPointer(1),
		ContextTokens:         262144,
		MaxOutputTokens:       262144,
		SpeedRating:           intPointer(9),
		CostRating:            intPointer(8),
		Descriptions: LocalizedModelDescriptions{
			EN: "Fast interactive candidate for card CRUD and topic-set generation with enough context for most libraries.",
			ES: "Candidata rapida para CRUD de tarjetas y generacion de conjuntos por tema, con contexto suficiente para la mayoria de bibliotecas.",
			RU: "Быстрый интерактивный вариант для CRUD карточек и генерации тематических наборов с контекстом, достаточным для большинства библиотек.",
			UK: "Швидкий інтерактивний варіант для CRUD карток і генерації тематичних наборів з контекстом, достатнім для більшості бібліотек.",
		},
	},
	{
		ID:                    "qwen/qwen3.6-flash",
		Label:                 "Qwen3.6 Flash",
		InputPricePerMillion:  floatPointer(0.1875),
		OutputPricePerMillion: floatPointer(1.125),
		ContextTokens:         1000000,
		MaxOutputTokens:       65536,
		SpeedRating:           intPointer(8),
		CostRating:            intPointer(8),
		Descriptions: LocalizedModelDescriptions{
			EN: "Fast Qwen option with a 1M context window; good for responsive card generation and larger prompts.",
			ES: "Opcion Qwen rapida con contexto de 1M; buena para generar tarjetas con respuesta agil y prompts grandes.",
			RU: "Быстрый вариант Qwen с контекстом 1M; хорош для отзывчивой генерации карточек и больших промптов.",
			UK: "Швидкий варіант Qwen з контекстом 1M; добрий для чуйної генерації карток і великих промптів.",
		},
	},
	{
		ID:                    "qwen/qwen3.7-max",
		Label:                 "Qwen3.7 Max",
		InputPricePerMillion:  floatPointer(1.475),
		OutputPricePerMillion: floatPointer(4.425),
		ContextTokens:         1000000,
		MaxOutputTokens:       65536,
		SpeedRating:           intPointer(6),
		CostRating:            intPointer(3),
		Descriptions: LocalizedModelDescriptions{
			EN: "Premium Qwen option for quality checks and nuanced language work when cost is secondary.",
			ES: "Opcion premium de Qwen para revisar calidad y trabajo linguistico fino cuando el coste es secundario.",
			RU: "Премиальный вариант Qwen для проверки качества и тонкой языковой работы, когда стоимость не главное.",
			UK: "Преміальний варіант Qwen для перевірки якості й тонкої мовної роботи, коли вартість не головна.",
		},
	},
	{
		ID:                    "qwen/qwen3.7-plus",
		Label:                 "Qwen3.7 Plus",
		InputPricePerMillion:  floatPointer(0.32),
		OutputPricePerMillion: floatPointer(1.28),
		ContextTokens:         1000000,
		MaxOutputTokens:       65536,
		SpeedRating:           intPointer(7),
		CostRating:            intPointer(7),
		Descriptions: LocalizedModelDescriptions{
			EN: "Strong balanced Qwen model for high-quality translations, examples, and learning recommendations.",
			ES: "Modelo Qwen potente y equilibrado para traducciones de calidad, ejemplos y recomendaciones de aprendizaje.",
			RU: "Сильная сбалансированная модель Qwen для качественных переводов, примеров и учебных рекомендаций.",
			UK: "Сильна збалансована модель Qwen для якісних перекладів, прикладів і навчальних рекомендацій.",
		},
	},
}

func NewHandler(config Config) (http.Handler, error) {
	dbPath := config.DBPath
	if dbPath == "" {
		dbPath = filepath.Join("data", "language-lab.sqlite")
	}
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}
	backupDir := config.BackupDir
	if backupDir == "" {
		backupDir = filepath.Join(filepath.Dir(dbPath), "backups")
	}
	if err := os.MkdirAll(backupDir, 0o755); err != nil {
		return nil, fmt.Errorf("create backup directory: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		db.Close()
		return nil, fmt.Errorf("enable sqlite foreign keys: %w", err)
	}

	server := &Server{
		adminToken:          config.AdminToken,
		backupDir:           backupDir,
		db:                  db,
		dbPath:              dbPath,
		openRouterModelsURL: strings.TrimSpace(config.OpenRouterModelsURL),
	}
	if server.openRouterModelsURL == "" {
		server.openRouterModelsURL = defaultOpenRouterModelsURL
	}
	if err := server.migrate(); err != nil {
		db.Close()
		return nil, err
	}
	if err := server.ensureBackupSettings(); err != nil {
		db.Close()
		return nil, err
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", server.handleHealth)
	mux.HandleFunc("/api/state", server.handleState)
	mux.HandleFunc("/api/users", server.handleUsers)
	mux.HandleFunc("/api/chat", server.handleChat)
	mux.HandleFunc("/api/openrouter/models", server.handleOpenRouterModels)
	mux.HandleFunc("/api/admin/backups", server.handleAdminBackups)
	mux.HandleFunc("/api/admin/backups/settings", server.handleAdminBackupSettings)

	if frontendDir := config.FrontendDir; frontendDir != "" {
		mux.Handle("/", frontendFileServer(frontendDir))
	}

	if config.AdminToken != "" {
		go server.runBackupScheduler()
	}

	return server.withCORS(mux), nil
}

func main() {
	config := Config{
		Addr:                getenv("LANG_LAB_ADDR", "127.0.0.1:8090"),
		AdminToken:          getenv("LANG_LAB_ADMIN_TOKEN", ""),
		BackupDir:           getenv("LANG_LAB_BACKUP_DIR", ""),
		DBPath:              getenv("LANG_LAB_DB_PATH", filepath.Join("data", "language-lab.sqlite")),
		FrontendDir:         getenv("LANG_LAB_FRONTEND_DIR", ""),
		OpenRouterModelsURL: getenv("LANG_LAB_OPENROUTER_MODELS_URL", ""),
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
		response.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-API-Key, X-Admin-Token")
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

func (server *Server) handleOpenRouterModels(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		writeJSON(response, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
		return
	}

	models, err := server.loadOpenRouterModels()
	if err != nil {
		writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(response, http.StatusOK, models)
}

func (server *Server) loadOpenRouterModels() (OpenRouterModelsResponse, error) {
	server.openRouterModelsMu.Lock()
	defer server.openRouterModelsMu.Unlock()

	now := time.Now().UTC()
	if server.openRouterModelsCache != nil {
		expiresAt, err := time.Parse(time.RFC3339, server.openRouterModelsCache.ExpiresAt)
		if err == nil && now.Before(expiresAt) {
			return *server.openRouterModelsCache, nil
		}
	}

	liveData, err := server.fetchOpenRouterModelLiveData()
	if err != nil {
		server.openRouterModelsCacheError = err.Error()
		if server.openRouterModelsCache != nil {
			return *server.openRouterModelsCache, nil
		}
		return buildOpenRouterModelsResponse(nil, now, "fallback"), nil
	}

	result := buildOpenRouterModelsResponse(liveData, now, "openrouter")
	server.openRouterModelsCache = &result
	server.openRouterModelsCacheError = ""
	return result, nil
}

func (server *Server) fetchOpenRouterModelLiveData() (map[string]openRouterModelLiveData, error) {
	request, err := http.NewRequest(http.MethodGet, server.openRouterModelsURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create OpenRouter models request: %w", err)
	}
	request.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("fetch OpenRouter models: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("OpenRouter models request failed with status %d", response.StatusCode)
	}

	var payload struct {
		Data []struct {
			ID            string `json:"id"`
			ContextLength int64  `json:"context_length"`
			Pricing       struct {
				Prompt     string `json:"prompt"`
				Completion string `json:"completion"`
			} `json:"pricing"`
			TopProvider struct {
				ContextLength       int64 `json:"context_length"`
				MaxCompletionTokens int64 `json:"max_completion_tokens"`
			} `json:"top_provider"`
		} `json:"data"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode OpenRouter models: %w", err)
	}

	wanted := map[string]struct{}{}
	for _, model := range openRouterModelCatalog {
		wanted[model.ID] = struct{}{}
	}

	result := map[string]openRouterModelLiveData{}
	for _, model := range payload.Data {
		if _, ok := wanted[model.ID]; !ok {
			continue
		}
		contextTokens := model.ContextLength
		if contextTokens == 0 {
			contextTokens = model.TopProvider.ContextLength
		}
		result[model.ID] = openRouterModelLiveData{
			ContextTokens:         contextTokens,
			MaxOutputTokens:       model.TopProvider.MaxCompletionTokens,
			InputPricePerMillion:  pricePerMillion(model.Pricing.Prompt),
			OutputPricePerMillion: pricePerMillion(model.Pricing.Completion),
		}
	}

	return result, nil
}

func buildOpenRouterModelsResponse(
	liveData map[string]openRouterModelLiveData,
	now time.Time,
	source string,
) OpenRouterModelsResponse {
	models := make([]OpenRouterModelPayload, 0, len(openRouterModelCatalog))
	for _, metadata := range openRouterModelCatalog {
		model := OpenRouterModelPayload{
			ContextTokens:         metadata.ContextTokens,
			CostRating:            metadata.CostRating,
			Descriptions:          metadata.Descriptions,
			ID:                    metadata.ID,
			InputPricePerMillion:  metadata.InputPricePerMillion,
			Label:                 metadata.Label,
			MaxOutputTokens:       metadata.MaxOutputTokens,
			OutputPricePerMillion: metadata.OutputPricePerMillion,
			SpeedRating:           metadata.SpeedRating,
		}
		if live, ok := liveData[metadata.ID]; ok {
			if live.ContextTokens > 0 {
				model.ContextTokens = live.ContextTokens
			}
			if live.MaxOutputTokens > 0 {
				model.MaxOutputTokens = live.MaxOutputTokens
			}
			if live.InputPricePerMillion != nil {
				model.InputPricePerMillion = live.InputPricePerMillion
			}
			if live.OutputPricePerMillion != nil {
				model.OutputPricePerMillion = live.OutputPricePerMillion
			}
		}
		models = append(models, model)
	}

	return OpenRouterModelsResponse{
		CachedAt:  now.Format(time.RFC3339),
		ExpiresAt: now.Add(openRouterModelsCacheTTL).Format(time.RFC3339),
		Models:    models,
		Source:    source,
	}
}

func pricePerMillion(raw string) *float64 {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	value, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return nil
	}
	return floatPointer(value * 1000000)
}

func floatPointer(value float64) *float64 {
	return &value
}

func intPointer(value int) *int {
	return &value
}

func (server *Server) handleAdminBackups(response http.ResponseWriter, request *http.Request) {
	if !server.authorizeAdmin(response, request) {
		return
	}

	switch request.Method {
	case http.MethodGet:
		settings, err := server.loadBackupSettings()
		if err != nil {
			writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		backups, err := server.listBackups()
		if err != nil {
			writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(response, http.StatusOK, BackupListResponse{
			Backups:  backups,
			Settings: settings,
		})
	case http.MethodPost:
		backup, err := server.createBackup("manual")
		if err != nil {
			_ = server.saveBackupRun("", err.Error())
			writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(response, http.StatusCreated, backup)
	default:
		writeJSON(response, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

func (server *Server) handleAdminBackupSettings(response http.ResponseWriter, request *http.Request) {
	if !server.authorizeAdmin(response, request) {
		return
	}

	switch request.Method {
	case http.MethodGet:
		settings, err := server.loadBackupSettings()
		if err != nil {
			writeJSON(response, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(response, http.StatusOK, settings)
	case http.MethodPut:
		var input SaveBackupSettingsRequest
		if err := json.NewDecoder(request.Body).Decode(&input); err != nil {
			writeJSON(response, http.StatusBadRequest, map[string]any{"error": "invalid json body"})
			return
		}
		settings, err := server.saveBackupSettings(input)
		if err != nil {
			writeJSON(response, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		writeJSON(response, http.StatusOK, settings)
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
		`CREATE TABLE IF NOT EXISTS backup_settings (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			enabled INTEGER NOT NULL,
			interval_hours INTEGER NOT NULL,
			last_run_at TEXT,
			next_run_at TEXT,
			last_error TEXT,
			updated_at TEXT NOT NULL
		)`,
	}

	for _, statement := range statements {
		if _, err := server.db.Exec(statement); err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
	}

	migrationStatements := []string{
		`ALTER TABLE app_settings ADD COLUMN assistant_id TEXT DEFAULT ''`,
		`ALTER TABLE app_settings ADD COLUMN open_router_api_key TEXT DEFAULT ''`,
		`ALTER TABLE app_settings ADD COLUMN world_id TEXT DEFAULT ''`,
	}
	for _, statement := range migrationStatements {
		server.db.Exec(statement)
	}
	return nil
}

func (server *Server) ensureBackupSettings() error {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	_, err := server.db.Exec(
		`INSERT OR IGNORE INTO backup_settings (
			id, enabled, interval_hours, last_run_at, next_run_at, last_error, updated_at
		) VALUES (1, 0, 24, NULL, NULL, NULL, ?)`,
		now,
	)
	return err
}

func (server *Server) authorizeAdmin(response http.ResponseWriter, request *http.Request) bool {
	if server.adminToken == "" {
		writeJSON(response, http.StatusServiceUnavailable, map[string]any{
			"error": "admin backups are disabled; set LANG_LAB_ADMIN_TOKEN on the server",
		})
		return false
	}
	if adminTokenFromRequest(request) != server.adminToken {
		writeJSON(response, http.StatusUnauthorized, map[string]any{"error": "admin token is required"})
		return false
	}
	return true
}

func (server *Server) loadBackupSettings() (BackupSettingsPayload, error) {
	var enabled int
	var intervalHours int
	var lastRunAt, nextRunAt, lastError sql.NullString
	err := server.db.QueryRow(
		`SELECT enabled, interval_hours, last_run_at, next_run_at, last_error
		 FROM backup_settings WHERE id = 1`,
	).Scan(&enabled, &intervalHours, &lastRunAt, &nextRunAt, &lastError)
	if errors.Is(err, sql.ErrNoRows) {
		if err := server.ensureBackupSettings(); err != nil {
			return BackupSettingsPayload{}, err
		}
		return server.loadBackupSettings()
	}
	if err != nil {
		return BackupSettingsPayload{}, err
	}
	return BackupSettingsPayload{
		BackupDir:     server.backupDir,
		Enabled:       enabled != 0,
		IntervalHours: intervalHours,
		LastError:     lastError.String,
		LastRunAt:     lastRunAt.String,
		NextRunAt:     nextRunAt.String,
	}, nil
}

func (server *Server) saveBackupSettings(input SaveBackupSettingsRequest) (BackupSettingsPayload, error) {
	intervalHours := input.IntervalHours
	if intervalHours < 1 || intervalHours > 24*365 {
		return BackupSettingsPayload{}, fmt.Errorf("intervalHours must be between 1 and 8760")
	}

	now := time.Now().UTC()
	nextRunAt := any(nil)
	if input.Enabled {
		nextRunAt = now.Add(time.Duration(intervalHours) * time.Hour).Format(time.RFC3339Nano)
	}
	if _, err := server.db.Exec(
		`UPDATE backup_settings
		 SET enabled = ?, interval_hours = ?, next_run_at = ?, last_error = NULL, updated_at = ?
		 WHERE id = 1`,
		boolToInt(input.Enabled),
		intervalHours,
		nextRunAt,
		now.Format(time.RFC3339Nano),
	); err != nil {
		return BackupSettingsPayload{}, err
	}
	return server.loadBackupSettings()
}

func (server *Server) listBackups() ([]BackupFilePayload, error) {
	entries, err := os.ReadDir(server.backupDir)
	if err != nil {
		return nil, err
	}

	backups := []BackupFilePayload{}
	for _, entry := range entries {
		if entry.IsDir() || !isBackupFileName(entry.Name()) {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			return nil, err
		}
		backups = append(backups, BackupFilePayload{
			CreatedAt: info.ModTime().UTC().Format(time.RFC3339Nano),
			Name:      entry.Name(),
			Path:      filepath.Join(server.backupDir, entry.Name()),
			SizeBytes: info.Size(),
		})
	}
	sort.Slice(backups, func(left, right int) bool {
		return backups[left].CreatedAt > backups[right].CreatedAt
	})
	return backups, nil
}

func (server *Server) createBackup(_ string) (BackupFilePayload, error) {
	server.backupMu.Lock()
	defer server.backupMu.Unlock()

	if err := os.MkdirAll(server.backupDir, 0o755); err != nil {
		return BackupFilePayload{}, err
	}
	if _, err := os.Stat(server.dbPath); err != nil {
		return BackupFilePayload{}, fmt.Errorf("database is not available for backup: %w", err)
	}

	_ = server.db.QueryRow(`PRAGMA wal_checkpoint(FULL)`).Err()
	backupPath := server.nextBackupPath()
	if _, err := server.db.Exec(`VACUUM INTO ?`, backupPath); err != nil {
		return BackupFilePayload{}, fmt.Errorf("create sqlite backup: %w", err)
	}
	info, err := os.Stat(backupPath)
	if err != nil {
		return BackupFilePayload{}, err
	}
	createdAt := time.Now().UTC().Format(time.RFC3339Nano)
	if err := server.saveBackupRun(createdAt, ""); err != nil {
		return BackupFilePayload{}, err
	}
	return BackupFilePayload{
		CreatedAt: createdAt,
		Name:      filepath.Base(backupPath),
		Path:      backupPath,
		SizeBytes: info.Size(),
	}, nil
}

func (server *Server) saveBackupRun(lastRunAt string, lastError string) error {
	settings, err := server.loadBackupSettings()
	if err != nil {
		return err
	}
	nextRunAt := any(nil)
	if settings.Enabled {
		nextRunAt = time.Now().UTC().Add(time.Duration(settings.IntervalHours) * time.Hour).Format(time.RFC3339Nano)
	}
	lastRunValue := any(nil)
	if lastRunAt != "" {
		lastRunValue = lastRunAt
	} else if settings.LastRunAt != "" {
		lastRunValue = settings.LastRunAt
	}
	lastErrorValue := any(nil)
	if lastError != "" {
		lastErrorValue = lastError
	}
	_, err = server.db.Exec(
		`UPDATE backup_settings
		 SET last_run_at = ?, next_run_at = ?, last_error = ?, updated_at = ?
		 WHERE id = 1`,
		lastRunValue,
		nextRunAt,
		lastErrorValue,
		time.Now().UTC().Format(time.RFC3339Nano),
	)
	return err
}

func (server *Server) nextBackupPath() string {
	now := time.Now().UTC()
	baseName := "language-lab-" + now.Format("20060102T150405Z")
	for index := 0; ; index++ {
		name := baseName + ".sqlite"
		if index > 0 {
			name = fmt.Sprintf("%s-%02d.sqlite", baseName, index)
		}
		path := filepath.Join(server.backupDir, name)
		if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
			return path
		}
	}
}

func (server *Server) runBackupScheduler() {
	timer := time.NewTimer(10 * time.Second)
	defer timer.Stop()
	for {
		<-timer.C
		if err := server.runScheduledBackupIfDue(); err != nil {
			log.Printf("scheduled backup failed: %v", err)
		}
		timer.Reset(time.Minute)
	}
}

func (server *Server) runScheduledBackupIfDue() error {
	settings, err := server.loadBackupSettings()
	if err != nil {
		return err
	}
	if !settings.Enabled {
		return nil
	}
	if settings.NextRunAt == "" {
		_, err := server.saveBackupSettings(SaveBackupSettingsRequest{
			Enabled:       true,
			IntervalHours: settings.IntervalHours,
		})
		return err
	}
	nextRunAt, err := time.Parse(time.RFC3339Nano, settings.NextRunAt)
	if err != nil {
		return server.saveBackupRun("", fmt.Sprintf("invalid next run time: %v", err))
	}
	if time.Now().UTC().Before(nextRunAt) {
		return nil
	}
	if _, err := server.createBackup("scheduled"); err != nil {
		_ = server.saveBackupRun("", err.Error())
		return err
	}
	return nil
}

func isBackupFileName(name string) bool {
	return strings.HasPrefix(name, "language-lab-") && strings.HasSuffix(name, ".sqlite")
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
			new_card_mix_frequency_percent, recent_mistake_repeat_frequency_percent,
			assistant_id, open_router_api_key, world_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
		nullString(settings.AssistantID),
		nullString(settings.OpenRouterAPIKey),
		nullString(settings.WorldID),
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
	var assistantID, openRouterAPIKey, worldID sql.NullString
	err := runner.QueryRow(
		`SELECT interface_language, target_language, selected_card_set_id, display_name, is_anonymous,
			cooldown_three, cooldown_four, cooldown_five_plus,
			new_card_mix_frequency_percent, recent_mistake_repeat_frequency_percent,
			assistant_id, open_router_api_key, world_id
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
		&assistantID,
		&openRouterAPIKey,
		&worldID,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return settings, nil
	}
	if err != nil {
		return SettingsPayload{}, err
	}
	settings.SelectedCardSetID = selectedCardSetID.String
	settings.AssistantID = assistantID.String
	settings.OpenRouterAPIKey = openRouterAPIKey.String
	settings.WorldID = worldID.String
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

func adminTokenFromRequest(request *http.Request) string {
	if value := strings.TrimSpace(request.Header.Get("X-Admin-Token")); value != "" {
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
