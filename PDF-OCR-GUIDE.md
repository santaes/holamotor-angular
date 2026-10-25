# PDF OCR & Translation Solution

## Overview

This solution adds the ability to upload diagnostic PDF files to customers and vehicles, with OCR text extraction and multi-language translation capabilities.

## Architecture

### Components

1. **LibreTranslate (Docker)**
   - Self-hosted translation service running on Orange Pi
   - ARM64 optimized (218MB image)
   - Supports 10 languages: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Arabic
   - Runs on port 5000 internally

2. **Tesseract.js (Client-side)**
   - OCR processing runs in the browser
   - Offloads heavy processing to client devices
   - Supports English and Spanish OCR out of the box
   - Can be extended with additional language packs

3. **PDF Storage (Server)**
   - Files stored in `/data/pdfs/` directory
   - Unique filenames with timestamps
   - Max file size: 50MB
   - Accessible via `/api/pdf/{filename}`

4. **Translation API (Server)**
   - Proxies requests to LibreTranslate
   - Auto-detects source language
   - Returns translated text with metadata

## Deployment to Orange Pi

### Step 1: Update the Code

```bash
# On Windows
cd C:\Users\TEMP.LAPTOP-C42MBD7L.000\Desktop\holamotor-angular
git add .
git commit -m "Add PDF OCR and translation support"
git push
```

### Step 2: Deploy to Orange Pi

```bash
# SSH into Orange Pi
ssh root@100.96.75.45

# Pull latest code
cd /opt/holamotor
git pull

# Rebuild and restart with LibreTranslate
docker-compose down
docker-compose up -d --build
```

### Step 3: Verify Services

```bash
# Check if both services are running
docker-compose ps

# Check LibreTranslate logs
docker-compose logs libretranslate

# Check main app logs
docker-compose logs holamotor
```

### Step 4: Test Translation

```bash
# Test LibreTranslate API
curl -X POST http://100.96.75.45:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"q": "Hello world", "source": "en", "target": "es"}'
```

## Usage

### For Customers

1. Navigate to customer detail page
2. Click on "Documentos" tab
3. Upload a PDF file
4. Optionally extract text using OCR
5. Translate extracted text to desired language

### Features

- **PDF Upload**: Drag & drop or click to select PDF files
- **OCR Extraction**: Extract text from scanned PDFs using Tesseract.js
- **Translation**: Translate extracted text to 10 supported languages
- **Progress Tracking**: Real-time progress indicators for OCR and upload
- **File Management**: Clear and re-upload files as needed

## Supported Languages

**Translation (LibreTranslate):**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Chinese (zh)
- Arabic (ar)

**OCR (Tesseract.js):**
- English (eng)
- Spanish (spa)
- Can be extended with additional language packs

## Performance Considerations

### Orange Pi Resource Usage

- **LibreTranslate**: ~500MB RAM with loaded models
- **Main App**: ~200MB RAM
- **Total**: ~700MB RAM (well within 4GB limit)

### Client-Side OCR

- Runs in user's browser
- No server load for OCR processing
- Performance depends on client device
- Typically 5-30 seconds per page

### Translation Speed

- LibreTranslate is optimized for ARM64
- Average translation: 1-3 seconds per paragraph
- Longer documents may take more time

## Troubleshooting

### LibreTranslate Not Starting

```bash
# Check logs
docker-compose logs libretranslate

# Restart LibreTranslate
docker-compose restart libretranslate

# Rebuild if needed
docker-compose up -d --build libretranslate
```

### PDF Upload Fails

- Check file size (max 50MB)
- Verify `/data/pdfs/` directory exists
- Check server logs: `docker-compose logs holamotor`

### OCR Not Working

- Verify Tesseract.js is installed in package.json
- Check browser console for errors
- Ensure PDF is not password-protected

### Translation Fails

- Verify LibreTranslate is running: `curl http://localhost:5000`
- Check server logs for translation errors
- Verify language codes are valid

## Extending the Solution

### Add More OCR Languages

```bash
# In browser console, download additional language data
Tesseract.recognize(file, 'eng+spa+fra+deu', options)
```

### Add More Translation Languages

Edit `docker-compose.yml`:
```yaml
environment:
  - LT_LOAD_ONLY=en,es,fr,de,it,pt,ru,ja,zh,ar,ko,nl,pl,tr
```

### Increase File Size Limit

Edit `server/index.js`:
```javascript
const MAX_BODY = 100 * 1024 * 1024; // 100MB
```

## Security Notes

- PDFs are stored locally on Orange Pi
- No external API calls for translation (LibreTranslate is self-hosted)
- OCR runs client-side (no server processing)
- All data stays within your Tailscale network
- Accessible only via Tailscale VPN

## Future Enhancements

- [ ] Add PDF preview/thumbnail generation
- [ ] Store extracted text in customer/vehicle records
- [ ] Batch processing for multiple PDFs
- [ ] Export translated PDFs
- [ ] Add more OCR languages
- [ ] Implement document categorization
- [ ] Add search across all PDFs
