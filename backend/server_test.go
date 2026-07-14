package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func TestStateRoundTripPersistsNormalizedSQLiteEntities(t *testing.T) {
	server, dbPath := newTestHTTPServer(t)
	defer server.Close()

	apiKey := createTestUser(t, server)
	initial := requestJSON(t, server, http.MethodGet, "/api/state", apiKey, nil, http.StatusOK)
	initialRevision := intFromJSONNumber(t, initial["revision"])

	state := sampleState()
	saveResponse := requestJSON(
		t,
		server,
		http.MethodPut,
		"/api/state",
		apiKey,
		map[string]any{
			"baseRevision": initialRevision,
			"state":        state,
		},
		http.StatusOK,
	)
	if intFromJSONNumber(t, saveResponse["revision"]) != initialRevision+1 {
		t.Fatalf("expected save to advance revision from %d to %d, got %v", initialRevision, initialRevision+1, saveResponse["revision"])
	}

	loaded := requestJSON(t, server, http.MethodGet, "/api/state", apiKey, nil, http.StatusOK)
	assertJSONEqual(t, loaded["state"], state)

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open sqlite db: %v", err)
	}
	defer db.Close()

	assertTableCount(t, db, "users", 1)
	assertTableCount(t, db, "app_settings", 1)
	assertTableCount(t, db, "complementary_languages", 2)
	assertTableCount(t, db, "cards", 2)
	assertTableCount(t, db, "card_translations", 5)
	assertTableCount(t, db, "card_definitions", 1)
	assertTableCount(t, db, "card_examples", 1)
	assertTableCount(t, db, "card_tags", 2)
	assertTableCount(t, db, "card_known_languages", 1)
	assertTableCount(t, db, "card_sets", 1)
	assertTableCount(t, db, "card_set_names", 1)
	assertTableCount(t, db, "card_set_cards", 2)
	assertTableCount(t, db, "exercise_attempts", 1)
	assertTableCount(t, db, "attempt_card_snapshots", 1)
	assertTableCount(t, db, "attempt_prompts", 1)
	assertTableCount(t, db, "attempt_prompt_hints", 1)
	assertTableCount(t, db, "attempt_answers", 1)
	assertTableCount(t, db, "attempt_correctness", 1)
	assertTableCount(t, db, "attempt_hints_used", 1)
	assertTableCount(t, db, "card_stats", 1)
}

func TestStateRequiresApiKey(t *testing.T) {
	server, _ := newTestHTTPServer(t)
	defer server.Close()

	requestJSON(t, server, http.MethodGet, "/api/state", "", nil, http.StatusUnauthorized)
	requestJSON(t, server, http.MethodGet, "/api/state", "unknown-token", nil, http.StatusUnauthorized)
	requestJSON(
		t,
		server,
		http.MethodPut,
		"/api/state",
		"",
		map[string]any{"baseRevision": 0, "state": sampleState()},
		http.StatusUnauthorized,
	)
}

func TestStateRejectsStaleRevision(t *testing.T) {
	server, _ := newTestHTTPServer(t)
	defer server.Close()

	apiKey := createTestUser(t, server)
	initial := requestJSON(t, server, http.MethodGet, "/api/state", apiKey, nil, http.StatusOK)
	initialRevision := intFromJSONNumber(t, initial["revision"])

	requestJSON(
		t,
		server,
		http.MethodPut,
		"/api/state",
		apiKey,
		map[string]any{"baseRevision": initialRevision, "state": sampleState()},
		http.StatusOK,
	)

	conflict := requestJSON(
		t,
		server,
		http.MethodPut,
		"/api/state",
		apiKey,
		map[string]any{"baseRevision": initialRevision, "state": sampleState()},
		http.StatusConflict,
	)
	if intFromJSONNumber(t, conflict["currentRevision"]) != initialRevision+1 {
		t.Fatalf("expected current revision %d in conflict response, got %v", initialRevision+1, conflict["currentRevision"])
	}
}

