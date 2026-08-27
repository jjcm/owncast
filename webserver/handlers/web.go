package handlers

import (
	"bytes"
	"io"
	"mime"
	"net/http"
	"path"
	"strings"
	"sync"

	"github.com/andybalholm/brotli"

	"github.com/owncast/owncast/static"
)

var staticServer = http.FileServer(http.FS(static.GetWeb()))

// precompressedCache holds embedded static assets compressed once at maximum
// brotli quality, keyed by request path. The embedded filesystem is immutable
// for the lifetime of the process, so entries never need invalidation.
var precompressedCache sync.Map

// precompressibleExtensions are the embedded asset types worth compressing.
// Fonts and raster images are already compressed formats and are skipped.
var precompressibleExtensions = map[string]bool{
	".js":   true,
	".css":  true,
	".json": true,
	".svg":  true,
	".txt":  true,
	".html": true,
}

// serveWeb will serve web assets.
func serveWeb(w http.ResponseWriter, r *http.Request) {
	if servePrecompressed(w, r) {
		return
	}
	staticServer.ServeHTTP(w, r)
}

// servePrecompressed serves a maximum-quality brotli representation of an
// embedded static asset when the client accepts it. Returns false when the
// request should fall through to the regular file server (and its runtime
// compression middleware) instead.
func servePrecompressed(w http.ResponseWriter, r *http.Request) bool {
	if r.Method != http.MethodGet {
		return false
	}

	if !strings.Contains(r.Header.Get("Accept-Encoding"), "br") {
		return false
	}

	requestPath := path.Clean(r.URL.Path)
	ext := strings.ToLower(path.Ext(requestPath))
	if !precompressibleExtensions[ext] {
		return false
	}

	compressed, ok := precompressedCache.Load(requestPath)
	if !ok {
		file, err := static.GetWeb().Open(strings.TrimPrefix(requestPath, "/"))
		if err != nil {
			return false
		}
		defer file.Close()

		contents, err := io.ReadAll(file)
		if err != nil {
			return false
		}

		var buf bytes.Buffer
		writer := brotli.NewWriterLevel(&buf, brotli.BestCompression)
		if _, err := writer.Write(contents); err != nil {
			return false
		}
		if err := writer.Close(); err != nil {
			return false
		}
		compressed, _ = precompressedCache.LoadOrStore(requestPath, buf.Bytes())
	}

	contentType := mime.TypeByExtension(ext)
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}
	w.Header().Set("Content-Encoding", "br")
	w.Header().Add("Vary", "Accept-Encoding")
	_, _ = w.Write(compressed.([]byte))

	return true
}
