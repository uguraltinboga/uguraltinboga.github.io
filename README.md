# 🕌 Cami Bulucu — GitHub Pages PWA

Konuma ve güzergaha göre en beğenilen camileri haritada listeleyen PWA uygulaması.

---

## 📁 Dosya Yapısı

```
cami-bulucu/
├── index.html          ← Ana sayfa (HTML iskeleti)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (offline cache)
├── css/
│   ├── style.css       ← Kaynak CSS (düzenleme için)
│   └── style.min.css   ← Minify edilmiş CSS (üretim)
├── js/
│   ├── main.js         ← Kaynak JS (düzenleme için)
│   └── main.min.js     ← Minify edilmiş JS (üretim)
└── icons/
    ├── icon-192.png    ← PWA ikonu (Android)
    └── icon-512.png    ← PWA ikonu (Splash screen)
```

---

## 🔑 Google API Key Kurulumu

### 1. Key oluştur
[Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create Credentials → API Key

### 2. API'leri etkinleştir
- Maps JavaScript API
- Places API (New)
- Routes API
- Geocoding API

### 3. Key kısıtlamalarını ekle ⚠️ (ÖNEMLİ)
- **Application restrictions** → HTTP referrers
- **Website restrictions** ekle:
  ```
  https://KULLANICIADINIZ.github.io/*
  ```
- **API restrictions** → Restrict key → yukarıdaki 4 API'yi seç

### 4. Key'i dosyaya ekle
`js/main.js` dosyasında (ve `js/main.min.js` içinde):
```js
const GOOGLE_API_KEY = 'BURAYA_GERCEK_KEY_YAZIN';
```

---

## 🚀 GitHub Pages'e Yükleme

```bash
# 1. GitHub'da yeni repo oluştur: cami-bulucu

# 2. Dosyaları yükle
git init
git add .
git commit -m "İlk sürüm"
git remote add origin https://github.com/KULLANICIADINIZ/cami-bulucu.git
git push -u origin main

# 3. GitHub Pages'i etkinleştir
# Repo → Settings → Pages → Source: main branch / root
```

Uygulaman `https://KULLANICIADINIZ.github.io/cami-bulucu/` adresinde yayına girer.

---

## 📱 Telefona Kurulum (PWA)

### Android (Chrome)
1. Siteyi Chrome'da aç
2. Sağ üst menü → "Ana ekrana ekle"
3. Uygulama gibi kullanılabilir

### iOS (Safari)
1. Siteyi Safari'de aç
2. Alt ortadaki paylaş butonu → "Ana Ekrana Ekle"
3. Uygulama gibi kullanılabilir

---

## 🔒 Güvenlik Notu

API key tarayıcı uygulamalarında her zaman görünürdür. 
**Asıl güvenlik Google Cloud Console'daki HTTP Referrer kısıtlamasından gelir.**
Key'ini yalnızca `github.io` domain'inize kısıtla.
