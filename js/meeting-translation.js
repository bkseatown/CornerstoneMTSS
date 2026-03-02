(function meetingTranslationModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.CSMeetingTranslation = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var labels = {
    en: "English",
    zh: "Mandarin",
    ms: "Bahasa Melayu",
    ta: "Tamil",
    tl: "Tagalog",
    other: "Other"
  };

  var phraseMap = {
    zh: [
      [/How Your Child Is Doing/g, "孩子目前表现"],
      [/What We Are Working On/g, "我们目前重点"],
      [/How the School Is Supporting/g, "学校正在提供的支持"],
      [/How You Can Help at Home/g, "家庭在家可做的支持"],
      [/Next Check-In Date/g, "下次回顾日期"],
      [/Strengths/g, "优势"],
      [/Growth Focus/g, "成长重点"],
      [/Next Steps/g, "下一步"],
      [/Translated from English/g, "由英文翻译"]
    ],
    ms: [
      [/How Your Child Is Doing/g, "Perkembangan Anak Anda"],
      [/What We Are Working On/g, "Fokus Semasa Kami"],
      [/How the School Is Supporting/g, "Sokongan Sekolah"],
      [/How You Can Help at Home/g, "Cara Bantu di Rumah"],
      [/Next Check-In Date/g, "Tarikh Semakan Seterusnya"],
      [/Strengths/g, "Kekuatan"],
      [/Growth Focus/g, "Fokus Penambahbaikan"],
      [/Next Steps/g, "Langkah Seterusnya"],
      [/Translated from English/g, "Diterjemah daripada Bahasa Inggeris"]
    ],
    ta: [
      [/How Your Child Is Doing/g, "உங்கள் குழந்தையின் முன்னேற்றம்"],
      [/What We Are Working On/g, "நாம் தற்போது செய்கிற வேலை"],
      [/How the School Is Supporting/g, "பள்ளி வழங்கும் ஆதரவு"],
      [/How You Can Help at Home/g, "வீட்டில் நீங்கள் உதவுவது எப்படி"],
      [/Next Check-In Date/g, "அடுத்த மதிப்பீட்டு தேதி"],
      [/Strengths/g, "வலிமைகள்"],
      [/Growth Focus/g, "மேம்பாட்டு கவனம்"],
      [/Next Steps/g, "அடுத்த படிகள்"],
      [/Translated from English/g, "ஆங்கிலத்திலிருந்து மொழிபெயர்க்கப்பட்டது"]
    ],
    tl: [
      [/How Your Child Is Doing/g, "Kumusta ang Pag-unlad ng Iyong Anak"],
      [/What We Are Working On/g, "Ano ang Pinagtutuunan Namin"],
      [/How the School Is Supporting/g, "Paano Sumusuporta ang Paaralan"],
      [/How You Can Help at Home/g, "Paano Ka Makakatulong sa Bahay"],
      [/Next Check-In Date/g, "Susunod na Petsa ng Pag-check In"],
      [/Strengths/g, "Lakas"],
      [/Growth Focus/g, "Pokus sa Pag-unlad"],
      [/Next Steps/g, "Mga Susunod na Hakbang"],
      [/Translated from English/g, "Isinalin mula sa Ingles"]
    ]
  };

  function normalizeLanguage(language) {
    var key = String(language || "en").toLowerCase();
    if (labels[key]) return key;
    return "other";
  }

  function translateText(text, targetLanguage) {
    var lang = normalizeLanguage(targetLanguage);
    var source = String(text || "");
    if (!source || lang === "en") return source;
    var translated = source;
    var replacements = phraseMap[lang] || [];
    replacements.forEach(function (pair) {
      translated = translated.replace(pair[0], pair[1]);
    });
    if (!replacements.length || translated === source) {
      translated = "[" + (labels[lang] || labels.other) + "] " + source;
    }
    return translated;
  }

  function languageLabel(language) {
    var key = normalizeLanguage(language);
    return labels[key] || labels.other;
  }

  function splitLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
  }

  return {
    translateText: translateText,
    languageLabel: languageLabel,
    normalizeLanguage: normalizeLanguage,
    splitLines: splitLines
  };
});
