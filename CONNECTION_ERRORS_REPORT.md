# Connection & API Error Report

## 🔍 Issues Found

### 1. **QuizPage.tsx** - Missing Error Display
**File:** [src/pages/QuizPage.tsx](src/pages/QuizPage.tsx#L37)  
**Problem:** Error is caught but only logged to console, not displayed to user
```typescript
} catch (error) {
  console.error(error)  // ❌ User never sees this error
}
```
**Impact:** Users won't know if quiz generation fails  
**Fix:** Display error message in UI or show fallback UI

---

### 2. **GraderPage.tsx** - Generic Error Message
**File:** [src/pages/GraderPage.tsx](src/pages/GraderPage.tsx#L41)  
**Problem:** No proper error handling or user feedback for grading failures
```typescript
} catch (error) {
  console.error(error)
  setStatus('Grading failed. Please try again.')
  setIsGrading(false)
}
```
**Impact:** Users don't know what went wrong  
**Fix:** Add specific error messages based on error type

---

### 3. **TutorPage.tsx** - Graceful but Silent Error
**File:** [src/pages/TutorPage.tsx](src/pages/TutorPage.tsx#L27)  
**Problem:** Shows generic error message instead of specific details
```typescript
} catch (error) {
  console.error(error)
  setMessages([...newMessages, { 
    role: 'assistant', 
    content: "Sorry, I encountered an error. Please try again later." 
  }])
}
```
**Impact:** Users can't troubleshoot; doesn't distinguish between network vs server errors  
**Fix:** Parse error details and provide meaningful feedback

---

### 4. **UploadPage.tsx** - Incomplete Error Information
**File:** [src/pages/UploadPage.tsx](src/pages/UploadPage.tsx#L63)  
**Problem:** Generic error message on upload failure
```typescript
} catch (err: any) {
  console.error("Upload Error:", err)
  setError(err.message || 'Failed to upload material. Please ensure your PDF is readable.')
  setStatus('Upload failed.')
  setIsUploading(false)
}
```
**Impact:** Users get vague error  
**Fix:** Add timeout handling and retry logic

---

### 5. **API Base URL Configuration** - Hardcoded Localhost
**File:** [src/lib/api.ts](src/lib/api.ts#L1)  
**Problem:** API URL defaults to `http://127.0.0.1:8000` - not ideal for production
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
```
**Impact:** Will fail if backend is not running locally  
**Fix:** Add better fallback and error messaging for network unavailability

---

### 6. **QuizPage.tsx** - No Error State UI
**File:** [src/pages/QuizPage.tsx](src/pages/QuizPage.tsx#L28)  
**Problem:** No error state to display to user when quiz generation fails
```typescript
const [isLoading, setIsLoading] = useState(true)
// ❌ No error state defined
```
**Impact:** User sees infinite loading spinner if API fails  
**Fix:** Add error UI with retry button

---

### 7. **Missing Network Error Recovery**
**Files:** All pages calling API  
**Problem:** No retry logic or offline detection across all API calls
**Impact:** Single network hiccup breaks the entire feature  
**Fix:** Implement retry mechanism with exponential backoff

---

### 8. **AuthPage.tsx** - Swallowed Upload Error**
**File:** [src/pages/AuthPage.tsx](src/pages/AuthPage.tsx#L69)  
**Problem:** Upload error is caught but silently ignored
```typescript
} catch (uploadError: any) {
  console.error("Optional upload failed:", uploadError)
  // User never sees this happened
}
```
**Impact:** User thinks upload succeeded when it failed  
**Fix:** Notify user about upload failure while allowing them to proceed

---

## 📊 Summary

| Page | Issue | Severity | Type |
|------|-------|----------|------|
| QuizPage | No user error display, no error state | 🔴 High | UX |
| GraderPage | Generic error, no specific handling | 🟡 Medium | UX |
| TutorPage | Vague error message | 🟡 Medium | UX |
| UploadPage | No timeout/retry logic | 🟡 Medium | Resilience |
| api.ts | Hardcoded localhost, no fallback | 🔴 High | Config |
| AuthPage | Silent upload failure | 🟡 Medium | UX |
| All Pages | No retry mechanism | 🟡 Medium | Resilience |
| All Pages | No offline detection | 🟠 Low | Optional |

## ✅ Recommendations

1. **Add error states** to all pages using API calls
2. **Implement common error handler** utility function
3. **Add retry logic** with exponential backoff
4. **Improve configuration** for different environments
5. **Add request timeouts** to API calls
6. **Implement offline detection** for better UX
7. **Add logging/analytics** for debugging production issues
