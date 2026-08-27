let mevcutEnlem = 39.93;
let mevcutBoylam = 32.85;

// 1. CANLI SAAT VE TARİH
function saatiGuncelle() {
    const simdi = new Date();
    document.getElementById("saat").innerText = simdi.toLocaleTimeString("tr-TR");
    const secenekler = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById("tarih").innerText = simdi.toLocaleDateString("tr-TR", secenekler);
}
setInterval(saatiGuncelle, 1000);
saatiGuncelle();

// Manuel Fotoğraf Yükleme Kontrolü
document.getElementById("bgFile").addEventListener("change", (e) => {
    const dosya = e.target.files[0];
    if (dosya) {
        const okuyucu = new FileReader();
        okuyucu.onload = function(event) {
            document.body.style.backgroundImage = `url('${event.target.result}')`;
        };
        okuyucu.readAsDataURL(dosya);
    }
});

// Enter Tuşu ile Arama
document.getElementById("sehirInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sehirAra();
    }
});

// 2. ŞEHRİN SEMBOLİK YERİNİN FOTOĞRAFINI ÇEKME (Wikimedia API)
function sembolikResimGetir(sehirAdi) {
    // Wikipedia API üzerinden şehrin kapak/sembol fotoğrafını çeker
    const wikiUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sehirAdi)}`;

    fetch(wikiUrl)
        .then(res => res.json())
        .then(data => {
            if (data.originalimage && data.originalimage.source) {
                // Şehrin simge görselini arka plana uygula
                const img = new Image();
                img.src = data.originalimage.source;
                img.onload = () => {
                    document.body.style.backgroundImage = `url('${img.src}')`;
                };
            } else {
                // Türkçe Vikipedi'de bulunamazsa İngilizce Vikipediden simge yapı ara
                ingilizceWikiResimGetir(sehirAdi);
            }
        })
        .catch(() => {
            ingilizceWikiResimGetir(sehirAdi);
        });
}

function ingilizceWikiResimGetir(sehirAdi) {
    const wikiUrlEn = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sehirAdi)}`;
    fetch(wikiUrlEn)
        .then(res => res.json())
        .then(data => {
            if (data.originalimage && data.originalimage.source) {
                document.body.style.backgroundImage = `url('${data.originalimage.source}')`;
            } else {
                // Yedek HD Şehir Manzarası
                document.body.style.backgroundImage = `url('https://picsum.photos/1920/1080?blur=1')`;
            }
        })
        .catch(() => {
            document.body.style.backgroundImage = `url('https://picsum.photos/1920/1080?blur=1')`;
        });
}

// 3. ŞEHİR ARAMA (Geocoding API)
function sehirAra() {
    const sehirAdi = document.getElementById("sehirInput").value.trim();
    if (sehirAdi === "") return;

    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sehirAdi)}&count=1&language=tr&format=json`)
        .then(res => res.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const konum = data.results[0];
                mevcutEnlem = konum.latitude;
                mevcutBoylam = konum.longitude;
                
                document.getElementById("sehir").innerText = konum.name;
                havaDurumuGetir(mevcutEnlem, mevcutBoylam);
                
                // Şehrin simge görselini getir
                sembolikResimGetir(konum.name);
                
                document.getElementById("sehirInput").value = "";
            } else {
                alert("Şehir bulunamadı!");
            }
        })
        .catch(() => alert("Şehir aranırken hata oluştu."));
}

// 4. DETAYLI HAVA DURUMU BİLGİLERİ (API)
function havaDurumuGetir(enlem, boylam) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${enlem}&longitude=${boylam}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=sunrise,sunset,uv_index_max&timezone=auto`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const anlik = data.current;
            const gunluk = data.daily;

            document.getElementById("sicaklik").innerText = `${Math.round(anlik.temperature_2m)}°C`;
            document.getElementById("hissedilen").innerText = `${Math.round(anlik.apparent_temperature)} °C`;
            document.getElementById("nem").innerText = `%${anlik.relative_humidity_2m}`;
            document.getElementById("ruzgar").innerText = `${Math.round(anlik.wind_speed_10m)} km/s`;
            
            document.getElementById("uv").innerText = gunluk.uv_index_max[0];
            
            const gundogumuSaat = gunluk.sunrise[0].split("T")[1];
            const gunbatimiSaat = gunluk.sunset[0].split("T")[1];
            document.getElementById("gundogumu").innerText = gundogumuSaat;
            document.getElementById("gunbatimi").innerText = gunbatimiSaat;

            document.getElementById("durum").innerText = weatherCodeMetni(anlik.weather_code);
        })
        .catch(() => {
            document.getElementById("durum").innerText = "Hava bilgisi alınamadı.";
        });
}

function weatherCodeMetni(code) {
    const kodlar = {
        0: "Açık / Güneşli",
        1: "Çoğunlukla Açık", 2: "Parçalı Bulutlu", 3: "Kapalı / Bulutlu",
        45: "Sisli", 48: "Kırağılı Sis",
        51: "Hafif Çiseleme", 53: "Çiseleme", 55: "Yoğun Çiseleme",
        61: "Hafif Yağmurlu", 63: "Yağmurlu", 65: "Şiddetli Yağmurlu",
        71: "Hafif Karlı", 73: "Karlı", 75: "Yoğun Karlı",
        95: "Gökgürültülü Fırtına"
    };
    return kodlar[code] || "Hava Durumu Bilinmiyor";
}

// İlk Yükleme (Ankara & Anıtkabir / Ankara Kalesi Görseli)
havaDurumuGetir(mevcutEnlem, mevcutBoylam);
sembolikResimGetir("Ankara");

setInterval(() => havaDurumuGetir(mevcutEnlem, mevcutBoylam), 600000);