func TestCreateUserReturnsTokenAndStoresInitialState(t *testing.T) {
	server, dbPath := newTestHTTPServer(t)
	defer server.Close()

	initialState := sampleState()
	created := requestJSON(
		t,
		server,
		http.MethodPost,
		"/api/users",
		"",
		map[string]any{"state": initialState},
		http.StatusCreated,
	)
	apiKey, ok := created["apiKey"].(string)
	if !ok || len(apiKey) < 32 {
		t.Fatalf("expected generated api key in response, got %v", created["apiKey"])
	}
	if intFromJSONNumber(t, created["revision"]) != 0 {
		t.Fatalf("expected new user revision 0, got %v", created["revision"])
	}

	loaded := requestJSON(t, server, http.MethodGet, "/api/state", apiKey, nil, http.StatusOK)
	assertJSONEqual(t, loaded["state"], initialState)

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open sqlite db: %v", err)
	}
	defer db.Close()
	assertTableCount(t, db, "users", 1)

	var cleartextMatches int
	if err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE api_key_hash = ?`, apiKey).Scan(&cleartextMatches); err != nil {
		t.Fatalf("count cleartext api key matches: %v", err)
	}
	if cleartextMatches != 0 {
		t.Fatalf("api key was stored in clear text")
	}
}

func newTestHTTPServer(t *testing.T) (*httptest.Server, string) {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "language-lab.sqlite")
	handler, err := NewHandler(Config{DBPath: dbPath})
	if err != nil {
		t.Fatalf("create handler: %v", err)
	}
	return httptest.NewServer(handler), dbPath
}

func createTestUser(t *testing.T, server *httptest.Server) string {
	t.Helper()

	created := requestJSON(
		t,
		server,
		http.MethodPost,
		"/api/users",
		"",
		map[string]any{"state": sampleState()},
		http.StatusCreated,
	)
	apiKey, ok := created["apiKey"].(string)
	if !ok || apiKey == "" {
		t.Fatalf("expected created api key, got %v", created["apiKey"])
	}
	return apiKey
}

func requestJSON(
	t *testing.T,
	server *httptest.Server,
	method string,
	path string,
	apiKey string,
	payload any,
	expectedStatus int,
) map[string]any {
	t.Helper()

	var body bytes.Buffer
	if payload != nil {
		if err := json.NewEncoder(&body).Encode(payload); err != nil {
			t.Fatalf("encode request body: %v", err)
		}
	}
	request, err := http.NewRequest(method, server.URL+path, &body)
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	if payload != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if apiKey != "" {
		request.Header.Set("X-API-Key", apiKey)
	}

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatalf("send request: %v", err)
	}
	defer response.Body.Close()

	if response.StatusCode != expectedStatus {
		t.Fatalf("expected HTTP %d, got %d", expectedStatus, response.StatusCode)
	}

	var decoded map[string]any
	if err := json.NewDecoder(response.Body).Decode(&decoded); err != nil {
		t.Fatalf("decode response body: %v", err)
	}
	return decoded
}

func assertTableCount(t *testing.T, db *sql.DB, table string, expected int) {
	t.Helper()

	var actual int
	if err := db.QueryRow("SELECT COUNT(*) FROM " + table).Scan(&actual); err != nil {
		t.Fatalf("count %s: %v", table, err)
	}
	if actual != expected {
		t.Fatalf("expected %s to contain %d rows, got %d", table, expected, actual)
	}
}

func assertJSONEqual(t *testing.T, actual any, expected any) {
	t.Helper()

	actualJSON, err := json.Marshal(actual)
	if err != nil {
		t.Fatalf("marshal actual value: %v", err)
	}
	expectedJSON, err := json.Marshal(expected)
	if err != nil {
		t.Fatalf("marshal expected value: %v", err)
	}
	if !bytes.Equal(actualJSON, expectedJSON) {
		t.Fatalf("JSON mismatch\nactual:   %s\nexpected: %s", actualJSON, expectedJSON)
	}
}

func intFromJSONNumber(t *testing.T, value any) int {
	t.Helper()

	number, ok := value.(float64)
	if !ok {
		t.Fatalf("expected JSON number, got %T", value)
	}
	return int(number)
}

func sampleState() map[string]any {
	return map[string]any{
		"settings": map[string]any{
			"interfaceLanguage": "ru",
			"targetLanguage":    "en",
			"selectedCardSetId": "set-travel",
			"playerProfile": map[string]any{
				"displayName": "Ilya",
				"isAnonymous": false,
			},
			"practiceSettings": map[string]any{
				"correctStreakCooldownMonths": map[string]any{
					"three":    1.5,
					"four":     3,
					"fivePlus": 6,
				},
				"newCardMixFrequencyPercent":          25,
				"recentMistakeRepeatFrequencyPercent": 45,
			},
			"complementaryLanguages": map[string]any{
				"en": []any{"ru", "es"},
			},
		},
		"cards": []any{
			map[string]any{
				"id": "card-hello",
				"translations": map[string]any{
					"en": "hello",
					"ru": "привет",
					"es": "hola",
				},
				"definitions": map[string]any{
					"en": "A greeting.",
				},
				"examples": map[string]any{
					"en": []any{
						map[string]any{
							"sentence": "Say hello.",
							"answer":   "hello",
						},
					},
				},
				"tags":                 []any{"basic", "spoken"},
				"difficulty":           "easy",
				"knownTargetLanguages": []any{"en"},
				"createdAt":            "2026-07-14T10:00:00.000Z",
				"updatedAt":            "2026-07-14T10:01:00.000Z",
			},
			map[string]any{
				"id": "card-thanks",
				"translations": map[string]any{
					"en": "thanks",
					"ru": "спасибо",
				},
				"createdAt": "2026-07-14T10:02:00.000Z",
				"updatedAt": "2026-07-14T10:03:00.000Z",
			},
		},
		"cardSets": []any{
			map[string]any{
				"id":   "set-travel",
				"name": "Travel",
				"names": map[string]any{
					"ru": "Путешествия",
				},
				"cardIds":   []any{"card-hello", "card-thanks"},
				"createdAt": "2026-07-14T10:04:00.000Z",
				"updatedAt": "2026-07-14T10:05:00.000Z",
			},
		},
		"attempts": []any{
			map[string]any{
				"id":                "attempt-1",
				"exerciseSessionId": "session-1",
				"exerciseType":      "multipleChoice",
				"cardSetId":         "set-travel",
				"targetLanguage":    "en",
				"createdAt":         "2026-07-14T10:06:00.000Z",
				"completedAt":       "2026-07-14T10:06:10.000Z",
				"cardSnapshots": []any{
					map[string]any{
						"id": "card-hello",
						"translations": map[string]any{
							"en": "hello",
							"ru": "привет",
						},
						"difficulty": "easy",
					},
				},
				"prompts": []any{
					map[string]any{
						"cardId":         "card-hello",
						"prompt":         "ru: привет",
						"expectedAnswer": "hello",
						"translationHints": []any{
							map[string]any{"language": "ru", "value": "привет"},
						},
					},
				},
				"answers":             map[string]any{"card-hello": "hello"},
				"correctness":         map[string]any{"card-hello": true},
				"hintsUsed":           map[string]any{"card-hello": 1},
				"isExerciseCompleted": true,
				"weightedScore":       1,
			},
		},
		"stats": []any{
			map[string]any{
				"cardId":          "card-hello",
				"targetLanguage":  "en",
				"attempts":        1,
				"correct":         1,
				"incorrect":       0,
				"hintsUsed":       1,
				"accuracy":        1,
				"recentMistakes":  0,
				"lastPracticedAt": "2026-07-14T10:06:10.000Z",
				"stability":       "new",
			},
		},
	}
}
